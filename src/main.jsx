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
  return {
    async get(key) {
      const r = await fetch(`${base}/${encodeURIComponent(key)}.json`);
      if (!r.ok) throw new Error("get");
      const v = await r.json();
      return v == null ? null : { key, value: v };
    },
    async set(key, value) {
      const r = await fetch(`${base}/${encodeURIComponent(key)}.json`, { method: "PUT", body: JSON.stringify(value) });
      if (!r.ok) throw new Error("set");
      return { key, value };
    },
    async list(prefix) {
      const r = await fetch(`${base}.json?shallow=true`);
      if (!r.ok) throw new Error("list");
      const o = (await r.json()) || {};
      return { keys: Object.keys(o).filter((k) => k.startsWith(prefix || "")) };
    },
    subscribe(f) { listeners.add(f); return () => listeners.delete(f); },
  };
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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#fff" }}>
      <div className="w-full max-w-md rounded-xl border p-5" style={{ borderColor: "#E4E4E4" }}>
        <h1 className="text-xl font-bold mb-1" style={{ color: DARK }}>Koppla till databasen</h1>
        <p className="text-sm mb-4" style={{ color: "#6B6B6B" }}>Görs en gång. Sedan får du en länk som kopplar Nivas telefon automatiskt.</p>
        <label className="text-xs font-bold">Databasadress (Firebase)</label>
        <input className={inp} style={{ borderColor: "#D5D5D5" }} placeholder="https://din-databas-default-rtdb.europe-west1.firebasedatabase.app" value={db} onChange={(e) => setDb(e.target.value)} />
        <label className="text-xs font-bold">Delningskod</label>
        <input className={inp} style={{ borderColor: "#D5D5D5" }} value={code} onChange={(e) => setCode(e.target.value)} />
        <p className="text-xs mb-3" style={{ color: "#6B6B6B" }}>Koden fungerar som lösenord – den som har den kan se och ändra dagboken. Behåll den som den är, eller klistra in koden du redan använder.</p>
        {err && <p className="text-sm mb-3" style={{ color: "#B00020" }}>{err}</p>}
        <button onClick={go} disabled={busy} className="w-full rounded-lg py-2 font-semibold text-white" style={{ background: ACCENT }}>{busy ? "Testar…" : "Spara och starta"}</button>
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
      onDisconnect={() => { if (confirm("Koppla bort den här enheten? Datan finns kvar i molnet.")) { try { localStorage.removeItem(LS); } catch (e) {} location.reload(); } }}
    />
  );
}
createRoot(document.getElementById("root")).render(<Root />);
