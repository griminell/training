import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { CalendarDays, ClipboardList, BarChart3, Trash2, Check, Download, Loader2, ChevronDown, Pencil, X, Upload, Users, Eye, Plus, AlertTriangle, RotateCw, Repeat, Moon, Thermometer } from "lucide-react";

export const APP_VERSION = "1.5.2";
export const APP_DATE = "2026-10-19";

const CHANGELOG = [
  { version: "1.5.2", date: "2026-10-19", items: [
    "Vilodag och sjukdag: välj Pass, Vilodag eller Sjukdag när du loggar. Då behövs bara datum och anteckningar",
    "Vilo- och sjukdagar räknas inte som pass i statistiken, men syns i listan och i kortet Registrerade vilo-/sjukdagar",
    "Max en vilo- eller sjukdag per person och dag. Ett pass kan ligga på samma dag",
    "Ansträngningen syns nu i listan över loggade pass, t.ex. 6/10",
    "CSV har en ny kolumn Typ (Pass, Vilodag, Sjukdag). Äldre filer går fortfarande att importera" ] },
  { version: "1.5.1", date: "2026-10-19", items: [
    "Aktivitet och Träningstyp: de tre du använder mest syns direkt, övriga finns under Fler",
    "Ordningen räknas på dina senaste 30 dagar och ändras bara när du öppnar appen, aldrig medan du loggar",
    "Samma som senast: fyller i aktivitet, träningstyp och tid från ditt senaste pass (inte ansträngning, datum eller anteckningar)" ] },
  { version: "1.5.0", date: "2026-10-19", items: [
    "Säkrare sparning: om två enheter sparar samtidigt blir båda passen kvar",
    "Ej sparat: pass som inte kommer fram sparas på telefonen och skickas automatiskt när nätet är tillbaka",
    "Du kan spara igen, redigera eller radera ett pass som är Ej sparat",
    "Bekräftelse innan ett pass tas bort",
    "Att flytta ett pass till en annan månad kan inte längre tappa passet på vägen",
    "Sidfoten visar om skyddet mot överskrivning är på",
    "Export avbryts med ett tydligt fel om någon månad inte kunde hämtas, i stället för en ofullständig fil" ] },
  { version: "1.4.7", date: "2026-10-18", items: [
    "Diagrammen på statistiksidan klipps inte längre av till vänster: siffrorna på den lodräta axeln syns nu",
    "Första punkten i diagrammet Ansträngning över tid ligger inte längre tryckt mot kanten" ] },
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
  return n.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "anv";
}
function applyTheme(user) {
  const t = themeForUser(user);
  ACCENT = t.accent; ACCENT_DARK = t.dark; ACCENT_SOFT = t.soft;
  TYPE_PALETTE = t.types; SPORT_COLORS = t.sports;
}
const PAPER = "#FFFFFF";
const INK = "#232323";
const MUTED = "#6B6B6B";

// Chart margin. Never use a negative left margin: the Y axis is drawn inside the
// margin box, so a negative value pushes the tick labels outside the SVG and clips them.
const CHART_MARGIN = { top: 4, right: 12, left: 0, bottom: 0 };


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
// Read a key. ok=false means the read FAILED (offline etc.), which is different from "no data" (ok=true, data=null).
async function safeGetResult(key) {
  try {
    const res = await window.storage.get(key, true);
    if (!(res && res.value)) return { ok: true, data: null };
    const data = JSON.parse(res.value);
    return { ok: true, data: key.startsWith("entries:") ? normalizeEntries(data) : data };
  } catch (e) {
    return { ok: false, data: null };
  }
}
async function safeGet(key) {
  return (await safeGetResult(key)).data;
}

// ---------------------------------------------------------------------------------------------
// The ONE place where data is written. Every save (add/edit/delete pass, import, user list) goes
// through saveKey: read the latest value together with its version (ETag), apply the change to
// that latest value (the "mutator"), and write only if nobody changed it in between. If someone
// did (HTTP 412), read again and redo the change on the newer value, up to MAX_TRIES times.
// Result: { status: "ok" | "offline" | "conflict" | "abort" | "error", value?, message? }
// A later full offline queue can be swapped in behind this function without touching callers.
// ---------------------------------------------------------------------------------------------
const MAX_TRIES = 5;
const NO_CHANGE = { noChange: true };
async function saveKey(key, mutate, parse, empty, opts = {}) {
  for (let i = 0; i < MAX_TRIES; i++) {
    let cur;
    try { cur = await window.storage.getV(key); } catch (e) { return { status: "offline" }; }
    let value = empty;
    if (cur.raw != null) {
      try { value = parse(JSON.parse(cur.raw)); } catch (e) { return { status: "error" }; } // never overwrite data we cannot read
    }
    const out = mutate(value);
    if (out && out.abort !== undefined) return { status: "abort", message: out.abort };
    if (out === NO_CHANGE) return { status: "ok", value };
    let r;
    try { r = await window.storage.putIf(key, JSON.stringify(out), cur); } catch (e) { return { status: "offline" }; }
    if (r === "ok") {
      // Reserve mode (no ETag): the check before writing is not airtight, so look again shortly after.
      // If our change is gone (a concurrent write landed on top), redo it on the newer data.
      if (opts.verify && window.storage.etagMode !== "on") {
        await new Promise((res) => setTimeout(res, 700));
        try {
          const chk = await window.storage.getV(key);
          const latest = chk.raw != null ? parse(JSON.parse(chk.raw)) : empty;
          const again = mutate(latest);
          const same = again === NO_CHANGE || (again && again.abort === undefined && JSON.stringify(again) === JSON.stringify(latest));
          if (!same) continue;
          return { status: "ok", value: latest };
        } catch (e) { /* cannot verify: accept the write */ }
      }
      return { status: "ok", value: out };
    }
    // "conflict": someone else wrote first. Loop: read their version and redo our change on top of it.
  }
  return { status: "conflict" };
}
function saveMonth(monthKey, mutate) {
  return saveKey(`entries:${monthKey}`, mutate, normalizeEntries, [], { verify: true });
}
const byDate = (a, b) => a.date.localeCompare(b.date);

// ---- "Ej sparat" queue (localStorage) ----
// Stores ACTIONS ("put this pass"), never copies of a whole month, so a late retry is applied to the
// latest data and replaces by id (no duplicates, nobody else's pass is overwritten).
// Action: { qid, entry, removeFrom (month key or null), stage (0 = write entry, 1 = remove old copy), attempts, queuedAt }
const PENDING_KEY = "nivadagbok-pending";
function loadPending() {
  try {
    const a = JSON.parse(localStorage.getItem(PENDING_KEY));
    return Array.isArray(a) ? a.filter((x) => x && x.entry && x.entry.id && x.entry.date) : [];
  } catch (e) { return []; }
}
function storePending(list) {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(list)); } catch (e) { /* kept in memory only */ }
}
async function runAction(a, onStage) {
  const id = a.entry.id;
  const key = monthKeyOf(a.entry.date);
  if (!a.stage) {
    const r = await saveMonth(key, (list) => {
      const next = list.some((e) => e.id === id) ? list.map((e) => (e.id === id ? a.entry : e)) : [...list, a.entry];
      return next.sort(byDate);
    });
    if (r.status !== "ok") return r;
    if (a.removeFrom && a.removeFrom !== key) onStage(1);
  }
  if (a.removeFrom && a.removeFrom !== key) {
    // Moving to another month: the new copy is already saved above, only now remove the old one.
    const r2 = await saveMonth(a.removeFrom, (list) => (list.some((e) => e.id === id) ? list.filter((e) => e.id !== id) : NO_CHANGE));
    if (r2.status !== "ok") return r2;
  }
  return { status: "ok" };
}
// kind: missing = normal pass, "rest" = rest day, "sick" = sick day
const kindLabel = (k) => (k === "rest" ? "Vilodag" : k === "sick" ? "Sjukdag" : "Pass");
function entryLine(e) {
  if (e.kind === "rest" || e.kind === "sick") return `${e.date.slice(8)}/${e.date.slice(5, 7)} · ${kindLabel(e.kind)}`;
  return [
    `${e.date.slice(8)}/${e.date.slice(5, 7)}`,
    (e.sport || []).join(" "),
    (e.typ || []).length ? e.typ.join(" ") : null,
    e.tid ? `${e.tid} min` : null,
    e.kansla ? `ansträngning ${e.kansla}` : null,
  ].filter(Boolean).join(" · ");
}

// ---- Most used choices ("Vanligaste valen") ----
const VISIBLE_COUNT = 3;
const DEFAULT_SPORTS = ["F", "LÖ", "S"];
const DEFAULT_TYPES = ["TE", "KO", "ST"];
const NO_COUNTS = {};
const isoDaysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
function monthsBetween(fromIso, toIso) {
  const out = new Set();
  for (let t = new Date(fromIso + "T00:00:00Z").getTime(), end = new Date(toIso + "T00:00:00Z").getTime(); t <= end; t += 86400000) {
    out.add(new Date(t).toISOString().slice(0, 7));
  }
  return [...out];
}
const isRealPass = (e) => e && e.kind !== "rest" && e.kind !== "sick";
const isOffDay = (e) => e && (e.kind === "rest" || e.kind === "sick");
// Order of all choices for one user: used in the last 30 days (most first), then the defaults, then the rest.
function rankCodes(all, counts, defaults) {
  const codes = all.map((x) => x.code);
  const used = codes.filter((c) => (counts[c] || 0) > 0)
    .sort((a, b) => (counts[b] - counts[a]) || (codes.indexOf(a) - codes.indexOf(b)));
  const rest = defaults.filter((c) => !used.includes(c));
  return [...used, ...rest, ...codes.filter((c) => !used.includes(c) && !rest.includes(c))];
}
// The three most used choices are visible, the others sit behind "Fler (n)". Selected choices are always visible.
// `counts` is computed once when the app opens, so buttons never move while the user is logging.
function ChoiceGroup({ items, counts, defaults, selected, color, onToggle, testId }) {
  const [open, setOpen] = useState(false);
  const order = useMemo(() => rankCodes(items, counts, defaults), [items, counts, defaults]);
  const top = order.slice(0, VISIBLE_COUNT);
  const shown = order.filter((c) => open || top.includes(c) || selected.includes(c));
  const hidden = order.length - shown.length;
  const label = (c) => items.find((x) => x.code === c).label;
  return (
    <div className="flex flex-wrap gap-2" data-testid={testId}>
      {shown.map((c) => (
        <Pill key={c} active={selected.includes(c)} color={color} onClick={() => onToggle(c)}>{label(c)}</Pill>
      ))}
      {(open || hidden > 0) && (
        <button type="button" onClick={() => setOpen(!open)} data-testid={`${testId}-more`} aria-expanded={open}
                className="px-3 py-2 rounded-full text-sm border flex items-center gap-1" style={{ borderColor: "#D5D5D5", color: MUTED }}>
          {open ? "Färre" : `Fler (${hidden})`}
          <ChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : "none" }} />
        </button>
      )}
    </div>
  );
}
const labelOf = (arr, code) => (arr.find((x) => x.code === code) || { label: code }).label;

// Latest real pass by a user, looking back over month boundaries (and at queued passes).
async function findLastEntry(userId, monthsDesc, queuedList) {
  let best = null;
  const consider = (e) => {
    if (!isRealPass(e) || (e.user || "niva") !== userId || !(e.sport || []).length) return;
    if (!best || e.date >= best.date) best = e; // same date: the later one in the list wins
  };
  queuedList.forEach((a) => consider(a.entry));
  for (const m of monthsDesc) {
    const r = await safeGetResult(`entries:${m}`);
    if (!r.ok) continue;
    (r.data || []).forEach(consider);
    if (best && best.date.slice(0, 7) >= m) break; // nothing in older months can be newer
  }
  return best;
}

// Confirmation dialog in the app's style (replaces the browser's confirm()).
function ConfirmModal({ title, text, confirmLabel, busy, error, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
         onClick={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}>
      <div role="dialog" aria-modal="true" aria-label={title} className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-4"
           style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        <h2 className="text-lg font-bold mb-1" style={{ color: INK }}>{title}</h2>
        <p className="text-sm mb-3" style={{ color: INK }}>{text}</p>
        {error && <p className="text-sm font-semibold mb-3" style={{ color: "#B5544A" }}>{error}</p>}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onCancel} disabled={busy}
                  className="rounded-lg text-sm font-semibold border" style={{ minHeight: 44, borderColor: "#D5D5D5", color: "#444444" }}>
            Avbryt
          </button>
          <button type="button" onClick={onConfirm} disabled={busy}
                  className="rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2" style={{ minHeight: 44, backgroundColor: "#B5544A", opacity: busy ? 0.6 : 1 }}>
            {busy && <Loader2 size={15} className="animate-spin" />}{confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
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
      aria-pressed={active}
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
  const [savedFlash, setSavedFlash] = useState(false); // false | "ok" | "queued"
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [editingId, setEditingId] = useState(null);
  const [editingOriginalMonth, setEditingOriginalMonth] = useState(null);
  // Ej sparat: the queue lives in localStorage (see loadPending); pendingRef is the source of truth for callbacks.
  const [pending, setPending] = useState(loadPending);
  const pendingRef = React.useRef(pending);
  const [editingPending, setEditingPending] = useState(null); // { qid, entryId, removeFrom } while a queued pass is loaded in the form
  const [retryingQid, setRetryingQid] = useState(null);
  const [formEpoch, setFormEpoch] = useState(0); // bumped after a save: "Fler" groups fold back together
  const [confirmDlg, setConfirmDlg] = useState(null); // { kind: "saved" | "pending" | "disconnect", ... }
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmError, setConfirmError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [protection, setProtection] = useState(null); // null | "on" | "limited"

  const emptyForm = {
    date: todayISO(),
    user: getMe(),
    sport: [],
    typ: [],
    tid: "",
    kansla: "",
    anteckningar: "",
    kind: "pass", // form only: "pass" | "rest" | "sick" (a normal pass is stored without kind)
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
    const r = await saveKey(
      "meta:users",
      (latest) => { const next = mutator(latest); return typeof next === "string" ? { abort: next } : next; },
      (l) => (Array.isArray(l) && l.length ? l : DEFAULT_USERS),
      DEFAULT_USERS
    );
    syncProtection();
    if (r.status === "abort") return { ok: false, error: r.message };
    if (r.status === "conflict") return { ok: false, error: "Någon annan ändrade samtidigt. Försök igen." };
    if (r.status !== "ok") return { ok: false, error: "Ingen kontakt med databasen. Försök igen." };
    setUsers(r.value);
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

  const loadedMonthRef = React.useRef(null);
  const loadMonth = useCallback(async (key) => {
    setLoadingMonth(true);
    const r = await safeGetResult(`entries:${key}`);
    // A failed read must never blank a list we already have for this month (e.g. when the network drops).
    if (r.ok) { loadedMonthRef.current = key; setMonthEntries(r.data || []); }
    else if (loadedMonthRef.current !== key) setMonthEntries([]);
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
      const mr = await safeGetResult(`entries:${selectedMonthRef.current}`);
      if (mr.ok) {
        const data = mr.data || [];
        setMonthEntries((prev) => (JSON.stringify(prev) === JSON.stringify(data) ? prev : data));
      }
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

  // ---- Vanligaste valen: counted once when the app opens (never while logging) ----
  const [usage, setUsage] = useState(null); // { userId: { sport: {code: n}, typ: {code: n} } }
  useEffect(() => {
    let dead = false;
    (async () => {
      const since = isoDaysAgo(30);
      const results = await Promise.all(monthsBetween(since, todayISO()).map((m) => safeGetResult(`entries:${m}`)));
      const u = {};
      results.forEach((r) => (r.data || []).forEach((e) => {
        if (!isRealPass(e) || e.date < since) return;
        const slot = (u[e.user || "niva"] = u[e.user || "niva"] || { sport: {}, typ: {} });
        (e.sport || []).forEach((c) => { slot.sport[c] = (slot.sport[c] || 0) + 1; });
        (e.typ || []).forEach((c) => { slot.typ[c] = (slot.typ[c] || 0) + 1; });
      }));
      if (!dead) setUsage(u);
    })();
    return () => { dead = true; };
  }, []);

  // ---- Samma som senast ----
  const [lastEntry, setLastEntry] = useState(null);

  // ---- Ej sparat: queue handling ----
  const mutatePending = useCallback((fn) => {
    const next = fn(pendingRef.current);
    pendingRef.current = next;
    storePending(next);
    setPending(next);
  }, []);
  const syncProtection = useCallback(() => {
    setProtection((window.storage && window.storage.etagMode) || null);
  }, []);
  const refreshViewRef = React.useRef(() => {});
  refreshViewRef.current = async () => {
    refreshMonthList();
    loadUsers();
    const r = await safeGetResult(`entries:${selectedMonthRef.current}`);
    if (r.ok) setMonthEntries(r.data || []);
    setAllEntries(null);
  };
  const flushChain = React.useRef(Promise.resolve());
  const flushing = React.useRef(false);
  // Try to send everything in the queue, one pass at a time. Calls are chained so two retries never run at once.
  const flush = useCallback(() => {
    const run = async () => {
      flushing.current = true;
      let saved = false;
      try {
        for (const a0 of [...pendingRef.current]) {
          const a = pendingRef.current.find((x) => x.qid === a0.qid);
          if (!a) continue; // removed (deleted by the user) while we were busy
          const r = await runAction(a, (stage) => mutatePending((l) => l.map((x) => (x.qid === a.qid ? { ...x, stage } : x))));
          if (r.status === "ok") {
            mutatePending((l) => l.filter((x) => x.qid !== a.qid));
            saved = true;
          } else {
            mutatePending((l) => l.map((x) => (x.qid === a.qid ? { ...x, attempts: (x.attempts || 0) + 1 } : x)));
            if (r.status === "offline") break; // no point trying the rest while unreachable
          }
        }
      } finally {
        flushing.current = false;
        syncProtection();
      }
      if (saved) refreshViewRef.current();
    };
    flushChain.current = flushChain.current.then(run, run);
    return flushChain.current;
  }, [mutatePending, syncProtection]);

  // Automatic retries: when the connection returns, when the app becomes visible, every 30 s, and at startup.
  useEffect(() => {
    const go = () => { if (pendingRef.current.length && !flushing.current) flush(); };
    const onOnline = () => { go(); refreshViewRef.current(); };
    const onVisible = () => { if (document.visibilityState === "visible") go(); };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    const timer = setInterval(go, 30000);
    go();
    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(timer);
    };
  }, [flush]);
  // Learn early whether the overwrite protection (ETag) works in this browser, for the footer line.
  useEffect(() => {
    if (window.storage && window.storage.getV) window.storage.getV("meta:users").then(syncProtection).catch(() => {});
  }, [syncProtection]);

  const queued = pending.filter((a) => a.attempts > 0); // shown as Ej sparat (in-flight saves are not shown)
  const queuedIds = useMemo(() => new Set(queued.map((a) => a.entry.id)), [pending]); // eslint-disable-line
  const maxAttempts = queued.reduce((m, a) => Math.max(m, a.attempts || 0), 0);

  useEffect(() => {
    let dead = false;
    findLastEntry(form.user, [...allMonths].sort().reverse(), pending).then((e) => { if (!dead) setLastEntry(e); });
    return () => { dead = true; };
  }, [form.user, allMonths, monthEntries, pending]); // eslint-disable-line
  const lastText = lastEntry ? [
    (lastEntry.sport || []).map((c) => labelOf(SPORTS, c)).join(" + "),
    (lastEntry.typ || []).map((c) => labelOf(TYPES, c)).join(" + "),
    lastEntry.tid ? `${lastEntry.tid} min` : null,
  ].filter(Boolean).join(" · ") : "";
  // Effort (ansträngning), date and notes are never copied: effort is a fresh judgement of this session.
  function applyLast() {
    if (!lastEntry) return;
    setForm((f) => ({ ...f, sport: [...(lastEntry.sport || [])], typ: [...(lastEntry.typ || [])], tid: lastEntry.tid || f.tid }));
  }

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
    setEditingPending(null);
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
      kind: isOffDay(entry) ? entry.kind : "pass",
    });
    if (typeof window !== "undefined" && window.scrollTo) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // Load a queued (Ej sparat) pass back into the form. Saving replaces the queued pass.
  function startEditPending(a) {
    setEditingId(null);
    setEditingOriginalMonth(null);
    setEditingPending({ qid: a.qid, entryId: a.entry.id, removeFrom: a.removeFrom || null });
    setForm({
      date: a.entry.date,
      user: a.entry.user || "niva",
      sport: a.entry.sport || [],
      typ: a.entry.typ || [],
      tid: a.entry.tid || "",
      kansla: a.entry.kansla || "",
      anteckningar: a.entry.anteckningar || "",
      kind: isOffDay(a.entry) ? a.entry.kind : "pass",
    });
    if (typeof window !== "undefined" && window.scrollTo) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingOriginalMonth(null);
    setEditingPending(null);
    setForm((f) => ({ ...emptyForm, user: f.user }));
  }

  // Saving always goes: put the pass in the queue first (so it survives a closed app or a dropped
  // connection), then try to send it. If it got through it leaves the queue; otherwise it stays as "Ej sparat".
  // The entry that gets stored. A normal pass has no `kind`; a rest/sick day only keeps date, user and notes.
  function buildEntry(id) {
    const { kind, ...rest } = form;
    if (kind === "rest" || kind === "sick") {
      return { id, date: form.date, user: form.user, kind, sport: [], typ: [], tid: "", kansla: "", anteckningar: form.anteckningar, cr10: true };
    }
    return { id, ...rest, cr10: true };
  }
  // At most one rest/sick day per user and date. Checks the queue and the saved month (if it can be read).
  async function offDayTaken(ignoreId) {
    const same = (e) => isOffDay(e) && (e.user || "niva") === form.user && e.date === form.date && e.id !== ignoreId;
    if (pendingRef.current.some((a) => same(a.entry))) return true;
    const mk = monthKeyOf(form.date);
    if (mk === selectedMonthRef.current && monthEntries.some(same)) return true;
    const r = await safeGetResult(`entries:${mk}`);
    return !!(r.ok && (r.data || []).some(same));
  }
  const isOff = form.kind === "rest" || form.kind === "sick";
  useEffect(() => { setSaveError(null); }, [form.date, form.kind, form.user]);

  async function handleSave() {
    if (!form.date || (!isOff && form.sport.length === 0) || saving) return;
    setSaveError(null);
    setSaving(true);
    if (isOff && (await offDayTaken(editingPending ? editingPending.entryId : editingId))) {
      setSaveError(`Du har redan en vilodag eller sjukdag den dagen.`);
      setSaving(false);
      return;
    }
    let qid;
    if (editingPending) {
      qid = editingPending.qid;
      const entry = buildEntry(editingPending.entryId);
      if (pendingRef.current.some((a) => a.qid === qid)) {
        mutatePending((l) => l.map((a) => (a.qid === qid ? { ...a, entry, stage: 0 } : a)));
      } else {
        // it was sent in the meantime: send the edited version, same id so it replaces the saved one
        qid = "q" + uid();
        mutatePending((l) => [...l, { qid, entry, removeFrom: editingPending.removeFrom, stage: 0, attempts: 0, queuedAt: Date.now() }]);
      }
    } else {
      const id = editingId || uid();
      const entry = buildEntry(id);
      const removeFrom = editingId && editingOriginalMonth && editingOriginalMonth !== monthKeyOf(form.date) ? editingOriginalMonth : null;
      qid = "q" + uid();
      mutatePending((l) => [...l, { qid, entry, removeFrom, stage: 0, attempts: 0, queuedAt: Date.now() }]);
    }
    await flush();
    const left = pendingRef.current.find((a) => a.qid === qid);
    if (left && !left.attempts) mutatePending((l) => l.map((a) => (a.qid === qid ? { ...a, attempts: 1 } : a)));
    setEditingId(null);
    setEditingOriginalMonth(null);
    setEditingPending(null);
    setForm((f) => ({ ...emptyForm, user: f.user }));
    setFormEpoch((n) => n + 1);
    setSavedFlash(left ? "queued" : "ok");
    setTimeout(() => setSavedFlash(false), left ? 3200 : 1800);
    setSaving(false);
  }

  async function retryPending(qid) {
    setRetryingQid(qid);
    await flush();
    setRetryingQid(null);
  }

  function askDelete(e) { setConfirmError(null); setConfirmDlg({ kind: "saved", entry: e }); }
  function askDeletePending(a) { setConfirmError(null); setConfirmDlg({ kind: "pending", qid: a.qid }); }
  function closeConfirm() { if (!confirmBusy) { setConfirmDlg(null); setConfirmError(null); } }
  async function doConfirm() {
    const d = confirmDlg;
    if (!d) return;
    if (d.kind === "pending") {
      mutatePending((l) => l.filter((a) => a.qid !== d.qid));
      if (editingPending && editingPending.qid === d.qid) cancelEdit();
      setConfirmDlg(null);
      return;
    }
    if (d.kind === "disconnect") { onDisconnect(); return; }
    // Deleting an already saved pass needs a connection; no queueing for this in 1.5.0.
    setConfirmBusy(true);
    setConfirmError(null);
    const id = d.entry.id;
    const key = monthKeyOf(d.entry.date);
    const r = await saveMonth(key, (list) => (list.some((e) => e.id === id) ? list.filter((e) => e.id !== id) : NO_CHANGE));
    syncProtection();
    setConfirmBusy(false);
    if (r.status === "ok") {
      if (key === selectedMonthRef.current) setMonthEntries(r.value);
      setAllEntries(null);
      if (editingId === id) cancelEdit();
      setConfirmDlg(null);
    } else {
      setConfirmError("Kunde inte ta bort, försök igen.");
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
      const results = await Promise.all(months.map((m) => safeGetResult(`entries:${m}`)));
      if (results.some((r) => !r.ok)) {
        // never hand out a backup that silently misses months
        setImportMsg({ ok: false, text: "Exporten avbröts: kunde inte hämta alla månader. Försök igen." });
        setExporting(false);
        return;
      }
      const merged = [];
      results.forEach((r) => { if (r.data) merged.push(...r.data); });
      merged.sort((a, b) => a.date.localeCompare(b.date));

      const header = ["Datum", "Anvandare", "Sport", "Traningstyp", "Tid (min)", "Anstrangning (1-10)", "Anteckningar", "Typ"];
      const rows = merged.map((e) => [
        e.date,
        userName(e.user || "niva"),
        (e.sport || []).join(" "),
        (e.typ || []).join(" "),
        e.tid || "",
        e.kansla || "",
        e.anteckningar || "",
        kindLabel(e.kind),
      ]);
      const csv = [header, ...rows]
        .map((row) => row.map(csvEscape).join(";"))
        .join("\r\n");
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
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
    const clean = text.replace(/^﻿/, "").replace(/\r\n/g, "\n");
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
        kind: header.indexOf("typ"), // optional, last column since 1.5.2; missing = Pass
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
        const kindText = idx.kind > -1 ? (r[idx.kind] || "").trim().toLowerCase() : "";
        const kind = kindText === "vilodag" ? "rest" : kindText === "sjukdag" ? "sick" : null;
        const entry = {
          id: uid(),
          ...(kind ? { kind } : {}),
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

      let failedMonths = 0;
      const monthKeys = Object.keys(byMonth);
      for (const mk of monthKeys) {
        const sig = (e) => [e.date, e.user, (e.sport||[]).join(","), (e.typ||[]).join(","), e.tid, e.kansla, e.anteckningar, e.kind || ""].join("|");
        // the merge runs on the latest data of that month (see saveKey), so nothing saved meanwhile is overwritten
        const r = await saveMonth(mk, (existing) => {
          const existingSigs = new Set(existing.map(sig));
          const toAdd = byMonth[mk].filter((e) => !existingSigs.has(sig(e)));
          return toAdd.length ? [...existing, ...toAdd].sort(byDate) : NO_CHANGE;
        });
        if (r.status !== "ok") failedMonths++;
      }
      syncProtection();

      await refreshMonthList();
      await loadMonth(selectedMonth);
      setAllEntries(null);
      setImportMsg(failedMonths
        ? { ok: false, text: `Importen blev inte klar: ${failedMonths} av ${monthKeys.length} månader kunde inte sparas. Försök igen, redan importerade pass dubbleras inte.` }
        : { ok: true, text: `${count} pass importerade.` });
    } catch (e) {
      console.error("import failed", e);
      setImportMsg({ ok: false, text: "Kunde inte läsa filen. Kontrollera att det är en CSV exporterad härifrån." });
    }
    setImporting(false);
  }

  // All entries of the chosen user and period, including rest/sick days.
  const statsBase = useMemo(() => {
    const base = statsScope === "all" ? (allEntries || []) : monthEntries;
    return base.filter((e) => (e.user || "niva") === statsUser);
  }, [statsScope, allEntries, monthEntries, statsUser]);
  // Rest/sick days never count as passes: everything below uses real passes only.
  const dataForStats = useMemo(() => statsBase.filter(isRealPass), [statsBase]);
  const offDayCounts = useMemo(() => ({
    rest: statsBase.filter((e) => e.kind === "rest").length,
    sick: statsBase.filter((e) => e.kind === "sick").length,
  }), [statsBase]);

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
      .filter((e) => (e.user || "niva") === form.user && !queuedIds.has(e.id))
      .sort((a, b) => b.date.localeCompare(a.date)),
    [monthEntries, form.user, queuedIds]
  );

  const offDayCard = (
    <Card>
      <div className="text-xs font-bold mb-1" style={{ color: ACCENT_DARK }}>REGISTRERADE VILO-/SJUKDAGAR</div>
      <div className="text-sm" data-testid="offday-stats" style={{ color: INK }}>
        Vilodagar <span className="font-bold">{offDayCounts.rest}</span> · Sjukdagar <span className="font-bold">{offDayCounts.sick}</span>
      </div>
    </Card>
  );

  const canSave = form.date && (isOff || form.sport.length > 0) && !saving;

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

        {queued.length > 0 && (
          <div role="status" className="rounded-lg p-3 mb-4 flex items-start gap-2 text-sm"
               style={maxAttempts >= 3
                 ? { backgroundColor: "#FDECEA", border: "1px solid #D98880", color: "#7A1F14" }
                 : { backgroundColor: "#FFFBEA", border: "1px solid #E6C84F", color: "#5C4A00" }}>
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div>
              {maxAttempts >= 3 ? (
                <>
                  <div className="font-bold">{queued.length === 1 ? "1 pass väntar på att sparas" : `${queued.length} pass väntar på att sparas`}</div>
                  Det går inte att spara just nu. Passen ligger kvar på den här telefonen men syns inte för andra. Rensa inte webbläsardata förrän de är sparade.
                </>
              ) : (
                <>
                  <div className="font-bold">{queued.length === 1 ? "1 pass väntar på att sparas" : `${queued.length} pass väntar på att sparas`}</div>
                  Försöker igen automatiskt.
                </>
              )}
            </div>
          </div>
        )}

        {view === "logga" && (
          <div className="space-y-5">
            <Card>
              {(editingId || editingPending) && (
                <div className="flex items-center justify-between mb-4 pb-3 border-b"
                     style={{ borderColor: "#E4E4E4" }}>
                  <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: ACCENT_DARK }}>
                    <Pencil size={13} /> {editingPending ? "Redigerar osparat pass" : "Redigerar loggat pass"}
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

              <div className="flex flex-wrap items-center gap-x-3 gap-y-3 mb-4">
                <div className="flex items-center gap-2">
                  <CalendarDays size={18} style={{ color: ACCENT }} />
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="border rounded-lg px-3 py-2 text-sm"
                    style={{ borderColor: "#D5D5D5" }}
                  />
                </div>
                {/* Pass / Vilodag / Sjukdag: sits next to the date if it fits, otherwise right below it */}
                <div role="group" aria-label="Typ" data-testid="kind-group" className="flex flex-1 rounded-lg border overflow-hidden"
                     style={{ minWidth: 220, borderColor: "#D5D5D5" }}>
                  {["pass", "rest", "sick"].map((k, i) => {
                    const on = form.kind === k;
                    return (
                      <button key={k} type="button" data-testid={`kind-${k}`} aria-pressed={on}
                              onClick={() => setForm((f) => ({ ...f, kind: k }))}
                              className="flex-1 py-2 text-sm font-semibold"
                              style={{ backgroundColor: on ? ACCENT : "white", color: on ? "white" : "#444444", borderLeft: i ? "1px solid #D5D5D5" : "none" }}>
                        {kindLabel(k)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {!isOff && !editingId && !editingPending && lastText && (
                <button type="button" onClick={applyLast} data-testid="same-as-last"
                        className="w-full text-left rounded-lg border px-3 py-2 text-sm mb-4 flex items-start gap-2"
                        style={{ borderColor: ACCENT, color: ACCENT_DARK }}>
                  <Repeat size={15} className="shrink-0 mt-0.5" />
                  <span><span className="font-bold">Samma som senast:</span> {lastText}</span>
                </button>
              )}

              {!isOff && (<>
              <div className="mb-4">
                <div className="text-xs font-bold mb-2" style={{ color: ACCENT_DARK }}>
                  AKTIVITET
                </div>
                <ChoiceGroup key={`sport-${formEpoch}`} testId="sport-group" items={SPORTS} defaults={DEFAULT_SPORTS} color={ACCENT}
                             counts={(usage && usage[form.user] && usage[form.user].sport) || NO_COUNTS}
                             selected={form.sport} onToggle={toggleSport} />
              </div>

              <div className="mb-4">
                <div className="text-xs font-bold mb-2" style={{ color: "#555555" }}>
                  TRÄNINGSTYP
                </div>
                <ChoiceGroup key={`typ-${formEpoch}`} testId="typ-group" items={TYPES} defaults={DEFAULT_TYPES} color="#5B5B5B"
                             counts={(usage && usage[form.user] && usage[form.user].typ) || NO_COUNTS}
                             selected={form.typ} onToggle={toggleTyp} />
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
              </>)}
              <div className="mb-4">
                <div className="text-xs font-bold mb-2" style={{ color: "#555555" }}>
                  ANTECKNINGAR
                </div>
                <textarea
                  value={form.anteckningar}
                  onChange={(e) => setForm((f) => ({ ...f, anteckningar: e.target.value }))}
                  placeholder={isOff ? (form.kind === "sick" ? "Hur mår du? Något som är bra att komma ihåg?" : "Hur kändes kroppen? Varför vila?") : "Vad gjorde ni? Hur kändes det?"}
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
                {saving ? (<><Loader2 size={16} className="animate-spin" /> Sparar…</>)
                  : savedFlash === "queued" ? (<><AlertTriangle size={16} /> Ej sparat, försöker igen</>)
                  : savedFlash ? (<><Check size={16} /> Sparat</>)
                  : (editingId || editingPending) ? "Spara ändringar"
                  : form.kind === "rest" ? "Spara vilodag" : form.kind === "sick" ? "Spara sjukdag" : "Spara pass"}
              </button>
              {saveError && (
                <p className="text-sm mt-2" role="alert" data-testid="save-error" style={{ color: "#B00020" }}>{saveError}</p>
              )}
              {!isOff && form.sport.length === 0 && (
                <p className="text-xs mt-2" style={{ color: MUTED }}>
                  Välj minst en aktivitet för att spara.
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
              {queued.length > 0 && (
                <div className="space-y-2 mb-3">
                  {queued.map((a) => (
                    <div key={a.qid} data-testid="pending-card" className="rounded-lg p-3 text-sm"
                         style={{ border: "1.5px dashed #C9A227", backgroundColor: "#FFFBEA" }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: "#F6D860", color: "#5C4A00" }}>Ej sparat</span>
                        <span className="font-semibold">{userName(a.entry.user || "niva")}</span>
                      </div>
                      <div style={{ color: INK }} data-testid="pending-line">{entryLine(a.entry)}</div>
                      {a.stage === 1 && (
                        <p className="text-xs mt-1" style={{ color: "#5C4A00" }}>
                          Passet är sparat i den nya månaden men finns kvar i den gamla tills flytten är klar.
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <button type="button" onClick={() => retryPending(a.qid)} disabled={retryingQid === a.qid}
                                className="flex items-center gap-1.5 px-3 rounded-lg text-xs font-bold border"
                                style={{ minHeight: 40, borderColor: ACCENT, color: ACCENT_DARK, backgroundColor: "white" }}>
                          {retryingQid === a.qid ? <Loader2 size={13} className="animate-spin" /> : <RotateCw size={13} />} Spara igen
                        </button>
                        {a.stage !== 1 && (
                          <>
                            <button type="button" onClick={() => startEditPending(a)}
                                    className="flex items-center gap-1.5 px-3 rounded-lg text-xs font-semibold border"
                                    style={{ minHeight: 40, borderColor: "#D5D5D5", color: "#444444", backgroundColor: "white" }}>
                              <Pencil size={13} /> Redigera
                            </button>
                            <button type="button" onClick={() => askDeletePending(a)}
                                    className="flex items-center gap-1.5 px-3 rounded-lg text-xs font-semibold border"
                                    style={{ minHeight: 40, borderColor: "#D5D5D5", color: "#B5544A", backgroundColor: "white" }}>
                              <Trash2 size={13} /> Radera
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                    const off = isOffDay(e);
                    return (
                      <div key={e.id} data-testid={off ? "offday-row" : "pass-row"} className="rounded-lg border text-sm overflow-hidden"
                           style={{ borderColor: "#E4E4E4", backgroundColor: off ? "#F6F6F6" : "white" }}>
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
                            {/* The facts (date, codes, time, effort) never get cut off; only the note preview is shortened. */}
                            <div className="min-w-0 flex items-baseline gap-1">
                              <span className="shrink-0 max-w-full">
                                <span className="font-semibold mr-2">{e.date.slice(8)}/{e.date.slice(5,7)}</span>
                                {off ? (
                                  <span className="inline-flex items-center gap-1" style={{ color: MUTED }}>
                                    {e.kind === "sick" ? <Thermometer size={14} /> : <Moon size={14} />}{kindLabel(e.kind)}
                                  </span>
                                ) : (
                                  <>
                                    <span style={{ color: ACCENT_DARK }}>{(e.sport||[]).join(" ")}</span>
                                    {(e.typ||[]).length > 0 && (
                                      <span style={{ color: MUTED }}> · {e.typ.join(" ")}</span>
                                    )}
                                    {e.tid && <span style={{ color: MUTED }}> · {e.tid} min</span>}
                                    {e.kansla && <span data-testid="effort" style={{ color: MUTED }}> · {e.kansla}/10</span>}
                                  </>
                                )}
                              </span>
                              {hasNote && !isExpanded && (
                                <span className="truncate min-w-0 flex-1" style={{ color: "#B5B5B5" }}>· {preview}</span>
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
                              onClick={(ev) => { ev.stopPropagation(); askDelete(e); }}
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
                                Ingen anteckning för {off ? (e.kind === "sick" ? "den här sjukdagen" : "den här vilodagen") : "det här passet"}.
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
              <>
                <Card>
                  <p className="text-sm" style={{ color: MUTED }}>
                    Inga pass loggade än för det här urvalet. Gå till "Logga pass" för att komma igång.
                  </p>
                </Card>
                {offDayCard}
              </>
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

                {offDayCard}

                <Card>
                  <div className="text-xs font-bold mb-3" style={{ color: ACCENT_DARK }}>
                    BELASTNING PER DAG &nbsp;<span className="font-normal" style={{ color: MUTED }}>(tid × ansträngning)</span>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={loadByDate} margin={CHART_MARGIN}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: MUTED }} axisLine={{ stroke: "#DDDDDD" }} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} width={40} />
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
                      <LineChart data={kanslaTrend} margin={CHART_MARGIN}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" vertical={false} />
                        <XAxis dataKey="date" padding={{ left: 12, right: 12 }} tick={{ fontSize: 10, fill: MUTED }} axisLine={{ stroke: "#DDDDDD" }} tickLine={false} />
                        <YAxis domain={[1, 10]} ticks={[1,2,3,4,5,6,7,8,9,10]} tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} width={26} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#E4E4E4" }} />
                        <Line type="monotone" dataKey="kansla" stroke={ACCENT} strokeWidth={2} dot={{ r: 3, fill: ACCENT }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>
                </div>

                <Card>
                  <div className="text-xs font-bold mb-3" style={{ color: "#555555" }}>FÖRDELNING TRÄNINGSTYP</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={typeDist} margin={CHART_MARGIN}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" vertical={false} />
                      <XAxis dataKey="code" tick={{ fontSize: 10, fill: MUTED }} axisLine={{ stroke: "#DDDDDD" }} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
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
        {confirmDlg && confirmDlg.kind === "saved" && (
          <ConfirmModal title={isOffDay(confirmDlg.entry) ? `Ta bort ${kindLabel(confirmDlg.entry.kind).toLowerCase()}en?` : "Ta bort passet?"} text={`${userName(confirmDlg.entry.user || "niva")} · ${entryLine(confirmDlg.entry)}. Det här går inte att ångra.`}
                        confirmLabel="Ta bort" busy={confirmBusy} error={confirmError} onConfirm={doConfirm} onCancel={closeConfirm} />
        )}
        {confirmDlg && confirmDlg.kind === "pending" && (
          <ConfirmModal title="Ta bort det osparade passet?" text="Det finns inte på någon annan enhet."
                        confirmLabel="Ta bort" busy={false} error={null} onConfirm={doConfirm} onCancel={closeConfirm} />
        )}
        {confirmDlg && confirmDlg.kind === "disconnect" && (
          <ConfirmModal title="Koppla bort den här enheten?"
                        text={queued.length > 0
                          ? `Datan finns kvar i molnet, men ${queued.length === 1 ? "1 osparat pass" : `${queued.length} osparade pass`} på den här telefonen försvinner.`
                          : "Datan finns kvar i molnet."}
                        confirmLabel="Koppla bort" busy={false} error={null} onConfirm={doConfirm} onCancel={closeConfirm} />
        )}
        {showUsers && (
          <UserManager users={users} localHidden={localHidden} onLocalHide={setLocalHiddenIds} onUpdate={updateUsers} onClose={() => setShowUsers(false)} />
        )}

        <p className="text-xs text-center mt-8" style={{ color: "#B5B5B5" }}>
          Live-delad: ändringar syns direkt hos alla som har samma delningslänk.<br />Version {APP_VERSION} · {APP_DATE} ·{" "}
          <button type="button" className="underline" style={{ color: ACCENT_DARK }} onClick={() => setShowChangelog(true)}>Vad är nytt?</button>
          {protection && (<><br /><span data-testid="protection">Skydd mot överskrivning: {protection === "on" ? "på" : "begränsat"}</span></>)}
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
              <button type="button" className="text-xs underline" style={{ color: "#999" }} onClick={() => { setConfirmError(null); setConfirmDlg({ kind: "disconnect" }); }}>
                Koppla bort enheten
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
