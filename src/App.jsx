import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { CalendarDays, ClipboardList, BarChart3, Trash2, Check, Download, Loader2, ChevronDown, Pencil, X, Upload, Users, Eye, Plus } from "lucide-react";

export const APP_VERSION = "1.4.6";
export const APP_DATE = "2026-10-17";

const CHANGELOG = [
  { version: "1.4.6", date: "2026-10-17", items: [
    "Knapparna längst ned följer användarens färgtema och har mer luft",
    "Annat tillagd som träningstyp" ] },
  { version: "1.4.5", date: "2026-10-17", items: [
    "Månadsväljaren bland loggade pass ligger nu i linje med övrig text" ] },
  { version: "1.4.4", date: "2026-10-17", items: [
    "Vad är nytt: den här listan över ändringar finns nu i appen",
    "Knappen för att ladda om heter nu Uppdatera sidan" ] },
  { version: "1.4.3", date: "2026-10-17", items: [
    "Kategorin Sport heter nu Aktivitet",
    "Promenad tillagd som aktivitet",
    "Byt månad bland loggade pass med pilen bredvid månadsnamnet",
    "Statistiksidan går nu att scrolla ända ned i Chrome på dator" ] },
  { version: "1.4.2", date: "2026-10-17", items: [
    "Statistiken hoppar inte längre till toppen när appen uppdateras i bakgrunden" ] },
  { version: "1.4.1", date: "2026-10-17", items: [
    "Dölj en användare bara på den här enheten",
    "Arkivera en användare för alla enheter, med Återställ" ] },
  { version: "1.4.0", date: "2026-10-17", items: [
    "Flera användare: lägg till, byt namn och välj färgtema",
    "Varje enhet minns vem som loggar" ] },
  { version: "1.3.1", date: "2026-10-17", items: [
    "Knapp för att ladda om appen",
    "Ny data hämtas automatiskt när appen öppnas igen" ] },
  { version: "1.3.0", date: "2026-10-17", items: [
    "Ansträngning på Borg CR10 (1–10). Äldre pass är omräknade (×2)" ] },
  { version: "1.2.1", date: "2026-10-17", items: [
    "Skarpare hemskärmsikon (enhörningen)" ] },
  { version: "1.2.0", date: "2026-10-17", items: [
    "Grönt färgtema för Grim",
    "Underrubriken Bastubackens finest",
    "Löpning, Alpint och Pingis som aktiviteter, och Lek som träningstyp" ] },
  { version: "1.1.0", date: "2026-10-16", items: [
    "Anpassad för att användas som webbapp på mobilen",
    "Rubriken Träningsdagbok och versionsrad längst ned" ] },
  { version: "1.0.0", date: "2026-10-16", items: [
    "Delad träningsdagbok i realtid för Niva och Grim",
    "Logga pass, anteckningar, redigering, export och import, statistik" ] },
];

function ChangelogModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
         onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-4 overflow-y-auto"
           style={{ maxHeight: "88vh", paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold" style={{ color: INK }}>Vad är nytt</h2>
          <button type="button" onClick={onClose} aria-label="Stäng" className="p-1"><X size={20} /></button>
        </div>
        {CHANGELOG.map((c) => (
          <div key={c.version} className="mb-4">
            <div className="text-sm font-bold" style={{ color: ACCENT_DARK }}>
              Version {c.version} <span className="font-normal" style={{ color: MUTED }}>· {c.date}</span>
            </div>
            <ul className="list-disc pl-5 mt-1 text-sm" style={{ color: INK }}>
              {c.items.map((it, i) => <li key={i}>{it}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

const THEMES = {
  niva: {
    accent: "#C2477A", dark: "#8E2F58", soft: "#FBE4EE",
    types: ["#8E2F58", "#B23E72", "#C2477A", "#D6698F", "#E38FAB", "#F0BBD1", "#B8B8B8", "#8A8A8A", "#6E6E6E", "#555555"],
    sports: ["#C2477A", "#E38FAB", "#8E2F58", "#F0BBD1", "#B8B8B8", "#8A8A8A"],
  },
  grim: {
    accent: "#004B26", dark: "#00301A", soft: "#DCEBE2",
    types: ["#00301A", "#004B26", "#1F6A41", "#3F8561", "#6BA286", "#9DBFAB", "#B8B8B8", "#8A8A8A", "#6E6E6E", "#555555"],
    sports: ["#004B26", "#6BA286", "#00301A", "#9DBFAB", "#B8B8B8", "#8A8A8A"],
  },
};
let ACCENT = THEMES.niva.accent;
let ACCENT_DARK = THEMES.niva.dark;
let ACCENT_SOFT = THEMES.niva.soft;
let TYPE_PALETTE = THEMES.niva.types;
let SPORT_COLORS = THEMES.niva.sports;
const DEFAULT_USERS = [
  { id: "niva", name: "Niva", color: "#C2477A" },
  { id: "grim", name: "Grim", color: "#004B26" },
];
const COLOR_PRESETS = ["#C2477A", "#004B26", "#1D5FA8", "#6B3FA0", "#B5541C", "#0E7C86", "#A62B2B", "#5C6B1F"];

function hexToRgb(h) {
  const m = /^#?([0-9a-f]{6})$/i.exec(h || "");
  const n = parseInt(m ? m[1] : "C2477A", 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("").toUpperCase();
}
function mixHex(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}
function luminance(h) {
  const c = hexToRgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
// Säkerställ att vit text syns på färgen (kontrast minst 4.5)
function ensureContrast(h) {
  let c = rgbToHex(...hexToRgb(h));
  for (let i = 0; i < 20 && 1.05 / (luminance(c) + 0.05) < 4.5; i++) c = mixHex(c, "#000000", 0.08);
  return c;
}
function themeForUser(user) {
  const color = ensureContrast((user && user.color) || THEMES.niva.accent).toUpperCase();
  if (color === THEMES.niva.accent.toUpperCase()) return THEMES.niva;
  if (color === THEMES.grim.accent.toUpperCase()) return THEMES.grim;
  return {
    accent: color,
    dark: mixHex(color, "#000000", 0.4),
    soft: mixHex(color, "#FFFFFF", 0.88),
    types: [mixHex(color, "#000000", 0.5), mixHex(color, "#000000", 0.3), color, mixHex(color, "#FFFFFF", 0.2),
            mixHex(color, "#FFFFFF", 0.4), mixHex(color, "#FFFFFF", 0.6), "#B8B8B8", "#8A8A8A", "#6E6E6E", "#555555"],
    sports: [color, mixHex(color, "#FFFFFF", 0.45), mixHex(color, "#000000", 0.45), mixHex(color, "#FFFFFF", 0.7), "#B8B8B8", "#8A8A8A"],
  };
}
const ME_KEY = "nivadagbok-me";
const LOCAL_HIDDEN_KEY = "nivadagbok-hidden-local";
function getLocalHidden() {
  try { const v = JSON.parse(localStorage.getItem(LOCAL_HIDDEN_KEY)); return Array.isArray(v) ? v : []; } catch (e) { return []; }
}
function getMe() {
  try { return localStorage.getItem(ME_KEY) || "niva"; } catch (e) { return "niva"; }
}
function slugify(n) {
  return n.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "anv";
}
function applyTheme(user) {
  const t = themeForUser(user);
  ACCENT = t.accent; ACCENT_DARK = t.dark; ACCENT_SOFT = t.soft;
  TYPE_PALETTE = t.types; SPORT_COLORS = t.sports;
}
const PAPER = "#FFFFFF";
const INK = "#232323";
const MUTED = "#6B6B6B";


const SPORTS = [
  { code: "F", label: "Fotboll" },
  { code: "S", label: "Skidor" },
  { code: "LÖ", label: "Löpning" },
  { code: "AL", label: "Alpint" },
  { code: "PI", label: "Pingis" },
  { code: "PR", label: "Promenad" },
  { code: "A", label: "Annat" },
];

const TYPES = [
  { code: "TE", label: "Teknik" },
  { code: "KO", label: "Kondition" },
  { code: "IN", label: "Intervall" },
  { code: "ST", label: "Styrka" },
  { code: "SP", label: "Spänst/Fart" },
  { code: "RÖ", label: "Rörl./Balans" },
  { code: "SK", label: "Skytte" },
  { code: "MA", label: "Match" },
  { code: "LE", label: "Lek" },
  { code: "AN", label: "Annat" },
];


const MONTH_NAMES = ["Januari","Februari","Mars","April","Maj","Juni",
                      "Juli","Augusti","September","Oktober","November","December"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function monthKeyOf(iso) {
  return iso.slice(0, 7);
}
function monthLabel(key) {
  const [y, m] = key.split("-");
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Äldre pass loggades på skala 1–5 och saknar flaggan cr10: de räknas om till 1–10 (×2).
function normalizeEntries(list) {
  if (!Array.isArray(list)) return list;
  return list.map((e) => {
    if (e.cr10) return e;
    const k = parseFloat(e.kansla);
    return { ...e, kansla: k ? String(k * 2) : "", cr10: true };
  });
}
async function safeGet(key) {
  try {
    const res = await window.storage.get(key, true);
    if (!(res && res.value)) return null;
    const data = JSON.parse(res.value);
    return key.startsWith("entries:") ? normalizeEntries(data) : data;
  } catch (e) {
    return null;
  }
}
async function safeSet(key, value) {
  try {
    const result = await window.storage.set(key, JSON.stringify(value), true);
    return !!result;
  } catch (e) {
    return false;
  }
}
async function safeListMonths() {
  try {
    const res = await window.storage.list("entries:", true);
    if (!res || !res.keys) return [];
    return res.keys.map((k) => k.replace("entries:", "")).sort();
  } catch (e) {
    return [];
  }
}

function ColorPicker({ value, onChange }) {
  const adjusted = ensureContrast(value);
  return (
    <div>
      <div className="flex flex-wrap gap-2 items-center">
        {COLOR_PRESETS.map((c) => (
          <button key={c} type="button" aria-label={`Färg ${c}`} onClick={() => onChange(c)}
                  className="rounded-full"
                  style={{ width: 30, height: 30, backgroundColor: c,
                           outline: adjusted.toUpperCase() === c.toUpperCase() ? "3px solid #232323" : "none", outlineOffset: 2 }} />
        ))}
        <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: MUTED }}>
          <input type="color" value={adjusted.toLowerCase()} onChange={(e) => onChange(e.target.value)}
                 style={{ width: 30, height: 30, padding: 0, border: "none", background: "none" }} />
          Egen färg
        </label>
      </div>
    </div>
  );
}

function UserManager({ users, localHidden, onLocalHide, onUpdate, onClose }) {
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLOR_PRESETS[2]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const active = users.filter((u) => !u.hidden && !localHidden.includes(u.id));
  const localList = users.filter((u) => !u.hidden && localHidden.includes(u.id));
  const archived = users.filter((u) => u.hidden);

  function openEdit(u) { setEditingId(u.id); setAdding(false); setName(u.name); setColor(u.color); setError(""); }
  function openAdd() {
    const used = users.map((u) => u.color.toUpperCase());
    setAdding(true); setEditingId(null); setName("");
    setColor(COLOR_PRESETS.find((c) => !used.includes(c.toUpperCase())) || COLOR_PRESETS[2]); setError("");
  }
  function closeForm() { setEditingId(null); setAdding(false); setError(""); }

  async function run(mutator, after) {
    setBusy(true);
    const r = await onUpdate(mutator);
    setBusy(false);
    if (!r.ok) setError(r.error); else { setError(""); if (after) after(); }
  }
  function validName(list, ignoreId) {
    const n = name.trim();
    if (!n) return "Skriv ett namn.";
    if (n.length > 20) return "Namnet får vara högst 20 tecken.";
    if (list.some((u) => u.id !== ignoreId && u.name.toLowerCase() === n.toLowerCase())) return "Det finns redan någon med det namnet (kan vara dold).";
    return null;
  }
  function submit() {
    const n = name.trim();
    const c = ensureContrast(color);
    if (adding) {
      run((list) => {
        const bad = validName(list, null); if (bad) return bad;
        let id = slugify(n);
        if (list.some((u) => u.id === id)) id += "-" + Math.random().toString(36).slice(2, 6);
        return [...list, { id, name: n, color: c }];
      }, closeForm);
    } else {
      run((list) => {
        const bad = validName(list, editingId); if (bad) return bad;
        return list.map((u) => (u.id === editingId ? { ...u, name: n, color: c } : u));
      }, closeForm);
    }
  }
  function archive(id, flag) {
    run((list) => {
      if (flag) {
        const remaining = list.filter((u) => !u.hidden && u.id !== id && !localHidden.includes(u.id)).length;
        if (remaining < 1) return "Minst en användare måste vara synlig på den här enheten.";
      }
      return list.map((u) => (u.id === id ? { ...u, hidden: flag } : u));
    });
  }
  function hideHere(id) {
    if (active.length <= 1) { setError("Minst en användare måste vara synlig på den här enheten."); return; }
    setError("");
    onLocalHide([...localHidden, id]);
  }
  function showHere(id) { setError(""); onLocalHide(localHidden.filter((x) => x !== id)); }

  const form = (
    <div className="rounded-xl border p-3 mb-3" style={{ borderColor: "#E4E4E4", backgroundColor: "#FAFAFA" }}>
      <div className="text-xs font-bold mb-1.5" style={{ color: "#555555" }}>NAMN</div>
      <input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder="t.ex. Alva"
             className="w-full border rounded-lg px-3 py-2 text-sm mb-3" style={{ borderColor: "#D5D5D5" }} />
      <div className="text-xs font-bold mb-1.5" style={{ color: "#555555" }}>FÄRGTEMA</div>
      <ColorPicker value={color} onChange={setColor} />
      <div className="flex gap-2 mt-3">
        <button type="button" onClick={submit} disabled={busy}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: ensureContrast(color), opacity: busy ? 0.6 : 1 }}>
          {busy ? "Sparar…" : "Spara"}
        </button>
        <button type="button" onClick={closeForm} className="px-4 py-2 rounded-lg text-sm border" style={{ borderColor: "#D5D5D5", color: MUTED }}>
          Avbryt
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
         onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-4 overflow-y-auto"
           style={{ maxHeight: "88vh", paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold" style={{ color: INK }}>Användare</h2>
          <button type="button" onClick={onClose} aria-label="Stäng" className="p-1"><X size={20} /></button>
        </div>

        {active.map((u) => (
          editingId === u.id ? <div key={u.id}>{form}</div> : (
            <div key={u.id} className="py-2 border-b" style={{ borderColor: "#EEEEEE" }}>
              <div className="flex items-center gap-3">
                <span className="inline-block rounded-full" style={{ width: 22, height: 22, backgroundColor: themeForUser(u).accent }} />
                <span className="flex-1 text-sm font-semibold">{u.name}</span>
                <button type="button" onClick={() => openEdit(u)} aria-label={`Redigera ${u.name}`} className="p-2"><Pencil size={16} style={{ color: MUTED }} /></button>
              </div>
              <div className="flex gap-4 pl-9 text-xs">
                <button type="button" onClick={() => hideHere(u.id)} disabled={busy} aria-label={`Dölj ${u.name} på den här enheten`} className="underline" style={{ color: MUTED }}>
                  Dölj på den här enheten
                </button>
                <button type="button" onClick={() => archive(u.id, true)} disabled={busy} aria-label={`Arkivera ${u.name}`} className="underline" style={{ color: MUTED }}>
                  Arkivera
                </button>
              </div>
            </div>
          )
        ))}

        {adding ? <div className="mt-3">{form}</div> : (
          <button type="button" onClick={openAdd} className="mt-3 flex items-center gap-1.5 text-sm font-semibold" style={{ color: ACCENT_DARK }}>
            <Plus size={16} /> Lägg till användare
          </button>
        )}

        {localList.length > 0 && (
          <div className="mt-5">
            <div className="text-xs font-bold mb-1" style={{ color: "#555555" }}>DOLDA PÅ DEN HÄR ENHETEN</div>
            <p className="text-xs mb-1" style={{ color: MUTED }}>Syns fortfarande för alla andra. Passen finns kvar.</p>
            {localList.map((u) => (
              <div key={u.id} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: "#EEEEEE" }}>
                <span className="inline-block rounded-full" style={{ width: 22, height: 22, backgroundColor: themeForUser(u).accent, opacity: 0.4 }} />
                <span className="flex-1 text-sm" style={{ color: MUTED }}>{u.name}</span>
                <button type="button" onClick={() => showHere(u.id)} className="flex items-center gap-1.5 text-sm font-semibold p-2" style={{ color: ACCENT_DARK }}>
                  <Eye size={16} /> Visa
                </button>
              </div>
            ))}
          </div>
        )}

        {archived.length > 0 && (
          <div className="mt-5">
            <div className="text-xs font-bold mb-1" style={{ color: "#555555" }}>ARKIVERADE</div>
            <p className="text-xs mb-1" style={{ color: MUTED }}>Dolda för alla enheter. Passen finns kvar och kommer tillbaka när du återställer användaren.</p>
            {archived.map((u) => (
              <div key={u.id} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: "#EEEEEE" }}>
                <span className="inline-block rounded-full" style={{ width: 22, height: 22, backgroundColor: themeForUser(u).accent, opacity: 0.4 }} />
                <span className="flex-1 text-sm" style={{ color: MUTED }}>{u.name}</span>
                <button type="button" onClick={() => archive(u.id, false)} disabled={busy} className="flex items-center gap-1.5 text-sm font-semibold p-2" style={{ color: ACCENT_DARK }}>
                  <Eye size={16} /> Återställ
                </button>
              </div>
            ))}
          </div>
        )}
        {error && <p className="text-sm font-semibold mt-3" style={{ color: "#B5544A" }}>{error}</p>}
      </div>
    </div>
  );
}

function Pill({ active, color, onClick, children, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="px-3 py-2 rounded-full text-sm font-semibold border transition-colors select-none"
      style={{
        borderColor: active ? color : "#D5D5D5",
        backgroundColor: active ? color : "white",
        color: active ? "white" : "#444444",
      }}
    >
      {children}
    </button>
  );
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-xl border p-4 bg-white ${className}`}
      style={{ borderColor: "#E4E4E4" }}
    >
      {children}
    </div>
  );
}

export default function TraningsDagbok({ connLink, onDisconnect }) {
  const [view, setView] = useState("logga");
  const [allMonths, setAllMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(monthKeyOf(todayISO()));
  const [monthEntries, setMonthEntries] = useState([]);
  const [allEntries, setAllEntries] = useState(null);
  const [statsScope, setStatsScope] = useState("month");
  const [loadingMonth, setLoadingMonth] = useState(true);
  const [loadingAll, setLoadingAll] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [editingId, setEditingId] = useState(null);
  const [editingOriginalMonth, setEditingOriginalMonth] = useState(null);

  const emptyForm = {
    date: todayISO(),
    user: getMe(),
    sport: [],
    typ: [],
    tid: "",
    kansla: "",
    anteckningar: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [statsUser, setStatsUser] = useState(getMe());
  const [users, setUsers] = useState(DEFAULT_USERS);
  const [showUsers, setShowUsers] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [localHidden, setLocalHidden] = useState(getLocalHidden);
  const visibleUsers = users.filter((u) => !u.hidden && !localHidden.includes(u.id));
  function setLocalHiddenIds(next) {
    setLocalHidden(next);
    try { localStorage.setItem(LOCAL_HIDDEN_KEY, JSON.stringify(next)); } catch (e) {}
  }
  const activeUserId = view === "stats" ? statsUser : form.user;
  applyTheme(users.find((u) => u.id === activeUserId) || visibleUsers[0] || DEFAULT_USERS[0]);
  const userName = (id) => (users.find((u) => u.id === id) || {}).name || id;

  const loadUsers = useCallback(async () => {
    try {
      const res = await window.storage.get("meta:users", true);
      if (res && res.value) {
        const list = JSON.parse(res.value);
        if (Array.isArray(list) && list.length) setUsers(list);
      }
    } catch (e) { /* behåll nuvarande lista */ }
  }, []);
  useEffect(() => { loadUsers(); }, [loadUsers]);

  useEffect(() => {
    const vis = users.filter((u) => !u.hidden && !localHidden.includes(u.id));
    if (!vis.length) {
      // säkerhetsnät: om allt ändå blivit dolt på den här enheten, visa alla ej arkiverade igen
      if (users.some((u) => !u.hidden) && localHidden.length) setLocalHiddenIds([]);
      return;
    }
    if (!vis.some((u) => u.id === form.user)) setForm((f) => ({ ...f, user: vis[0].id }));
    if (!vis.some((u) => u.id === statsUser)) setStatsUser(vis[0].id);
  }, [users, localHidden]); // eslint-disable-line
  useEffect(() => {
    try { localStorage.setItem(ME_KEY, form.user); } catch (e) {}
  }, [form.user]);

  // Läs–ändra–skriv mot senaste listan; skriver aldrig om hämtningen misslyckas
  async function updateUsers(mutator) {
    let latest = DEFAULT_USERS;
    try {
      const res = await window.storage.get("meta:users", true);
      if (res && res.value) { const l = JSON.parse(res.value); if (Array.isArray(l) && l.length) latest = l; }
    } catch (e) { return { ok: false, error: "Ingen kontakt med databasen. Försök igen." }; }
    const next = mutator(latest);
    if (typeof next === "string") return { ok: false, error: next };
    const ok = await safeSet("meta:users", next);
    if (!ok) return { ok: false, error: "Kunde inte spara. Försök igen." };
    setUsers(next);
    return { ok: true };
  }

  const refreshMonthList = useCallback(async () => {
    const months = await safeListMonths();
    const current = monthKeyOf(todayISO());
    if (!months.includes(current)) months.push(current);
    months.sort();
    setAllMonths(months);
  }, []);

  useEffect(() => {
    refreshMonthList();
  }, [refreshMonthList]);

  const loadMonth = useCallback(async (key) => {
    setLoadingMonth(true);
    const data = await safeGet(`entries:${key}`);
    setMonthEntries(data || []);
    setLoadingMonth(false);
  }, []);

  useEffect(() => {
    loadMonth(selectedMonth);
  }, [selectedMonth, loadMonth]);

  // Live sync: when anyone changes data, refresh silently (utan att nollställa vyn eller scrollen)
  const selectedMonthRef = React.useRef(selectedMonth);
  useEffect(() => { selectedMonthRef.current = selectedMonth; }, [selectedMonth]);
  const statsScopeRef = React.useRef(statsScope);
  useEffect(() => { statsScopeRef.current = statsScope; }, [statsScope]);
  useEffect(() => {
    if (!window.storage || !window.storage.subscribe) return;
    return window.storage.subscribe(async () => {
      refreshMonthList();
      loadUsers();
      const data = (await safeGet(`entries:${selectedMonthRef.current}`)) || [];
      setMonthEntries((prev) => (JSON.stringify(prev) === JSON.stringify(data) ? prev : data));
      if (statsScopeRef.current === "all") {
        const months = await safeListMonths();
        const results = await Promise.all(months.map((m) => safeGet(`entries:${m}`)));
        const merged = [];
        results.forEach((r) => { if (r) merged.push(...r); });
        setAllEntries((prev) => (prev && JSON.stringify(prev) === JSON.stringify(merged) ? prev : merged));
      } else {
        setAllEntries(null);
      }
    });
  }, [refreshMonthList, loadUsers]);

  const loadAll = useCallback(async () => {
    setLoadingAll(true);
    const months = allMonths.length ? allMonths : await safeListMonths();
    const results = await Promise.all(months.map((m) => safeGet(`entries:${m}`)));
    const merged = [];
    results.forEach((r) => { if (r) merged.push(...r); });
    setAllEntries(merged);
    setLoadingAll(false);
  }, [allMonths]);

  useEffect(() => {
    if (statsScope === "all" && allEntries === null && allMonths.length) {
      loadAll();
    }
  }, [statsScope, allEntries, allMonths, loadAll]);

  function toggleSport(code) {
    setForm((f) => ({
      ...f,
      sport: f.sport.includes(code) ? f.sport.filter((c) => c !== code) : [...f.sport, code],
    }));
  }
  function toggleTyp(code) {
    setForm((f) => ({
      ...f,
      typ: f.typ.includes(code) ? f.typ.filter((c) => c !== code) : [...f.typ, code],
    }));
  }
  function toggleExpand(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function startEdit(entry) {
    setEditingId(entry.id);
    setEditingOriginalMonth(monthKeyOf(entry.date));
    setForm({
      date: entry.date,
      user: entry.user || "niva",
      sport: entry.sport || [],
      typ: entry.typ || [],
      tid: entry.tid || "",
      kansla: entry.kansla || "",
      anteckningar: entry.anteckningar || "",
    });
    setSaveError(false);
    if (typeof window !== "undefined" && window.scrollTo) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingOriginalMonth(null);
    setForm((f) => ({ ...emptyForm, user: f.user }));
    setSaveError(false);
  }

  async function handleSave() {
    if (!form.date || form.sport.length === 0) return;
    setSaving(true);
    setSaveError(false);

    if (editingId) {
      const newMonthKey = monthKeyOf(form.date);
      const updatedEntry = { id: editingId, ...form, cr10: true };
      let ok = true;

      if (newMonthKey === editingOriginalMonth) {
        const existing = (await safeGet(`entries:${newMonthKey}`)) || [];
        const replaced = existing
          .map((e) => (e.id === editingId ? updatedEntry : e))
          .sort((a, b) => a.date.localeCompare(b.date));
        ok = await safeSet(`entries:${newMonthKey}`, replaced);
        if (ok && newMonthKey === selectedMonth) setMonthEntries(replaced);
      } else {
        const oldEntries = (await safeGet(`entries:${editingOriginalMonth}`)) || [];
        const oldFiltered = oldEntries.filter((e) => e.id !== editingId);
        const okOld = await safeSet(`entries:${editingOriginalMonth}`, oldFiltered);

        const newEntries = (await safeGet(`entries:${newMonthKey}`)) || [];
        const newUpdated = [...newEntries, updatedEntry].sort((a, b) => a.date.localeCompare(b.date));
        const okNew = await safeSet(`entries:${newMonthKey}`, newUpdated);

        ok = okOld && okNew;
        if (ok) {
          if (editingOriginalMonth === selectedMonth) setMonthEntries(oldFiltered);
          if (newMonthKey === selectedMonth) setMonthEntries(newUpdated);
          if (!allMonths.includes(newMonthKey)) {
            setAllMonths([...allMonths, newMonthKey].sort());
          }
        }
      }

      if (ok) {
        setAllEntries(null);
        setEditingId(null);
        setEditingOriginalMonth(null);
        setForm((f) => ({ ...emptyForm, user: f.user }));
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1800);
      } else {
        setSaveError(true);
      }
      setSaving(false);
      return;
    }

    const key = monthKeyOf(form.date);
    const existing = (await safeGet(`entries:${key}`)) || [];
    const entry = { id: uid(), ...form, cr10: true };
    const updated = [...existing, entry].sort((a, b) => a.date.localeCompare(b.date));
    const ok = await safeSet(`entries:${key}`, updated);
    if (ok) {
      if (key === selectedMonth) setMonthEntries(updated);
      if (!allMonths.includes(key)) {
        const next = [...allMonths, key].sort();
        setAllMonths(next);
      }
      setAllEntries(null);
      setForm((f) => ({ ...emptyForm, user: f.user }));
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1800);
    } else {
      setSaveError(true);
    }
    setSaving(false);
  }

  async function deleteEntry(id) {
    const updated = monthEntries.filter((e) => e.id !== id);
    const ok = await safeSet(`entries:${selectedMonth}`, updated);
    if (ok) {
      setMonthEntries(updated);
      setAllEntries(null);
      if (editingId === id) cancelEdit();
    }
  }

  function csvEscape(val) {
    const s = String(val ?? "");
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  async function handleExport() {
    setExporting(true);
    try {
      const months = allMonths.length ? allMonths : await safeListMonths();
      const results = await Promise.all(months.map((m) => safeGet(`entries:${m}`)));
      const merged = [];
      results.forEach((r) => { if (r) merged.push(...r); });
      merged.sort((a, b) => a.date.localeCompare(b.date));

      const header = ["Datum", "Anvandare", "Sport", "Traningstyp", "Tid (min)", "Anstrangning (1-10)", "Anteckningar"];
      const rows = merged.map((e) => [
        e.date,
        userName(e.user || "niva"),
        (e.sport || []).join(" "),
        (e.typ || []).join(" "),
        e.tid || "",
        e.kansla || "",
        e.anteckningar || "",
      ]);
      const csv = [header, ...rows]
        .map((row) => row.map(csvEscape).join(";"))
        .join("\r\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `traningsdagbok_${todayISO()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("export failed", e);
    }
    setExporting(false);
  }

  function parseCsv(text) {
    const clean = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < clean.length; i++) {
      const c = clean[i];
      if (inQuotes) {
        if (c === '"') {
          if (clean[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else {
          field += c;
        }
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ";") {
        row.push(field); field = "";
      } else if (c === "\n") {
        row.push(field); rows.push(row); row = []; field = "";
      } else {
        field += c;
      }
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    return rows.filter((r) => r.length > 1 || (r[0] && r[0].trim() !== ""));
  }

  function userLabelToCode(label) {
    const match = users.find((u) => u.name.toLowerCase() === String(label).trim().toLowerCase());
    return match ? match.id : (users.some((u) => u.id === "niva") ? "niva" : (visibleUsers[0] || DEFAULT_USERS[0]).id);
  }

  async function handleImportFile(file) {
    setImporting(true);
    setImportMsg(null);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length < 2) {
        setImportMsg({ ok: false, text: "Filen verkar tom eller felformaterad." });
        setImporting(false);
        return;
      }
      const header = rows[0].map((h) => h.trim().toLowerCase());
      const idx = {
        date: header.indexOf("datum"),
        user: header.indexOf("anvandare"),
        sport: header.indexOf("sport"),
        typ: header.indexOf("traningstyp"),
        tid: header.indexOf("tid (min)"),
        kansla: header.findIndex((h) => h.startsWith("anstrangning") || h.startsWith("kansla")),
        anteckningar: header.indexOf("anteckningar"),
      };
      if (idx.date === -1) {
        setImportMsg({ ok: false, text: "Hittar ingen 'Datum'-kolumn i filen." });
        setImporting(false);
        return;
      }

      const legacyScale = idx.kansla > -1 && /1-5/.test(header[idx.kansla]);
      const scaleImported = (v) => {
        const k = parseFloat(v);
        if (!k) return "";
        return String(legacyScale ? k * 2 : k);
      };
      const byMonth = {};
      let count = 0;
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        const date = (r[idx.date] || "").trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
        const entry = {
          id: uid(),
          date,
          user: idx.user > -1 ? userLabelToCode(r[idx.user] || "Niva") : "niva",
          sport: idx.sport > -1 ? (r[idx.sport] || "").split(" ").filter(Boolean) : [],
          typ: idx.typ > -1 ? (r[idx.typ] || "").split(" ").filter(Boolean) : [],
          tid: idx.tid > -1 ? (r[idx.tid] || "") : "",
          kansla: idx.kansla > -1 ? scaleImported(r[idx.kansla]) : "",
          cr10: true,
          anteckningar: idx.anteckningar > -1 ? (r[idx.anteckningar] || "") : "",
        };
        const mk = monthKeyOf(date);
        if (!byMonth[mk]) byMonth[mk] = [];
        byMonth[mk].push(entry);
        count++;
      }

      for (const mk of Object.keys(byMonth)) {
        const existing = (await safeGet(`entries:${mk}`)) || [];
        const sig = (e) => [e.date, e.user, (e.sport||[]).join(","), (e.typ||[]).join(","), e.tid, e.kansla, e.anteckningar].join("|");
        const existingSigs = new Set(existing.map(sig));
        const toAdd = byMonth[mk].filter((e) => !existingSigs.has(sig(e)));
        const merged = [...existing, ...toAdd].sort((a, b) => a.date.localeCompare(b.date));
        await safeSet(`entries:${mk}`, merged);
      }

      await refreshMonthList();
      await loadMonth(selectedMonth);
      setAllEntries(null);
      setImportMsg({ ok: true, text: `${count} pass importerade.` });
    } catch (e) {
      console.error("import failed", e);
      setImportMsg({ ok: false, text: "Kunde inte läsa filen. Kontrollera att det är en CSV exporterad härifrån." });
    }
    setImporting(false);
  }

  const dataForStats = useMemo(() => {
    const base = statsScope === "all" ? (allEntries || []) : monthEntries;
    return base.filter((e) => (e.user || "niva") === statsUser);
  }, [statsScope, allEntries, monthEntries, statsUser]);

  const loadByDate = useMemo(() => {
    const map = {};
    dataForStats.forEach((e) => {
      const tid = parseFloat(e.tid) || 0;
      const kansla = parseFloat(e.kansla) || 0;
      map[e.date] = (map[e.date] || 0) + tid * kansla;
    });
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, load]) => ({ date: date.slice(5), load: Math.round(load) }));
  }, [dataForStats]);

  const sportDist = useMemo(() => {
    const counts = { F: 0, S: 0, A: 0 };
    dataForStats.forEach((e) => (e.sport || []).forEach((s) => { counts[s] = (counts[s] || 0) + 1; }));
    return SPORTS.map((s) => ({ name: s.label, value: counts[s.code] || 0 }));
  }, [dataForStats]);

  const typeDist = useMemo(() => {
    const counts = {};
    dataForStats.forEach((e) => (e.typ || []).forEach((t) => { counts[t] = (counts[t] || 0) + 1; }));
    return TYPES.map((t) => ({ code: t.code, name: t.label, count: counts[t.code] || 0 }));
  }, [dataForStats]);

  const kanslaTrend = useMemo(() => {
    return [...dataForStats]
      .filter((e) => e.kansla)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e) => ({ date: e.date.slice(5), kansla: parseFloat(e.kansla) }));
  }, [dataForStats]);

  const summary = useMemo(() => {
    const totalPass = dataForStats.length;
    const totalTidMin = dataForStats.reduce((s, e) => s + (parseFloat(e.tid) || 0), 0);
    const withKansla = dataForStats.filter((e) => e.kansla);
    const avgKansla = withKansla.length
      ? withKansla.reduce((s, e) => s + parseFloat(e.kansla), 0) / withKansla.length
      : 0;
    const totalLoad = dataForStats.reduce(
      (s, e) => s + (parseFloat(e.tid) || 0) * (parseFloat(e.kansla) || 0), 0
    );
    return { totalPass, totalTidMin, avgKansla, totalLoad };
  }, [dataForStats]);

  const sortedMonthEntries = useMemo(
    () => monthEntries
      .filter((e) => (e.user || "niva") === form.user)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [monthEntries, form.user]
  );

  const canSave = form.date && form.sport.length > 0 && !saving;

  return (
    <div className="w-full" style={{ backgroundColor: PAPER, color: INK }}>
      <div className="max-w-3xl mx-auto px-4 pt-4 pb-2" style={{ paddingTop: "max(1rem, env(safe-area-inset-top))", paddingLeft: "max(1rem, env(safe-area-inset-left))", paddingRight: "max(1rem, env(safe-area-inset-right))" }}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h1 className="text-3xl font-bold tracking-tight min-w-0" style={{ color: INK }}>
            Träningsdagbok
          </h1>
          <div className="flex items-center gap-2 mt-1 shrink-0">
            <label
              title="Importera pass från en tidigare CSV-export (t.ex. efter en uppdatering)"
              aria-label="Importera"
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold border cursor-pointer"
              style={{ borderColor: "#D5D5D5", color: MUTED }}
            >
              {importing ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              <span className="hidden sm:inline">Importera</span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files && e.target.files[0];
                  if (file) handleImportFile(file);
                  e.target.value = "";
                }}
              />
            </label>
            <button
              onClick={handleExport}
              disabled={exporting}
              title="Ladda ner alla loggade pass som CSV-fil (säkerhetskopia)"
              aria-label="Exportera"
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold border"
              style={{ borderColor: "#D5D5D5", color: MUTED }}
            >
              {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              <span className="hidden sm:inline">Exportera</span>
            </button>
          </div>
        </div>
        {importMsg && (
          <p className="text-xs font-semibold mb-1 text-right" style={{ color: importMsg.ok ? ACCENT_DARK : "#B5544A" }}>
            {importMsg.text}
          </p>
        )}
        <p className="text-xs font-semibold mb-4" style={{ color: ACCENT }}>
          BASTUBACKENS FINEST
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 border-b" style={{ borderColor: "#E4E4E4" }}>
          <button
            onClick={() => setView("logga")}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors"
            style={{
              borderColor: view === "logga" ? ACCENT : "transparent",
              color: view === "logga" ? ACCENT_DARK : MUTED,
            }}
          >
            <ClipboardList size={16} /> Logga pass
          </button>
          <button
            onClick={() => setView("stats")}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors"
            style={{
              borderColor: view === "stats" ? ACCENT : "transparent",
              color: view === "stats" ? ACCENT_DARK : MUTED,
            }}
          >
            <BarChart3 size={16} /> Statistik
          </button>
        </div>

        {view === "logga" && (
          <div className="space-y-5">
            <Card>
              {editingId && (
                <div className="flex items-center justify-between mb-4 pb-3 border-b"
                     style={{ borderColor: "#E4E4E4" }}>
                  <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: ACCENT_DARK }}>
                    <Pencil size={13} /> Redigerar loggat pass
                  </div>
                  <button
                    onClick={cancelEdit}
                    className="flex items-center gap-1 text-xs font-semibold"
                    style={{ color: MUTED }}
                  >
                    <X size={13} /> Avbryt
                  </button>
                </div>
              )}

              <div className="mb-4">
                <div className="text-xs font-bold mb-2" style={{ color: ACCENT_DARK }}>
                  LOGGAR SOM
                </div>
                <div className="flex flex-wrap gap-2">
                  {visibleUsers.map((u) => (
                    <Pill key={u.id} active={form.user === u.id} color={themeForUser(u).accent}
                          onClick={() => setForm((f) => ({ ...f, user: u.id }))}>
                      {u.name}
                    </Pill>
                  ))}
                  <button type="button" onClick={() => setShowUsers(true)} aria-label="Hantera användare"
                          className="px-3 py-2 rounded-full text-sm border flex items-center gap-1.5"
                          style={{ borderColor: "#D5D5D5", color: MUTED }}>
                    <Users size={15} /> Hantera
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <CalendarDays size={18} style={{ color: ACCENT }} />
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="border rounded-lg px-3 py-2 text-sm"
                  style={{ borderColor: "#D5D5D5" }}
                />
              </div>

              <div className="mb-4">
                <div className="text-xs font-bold mb-2" style={{ color: ACCENT_DARK }}>
                  AKTIVITET
                </div>
                <div className="flex flex-wrap gap-2">
                  {SPORTS.map((s) => (
                    <Pill key={s.code} active={form.sport.includes(s.code)} color={ACCENT}
                          onClick={() => toggleSport(s.code)}>
                      {s.label}
                    </Pill>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <div className="text-xs font-bold mb-2" style={{ color: "#555555" }}>
                  TRÄNINGSTYP
                </div>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map((t) => (
                    <Pill key={t.code} active={form.typ.includes(t.code)} color="#5B5B5B"
                          onClick={() => toggleTyp(t.code)}>
                      {t.label}
                    </Pill>
                  ))}
                </div>
              </div>

              <div className="mb-4" style={{ maxWidth: "50%" }}>
                  <div className="text-xs font-bold mb-2" style={{ color: "#555555" }}>
                    TID (MIN)
                  </div>
                  <input
                    type="number" inputMode="numeric" min="0" placeholder="t.ex. 60"
                    value={form.tid}
                    onChange={(e) => setForm((f) => ({ ...f, tid: e.target.value }))}
                    className="border rounded-lg px-3 py-2 text-sm w-full"
                    style={{ borderColor: "#D5D5D5" }}
                  />
              </div>
              <div className="mb-4">
                <div className="text-xs font-bold mb-2" style={{ color: "#555555" }}>
                  ANSTRÄNGNING (1–10)
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <button
                      key={n} type="button"
                      onClick={() => setForm((f) => ({ ...f, kansla: String(n) }))}
                      className="py-2 rounded-lg text-sm font-bold border"
                      style={{
                        borderColor: form.kansla === String(n) ? ACCENT : "#D5D5D5",
                        backgroundColor: form.kansla === String(n) ? ACCENT : "white",
                        color: form.kansla === String(n) ? "white" : "#444444",
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-xs mt-1.5" style={{ color: "#999999" }}>
                  1 = Mycket lätt · 3 = Måttligt · 5 = Tungt · 7 = Mycket tungt · 10 = Maximalt
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#B5B5B5" }}>
                  Skala enligt Borg CR10.
                </p>
              </div>
              <div className="mb-4">
                <div className="text-xs font-bold mb-2" style={{ color: "#555555" }}>
                  ANTECKNINGAR
                </div>
                <textarea
                  value={form.anteckningar}
                  onChange={(e) => setForm((f) => ({ ...f, anteckningar: e.target.value }))}
                  placeholder="Vad gjorde ni? Hur kändes det?"
                  rows={3}
                  className="border rounded-lg px-3 py-2 text-sm w-full resize-none"
                  style={{ borderColor: "#D5D5D5" }}
                />
              </div>

              <button
                onClick={handleSave}
                disabled={!canSave}
                className="w-full py-2.5 rounded-lg text-sm font-bold text-white transition-opacity flex items-center justify-center gap-2"
                style={{ backgroundColor: ACCENT, opacity: canSave ? 1 : 0.45 }}
              >
                {savedFlash ? (<><Check size={16} /> Sparat</>) : editingId ? "Spara ändringar" : "Spara pass"}
              </button>
              {form.sport.length === 0 && (
                <p className="text-xs mt-2" style={{ color: MUTED }}>
                  Välj minst en aktivitet för att spara.
                </p>
              )}
              {saveError && (
                <p className="text-xs mt-2 font-semibold" style={{ color: "#B5544A" }}>
                  Kunde inte spara. Det här funkar bara på den publicerade länken, inte i
                  förhandsvisningen här i chatten — testa via den riktiga länken.
                </p>
              )}
            </Card>

            <div>
              <div className="text-xs font-bold mb-2" style={{ color: MUTED }}>
                LOGGADE PASS · {userName(form.user)} ·{" "}
                <span className="relative inline-block">
                  {monthLabel(selectedMonth)}
                  <ChevronDown size={14} style={{ display: "inline", verticalAlign: "-2px", marginLeft: 2 }} />
                  <select
                    aria-label="Välj månad"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="absolute inset-0 w-full h-full cursor-pointer"
                    style={{ opacity: 0 }}
                  >
                    {[...new Set([...allMonths, selectedMonth])].sort().reverse().map((m) => (
                      <option key={m} value={m}>{monthLabel(m)}</option>
                    ))}
                  </select>
                </span>
              </div>
              {loadingMonth ? (
                <p className="text-sm" style={{ color: MUTED }}>Laddar…</p>
              ) : sortedMonthEntries.length === 0 ? (
                <p className="text-sm" style={{ color: MUTED }}>Inga pass loggade den här månaden ännu.</p>
              ) : (
                <div className="space-y-2">
                  {sortedMonthEntries.map((e) => {
                    const isExpanded = expandedIds.has(e.id);
                    const hasNote = e.anteckningar && e.anteckningar.trim().length > 0;
                    const preview = hasNote && e.anteckningar.length > 42
                      ? e.anteckningar.slice(0, 42) + "…"
                      : e.anteckningar;
                    return (
                      <div key={e.id} className="rounded-lg border bg-white text-sm overflow-hidden"
                           style={{ borderColor: "#E4E4E4" }}>
                        <div
                          onClick={() => toggleExpand(e.id)}
                          className="flex items-center justify-between px-3 py-2 cursor-pointer select-none"
                        >
                          <div className="flex-1 min-w-0 flex items-center gap-1.5">
                            <ChevronDown
                              size={14}
                              className="shrink-0 transition-transform"
                              style={{
                                color: MUTED,
                                transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                              }}
                            />
                            <div className="min-w-0 truncate">
                              <span className="font-semibold mr-2">{e.date.slice(8)}/{e.date.slice(5,7)}</span>
                              <span style={{ color: ACCENT_DARK }}>{(e.sport||[]).join(" ")}</span>
                              {(e.typ||[]).length > 0 && (
                                <span style={{ color: MUTED }}> · {e.typ.join(" ")}</span>
                              )}
                              {e.tid && <span style={{ color: MUTED }}> · {e.tid} min</span>}
                              {e.kansla && <span style={{ color: MUTED }}> · ansträngning {e.kansla}</span>}
                              {hasNote && !isExpanded && (
                                <span style={{ color: "#B5B5B5" }}> · {preview}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0 ml-2">
                            <button
                              onClick={(ev) => { ev.stopPropagation(); startEdit(e); }}
                              className="p-1 rounded hover:bg-gray-100"
                              title="Redigera"
                            >
                              <Pencil size={14} style={{ color: MUTED }} />
                            </button>
                            <button
                              onClick={(ev) => { ev.stopPropagation(); deleteEntry(e.id); }}
                              className="p-1 rounded hover:bg-gray-100"
                              title="Ta bort"
                            >
                              <Trash2 size={15} style={{ color: "#B5544A" }} />
                            </button>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="px-3 pb-3 pt-0.5" style={{ paddingLeft: "2rem" }}>
                            {hasNote ? (
                              <p className="text-sm whitespace-pre-wrap" style={{ color: INK }}>
                                {e.anteckningar}
                              </p>
                            ) : (
                              <p className="text-xs italic" style={{ color: "#B5B5B5" }}>
                                Ingen anteckning för det här passet.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {view === "stats" && (
          <div className="space-y-5">
            <div>
              <div className="text-xs font-bold mb-2" style={{ color: ACCENT_DARK }}>
                VISAR STATISTIK FÖR
              </div>
              <div className="flex flex-wrap gap-2">
                {visibleUsers.map((u) => (
                  <Pill key={u.id} active={statsUser === u.id} color={themeForUser(u).accent}
                        onClick={() => setStatsUser(u.id)}>
                    {u.name}
                  </Pill>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => { setSelectedMonth(e.target.value); setStatsScope("month"); }}
                disabled={statsScope === "all"}
                className="border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: "#D5D5D5", opacity: statsScope === "all" ? 0.5 : 1 }}
              >
                {allMonths.map((m) => (
                  <option key={m} value={m}>{monthLabel(m)}</option>
                ))}
              </select>
              <Pill active={statsScope === "month"} color={ACCENT} onClick={() => setStatsScope("month")}>
                Vald månad
              </Pill>
              <Pill active={statsScope === "all"} color={ACCENT} onClick={() => setStatsScope("all")}>
                Alla månader
              </Pill>
            </div>

            {(loadingMonth && statsScope === "month") || (loadingAll && statsScope === "all") ? (
              <p className="text-sm" style={{ color: MUTED }}>Laddar…</p>
            ) : dataForStats.length === 0 ? (
              <Card>
                <p className="text-sm" style={{ color: MUTED }}>
                  Inga pass loggade än för det här urvalet. Gå till "Logga pass" för att komma igång.
                </p>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Card>
                    <div className="text-2xl font-bold" style={{ color: ACCENT_DARK }}>{summary.totalPass}</div>
                    <div className="text-xs" style={{ color: MUTED }}>Antal pass</div>
                  </Card>
                  <Card>
                    <div className="text-2xl font-bold" style={{ color: ACCENT_DARK }}>
                      {(summary.totalTidMin / 60).toFixed(1)}
                    </div>
                    <div className="text-xs" style={{ color: MUTED }}>Timmar totalt</div>
                  </Card>
                  <Card>
                    <div className="text-2xl font-bold" style={{ color: ACCENT_DARK }}>
                      {summary.avgKansla ? summary.avgKansla.toFixed(1) : "–"}
                    </div>
                    <div className="text-xs" style={{ color: MUTED }}>Snittansträngning</div>
                  </Card>
                  <Card>
                    <div className="text-2xl font-bold" style={{ color: ACCENT_DARK }}>
                      {Math.round(summary.totalLoad).toLocaleString("sv-SE")}
                    </div>
                    <div className="text-xs" style={{ color: MUTED }}>Belastning (AU)</div>
                  </Card>
                </div>

                <Card>
                  <div className="text-xs font-bold mb-3" style={{ color: ACCENT_DARK }}>
                    BELASTNING PER DAG &nbsp;<span className="font-normal" style={{ color: MUTED }}>(tid × ansträngning)</span>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={loadByDate} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: MUTED }} axisLine={{ stroke: "#DDDDDD" }} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} width={30} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#E4E4E4" }} />
                      <Bar dataKey="load" name="Belastning" fill={ACCENT} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Card>
                    <div className="text-xs font-bold mb-3" style={{ color: ACCENT_DARK }}>FÖRDELNING AKTIVITET</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={sportDist} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                          {sportDist.map((entry, i) => (
                            <Cell key={entry.name} fill={SPORT_COLORS[i % SPORT_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#E4E4E4" }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-3 justify-center mt-1">
                      {sportDist.map((s, i) => (
                        <div key={s.name} className="flex items-center gap-1.5 text-xs" style={{ color: MUTED }}>
                          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SPORT_COLORS[i % SPORT_COLORS.length] }} />
                          {s.name} ({s.value})
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card>
                    <div className="text-xs font-bold mb-3" style={{ color: ACCENT_DARK }}>ANSTRÄNGNING ÖVER TID</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={kanslaTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: MUTED }} axisLine={{ stroke: "#DDDDDD" }} tickLine={false} />
                        <YAxis domain={[1, 10]} ticks={[1,2,3,4,5,6,7,8,9,10]} tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} width={20} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#E4E4E4" }} />
                        <Line type="monotone" dataKey="kansla" stroke={ACCENT} strokeWidth={2} dot={{ r: 3, fill: ACCENT }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>
                </div>

                <Card>
                  <div className="text-xs font-bold mb-3" style={{ color: "#555555" }}>FÖRDELNING TRÄNINGSTYP</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={typeDist} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" vertical={false} />
                      <XAxis dataKey="code" tick={{ fontSize: 10, fill: MUTED }} axisLine={{ stroke: "#DDDDDD" }} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#E4E4E4" }}
                        formatter={(value, name, props) => [value, props.payload.name]}
                      />
                      <Bar dataKey="count" name="Antal pass" radius={[3, 3, 0, 0]}>
                        {typeDist.map((entry, i) => (
                          <Cell key={entry.code} fill={TYPE_PALETTE[i % TYPE_PALETTE.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </>
            )}
          </div>
        )}

        {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
        {showUsers && (
          <UserManager users={users} localHidden={localHidden} onLocalHide={setLocalHiddenIds} onUpdate={updateUsers} onClose={() => setShowUsers(false)} />
        )}

        <p className="text-xs text-center mt-8" style={{ color: "#B5B5B5" }}>
          Live-delad: ändringar syns direkt hos alla som har samma delningslänk.<br />Version {APP_VERSION} · {APP_DATE} ·{" "}
          <button type="button" className="underline" style={{ color: ACCENT_DARK }} onClick={() => setShowChangelog(true)}>Vad är nytt?</button>
        </p>

        {connLink && (
          <div className="text-center" style={{ marginTop: 28, paddingBottom: "max(2.5rem, calc(env(safe-area-inset-bottom) + 1.5rem))" }}>
            <button
              type="button"
              onClick={() => { location.replace(location.pathname + "?v=" + Date.now()); }}
              className="inline-flex items-center justify-center rounded-lg text-sm font-semibold border"
              style={{ minHeight: 44, paddingLeft: 20, paddingRight: 20, borderColor: ACCENT, color: ACCENT_DARK }}
            >
              Uppdatera sidan
            </button>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2" style={{ marginTop: 20 }}>
              <button
                type="button"
                className="text-xs underline"
                style={{ color: ACCENT_DARK }}
                onClick={() => { navigator.clipboard && navigator.clipboard.writeText(connLink); setLinkCopied(true); }}
              >
                {linkCopied ? "Länk kopierad – skicka till rätt person" : "Kopiera kopplingslänk till annan enhet"}
              </button>
              <button type="button" className="text-xs underline" style={{ color: "#999" }} onClick={onDisconnect}>
                Koppla bort enheten
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
