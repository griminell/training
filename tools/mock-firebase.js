// Minimal local stand-in for Firebase Realtime Database (REST + SSE), for tests without internet.
// Supports ETag / if-match (HTTP 412), artificial delay and a simulated "network off" mode.
//
// Usage: node tools/mock-firebase.js [port] [seedFile.json] [--no-expose-etag] [--no-ifmatch-cors]
//   --no-expose-etag   do not send Access-Control-Expose-Headers: ETag (browser cannot read the ETag)
//   --no-ifmatch-cors  reject CORS preflights that ask for the if-match header
//
// Control endpoint (no CORS needed from tests, use curl or page.request):
//   GET /__ctl?offline=1|0        simulate network off (sockets are destroyed)
//   GET /__ctl?delayGet=ms        delay GET responses (value is read at request time = stale on arrival)
//   GET /__ctl?delayPut=ms        delay before a PUT is applied
//   GET /__ctl?failPut=n          make the next n PUTs fail with HTTP 500
//   GET /__ctl?dropPutResponse=n  apply the next n PUTs but cut the connection before answering (lost response)
//   GET /__raw?path=a/b/c         read a value directly (works even when offline, for test assertions)
//   GET /__stats                  counters: puts, conflicts (412), gets
const http = require("http");
const fs = require("fs");
const crypto = require("crypto");

const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith("--"));
const pos = args.filter((a) => !a.startsWith("--"));
const port = parseInt(pos[0] || "9000", 10);
const seedFile = pos[1];
const exposeEtag = !flags.includes("--no-expose-etag");
const ifMatchCors = !flags.includes("--no-ifmatch-cors");

let db = {};
if (seedFile) db = JSON.parse(fs.readFileSync(seedFile, "utf8"));
const streams = new Set();
const ctl = { offline: false, delayGet: 0, delayPut: 0, failPut: 0, dropPutResponse: 0 };
const stats = { puts: 0, conflicts: 0, gets: 0 };

function getAt(path) {
  let node = db;
  for (const p of path) {
    if (node == null || typeof node !== "object") return null;
    node = node[p];
  }
  return node === undefined ? null : node;
}
function setAt(path, value) {
  if (!path.length) { db = value || {}; return; }
  let node = db;
  for (let i = 0; i < path.length - 1; i++) {
    if (node[path[i]] == null || typeof node[path[i]] !== "object") node[path[i]] = {};
    node = node[path[i]];
  }
  const last = path[path.length - 1];
  if (value === null) delete node[last]; else node[last] = value;
}
const etagOf = (v) => (v === null ? "null_etag" : crypto.createHash("sha1").update(JSON.stringify(v)).digest("base64").slice(0, 12));
const later = (ms, fn) => (ms > 0 ? setTimeout(fn, ms) : fn());

http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");

  if (url.pathname === "/__ctl") {
    for (const [k, v] of url.searchParams) {
      if (k === "offline") ctl.offline = v === "1";
      else if (k in ctl) ctl[k] = parseInt(v, 10) || 0;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(ctl));
  }
  if (url.pathname === "/__raw") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(getAt((url.searchParams.get("path") || "").split("/").filter(Boolean))));
  }
  if (url.pathname === "/__stats") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(stats));
  }
  if (ctl.offline) { req.socket.destroy(); return; }

  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,PUT,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": ifMatchCors ? "*" : "X-Firebase-ETag, Content-Type",
  };
  if (exposeEtag) cors["Access-Control-Expose-Headers"] = "ETag";
  if (req.method === "OPTIONS") {
    const asked = (req.headers["access-control-request-headers"] || "").toLowerCase();
    if (!ifMatchCors && asked.includes("if-match")) { res.writeHead(403, cors); return res.end(); }
    res.writeHead(204, cors);
    return res.end();
  }
  const path = decodeURIComponent(url.pathname).replace(/^\/+|\.json$/g, "").split("/").filter(Boolean);
  const mutated = () => streams.forEach((s) => s.write(`event: put\ndata: ${JSON.stringify({ path: "/", data: null })}\n\n`));

  if (req.method === "GET") {
    if ((req.headers.accept || "").includes("text/event-stream")) {
      res.writeHead(200, { ...cors, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" });
      res.write(`event: put\ndata: ${JSON.stringify({ path: "/", data: getAt(path) })}\n\n`);
      streams.add(res);
      req.on("close", () => streams.delete(res));
      return;
    }
    stats.gets++;
    let v = getAt(path);
    if (url.searchParams.get("shallow") === "true" && v && typeof v === "object") {
      v = Object.fromEntries(Object.keys(v).map((k) => [k, true]));
    }
    const headers = { ...cors, "Content-Type": "application/json" };
    if ((req.headers["x-firebase-etag"] || "") === "true") headers.ETag = etagOf(getAt(path));
    const body = JSON.stringify(v); // read now: a delayed response is stale on arrival
    later(ctl.delayGet, () => { if (ctl.offline) { req.socket.destroy(); return; } res.writeHead(200, headers); res.end(body); });
    return;
  }
  if (req.method === "PUT") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => later(ctl.delayPut, () => {
      if (ctl.offline) { req.socket.destroy(); return; }
      if (ctl.failPut > 0) { ctl.failPut--; res.writeHead(500, cors); return res.end("{}"); }
      const cur = getAt(path);
      const ifMatch = req.headers["if-match"];
      if (ifMatch !== undefined && ifMatch !== etagOf(cur)) {
        stats.conflicts++;
        res.writeHead(412, { ...cors, "Content-Type": "application/json", ETag: etagOf(cur) });
        return res.end(JSON.stringify(cur));
      }
      stats.puts++;
      setAt(path, JSON.parse(body));
      if (ctl.dropPutResponse > 0) { ctl.dropPutResponse--; mutated(); req.socket.destroy(); return; }
      res.writeHead(200, { ...cors, "Content-Type": "application/json", ETag: etagOf(getAt(path)) });
      res.end(body);
      mutated();
    }));
    return;
  }
  res.writeHead(405, cors); res.end();
}).listen(port, () => console.log("mock firebase on", port));
