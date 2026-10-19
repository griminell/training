import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import App, { APP_VERSION } from "./App.jsx";

const ACCENT = "#C2477A", DARK = "#8E2F58", SOFT = "#FBE4EE";
const LS = "nivadagbok-conn";

function loadConn() {
  try {
    const h = new URLSearchParams(location.hash.replace(/^#/, ""));
    if (h.get("db") && h.get("code")) {
      const c = { db: h.get("db"), code: h.get("code") };
      try { localStorage.setItem(LS, JSON.stringify(c)); } catch (e) {}
      history.replaceState(null, "", location.pathname);
      return c;
    }
  } catch (e) {}
  try { return JSON.parse(localStorage.getItem(LS)); } catch (e) { return null; }
}
const clean = (u) => u.trim().replace(/\/+$/, "");
const randCode = () => {
  const a = new Uint8Array(12); crypto.getRandomValues(a);
  return Array.from(a, (b) => "abcdefghijkmnpqrstuvwxyz23456789"[b % 32]).join("");
};

function makeStorage(conn) {
  const base = `${clean(conn.db)}/diaries/${conn.code}`;
  const listeners = new Set();
  let es = null, first = true;
  const connect = () => {
    try {
      es = new EventSource(`${base}.json`);
      const h = () => { if (first) { first = false; return; } listeners.forEach((f) => f()); };
      es.addEventListener("put", h); es.addEventListener("patch", h);
    } catch (e) {}
  };
  connect();
  // iOS pausar anslutningen när appen ligger i bakgrunden: koppla upp igen och hämta färsk data vid återvändo
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    try { es && es.close(); } catch (e) {}
    first = true;
    connect();
    listeners.forEach((f) => f());
  });
  const url = (key) => `${base}/${encodeURIComponent(key)}.json`;
  // fetch with a timeout, so a hung connection counts as a failure instead of waiting forever
  const tfetch = async (u, opts) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    try { return await fetch(u, { ...opts, signal: ctrl.signal }); } finally { clearTimeout(t); }
  };
  let ifMatchBroken = false; // set if the browser/server refuses the if-match header (CORS)
  const api = {
    // "on" = ETag readable, writes are conditional. "limited" = fallback (compare right before write).
    etagMode: null,
    async get(key) {
      const r = await tfetch(url(key));
      if (!r.ok) throw new Error("get");
      const v = await r.json();
      return v == null ? null : { key, value: v };
    },
    // Read the raw stored value together with its ETag (version number).
    async getV(key) {
      const r = await tfetch(url(key), { headers: { "X-Firebase-ETag": "true" } });
      if (!r.ok) throw new Error("get");
      const raw = await r.json();
      const etag = r.headers.get("ETag") || null;
      api.etagMode = etag && !ifMatchBroken ? "on" : "limited";
      return { raw: raw == null ? null : raw, etag };
    },
    // Write only if the value is still the version we read. Returns "ok" or "conflict"; throws if unreachable.
    async putIf(key, raw, prev) {
      const body = JSON.stringify(raw);
      if (prev.etag && !ifMatchBroken) {
        try {
          const r = await tfetch(url(key), { method: "PUT", body, headers: { "if-match": prev.etag } });
          if (r.status === 412) return "conflict";
          if (!r.ok) throw new Error("put");
          return "ok";
        } catch (e) {
          // A network-level failure while the browser says it is online may mean the if-match header
          // was refused. Fall through to the compare-then-write fallback; if that also fails we are offline.
          if (e.message === "put" || (typeof navigator !== "undefined" && navigator.onLine === false)) throw e;
        }
        const out = await api.putCompare(key, raw, prev);
        if (out === "ok") { ifMatchBroken = true; api.etagMode = "limited"; }
        return out;
      }
      return api.putCompare(key, raw, prev);
    },
    // Fallback: re-read right before writing and refuse if the value changed since we read it.
    async putCompare(key, raw, prev) {
      const r0 = await tfetch(url(key));
      if (!r0.ok) throw new Error("get");
      const now = await r0.json();
      if (JSON.stringify(now == null ? null : now) !== JSON.stringify(prev.raw)) return "conflict";
      const r = await tfetch(url(key), { method: "PUT", body: JSON.stringify(raw) });
      if (!r.ok) throw new Error("put");
      return "ok";
    },
    async set(key, value) {
      const r = await tfetch(url(key), { method: "PUT", body: JSON.stringify(value) });
      if (!r.ok) throw new Error("set");
      return { key, value };
    },
    async list(prefix) {
      const r = await tfetch(`${base}.json?shallow=true`);
      if (!r.ok) throw new Error("list");
      const o = (await r.json()) || {};
      return { keys: Object.keys(o).filter((k) => k.startsWith(prefix || "")) };
    },
    subscribe(f) { listeners.add(f); return () => listeners.delete(f); },
  };
  return api;
}

function Setup({ onDone }) {
  const [db, setDb] = useState("");
  const [code, setCode] = useState(randCode());
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function go() {
    setErr(""); setBusy(true);
    const c = { db: clean(db), code: code.trim() };
    if (!/^https:\/\/.+/.test(c.db) || c.code.length < 10) { setErr("Fyll i databasadressen (https://…) och en delningskod på minst 10 tecken."); setBusy(false); return; }
    try {
      const r = await fetch(`${c.db}/diaries/${c.code}/ping.json`, { method: "PUT", body: "1" });
      if (!r.ok) throw new Error(String(r.status));
      try { localStorage.setItem(LS, JSON.stringify(c)); } catch (e) {}
      onDone(c);
    } catch (e) {
      setErr("Kunde inte nå databasen. Kontrollera adressen och att reglerna är publicerade (se guiden).");
      setBusy(false);
    }
  }
  const inp = "w-full border rounded-lg px-3 py-2 text-sm mb-3";
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--paper)" }}>
      <div className="w-full max-w-md rounded-xl border p-5" style={{ borderColor: "var(--line)", backgroundColor: "var(--card)", color: "var(--ink)" }}>
        <h1 className="text-xl font-bold mb-1" style={{ color: DARK }}>Koppla till databasen</h1>
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>Görs en gång. Sedan får du en länk som kopplar Nivas telefon automatiskt.</p>
        <label className="text-xs font-bold">Databasadress (Firebase)</label>
        <input className={inp} style={{ borderColor: "var(--line2)" }} placeholder="https://din-databas-default-rtdb.europe-west1.firebasedatabase.app" value={db} onChange={(e) => setDb(e.target.value)} />
        <label className="text-xs font-bold">Delningskod</label>
        <input className={inp} style={{ borderColor: "var(--line2)" }} value={code} onChange={(e) => setCode(e.target.value)} />
        <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>Koden fungerar som lösenord – den som har den kan se och ändra dagboken. Behåll den som den är, eller klistra in koden du redan använder.</p>
        {err && <p className="text-sm mb-3" style={{ color: "var(--err)" }}>{err}</p>}
        <button onClick={go} disabled={busy} className="w-full rounded-lg py-2 font-semibold" style={{ background: ACCENT, color: "#fff" }}>{busy ? "Testar…" : "Spara och starta"}</button>
      </div>
    </div>
  );
}

function Root() {
  const [conn, setConn] = useState(loadConn);
  if (!conn) return <Setup onDone={setConn} />;
  if (!window.storage) window.storage = makeStorage(conn);
  const link = `${location.origin}${location.pathname}#db=${encodeURIComponent(clean(conn.db))}&code=${conn.code}`;
  return (
    <App
      connLink={link}
      onDisconnect={() => { try { localStorage.removeItem(LS); } catch (e) {} location.reload(); }}
    />
  );
}
createRoot(document.getElementById("root")).render(<Root />);
