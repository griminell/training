import React, { useState, useEffect, useLayoutEffect, useMemo, useCallback, useDeferredValue, useRef } from "react";
import {
  ComposedChart, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { CalendarDays, ClipboardList, BarChart3, Trash2, Check, Download, Loader2, ChevronDown, ChevronRight, Pencil, X, Upload, Users, Eye, Plus, AlertTriangle, RotateCw, Repeat, Moon, Thermometer, EyeOff, Copy, Unplug, Sun, History, Search, SlidersHorizontal } from "lucide-react";

export const APP_VERSION = "1.8.3";
export const APP_DATE = "2026-10-23";

const CHANGELOG = [
  { version: "1.8.3", date: "2026-10-23", items: [
    "Bakom kulisserna: varje ny version byggs och testas nu automatiskt hos GitHub. Inga ändringar i appens utseende eller funktioner" ] },
  { version: "1.8.2", date: "2026-10-23", items: [
    "Påminn om igår: en växel per person i Hantera användare (Redigera), avstängd som standard",
    "Är den på visas raden Igår (torsdag) är inte loggad. Gör det nu. överst på Logga pass. Tryck på texten för att logga igår, eller på krysset för att dölja raden",
    "Krysset döljer bara raden på den här enheten för den dagen och sparar ingenting",
    "Raden visas först efter klockan 06.00 och försvinner när igår är loggad (pass, vilodag eller sjukdag)" ] },
  { version: "1.8.1", date: "2026-10-22", items: [
    "Logga pass visar nu bara de 5 senaste passen (utan vilo- och sjukdagar), även över månadsskifte",
    "Under listan finns länken Historik som öppnar fliken för samma person",
    "Månadsväljaren och knappen för vilo-/sjukdagar finns kvar i Historik" ] },
  { version: "1.8.0", date: "2026-10-22", items: [
    "Statistik jämför nu med förra perioden: en liten pil och procent i varje ruta (Vecka och Månad)",
    "En pågående vecka eller månad jämförs med samma dagar förra gången, en avslutad med hela förra perioden",
    "Snittansträngning visar skillnaden i poäng",
    "Förra veckans belastning syns som tunna streck i diagrammet Belastning per dag",
    "Inga färger och ingen tolkning: pilen visar bara riktningen",
    "Denna månad och Denna vecka ligger centrerade under väljaren",
    "Rättat: sidan startar inte längre i grönt innan din egen färg visas, den senast kända färgen används direkt vid omladdning" ] },
  { version: "1.7.9", date: "2026-10-22", items: [
    "Datan märks nu med ett versionsnummer, så att en gammal kopia av appen aldrig kan skriva över data den inte förstår",
    "Om datan är nyare än appen visas en notis med knappen Uppdatera sidan, och sparning stängs av tills du uppdaterat",
    "Säkerhetskopian märks också med versionsnummer och en kopia från en nyare app återställs inte av misstag" ] },
  { version: "1.7.8", date: "2026-10-22", items: [
    "Säkerhetskopia: administratören kan ta en kopia av allt (alla pass, alla personer) som en fil, och återställa från den. Återställningen lägger bara till pass som saknas, den skriver aldrig över eller raderar något",
    "Administratör slås på per person i Hantera användare (Redigera). Det gäller på alla enheter där den personen är vald. Övriga ser varken säkerhetskopia, återställning eller påminnelse",
    "Påminnelse längst ner när det gått mer än fyra veckor sedan senaste säkerhetskopia. Tiden sparas delat, så en kopia på en enhet räknas för alla",
    "CSV-valen i menyn heter nu Importera (CSV) och Exportera (CSV)" ] },
  { version: "1.7.7", date: "2026-10-22", items: [
    "Bredare färgpalett för aktivitet och träningstyp i Statistik och kalendern: fler färger i stället för bara nyanser av din färg. Din färg går till det du tränat mest de senaste 30 dagarna, och varje aktivitet behåller sin färg",
    "Förslaget om fysio eller läkare ligger nu under diagrammet",
    "Swipa åt vänster eller höger för att gå mellan Logga pass, Statistik och Historik. Det fungerar inte när du drar i ett reglage, ett diagram, ett textfält eller nära skärmkanten, och inte när en ruta eller panel är öppen",
    "Förslaget om fysio eller läkare räknar nu på dina senaste loggade dagar (pass, vilodag eller sjukdag) i stället för kalenderdagar: smärta på 5 eller mer under minst 5 av de senaste 7 loggade dagarna, eller 10 av de senaste 14. Det tittar som mest 4 veckor bakåt, så gammal värk utlöser inget" ] },
  { version: "1.7.6", date: "2026-10-22", items: [
    "Ny ruta Smärta i Statistik: välj kroppsdel och se hur smärtan har varit dag för dag, med belastningen svagt i bakgrunden. Dagar utan notering blir ett glapp i linjen, inte en nolla",
    "Om smärtan är ihållande (smärta på 5 eller mer under minst 5 av de senaste 7 dagarna eller 10 av de senaste 14) visas ett lugnt förslag om att kontakta fysio eller läkare",
    "Rättat: när du redigerade eller la till ett pass åt någon annan i Historik hoppade personvalet tillbaka till dig när panelen stängdes",
    "Rättat: en enhet som tillhör någon annan än Niva eller Grim kunde starta som Niva efter uppdatering av sidan. Nu behålls rätt person",
    "Rättat: i Vad är nytt rullar inte sidan bakom längre. Fortsätter du dra uppåt när du kommit till toppen stängs rutan, som ett alternativ till krysset" ] },
  { version: "1.7.5", date: "2026-10-21", items: [
    "Kalendervy i Historik: växla mellan Lista och Kalender. Dagar med pass har prickar i aktivitetens färg, vilo- och sjukdagar har en måne eller termometer, och dagar med smärta har en liten röd markering",
    "Tryck på en dag för att se dess pass under kalendern. Där kan du fälla ut, redigera och ta bort precis som i listan",
    "Dagar utan något loggat har ett plus. Tryck på det så glider panelen upp med datumet ifyllt, så du kan logga det du missat utan att lämna Historik",
    "Filtren ligger nu bakom en filterknapp bredvid sökfältet och tar ingen plats när de inte behövs. Knappen visar hur många filter som är på",
    "Sök och filter fungerar i kalendern: dagar utan träff tonas ned" ] },
  { version: "1.7.4", date: "2026-10-21", items: [
    "Redigeringspanelen i Historik anpassar sig nu till tangentbordet på telefonen, så det du skriver syns ovanför tangentbordet och Spara-knappen går att nå" ] },
  { version: "1.7.3", date: "2026-10-21", items: [
    "Ny flik Historik: bläddra månad för månad med veckorubriker och veckosummor (pass, tid, belastning, distans, vilo- och sjukdagar och högsta smärta per kroppsdel)",
    "Sök: letar i sammanfattning, smärtnoteringar, kroppsdelar, aktiviteter och träningstyper. När du skriver söker den i alla månader",
    "Filter: Bara med smärta, Aktivitet, Träningstyp och Kroppsdel. Filtren kan kombineras",
    "Smärta syns som små markeringar under raden (till exempel Häl V 6)",
    "Pennan i Historik öppnar passet i en panel som glider upp, så du slipper lämna fliken. Det du höll på att skriva på Logga pass finns kvar när du stänger panelen" ] },
  { version: "1.7.2", date: "2026-10-21", items: [
    "Ansträngning (1–10) väljs nu med en slider, som smärtan. Ingen siffra är vald från början, tryck eller dra för att välja, och kryssknappen tar bort valet",
    "Sliderns ändsiffror (1 och 10, 0 och 10 för smärta) står på samma rad som slidern, så den tar mindre plats",
    "Anteckningar heter nu Sammanfattning, i formuläret och i det öppnade passet" ] },
  { version: "1.7.1", date: "2026-10-21", items: [
    "I det öppnade passet skiljs Anteckning från Mående och smärta med en linje och en egen rubrik",
    "Skala enligt Borg CR10 står nu direkt efter rubriken Ansträngning" ] },
  { version: "1.7.0", date: "2026-10-21", items: [
    "Ny hopfällbar sektion Mående i loggformuläret, ovanför Anteckningar. Allt är valfritt och inget är förifyllt",
    "Sömn och Energi på skalan 1–5 (Sömn: Dålig till Toppen, Energi: Tömd till Laddad)",
    "Smärta per kroppsdel, 0–10 med en slider (ingen siffra är vald från början), och valfri notering. Snabbval för dina vanligaste kroppsdelar och Lägg till kroppsdel för resten. Vänster/höger (eller övre/nedre för rygg) väljs separat",
    "Går även att fylla i på vilodagar och sjukdagar (Smärta idag)",
    "Smärta syns direkt på raden i listan (till exempel Häl V 6), och allt visas i det öppnade passet",
    "CSV-filen har tre nya kolumner sist: Somn, Energi och Smarta. Äldre filer går att importera som förut" ] },
  { version: "1.6.6", date: "2026-10-21", items: [
    "Tid kan nu anges med sekunder (min : sek). Sekunderna är valfria",
    "Tempot räknas på exakt tid, till exempel 4,07 km på 40:46 ger 10:01 min/km",
    "CSV-filen skriver tiden som 40:46 när sekunder finns. Import förstår både 40:46 och hela minuter" ] },
  { version: "1.6.5", date: "2026-10-21", items: [
    "Statistik per vecka: välj Vecka, Månad eller Alla månader. Bläddra med pilarna (både vecka och månad) eller tryck på veckan eller månaden för att hoppa till ett valfritt datum",
    "Snabbare statistiksida: diagrammen animeras inte längre, och det går att klicka direkt när du byter person" ] },
  { version: "1.6.4", date: "2026-10-21", items: [
    "Ny uppgift: Distans (km) bredvid Tid. Syns i passlistan, i statistiken (Distans totalt) och i CSV-filen",
    "Tempo visas i det öppnade passet för löpning, promenad (min/km) och cykel (km/h)",
    "Statistiken visar nu den person du loggar som från början, och byter när du byter person i menyn" ] },
  { version: "1.6.3", date: "2026-10-20", items: [
    "Ny aktivitet: Barmarksträning (före Pingis)" ] },
  { version: "1.6.2", date: "2026-10-20", items: [
    "Nya aktiviteter: Handboll (efter Fotboll), Yoga och Pilates (före Annat)",
    "Ny träningstyp: Stretching" ] },
  { version: "1.6.1", date: "2026-10-20", items: [
    "Ny sidfot: © 2026 Grim till vänster, versionsnummer och Vad är nytt? till höger. Skydd mot överskrivning står på egen rad",
    "Vad är nytt är nu ihopfällbart per version (1.6, 1.5 osv.). Den senaste visas öppen, äldre är hopfällda. Datumet står vid varje version" ] },
  { version: "1.6.0", date: "2026-10-20", items: [
    "Mörkt läge: välj Auto, Ljust eller Mörkt under Utseende i personmenyn. Auto följer telefonens inställning. Valet sparas på enheten",
    "Mörk bakgrund och kort i mörkgrått, din färg ljusas upp automatiskt så att den är lätt att läsa",
    "Diagram, rutnät, förklaringsrutor, datumväljare och rullistor har även mörka varianter",
    "Datum-, månad- och textfält har samma mörka färg överallt" ] },
  { version: "1.5.6", date: "2026-10-20", items: [
    "Längst ned på sidan står nu © 2026 Grim • Bastubacken" ] },
  { version: "1.5.5", date: "2026-10-20", items: [
    "Personvalet (Loggar som) har flyttat från formuläret till en personmeny uppe till höger: tryck på ditt namn för att byta person",
    "I menyn finns också Hantera användare, Importera, Exportera, Kopiera kopplingslänk och Koppla bort enheten",
    "Formuläret börjar nu direkt med Pass / Vilodag / Sjukdag" ] },
  { version: "1.5.4", date: "2026-10-20", items: [
    "Mer luft överst: rubriken och knapparna för import och export hamnar nu under iOS mjuka kant",
    "Knappen Vilo-/sjukdagar ligger nu vänsterställd direkt under rubriken Loggade pass" ] },
  { version: "1.5.3", date: "2026-10-19", items: [
    "Ny knapp Rensa bredvid Spara: tömmer det du fyllt i, men behåller datum, person och val av Pass/Vilodag/Sjukdag",
    "Pass / Vilodag / Sjukdag ligger nu ovanför datumet, med en linje som skiljer personvalet från själva loggningen",
    "Lite mer luft överst så att rubriken inte hamnar i iOS mjuka kant när appen ligger på hemskärmen",
    "Loggade pass: knappen Vilo-/sjukdagar (öga) döljer eller visar vilo- och sjukdagar i listan. Valet sparas på enheten",
    "Nya aktiviteter: Cykel och Rullskidor. Skidor, Rullskidor och Alpint ligger bredvid varandra, liksom Löpning och Promenad" ] },
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

// Release notes grouped by minor version (1.6, 1.5, ...). The newest group is open, older ones are collapsed.
function groupChangelog(list) {
  const groups = [];
  list.forEach((c) => {
    const key = c.version.split(".").slice(0, 2).join(".");
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) { g = { key, entries: [] }; groups.push(g); }
    g.entries.push(c);
  });
  return groups;
}
function ChangelogModal({ onClose }) {
  const groups = useMemo(() => groupChangelog(CHANGELOG), []);
  const [open, setOpen] = useState(() => new Set([groups[0].key]));
  const toggle = (k) => setOpen((prev) => { const n = new Set(prev); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  // Scrolling never reaches the page behind. Pulling further once the top is reached closes the box (like the X).
  const boxRef = useRef(null);
  const [pull, setPull] = useState(0);
  const touch = useRef({ y: null, top: false });
  const wheelAcc = useRef({ sum: 0, t: 0 });
  const PULL_CLOSE = 90;
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
  const onTouchStart = (e) => { const el = boxRef.current; touch.current = { y: e.touches[0].clientY, top: !!el && el.scrollTop <= 0 }; };
  const onTouchMove = (e) => {
    const t = touch.current;
    if (t.y === null || !t.top) return;
    const dy = e.touches[0].clientY - t.y;
    setPull(dy > 0 ? Math.min(dy * 0.6, 160) : 0);
    if (dy > PULL_CLOSE) { t.y = null; setPull(0); onClose(); }
  };
  const onTouchEnd = () => { touch.current = { y: null, top: false }; setPull(0); };
  const onWheel = (e) => {
    const el = boxRef.current;
    if (!el || el.scrollTop > 0 || e.deltaY >= 0) { wheelAcc.current.sum = 0; return; }
    const now = Date.now();
    if (now - wheelAcc.current.t > 500) wheelAcc.current.sum = 0;
    wheelAcc.current.t = now;
    wheelAcc.current.sum += -e.deltaY;
    if (wheelAcc.current.sum > 200) { wheelAcc.current.sum = 0; onClose(); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)", overscrollBehavior: "contain" }}
         onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={boxRef} data-testid="changelog-box" className="bg-card w-full max-w-md rounded-t-2xl sm:rounded-2xl p-4 overflow-y-auto"
           onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd} onWheel={onWheel}
           style={{ maxHeight: "88vh", paddingBottom: "max(1rem, env(safe-area-inset-bottom))", overscrollBehavior: "contain",
                    transform: pull ? `translateY(${pull}px)` : "none", transition: pull ? "none" : "transform .15s" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold" style={{ color: INK }}>Vad är nytt</h2>
          <button type="button" onClick={onClose} aria-label="Stäng" className="p-1"><X size={20} /></button>
        </div>
        {groups.map((g, gi) => {
          const isOpen = open.has(g.key);
          const first = g.entries[g.entries.length - 1].version, last = g.entries[0].version;
          return (
            <div key={g.key} data-testid={`cl-group-${g.key}`} className="border-t" style={{ borderColor: LINE }}>
              <button type="button" onClick={() => toggle(g.key)} aria-expanded={isOpen} data-testid={`cl-toggle-${g.key}`}
                      className="w-full flex items-center gap-2 text-left" style={{ minHeight: 48 }}>
                <ChevronDown size={18} style={{ color: MUTED, transform: isOpen ? "none" : "rotate(-90deg)", transition: "transform .15s" }} />
                <span className="text-base font-bold flex-1" style={{ color: gi === 0 ? ACCENT_DARK : INK }}>
                  Version {g.key}
                </span>
                <span className="text-xs" style={{ color: MUTED }}>{first === last ? first : `${first} – ${last}`}</span>
              </button>
              {isOpen && (
                <div className="pb-2" data-testid={`cl-body-${g.key}`}>
                  {g.entries.map((c) => (
                    <div key={c.version} className="mb-3 pl-6">
                      <div className="text-sm font-bold" style={{ color: ACCENT_DARK }}>
                        Version {c.version} <span className="font-normal" style={{ color: MUTED }}>· {c.date}</span>
                      </div>
                      <ul className="list-disc pl-5 mt-1 text-sm" style={{ color: INK }}>
                        {c.items.map((it, i) => <li key={i}>{it}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
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
// ---- "Igår saknas" (per person, off by default: user.remindYesterday) ----
// The reminder row is hidden on this device per person and day with the cross (nothing is saved to the database).
const WEEKDAY_LONG = ["måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag", "söndag"];
const REMIND_FROM_HOUR = 6; // before 06:00 "igår" is not counted as missing yet (late evening passes are often logged after midnight)
const SKIP_YESTERDAY_KEY = "nivadagbok-skip-yesterday"; // per device: { userId: "YYYY-MM-DD" }
function loadSkipYesterday() {
  try { const o = JSON.parse(localStorage.getItem(SKIP_YESTERDAY_KEY)); return o && typeof o === "object" && !Array.isArray(o) ? o : {}; } catch (e) { return {}; }
}
function saveSkipYesterday(o) { try { localStorage.setItem(SKIP_YESTERDAY_KEY, JSON.stringify(o)); } catch (e) { /* kept in memory only */ } }
// The last known user list is kept on the device so the person's colours are right from the very first paint
// (otherwise the page starts in the default colours until the list has been fetched). Never used for writing.
const USERS_CACHE_KEY = "nivadagbok-users-cache";
function loadCachedUsers() {
  try {
    const l = JSON.parse(localStorage.getItem(USERS_CACHE_KEY));
    if (Array.isArray(l) && l.length && l.every((u) => u && typeof u.id === "string" && typeof u.name === "string" && /^#[0-9a-fA-F]{6}$/.test(u.color || ""))) return l;
  } catch (e) { /* no cache */ }
  return DEFAULT_USERS;
}
function saveCachedUsers(list) { try { localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(list)); } catch (e) { /* ignore */ } }
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
// ---- Neutral palettes (light / dark). Keep in sync with the CSS variables in styles.css. ----
const NEUTRALS = {
  light: {
    PAPER: "#FFFFFF", CARD: "#FFFFFF", INK: "#232323", MUTED: "#6B6B6B", LABEL: "#555555", CTRL: "#444444",
    FAINT: "#B5B5B5", HINT: "#999999", LINE: "#E4E4E4", LINE2: "#D5D5D5", GRIDC: "#EEEEEE", AXISC: "#DDDDDD",
    SUBTLE: "#FAFAFA", OFFROW: "#F6F6F6", DANGER: "#B5544A", ERR: "#B00020", ON_ACCENT: "#FFFFFF", NEUTRAL_FILL: "#5B5B5B",
    WARN_BG: "#FFFBEA", WARN_BORDER: "#C9A227", WARN_BADGE: "#F6D860", WARN_TEXT: "#5C4A00",
    ERRBOX_BG: "#FDECEA", ERRBOX_BORDER: "#D98880", ERRBOX_TEXT: "#7A1F14",
    GREYS: ["#B8B8B8", "#8A8A8A", "#6E6E6E", "#555555"],
  },
  dark: {
    PAPER: "#121212", CARD: "#1C1C1C", INK: "#ECECEC", MUTED: "#A3A3A3", LABEL: "#B8B8B8", CTRL: "#D0D0D0",
    FAINT: "#8A8A8A", HINT: "#8F8F8F", LINE: "#2E2E2E", LINE2: "#3F3F3F", GRIDC: "#2A2A2A", AXISC: "#3F3F3F",
    SUBTLE: "#222222", OFFROW: "#161616", DANGER: "#E5877C", ERR: "#FF8A80", ON_ACCENT: "#121212", NEUTRAL_FILL: "#BDBDBD",
    WARN_BG: "#2B2410", WARN_BORDER: "#8A7320", WARN_BADGE: "#5A4A10", WARN_TEXT: "#F3E3A0",
    ERRBOX_BG: "#3A1A17", ERRBOX_BORDER: "#A5493F", ERRBOX_TEXT: "#FFB4AA",
    GREYS: ["#E0E0E0", "#BDBDBD", "#9A9A9A", "#7C7C7C"],
  },
};
let PAPER, CARD, INK, MUTED, LABEL, CTRL, FAINT, HINT, LINE, LINE2, GRIDC, AXISC, SUBTLE, OFFROW, DANGER, ERR, ON_ACCENT, NEUTRAL_FILL;
let WARN_BG, WARN_BORDER, WARN_BADGE, WARN_TEXT, ERRBOX_BG, ERRBOX_BORDER, ERRBOX_TEXT;
let IS_DARK = false;
function setNeutrals(dark) {
  const n = dark ? NEUTRALS.dark : NEUTRALS.light;
  IS_DARK = !!dark;
  ({ PAPER, CARD, INK, MUTED, LABEL, CTRL, FAINT, HINT, LINE, LINE2, GRIDC, AXISC, SUBTLE, OFFROW, DANGER, ERR, ON_ACCENT, NEUTRAL_FILL,
     WARN_BG, WARN_BORDER, WARN_BADGE, WARN_TEXT, ERRBOX_BG, ERRBOX_BORDER, ERRBOX_TEXT } = n);
}
setNeutrals(false);

function contrastRatio(a, b) {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
// Dark mode: lift a colour (keeping its hue) until it reads on the card (>= 4.5) and dark text reads on it (>= 4.5).
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  let h = 0, s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return [h, s, l];
}
function hslToHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}
function liftForDark(h) {
  const bg = NEUTRALS.dark.CARD, ink = NEUTRALS.dark.ON_ACCENT;
  let c = rgbToHex(...hexToRgb(h));
  if (contrastRatio(c, bg) >= 4.5 && contrastRatio(c, ink) >= 4.5) return c;
  const [hue, sat, l0] = rgbToHsl(...hexToRgb(c));
  const s = Math.min(sat, 0.62);
  for (let l = Math.max(l0, 0.25); l <= 0.95; l += 0.01) {
    c = hslToHex(hue, s, l);
    if (contrastRatio(c, bg) >= 4.5 && contrastRatio(c, ink) >= 4.5) return c;
  }
  return c;
}
// Dark palette for a user. A stored user.colorDark wins over the computed lift.
function darkThemeFor(user) {
  const light = themeForUser(user);
  const base = liftForDark((user && user.colorDark) || light.accent);
  const g = NEUTRALS.dark.GREYS;
  return {
    accent: base,
    dark: mixHex(base, "#FFFFFF", 0.12),
    soft: mixHex(base, NEUTRALS.dark.CARD, 0.82),
    types: [mixHex(base, "#000000", 0.2), base, mixHex(base, "#FFFFFF", 0.15), mixHex(base, "#FFFFFF", 0.3),
            mixHex(base, "#FFFFFF", 0.45), mixHex(base, "#FFFFFF", 0.6), g[0], g[1], g[2], g[3]],
    sports: [base, mixHex(base, "#FFFFFF", 0.45), mixHex(base, "#000000", 0.22), mixHex(base, "#FFFFFF", 0.7), g[1], g[2]],
  };
}
function applyTheme(user, dark) {
  setNeutrals(dark);
  const t = dark ? darkThemeFor(user) : themeForUser(user);
  ACCENT = t.accent; ACCENT_DARK = t.dark; ACCENT_SOFT = t.soft;
  TYPE_PALETTE = t.types;
  // 6 base shades + 3 more from the user's own colour, so no two activities share a colour
  SPORT_COLORS = [...t.sports, mixHex(t.sports[0], "#FFFFFF", 0.25), mixHex(t.sports[0], "#000000", dark ? 0.08 : 0.2), mixHex(t.sports[0], "#FFFFFF", 0.6),
    // slots 9-11 (Handboll, Yoga, Pilates)
    mixHex(t.sports[0], dark ? "#FFFFFF" : "#000000", dark ? 0.85 : 0.65), mixHex(t.sports[0], "#FFFFFF", dark ? 0.12 : 0.12), mixHex(t.sports[0], dark ? "#000000" : "#FFFFFF", dark ? 0.15 : 0.35),
    // slot 12 (Barmarksträning)
    mixHex(t.sports[0], dark ? "#FFFFFF" : "#000000", dark ? 0.35 : 0.3)];
  // 11th training type needs an 11th shade
  TYPE_PALETTE = [...t.types, mixHex(t.types[2], dark ? "#FFFFFF" : "#000000", dark ? 0.8 : 0.7)];
}
function userColor(u) { return IS_DARK ? darkThemeFor(u).accent : themeForUser(u).accent; }
function tipProps() {
  return {
    contentStyle: { fontSize: 12, borderRadius: 8, borderColor: LINE, backgroundColor: CARD, color: INK },
    labelStyle: { color: INK }, itemStyle: { color: INK }, cursor: { fill: GRIDC, fillOpacity: 0.6 },
  };
}

// ---- Appearance (Auto / Ljust / Mörkt), saved per device ----
const THEME_KEY = "nivadagbok-theme";
const THEME_MODES = [{ id: "auto", label: "Auto" }, { id: "light", label: "Ljust" }, { id: "dark", label: "Mörkt" }];
function getThemeMode() {
  try { const v = localStorage.getItem(THEME_KEY); return v === "light" || v === "dark" ? v : "auto"; } catch (e) { return "auto"; }
}
function systemPrefersDark() {
  try { return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches); } catch (e) { return false; }
}

// Chart margin. Never use a negative left margin: the Y axis is drawn inside the
// margin box, so a negative value pushes the tick labels outside the SVG and clips them.
const CHART_MARGIN = { top: 4, right: 12, left: 0, bottom: 0 };


const SPORTS = [
  // Default order (also the order under "Fler"): related activities sit together.
  { code: "S", label: "Skidor" },
  { code: "RU", label: "Rullskidor" },
  { code: "AL", label: "Alpint" },
  { code: "F", label: "Fotboll" },
  { code: "H", label: "Handboll" },
  { code: "LÖ", label: "Löpning" },
  { code: "PR", label: "Promenad" },
  { code: "CY", label: "Cykel" },
  { code: "BA", label: "Barmarksträning" },
  { code: "PI", label: "Pingis" },
  { code: "YO", label: "Yoga" },
  { code: "PL", label: "Pilates" },
  { code: "A", label: "Annat" },
];
// Stable colour slot per activity in the distribution chart (existing activities keep their colours).
const SPORT_COLOR_SLOT = { F: 0, S: 1, "LÖ": 2, AL: 3, PI: 4, PR: 5, CY: 6, RU: 7, A: 8, H: 9, YO: 10, PL: 11, BA: 12 };
// ---- Categorical palette for activities and training types ----
// Every activity/type keeps its own colour (fixed slot). The user's own colour goes to what the person has done most
// (last 30 days), so it stands for the biggest slice. Candidates too close to the user's colour are left out.
const CAT_CANDIDATES = ["#1D6FA5", "#E08A00", "#2E9E6B", "#8E5BB5", "#D2504A", "#17A3B8", "#B8920A", "#E07BA7", "#7A5C3E", "#6C8E2A",
                        "#5B6EE1", "#8A8A8A", "#7FB3D5", "#A04070", "#4F4F4F", "#C2A878", "#B5541C", "#B07AA1"];
function fitContrast3(hex, bg) {
  let c = rgbToHex(...hexToRgb(hex));
  if (contrastRatio(c, bg) >= 3) return c;
  const [h, sat, l0] = rgbToHsl(...hexToRgb(c));
  const bgLum = contrastRatio("#FFFFFF", bg) < contrastRatio("#000000", bg); // light background -> darken
  for (let i = 1; i <= 60; i++) {
    c = hslToHex(h, sat, Math.max(0.05, Math.min(0.95, l0 + (bgLum ? -1 : 1) * i * 0.01)));
    if (contrastRatio(c, bg) >= 3) return c;
  }
  return c;
}
function categoricalPalette(accent, dark) {
  const bg = NEUTRALS[dark ? "dark" : "light"].CARD;
  const [ar, ag, ab] = hexToRgb(accent);
  const dist = (c) => { const [r, g, b] = hexToRgb(c); return Math.hypot(r - ar, g - ag, b - ab); };
  const far = CAT_CANDIDATES.filter((c) => dist(c) >= 100);
  // 13 activities need 13 different colours (12 plus the user's own): top up with the next most distant ones
  const rest = CAT_CANDIDATES.filter((c) => dist(c) < 100).sort((a, b) => dist(b) - dist(a));
  while (far.length < 13 && rest.length) far.push(rest.shift());
  return far.map((c) => fitContrast3(c, bg));
}
let COLOR_MAP = { sport: {}, typ: {} };
function topCode(counts) {
  let best = null, n = 0;
  Object.entries(counts || {}).forEach(([k, v]) => { if (v > n) { best = k; n = v; } });
  return best;
}
function setColorMaps(userUsage, accent, dark) {
  const pal = categoricalPalette(accent, dark);
  const sport = {}, typ = {};
  Object.keys(SPORT_COLOR_SLOT).forEach((code) => { sport[code] = pal[SPORT_COLOR_SLOT[code] % pal.length]; });
  TYPES.forEach((t, i) => { typ[t.code] = pal[(i + 5) % pal.length]; });
  const ts = topCode(userUsage && userUsage.sport), tt = topCode(userUsage && userUsage.typ);
  if (ts && sport[ts]) sport[ts] = accent;
  if (tt && typ[tt]) typ[tt] = accent;
  COLOR_MAP = { sport, typ };
}
const sportColor = (code) => COLOR_MAP.sport[code] || SPORT_COLORS[(SPORT_COLOR_SLOT[code] ?? 0) % SPORT_COLORS.length];
const typeColor = (code) => COLOR_MAP.typ[code] || TYPE_PALETTE[0];

const TYPES = [
  { code: "TE", label: "Teknik" },
  { code: "KO", label: "Kondition" },
  { code: "IN", label: "Intervall" },
  { code: "ST", label: "Styrka" },
  { code: "SP", label: "Spänst/Fart" },
  { code: "RÖ", label: "Rörl./Balans" },
  { code: "SR", label: "Stretching" },
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
// ---- Weeks (Monday to Sunday, ISO week numbers) ----
const MS_DAY = 86400000;
const isoToDate = (iso) => new Date(iso + "T12:00:00Z");
const dateToIso = (d) => d.toISOString().slice(0, 10);
const addDaysIso = (iso, n) => dateToIso(new Date(isoToDate(iso).getTime() + n * MS_DAY));
function mondayOf(iso) {
  const dow = (isoToDate(iso).getUTCDay() + 6) % 7; // Monday = 0
  return addDaysIso(iso, -dow);
}
function isoWeekNumber(iso) {
  const d = isoToDate(iso);
  const thursday = new Date(isoToDate(mondayOf(iso)).getTime() + 3 * MS_DAY);
  const jan1 = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1, 12));
  return Math.floor((thursday - jan1) / MS_DAY / 7) + 1;
}
const MONTH_SHORT = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
const WEEKDAY_SHORT = ["Mån", "Tis", "Ons", "Tors", "Fre", "Lör", "Sön"];
function weekLabel(monday) {
  const sunday = addDaysIso(monday, 6);
  const a = { d: parseInt(monday.slice(8), 10), m: parseInt(monday.slice(5, 7), 10) - 1, y: monday.slice(0, 4) };
  const b = { d: parseInt(sunday.slice(8), 10), m: parseInt(sunday.slice(5, 7), 10) - 1, y: sunday.slice(0, 4) };
  const range = a.m === b.m ? `${a.d}–${b.d} ${MONTH_SHORT[b.m]}` : `${a.d} ${MONTH_SHORT[a.m]} – ${b.d} ${MONTH_SHORT[b.m]}`;
  const year = b.y !== todayISO().slice(0, 4) ? ` ${b.y}` : "";
  return { week: isoWeekNumber(monday), range: range + year };
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
// Data schema version. The shared key "meta:schema" = { version, appVersion, at } says which version of the
// app wrote the data last. It is a separate key on purpose: the month lists stay plain arrays, so older
// copies of the app keep working. If the stored version is NEWER than this app understands, all writes are
// blocked (schemaLocked) so an old copy can never damage data it does not understand.
const DATA_SCHEMA = 1;
let schemaLocked = false;
async function saveKey(key, mutate, parse, empty, opts = {}) {
  if (schemaLocked && !opts.ignoreLock) return { status: "error", message: "schema" };
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
const HIST_MODE_KEY = "nivadagbok-hist-mode"; // per device: "list" | "cal"
function getHistMode() { try { return localStorage.getItem(HIST_MODE_KEY) === "cal" ? "cal" : "list"; } catch (e) { return "list"; } }
const HIDE_OFFDAYS_KEY = "nivadagbok-hide-offdays"; // per device: hide rest/sick days in the list of logged passes
function getHideOffDays() {
  try { return localStorage.getItem(HIDE_OFFDAYS_KEY) === "1"; } catch (e) { return false; }
}
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
// ---- Distance (km, optional) and pace ----
// Stored as a plain string with a dot ("5.2"); shown with a comma. Empty = not logged.
function cleanDistance(v) {
  let t = String(v == null ? "" : v).replace(",", ".").replace(/[^0-9.]/g, "");
  const i = t.indexOf(".");
  if (i > -1) t = t.slice(0, i + 1) + t.slice(i + 1).replace(/\./g, "").slice(0, 2);
  return t.slice(0, 6);
}
const distNum = (e) => { const d = parseFloat(e && e.distance); return d > 0 ? d : 0; };
const fmtKm = (km) => (Math.round(km * 100) / 100).toLocaleString("sv-SE", { maximumFractionDigits: 2 });
// ---- Duration (minutes, optional seconds) ----
// Stored in the existing field "tid" as a plain string of (decimal) minutes: "45" or "40.7667" for 40:46.
// Old whole-minute passes are unchanged. Seconds are optional.
function tidSeconds(tid) { const m = parseFloat(tid); return m > 0 ? Math.round(m * 60) : 0; }
function splitTid(tid) {
  const t = tidSeconds(tid);
  if (!t) return { m: "", s: "" };
  return { m: String(Math.floor(t / 60)), s: t % 60 ? String(t % 60) : "" };
}
function joinTid(m, s) {
  const mm = parseInt(m, 10) || 0, ss = Math.min(59, parseInt(s, 10) || 0);
  const total = mm * 60 + ss;
  if (!total) return "";
  return ss ? String(Math.round((total / 60) * 10000) / 10000) : String(mm);
}
function fmtTid(tid) {
  const t = tidSeconds(tid);
  if (!t) return null;
  const m = Math.floor(t / 60), s = t % 60;
  return s ? `${m}:${String(s).padStart(2, "0")} min` : `${m} min`;
}
// CSV: "40:46" when seconds exist, otherwise the plain minutes as before. Import accepts "40:46", "45" and "40,5".
function tidToCsv(tid) { const t = tidSeconds(tid); return t % 60 ? `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}` : (tid || ""); }
function tidFromCsv(v) {
  const t = String(v == null ? "" : v).trim();
  const m = t.match(/^(\d+):(\d{1,2})$/);
  return m ? joinTid(m[1], m[2]) : t.replace(",", ".");
}
// Pace is shown only for passes with exactly one activity among Löpning, Promenad and Cykel (otherwise it is unclear what the distance belongs to).
function paceOf(e) {
  const sp = e && e.sport || [];
  const km = distNum(e), min = tidSeconds(e && e.tid) / 60;
  if (sp.length !== 1 || !km || !min) return null;
  if (sp[0] === "CY") return `${(km / (min / 60)).toLocaleString("sv-SE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km/h`;
  if (sp[0] === "LÖ" || sp[0] === "PR") {
    const secPerKm = Math.round((min * 60) / km);
    return `${Math.floor(secPerKm / 60)}:${String(secPerKm % 60).padStart(2, "0")} min/km`;
  }
  return null;
}

function entryLine(e) {
  if (e.kind === "rest" || e.kind === "sick") return `${e.date.slice(8)}/${e.date.slice(5, 7)} · ${kindLabel(e.kind)}`;
  return [
    `${e.date.slice(8)}/${e.date.slice(5, 7)}`,
    (e.sport || []).join(" "),
    (e.typ || []).length ? e.typ.join(" ") : null,
    fmtTid(e.tid),
    distNum(e) ? `${fmtKm(distNum(e))} km` : null,
    e.kansla ? `ansträngning ${e.kansla}` : null,
  ].filter(Boolean).join(" · ");
}

// ---- Wellbeing ("Mående"): sleep, energy (1-5) and pain per body part (0-10). All optional. ----
// Entry fields: sleep "1".."5", energy "1".."5", pain [{ part, pos?, value "0".."10", note?, label? }].
// `pos` is the side (L/R) for paired body parts and "up"/"low" for the back. `label` names a free-text "other" part.
const SLEEP_LABELS = ["Dålig", "Sådär", "Okej", "Bra", "Toppen"];
const ENERGY_LABELS = ["Tömd", "Låg", "Okej", "Bra", "Laddad"];
const POS_LR = [{ code: "L", label: "vänster", short: "V" }, { code: "R", label: "höger", short: "H" }];
const POS_BACK = [{ code: "up", label: "övre", short: "övre" }, { code: "low", label: "nedre", short: "nedre" }];
const LR = (code, label) => ({ code, label, pos: POS_LR });
const BODY_REGIONS = [
  { label: "Nacke och rygg", parts: [{ code: "neck", label: "Nacke" }, { code: "back", label: "Rygg", pos: POS_BACK }] },
  { label: "Arm", parts: [LR("shoulder", "Axel"), LR("upper_arm", "Överarm"), LR("elbow", "Armbåge"), LR("forearm", "Underarm"), LR("wrist", "Handled/hand")] },
  { label: "Bål", parts: [{ code: "chest", label: "Bröst" }, { code: "belly", label: "Mage" }] },
  { label: "Höft och ben", parts: [LR("hip", "Höft"), LR("groin", "Ljumske"), LR("thigh_front", "Lår framsida"), LR("thigh_back", "Lår baksida"),
                                  LR("knee", "Knä"), LR("shin", "Smalben"), LR("calf", "Vad")] },
  { label: "Fot", parts: [LR("ankle", "Fotled"), LR("achilles", "Hälsena"), LR("heel", "Häl"), LR("foot", "Fot/framfot")] },
];
const OTHER_PART = { code: "other", label: "Annat" };
const BODY_PARTS = BODY_REGIONS.flatMap((r) => r.parts); // without "other"
const partInfo = (code) => (code === "other" ? OTHER_PART : BODY_PARTS.find((x) => x.code === code)) || { code, label: code };
const DEFAULT_PAIN_PARTS = ["heel", "knee", "back"];
const posInfo = (part, pos) => ((partInfo(part).pos || []).find((x) => x.code === pos)) || null;
const newPainRow = (part) => ({ k: uid(), part, pos: "", value: "", note: "", label: "" });
// A pain row is complete when it has a value, a side/level where the part needs one, and a name if it is "other".
const painRowOk = (r) => r.value !== "" && (!partInfo(r.part).pos || !!posInfo(r.part, r.pos)) && (r.part !== "other" || r.label.trim() !== "");
const painToForm = (list) => (list || []).map((p) => ({ k: uid(), part: p.part, pos: p.pos || "", value: String(p.value ?? ""), note: p.note || "", label: p.label || "" }));
const painFromForm = (rows) => (rows || []).filter(painRowOk).map((r) => ({
  part: r.part,
  ...(r.pos ? { pos: r.pos } : {}),
  value: String(r.value),
  ...(r.note.trim() ? { note: r.note.trim() } : {}),
  ...(r.part === "other" ? { label: r.label.trim() } : {}),
}));
// Fields to store (omitted when empty, so old entries and untouched forms stay exactly as before).
const wellbeingOf = (f) => {
  const pain = painFromForm(f.pain);
  return { ...(f.sleep ? { sleep: f.sleep } : {}), ...(f.energy ? { energy: f.energy } : {}), ...(pain.length ? { pain } : {}) };
};
const hasWellbeing = (f) => !!(f.sleep || f.energy || (f.pain && f.pain.length));
const painName = (p) => (p.part === "other" ? (p.label || "Annat") : partInfo(p.part).label);
// "Häl V 6" (short, for the list row) and "Häl, vänster: 6/10 – note" (long, for the opened entry)
const painShort = (p) => { const pi = posInfo(p.part, p.pos); return `${painName(p)}${pi ? " " + pi.short : ""} ${p.value}`; };
const painLong = (p) => { const pi = posInfo(p.part, p.pos); return `${painName(p)}${pi ? ", " + pi.label : ""}: ${p.value}/10${p.note ? " – " + p.note : ""}`; };
// CSV text for pain: "Häl vänster:6:ont vid start | Knä höger:3:" (name+position : value : note)
const painToCsv = (list) => (list || []).map((p) => {
  const pi = posInfo(p.part, p.pos);
  const name = p.part === "other" ? `Annat (${p.label || ""})` : partInfo(p.part).label;
  return `${name}${pi ? " " + pi.label : ""}:${p.value}:${(p.note || "").replace(/ \| /g, " / ").replace(/\n/g, " ")}`;
}).join(" | ");
function painFromCsv(text) {
  const out = [];
  String(text || "").split(" | ").forEach((chunk) => {
    const c1 = chunk.indexOf(":"); if (c1 < 0) return;
    const c2 = chunk.indexOf(":", c1 + 1);
    const head = chunk.slice(0, c1).trim(), value = (c2 < 0 ? chunk.slice(c1 + 1) : chunk.slice(c1 + 1, c2)).trim();
    const note = c2 < 0 ? "" : chunk.slice(c2 + 1).trim();
    if (!/^(?:10|[0-9])$/.test(value)) return;
    const other = head.match(/^Annat \((.*)\)$/i);
    if (other) { if (other[1].trim()) out.push({ part: "other", value, ...(note ? { note } : {}), label: other[1].trim() }); return; }
    const lower = head.toLowerCase();
    const part = [...BODY_PARTS].sort((a, b) => b.label.length - a.label.length).find((x) => lower === x.label.toLowerCase() || lower.startsWith(x.label.toLowerCase() + " "));
    if (!part) return;
    let pos = "";
    if (part.pos) {
      const rest = lower.slice(part.label.length).trim();
      const pi = part.pos.find((x) => x.label === rest);
      if (!pi) return;
      pos = pi.code;
    }
    out.push({ part: part.code, ...(pos ? { pos } : {}), value, ...(note ? { note } : {}) });
  });
  return out;
}

// One 1-5 scale: five buttons, no default, tap again to clear. Ends are named; the chosen step shows its name.
function ScaleRow({ title, value, labels, onChange, testId }) {
  return (
    <div className="mb-3" data-testid={testId}>
      <div className="text-xs font-bold mb-2" style={{ color: LABEL }}>{title}</div>
      <div className="grid grid-cols-5 gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const on = value === String(n);
          return (
            <button key={n} type="button" data-testid={`${testId}-${n}`} aria-pressed={on} onClick={() => onChange(on ? "" : String(n))}
                    className="py-2 rounded-lg text-sm font-bold border"
                    style={{ borderColor: on ? ACCENT : LINE2, backgroundColor: on ? ACCENT : CARD, color: on ? ON_ACCENT : CTRL }}>{n}</button>
          );
        })}
      </div>
      <div className="flex justify-between text-xs mt-1.5" style={{ color: HINT }} data-testid={`${testId}-hint`}>
        {value ? <span style={{ color: INK }}>{value} – {labels[Number(value) - 1]}</span> : (<><span>{labels[0]}</span><span>{labels[4]}</span></>)}
      </div>
    </div>
  );
}

// A slider that starts unset: no thumb until the user taps or drags (so nothing looks pre-chosen). Used for pain (0-10) and effort (1-10).
// Tap or drag horizontally; a vertical swipe still scrolls the page (touch-action: pan-y).
function RangeSlider({ value, onChange, min, max, testId, label }) {
  const ref = useRef(null);
  const drag = useRef(null);
  const PAD = 16; // half the thumb, so both ends sit fully inside the track
  const span = max - min;
  const set = (clientX) => {
    const r = ref.current.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (clientX - r.left - PAD) / Math.max(1, r.width - 2 * PAD)));
    const v = String(min + Math.round(t * span));
    if (v !== value) onChange(v);
  };
  const n = value === "" ? null : Number(value);
  const pos = (i) => `calc(${PAD}px + (100% - ${2 * PAD}px) * ${(i - min) / span})`;
  const steps = Array.from({ length: span + 1 }, (_, i) => min + i);
  const key = (e) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    onChange(String(Math.min(max, Math.max(min, (n === null ? (d > 0 ? min - 1 : max + 1) : n) + d))));
  };
  return (
    <div className="mb-2" data-testid={`${testId}-slider-wrap`}>
      <div className="flex items-center gap-1">
        <span className="text-xs shrink-0 text-right" style={{ color: HINT, width: 14 }} data-testid={`${testId}-min`}>{min}</span>
        <div ref={ref} role="slider" tabIndex={0} aria-label={label} aria-valuemin={min} aria-valuemax={max}
             aria-valuenow={n === null ? undefined : n} aria-valuetext={n === null ? "Inte vald" : String(n)} data-testid={`${testId}-slider`} onKeyDown={key}
             onPointerDown={(e) => { drag.current = { x: e.clientX, moved: false }; try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {} }}
             onPointerMove={(e) => { const d = drag.current; if (!d) return; if (Math.abs(e.clientX - d.x) > 4) { d.moved = true; set(e.clientX); } }}
             onPointerUp={(e) => { const d = drag.current; drag.current = null; if (d && !d.moved) set(e.clientX); }}
             onPointerCancel={() => { drag.current = null; }}
             className="relative flex-1 select-none" style={{ height: 44, touchAction: "pan-y", cursor: "pointer" }}>
          {n === null && <div data-testid={`${testId}-slider-hint`} className="absolute text-xs text-center w-full" style={{ top: 1, color: HINT, pointerEvents: "none" }}>Tryck eller dra för att välja</div>}
          <div className="absolute rounded-full" style={{ left: PAD, right: PAD, top: 20, height: 4, backgroundColor: LINE2 }} />
          {n !== null && <div className="absolute rounded-full" style={{ left: PAD, width: `calc((100% - ${2 * PAD}px) * ${(n - min) / span})`, top: 20, height: 4, backgroundColor: ACCENT }} />}
          {steps.map((i) => (
            <div key={i} className="absolute rounded-full" style={{ left: pos(i), top: 19, width: 2, height: 6, marginLeft: -1, backgroundColor: n !== null && i <= n ? ACCENT : MUTED, opacity: n !== null && i <= n ? 1 : 0.5 }} />
          ))}
          {n !== null && (
            <div data-testid={`${testId}-thumb`} className="absolute rounded-full" style={{ left: pos(n), top: 8, width: 28, height: 28, marginLeft: -14, backgroundColor: ACCENT, border: `3px solid ${CARD}`, boxShadow: `0 0 0 1px ${ACCENT}` }} />
          )}
        </div>
        <span className="text-xs shrink-0" style={{ color: HINT, width: 14 }} data-testid={`${testId}-max`}>{max}</span>
        <div className="flex items-center gap-1 shrink-0 ml-1" style={{ width: 54 }}>
          <span data-testid={`${testId}-value-text`} className="text-2xl font-bold text-center" style={{ minWidth: 28, color: n === null ? FAINT : ACCENT_DARK }}>{n === null ? "–" : n}</span>
          {n !== null && (
            <button type="button" data-testid={`${testId}-clear`} aria-label="Rensa värdet" onClick={() => onChange("")} className="p-1 rounded hover-soft">
              <X size={14} style={{ color: MUTED }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
const PainSlider = ({ value, onChange }) => <RangeSlider value={value} onChange={onChange} min={0} max={10} testId="pain" label="Smärta 0 till 10" />;

// Collapsible "Mående" section of the log form.
function WellbeingSection({ form, setForm, isOff, counts }) {
  const [open, setOpen] = useState(() => hasWellbeing(form));
  // Most used body parts (last 30 days) first, topped up with the defaults in their own order.
  const quick = useMemo(() => {
    const used = BODY_PARTS.map((x) => x.code).filter((c) => (counts[c] || 0) > 0).sort((a, b) => counts[b] - counts[a]);
    return [...used, ...DEFAULT_PAIN_PARTS].filter((c, i, l) => l.indexOf(c) === i).slice(0, VISIBLE_COUNT);
  }, [counts]);
  const setPain = (fn) => setForm((f) => ({ ...f, pain: fn(f.pain || []) }));
  const addPart = (code) => setPain((l) => [...l, newPainRow(code)]);
  const upd = (k, patch) => setPain((l) => l.map((r) => (r.k === k ? { ...r, ...patch } : r)));
  const summary = [form.sleep && `Sömn ${form.sleep}`, form.energy && `Energi ${form.energy}`, form.pain.length && `${form.pain.length} smärta`].filter(Boolean).join(" · ");
  const painTitle = isOff ? "SMÄRTA IDAG" : "SMÄRTA UNDER PASSET";
  return (
    <div className="mb-4 rounded-lg border" style={{ borderColor: LINE }} data-testid="wellbeing">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} data-testid="wellbeing-toggle"
              className="w-full flex items-center justify-between px-3 py-2.5 text-left">
        <span className="min-w-0">
          <span className="text-xs font-bold" style={{ color: LABEL }}>MÅENDE</span>
          {!open && <span className="text-xs ml-2" data-testid="wellbeing-summary" style={{ color: summary ? INK : FAINT }}>{summary || "Sömn, energi, smärta (valfritt)"}</span>}
        </span>
        <ChevronDown size={16} style={{ color: MUTED, transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <div className="px-3 pb-3">
          <ScaleRow title="SÖMN" value={form.sleep} labels={SLEEP_LABELS} testId="sleep"
                    onChange={(v) => setForm((f) => ({ ...f, sleep: v }))} />
          <ScaleRow title="ENERGI" value={form.energy} labels={ENERGY_LABELS} testId="energy"
                    onChange={(v) => setForm((f) => ({ ...f, energy: v }))} />
          <div className="text-xs font-bold mb-1" style={{ color: LABEL }}>{painTitle}</div>
          <p className="text-xs mb-2" style={{ color: HINT }}>0 = ingen smärta · 10 = värsta tänkbara</p>
          <div className="space-y-2 mb-2">
            {form.pain.map((r) => {
              const info = partInfo(r.part);
              return (
                <div key={r.k} data-testid="pain-row" className="rounded-lg border p-2.5" style={{ borderColor: LINE2, backgroundColor: SUBTLE }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold" style={{ color: INK }}>{info.label}</span>
                    <button type="button" aria-label={`Ta bort ${info.label}`} data-testid="pain-remove"
                            onClick={() => setPain((l) => l.filter((x) => x.k !== r.k))} className="p-1 rounded hover-soft">
                      <X size={16} style={{ color: MUTED }} />
                    </button>
                  </div>
                  {r.part === "other" && (
                    <input type="text" value={r.label} maxLength={40} placeholder="Vilken kroppsdel?" data-testid="pain-label" aria-label="Kroppsdel"
                           onChange={(e) => upd(r.k, { label: e.target.value })}
                           className="border rounded-lg px-3 py-2 text-sm w-full mb-2" style={{ borderColor: LINE2 }} />
                  )}
                  {info.pos && (
                    <div role="group" aria-label="Sida" data-testid="pain-pos" className="flex w-full rounded-lg border overflow-hidden mb-2" style={{ borderColor: LINE2 }}>
                      {info.pos.map((o, i) => {
                        const on = r.pos === o.code;
                        return (
                          <button key={o.code} type="button" aria-pressed={on} data-testid={`pain-pos-${o.code}`} onClick={() => upd(r.k, { pos: on ? "" : o.code })}
                                  className="flex-1 py-2 text-sm font-semibold"
                                  style={{ backgroundColor: on ? ACCENT : CARD, color: on ? ON_ACCENT : CTRL, borderLeft: i ? `1px solid ${LINE2}` : "none" }}>
                            {o.label.charAt(0).toUpperCase() + o.label.slice(1)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <PainSlider value={r.value} onChange={(v) => upd(r.k, { value: v })} />
                  <input type="text" value={r.note} maxLength={120} placeholder="Notering (valfri)" data-testid="pain-note" aria-label="Notering"
                         onChange={(e) => upd(r.k, { note: e.target.value })}
                         className="border rounded-lg px-3 py-2 text-sm w-full" style={{ borderColor: LINE2 }} />
                  {!painRowOk(r) && (
                    <p className="text-xs mt-1.5" data-testid="pain-missing" style={{ color: ERR }}>
                      {r.part === "other" && !r.label.trim() ? "Skriv vilken kroppsdel det gäller." : info.pos && !r.pos ? `Välj ${info.pos.map((o) => o.label).join(" eller ")}.` : "Välj hur ont det gör (0–10)."}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2 items-center" data-testid="pain-add">
            {quick.map((c) => (
              <button key={c} type="button" data-testid={`pain-quick-${c}`} onClick={() => addPart(c)}
                      className="px-3 py-2 rounded-full text-sm border flex items-center gap-1" style={{ borderColor: LINE2, color: CTRL, backgroundColor: CARD }}>
                <Plus size={14} /> {partInfo(c).label}
              </button>
            ))}
            <select aria-label="Lägg till kroppsdel" data-testid="pain-select" value=""
                    onChange={(e) => { if (e.target.value) addPart(e.target.value); }}
                    className="border rounded-full px-3 py-2 text-sm" style={{ borderColor: LINE2, color: MUTED }}>
              <option value="">+ Lägg till kroppsdel</option>
              {BODY_REGIONS.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.parts.map((x) => <option key={x.code} value={x.code}>{x.label}</option>)}
                </optgroup>
              ))}
              <optgroup label="Annat"><option value="other">Annat (skriv själv)</option></optgroup>
            </select>
          </div>
        </div>
      )}
    </div>
  );
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
// The default order of the list always applies; "most used" overrules it: the most used choices (last 30 days) move to
// the front. The visible VISIBLE_COUNT are topped up with the default choices, in default order. Everything else keeps
// the default order (so related choices, e.g. Skidor / Rullskidor / Alpint, stay next to each other under "Fler").
function rankCodes(all, counts, defaults) {
  const codes = all.map((x) => x.code);
  const used = codes.filter((c) => (counts[c] || 0) > 0)
    .sort((a, b) => (counts[b] - counts[a]) || (codes.indexOf(a) - codes.indexOf(b)));
  const topUp = codes.filter((c) => defaults.includes(c) && !used.includes(c));
  const head = [...used, ...topUp, ...codes].filter((c, i, a) => a.indexOf(c) === i).slice(0, VISIBLE_COUNT);
  return [...head, ...codes.filter((c) => !head.includes(c))];
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
                className="px-3 py-2 rounded-full text-sm border flex items-center gap-1" style={{ borderColor: LINE2, color: MUTED }}>
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

// ---- Comparison with the previous period (Statistik, Vecka and Månad) ----
// A running period is compared with the SAME days of the previous one (Mon-Wed against Mon-Wed), a finished
// period with the whole previous one. Neutral on purpose: no colours, no "good/bad", no thresholds.
function summarizeEntries(list) {
  const withK = list.filter((e) => e.kansla);
  return {
    totalPass: list.length,
    totalTidMin: list.reduce((a, e) => a + (parseFloat(e.tid) || 0), 0),
    avgKansla: withK.length ? withK.reduce((a, e) => a + parseFloat(e.kansla), 0) / withK.length : 0,
    totalLoad: list.reduce((a, e) => a + (parseFloat(e.tid) || 0) * (parseFloat(e.kansla) || 0), 0),
    totalKm: list.reduce((a, e) => a + distNum(e), 0),
  };
}
// Percent change as { dir: "up" | "down" | "flat", text } or null when it cannot be calculated (previous is 0).
function pctDelta(cur, prev) {
  if (!(prev > 0)) return null;
  const r = (cur - prev) / prev;
  if (Math.abs(r) < 0.01) return { dir: "flat", text: "" };
  return { dir: r > 0 ? "up" : "down", text: `${Math.round(Math.abs(r) * 100)} %` };
}
// Average effort is a 1-10 scale, so the difference is shown in points, not percent.
function pointDelta(cur, prev) {
  if (!(cur > 0) || !(prev > 0)) return null;
  const d = Math.round((cur - prev) * 10) / 10;
  if (d === 0) return { dir: "flat", text: "" };
  return { dir: d > 0 ? "up" : "down", text: Math.abs(d).toLocaleString("sv-SE", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) };
}
// The small muted arrow + number in a tile. No colour judgement.
function Delta({ d, testid }) {
  const label = !d ? "ingen jämförelse" : d.dir === "flat" ? "oförändrat" : `${d.dir === "up" ? "upp" : "ned"} ${d.text}`;
  return (
    <span className="text-xs font-semibold whitespace-nowrap" data-testid={testid} data-dir={d ? d.dir : "none"} aria-label={label} style={{ color: MUTED }}>
      {!d || d.dir === "flat" ? "–" : `${d.dir === "up" ? "▲" : "▼"} ${d.text}`}
    </span>
  );
}

// Confirmation dialog in the app's style (replaces the browser's confirm()).
// ---- Backup (JSON): everything in one file. Never contains the database address or the share code. ----
const BACKUP_FORMAT = 1;
const BACKUP_NEWER = "Säkerhetskopian är gjord med en nyare version av appen. Tryck Uppdatera sidan och försök igen.";
const BACKUP_DAYS = 28; // reminder after this many days without a backup
const entrySig = (e) => [e.date, e.user, (e.sport || []).join(","), (e.typ || []).join(","), e.tid, e.distance || "", e.kansla, e.anteckningar, e.kind || "", e.sleep || "", e.energy || "", JSON.stringify(e.pain || [])].join("|");
function buildBackup(usersList, monthsMap) {
  return { app: "traningsdagbok", format: BACKUP_FORMAT, schema: DATA_SCHEMA, createdAt: new Date().toISOString(), appVersion: APP_VERSION, users: usersList, months: monthsMap };
}
// Checks a parsed file and returns { users, months } with only valid data, or { error }.
function readBackup(obj) {
  if (!obj || typeof obj !== "object" || obj.app !== "traningsdagbok" || obj.format !== BACKUP_FORMAT) return { error: "Det här är ingen säkerhetskopia från Träningsdagboken." };
  if (typeof obj.schema === "number" && obj.schema > DATA_SCHEMA) return { error: BACKUP_NEWER }; // a file without "schema" is version 1
  if (!obj.months || typeof obj.months !== "object" || Array.isArray(obj.months) || !Array.isArray(obj.users)) return { error: "Säkerhetskopian är trasig eller ofullständig." };
  const months = {};
  let skipped = 0;
  Object.entries(obj.months).forEach(([mk, list]) => {
    if (!/^\d{4}-\d{2}$/.test(mk) || !Array.isArray(list)) { skipped += Array.isArray(list) ? list.length : 1; return; }
    const ok = normalizeEntries(list.filter((e) => e && typeof e === "object" && typeof e.id === "string" && e.id && typeof e.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(e.date) && e.date.slice(0, 7) === mk));
    skipped += list.length - ok.length;
    if (ok.length) months[mk] = ok;
  });
  const users = obj.users.filter((u) => u && typeof u.id === "string" && u.id && typeof u.name === "string" && u.name && typeof u.color === "string" && /^#[0-9a-fA-F]{6}$/.test(u.color));
  return { users, months, skipped, createdAt: typeof obj.createdAt === "string" ? obj.createdAt : null };
}
function agoText(iso, now = Date.now()) {
  const t = Date.parse(iso);
  if (isNaN(t)) return "okänt";
  const d = Math.max(0, Math.floor((now - t) / 86400000));
  if (d === 0) return "idag";
  if (d === 1) return "igår";
  if (d < 14) return `${d} dagar sedan`;
  if (d < 60) return `${Math.floor(d / 7)} veckor sedan`;
  return `${Math.floor(d / 30)} månader sedan`;
}

function ConfirmModal({ title, text, confirmLabel, busy, error, onConfirm, onCancel, neutral }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
         onClick={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}>
      <div role="dialog" aria-modal="true" aria-label={title} className="bg-card w-full max-w-md rounded-t-2xl sm:rounded-2xl p-4"
           style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        <h2 className="text-lg font-bold mb-1" style={{ color: INK }}>{title}</h2>
        <p className="text-sm mb-3" style={{ color: INK }}>{text}</p>
        {error && <p className="text-sm font-semibold mb-3" style={{ color: DANGER }}>{error}</p>}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onCancel} disabled={busy}
                  className="rounded-lg text-sm font-semibold border" style={{ minHeight: 44, borderColor: LINE2, color: CTRL }}>
            Avbryt
          </button>
          <button type="button" onClick={onConfirm} disabled={busy}
                  className="rounded-lg text-sm font-bold text-on-accent flex items-center justify-center gap-2" style={{ minHeight: 44, backgroundColor: neutral ? ACCENT : DANGER, opacity: busy ? 0.6 : 1 }}>
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
                           outline: adjusted.toUpperCase() === c.toUpperCase() ? `3px solid ${INK}` : "none", outlineOffset: 2 }} />
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
  const [admin, setAdmin] = useState(false);
  const [remind, setRemind] = useState(false);
  const [busy, setBusy] = useState(false);
  const active = users.filter((u) => !u.hidden && !localHidden.includes(u.id));
  const localList = users.filter((u) => !u.hidden && localHidden.includes(u.id));
  const archived = users.filter((u) => u.hidden);

  function openEdit(u) { setEditingId(u.id); setAdding(false); setName(u.name); setColor(u.color); setAdmin(u.admin === true); setRemind(u.remindYesterday === true); setError(""); }
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
        return list.map((u) => {
          if (u.id !== editingId) return u;
          const { admin: _old, remindYesterday: _oldRemind, ...rest } = u;
          return { ...rest, name: n, color: c, ...(admin ? { admin: true } : {}), ...(remind ? { remindYesterday: true } : {}) };
        });
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
    <div className="rounded-xl border p-3 mb-3" style={{ borderColor: LINE, backgroundColor: SUBTLE }}>
      <div className="text-xs font-bold mb-1.5" style={{ color: LABEL }}>NAMN</div>
      <input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder="t.ex. Alva"
             className="w-full border rounded-lg px-3 py-2 text-sm mb-3" style={{ borderColor: LINE2 }} />
      <div className="text-xs font-bold mb-1.5" style={{ color: LABEL }}>FÄRGTEMA</div>
      <ColorPicker value={color} onChange={setColor} />
      {editingId && (
        <button type="button" role="switch" aria-checked={admin} data-testid="user-admin-switch" onClick={() => setAdmin((v) => !v)}
                className="w-full flex items-center gap-3 text-left mt-3" style={{ minHeight: 44, color: INK }}>
          <span className="inline-flex items-center rounded-full shrink-0" style={{ width: 40, height: 24, padding: 2, backgroundColor: admin ? ACCENT : LINE2, justifyContent: admin ? "flex-end" : "flex-start" }}>
            <span className="inline-block rounded-full" style={{ width: 20, height: 20, backgroundColor: CARD }} />
          </span>
          <span className="text-sm">
            <span className="font-semibold">Administratör</span>
            <span className="block text-xs" style={{ color: MUTED }}>Ser säkerhetskopia, återställning och påminnelse, på alla enheter där den här personen är vald.</span>
          </span>
        </button>
      )}
      {editingId && (
        <button type="button" role="switch" aria-checked={remind} data-testid="user-remind-switch" onClick={() => setRemind((v) => !v)}
                className="w-full flex items-center gap-3 text-left mt-1" style={{ minHeight: 44, color: INK }}>
          <span className="inline-flex items-center rounded-full shrink-0" style={{ width: 40, height: 24, padding: 2, backgroundColor: remind ? ACCENT : LINE2, justifyContent: remind ? "flex-end" : "flex-start" }}>
            <span className="inline-block rounded-full" style={{ width: 20, height: 20, backgroundColor: CARD }} />
          </span>
          <span className="text-sm">
            <span className="font-semibold">Påminn om igår</span>
            <span className="block text-xs" style={{ color: MUTED }}>Visar en rad på Logga pass när gårdagen inte är loggad.</span>
          </span>
        </button>
      )}
      <div className="flex gap-2 mt-3">
        <button type="button" onClick={submit} disabled={busy}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-on-accent"
                style={{ backgroundColor: ensureContrast(color), opacity: busy ? 0.6 : 1 }}>
          {busy ? "Sparar…" : "Spara"}
        </button>
        <button type="button" onClick={closeForm} className="px-4 py-2 rounded-lg text-sm border" style={{ borderColor: LINE2, color: MUTED }}>
          Avbryt
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
         onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-card w-full max-w-md rounded-t-2xl sm:rounded-2xl p-4 overflow-y-auto"
           style={{ maxHeight: "88vh", paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold" style={{ color: INK }}>Användare</h2>
          <button type="button" onClick={onClose} aria-label="Stäng" className="p-1"><X size={20} /></button>
        </div>

        {active.map((u) => (
          editingId === u.id ? <div key={u.id}>{form}</div> : (
            <div key={u.id} className="py-2 border-b" style={{ borderColor: GRIDC }}>
              <div className="flex items-center gap-3">
                <span className="inline-block rounded-full" style={{ width: 22, height: 22, backgroundColor: userColor(u) }} />
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
            <div className="text-xs font-bold mb-1" style={{ color: LABEL }}>DOLDA PÅ DEN HÄR ENHETEN</div>
            <p className="text-xs mb-1" style={{ color: MUTED }}>Syns fortfarande för alla andra. Passen finns kvar.</p>
            {localList.map((u) => (
              <div key={u.id} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: GRIDC }}>
                <span className="inline-block rounded-full" style={{ width: 22, height: 22, backgroundColor: userColor(u), opacity: 0.4 }} />
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
            <div className="text-xs font-bold mb-1" style={{ color: LABEL }}>ARKIVERADE</div>
            <p className="text-xs mb-1" style={{ color: MUTED }}>Dolda för alla enheter. Passen finns kvar och kommer tillbaka när du återställer användaren.</p>
            {archived.map((u) => (
              <div key={u.id} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: GRIDC }}>
                <span className="inline-block rounded-full" style={{ width: 22, height: 22, backgroundColor: userColor(u), opacity: 0.4 }} />
                <span className="flex-1 text-sm" style={{ color: MUTED }}>{u.name}</span>
                <button type="button" onClick={() => archive(u.id, false)} disabled={busy} className="flex items-center gap-1.5 text-sm font-semibold p-2" style={{ color: ACCENT_DARK }}>
                  <Eye size={16} /> Återställ
                </button>
              </div>
            ))}
          </div>
        )}
        {error && <p className="text-sm font-semibold mt-3" style={{ color: DANGER }}>{error}</p>}
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
        borderColor: active ? color : LINE2,
        backgroundColor: active ? color : CARD,
        color: active ? ON_ACCENT : CTRL,
      }}
    >
      {children}
    </button>
  );
}

// ---- Pain trend (Statistik) ----
const painLabelOf = (q) => { const pi = posInfo(q.part, q.pos); return `${painName(q)}${pi ? " " + pi.short : ""}`; };
function painKeysOf(entries) {
  const m = {};
  entries.forEach((e) => (e.pain || []).forEach((q) => {
    const k = histPartKey(q);
    m[k] = m[k] || { key: k, label: painLabelOf(q), days: new Set() };
    m[k].days.add(e.date);
  }));
  return Object.values(m).map((x) => ({ key: x.key, label: x.label, n: x.days.size }))
    .sort((a, b) => b.n - a.n || a.label.localeCompare(b.label, "sv"));
}
// highest value per day for one body part (side counts as its own part)
function painDayMax(entries, key) {
  const m = {};
  entries.forEach((e) => (e.pain || []).forEach((q) => {
    if (histPartKey(q) !== key) return;
    const v = parseFloat(q.value);
    if (!isNaN(v)) m[e.date] = Math.max(m[e.date] === undefined ? -1 : m[e.date], v);
  }));
  return m;
}
// Persistent pain, counted on logged days (pass, rest or sick day) and not calendar days, so someone who trains
// three times a week is still covered: pain of 5 or more on 5 of the last 7 logged days, or on 10 of the last 14.
// A logged day without that pain counts as pain free. Looks back 28 days at most, so old trouble does not trigger it.
function persistentPain(entries, today) {
  const from = addDaysIso(today, -27);
  const days = [...new Set(entries.filter((e) => e.date >= from && e.date <= today).map((e) => e.date))].sort().reverse();
  if (!days.length) return [];
  const per = {}; // key -> { label, byDay: {date: max value} }
  entries.forEach((e) => (e.pain || []).forEach((q) => {
    if (e.date < from || e.date > today) return;
    const v = parseFloat(q.value);
    if (isNaN(v)) return;
    const k = histPartKey(q);
    per[k] = per[k] || { label: painLabelOf(q), byDay: {} };
    per[k].byDay[e.date] = Math.max(per[k].byDay[e.date] === undefined ? -1 : per[k].byDay[e.date], v);
  }));
  const out = [];
  Object.values(per).forEach((x) => {
    const hits = (list) => list.filter((d) => (x.byDay[d] === undefined ? -1 : x.byDay[d]) >= 5).length;
    const d7 = days.slice(0, 7), d14 = days.slice(0, 14);
    const n7 = hits(d7), n14 = hits(d14);
    if (n7 >= 5) out.push({ label: x.label, n: n7, win: d7.length >= 7 ? 7 : d7.length });
    else if (n14 >= 10) out.push({ label: x.label, n: n14, win: d14.length >= 14 ? 14 : d14.length });
  });
  return out.sort((a, b) => b.n / b.win - a.n / a.win).slice(0, 3);
}
function daysOfMonthKey(key) {
  const out = []; let d = `${key}-01`;
  while (d.slice(0, 7) === key) { out.push(d); d = addDaysIso(d, 1); }
  return out;
}
function PainTrendCard({ entries, loadMap, scope, week, month, hints, part, onPart }) {
  const parts = useMemo(() => painKeysOf(entries), [entries]);
  const sel = parts.find((x) => x.key === part) || parts[0] || null;
  const data = useMemo(() => {
    if (!sel) return [];
    const max = painDayMax(entries, sel.key);
    let days;
    if (scope === "week") days = Array.from({ length: 7 }, (_, i) => addDaysIso(week, i));
    else if (scope === "month") days = daysOfMonthKey(month);
    else {
      const dates = entries.map((e) => e.date).sort();
      days = [];
      if (dates.length) {
        const a = dates[0], b = dates[dates.length - 1];
        for (let d = a; d <= b && days.length < 400; d = addDaysIso(d, 1)) days.push(d);
        if (days.length >= 400 || addDaysIso(a, 399) < b) days = [...new Set(dates)];
      }
    }
    return days.map((d, i) => ({
      date: d,
      x: scope === "week" ? WEEKDAY_SHORT[i] : scope === "month" ? String(parseInt(d.slice(8), 10)) : d.slice(5),
      pain: max[d] === undefined ? null : max[d],
      load: Math.round(loadMap[d] || 0),
    }));
  }, [entries, sel, scope, week, month, loadMap]);
  const vals = data.filter((r) => r.pain !== null).map((r) => r.pain);
  const stat = vals.length ? { max: Math.max(...vals), avg: vals.reduce((a, b) => a + b, 0) / vals.length, n: vals.length } : null;
  return (
    <Card>
      <div className="text-xs font-bold mb-3" style={{ color: ACCENT_DARK }}>SMÄRTA</div>
      {!sel ? (
        <p className="text-sm" data-testid="pain-trend-empty" style={{ color: MUTED }}>Ingen smärta noterad den här perioden.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-3" data-testid="pain-parts">
            {parts.map((x) => (
              <button key={x.key} type="button" data-testid="pain-part" aria-pressed={x.key === sel.key} onClick={() => onPart(x.key)}
                      className="px-3 rounded-full text-sm font-semibold border"
                      style={{ minHeight: 36, borderColor: x.key === sel.key ? ACCENT : LINE2, backgroundColor: x.key === sel.key ? ACCENT : CARD, color: x.key === sel.key ? ON_ACCENT : CTRL }}>
                {x.label}
              </button>
            ))}
          </div>
          <div className="flex gap-4 mb-2 text-xs" data-testid="pain-stats" style={{ color: MUTED }}>
            <span>Högst <b style={{ color: INK }}>{stat ? stat.max : "–"}</b></span>
            <span>Snitt <b style={{ color: INK }}>{stat ? stat.avg.toFixed(1).replace(".", ",") : "–"}</b></span>
            <span>Dagar med smärta <b style={{ color: INK }}>{stat ? stat.n : 0}</b></span>
          </div>
          <div data-testid="pain-chart">
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={data} margin={CHART_MARGIN}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRIDC} vertical={false} />
              <XAxis dataKey="x" tick={{ fontSize: 10, fill: MUTED }} axisLine={{ stroke: AXISC }} tickLine={false} interval="preserveStartEnd" minTickGap={14} />
              <YAxis yAxisId="pain" domain={[0, 10]} ticks={[0, 5, 10]} tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} width={40} />
              <YAxis yAxisId="load" hide domain={[0, (m) => Math.max(m, 1)]} />
              <Tooltip {...tipProps()} formatter={(v, name) => [v, name]} />
              <Bar yAxisId="load" dataKey="load" name="Belastning" fill={ACCENT} fillOpacity={0.18} isAnimationActive={false} />
              <Line yAxisId="pain" type="monotone" dataKey="pain" name="Smärta" stroke={DANGER} strokeWidth={2} connectNulls={false}
                    dot={{ r: 4, fill: DANGER, stroke: DANGER }} activeDot={{ r: 5 }} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
          </div>
          <div className="text-xs mt-1" style={{ color: MUTED }}>Linje: högsta smärta den dagen (0–10). Staplar: belastning. Dagar utan notering visas som glapp.</div>
        </>
      )}
      {hints.map((h) => (
        <div key={h.label} data-testid="pain-hint" className="rounded-lg px-3 py-2 mt-3 text-sm"
             style={{ backgroundColor: WARN_BG, border: `1px solid ${WARN_BORDER}`, color: WARN_TEXT }}>
          Smärta på 5 eller mer i {h.label} har noterats {h.n} av de senaste {h.win} loggade dagarna. Om den inte går över kan det vara bra att kontakta fysio eller läkare.
        </div>
      ))}
    </Card>
  );
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-xl border p-4 bg-card ${className}`}
      style={{ borderColor: LINE }}
    >
      {children}
    </div>
  );
}

// One look for both period pickers (week and month): arrow, label (tap = jump), arrow.
function PeriodStepper({ id, canPrev, canNext, onPrev, onNext, prevLabel, nextLabel, children, overlay }) {
  const arrow = (dir, enabled, label, fn) => (
    <button type="button" data-testid={`${id}-${dir > 0 ? "next" : "prev"}`} aria-label={label} disabled={!enabled} onClick={fn}
            className="flex items-center justify-center rounded-lg border"
            style={{ width: 44, minHeight: 44, borderColor: LINE2, color: CTRL, opacity: enabled ? 1 : 0.35 }}>
      <ChevronDown size={18} style={{ transform: dir > 0 ? "rotate(-90deg)" : "rotate(90deg)" }} />
    </button>
  );
  return (
    <div className="flex items-center gap-2">
      {arrow(-1, canPrev, prevLabel, onPrev)}
      <div className="relative flex-1 rounded-lg border flex items-center justify-center text-center"
           style={{ minHeight: 44, borderColor: LINE2, color: INK }}>
        <div className="text-sm leading-tight px-2 whitespace-nowrap" data-testid={`${id}-label`}>
          {children}
          <ChevronDown size={14} style={{ display: "inline", verticalAlign: "-2px", marginLeft: 4, color: MUTED }} />
        </div>
        {overlay}
      </div>
      {arrow(1, canNext, nextLabel, onNext)}
    </div>
  );
}
const addMonthKey = (key, n) => { const [y, m] = key.split("-").map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1, 12)); return d.toISOString().slice(0, 7); };

// ---- Historik: search, filters and week summaries ----
const histPartKey = (p) => (p.part === "other" ? `other:${(p.label || "").trim().toLowerCase()}` : `${p.part}:${p.pos || ""}`);
const histPartName = (p) => { const pi = posInfo(p.part, p.pos); return `${painName(p)}${pi ? " " + pi.label : ""}`; };
const dayTitle = (iso) => `${WEEKDAY_SHORT[(isoToDate(iso).getUTCDay() + 6) % 7]} ${parseInt(iso.slice(8), 10)} ${MONTH_SHORT[parseInt(iso.slice(5, 7), 10) - 1]}`;
const isoDayLabel = (iso) => `${iso.slice(8)}/${iso.slice(5, 7)}`;
// Everything a search can hit, lower-cased: note, pain notes and body parts, activities, types, kind and date.
function histHaystack(e) {
  return [
    e.anteckningar,
    ...(e.pain || []).flatMap((p) => [histPartName(p), p.note || ""]),
    ...(e.sport || []).map((c) => labelOf(SPORTS, c)),
    ...(e.typ || []).map((c) => labelOf(TYPES, c)),
    isOffDay(e) ? kindLabel(e.kind) : "",
    isoDayLabel(e.date), e.date,
  ].join(" ").toLowerCase();
}
function filterHistory(list, f) {
  const terms = (f.query || "").toLowerCase().split(/\s+/).filter(Boolean);
  return list.filter((e) => {
    if (f.hideOff && isOffDay(e)) return false;
    if (f.painOnly && !(e.pain || []).length) return false;
    if (f.sport && !(e.sport || []).includes(f.sport)) return false;
    if (f.typ && !(e.typ || []).includes(f.typ)) return false;
    if (f.part && !(e.pain || []).some((p) => histPartKey(p) === f.part)) return false;
    if (terms.length) { const h = histHaystack(e); if (!terms.every((t) => h.includes(t))) return false; }
    return true;
  });
}
// Weeks (Monday-based), newest first; days newest first inside a week.
function weekGroups(list) {
  const by = {};
  list.forEach((e) => { (by[mondayOf(e.date)] = by[mondayOf(e.date)] || []).push(e); });
  return Object.keys(by).sort().reverse().map((monday) => ({ monday, entries: by[monday].slice().sort((a, b) => b.date.localeCompare(a.date)) }));
}
function fmtDuration(min) {
  const t = Math.round(min), h = Math.floor(t / 60), m = t % 60;
  return h && m ? `${h} h ${m} min` : h ? `${h} h` : `${m} min`;
}
// Same arithmetic as the statistics page: load = minutes x effort.
function weekSummary(entries) {
  const passes = entries.filter(isRealPass);
  const minutes = passes.reduce((s, e) => s + tidSeconds(e.tid) / 60, 0);
  const load = Math.round(passes.reduce((s, e) => s + (parseFloat(e.tid) || 0) * (parseFloat(e.kansla) || 0), 0));
  const km = passes.reduce((s, e) => s + distNum(e), 0);
  const rest = entries.filter((e) => e.kind === "rest").length, sick = entries.filter((e) => e.kind === "sick").length;
  const pain = {};
  entries.forEach((e) => (e.pain || []).forEach((p) => {
    const k = histPartKey(p), v = Number(p.value) || 0;
    if (!pain[k] || pain[k].max < v) pain[k] = { name: histPartName(p), short: painShort({ ...p, value: "" }).trim(), max: v };
  }));
  const painList = Object.values(pain).sort((a, b) => b.max - a.max || a.name.localeCompare(b.name, "sv"));
  const parts = [
    passes.length ? `${passes.length} pass` : null,
    minutes > 0 ? fmtDuration(minutes) : null,
    load > 0 ? `belastning ${load.toLocaleString("sv-SE")}` : null,
    km > 0 ? `${fmtKm(km)} km` : null,
    rest ? (rest === 1 ? "1 vilodag" : `${rest} vilodagar`) : null,
    sick ? (sick === 1 ? "1 sjukdag" : `${sick} sjukdagar`) : null,
  ].filter(Boolean);
  return { text: parts.join(" · ") || "Inga pass", painList };
}
// A pill that looks like a button but is a native select underneath (works well on phones).
function FilterSelect({ testId, label, value, options, onChange }) {
  const cur = options.find((o) => o.value === value);
  const on = !!value;
  return (
    <span className="relative inline-flex items-center gap-1 px-3 rounded-full text-sm border select-none" data-testid={`${testId}-pill`}
          style={{ minHeight: 40, borderColor: on ? ACCENT : LINE2, backgroundColor: on ? ACCENT : CARD, color: on ? ON_ACCENT : CTRL, opacity: options.length || on ? 1 : 0.5 }}>
      <span className="font-semibold">{on ? `${label}: ${cur ? cur.short : value}` : label}</span>
      <ChevronDown size={14} />
      <select aria-label={label} data-testid={testId} value={value} disabled={!options.length && !on}
              onChange={(e) => onChange(e.target.value)} className="absolute inset-0 w-full h-full cursor-pointer" style={{ opacity: 0 }}>
        <option value="">Alla</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </span>
  );
}

export default function TraningsDagbok({ connLink, onDisconnect }) {
  const [view, setView] = useState("logga"); // "logga" | "hist" | "stats"
  const [allMonths, setAllMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(monthKeyOf(todayISO()));
  const [monthEntries, setMonthEntries] = useState([]);
  const [allEntries, setAllEntries] = useState(null);
  const [statsScope, setStatsScope] = useState("month"); // "week" | "month" | "all"
  const [statsWeek, setStatsWeek] = useState(() => mondayOf(todayISO())); // Monday of the chosen week
  const [weekEntries, setWeekEntries] = useState([]);
  const [loadingWeek, setLoadingWeek] = useState(false);
  const [liveTick, setLiveTick] = useState(0); // bumped by live sync so the week view reloads
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
  const [hideOffDays, setHideOffDays] = useState(getHideOffDays);
  const [showMenu, setShowMenu] = useState(false); // person menu (top right)
  const importRef = React.useRef(null);
  const restoreRef = React.useRef(null);
  const [backupInfo, setBackupInfo] = useState({ loaded: false, at: null }); // shared: meta:backup
  const [backingUp, setBackingUp] = useState(false);
  const [restorePlan, setRestorePlan] = useState(null); // { data, counts } while the confirmation is open
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [restoreError, setRestoreError] = useState(null);
  useEffect(() => {
    if (!showMenu) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setShowMenu(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showMenu]);
  function toggleHideOffDays() {
    const next = !hideOffDays;
    setHideOffDays(next);
    try { localStorage.setItem(HIDE_OFFDAYS_KEY, next ? "1" : "0"); } catch (e) {}
  }
  const [protection, setProtection] = useState(null); // null | "on" | "limited"

  const emptyForm = {
    date: todayISO(),
    user: getMe(),
    sport: [],
    typ: [],
    tid: "",
    distance: "",
    kansla: "",
    anteckningar: "",
    sleep: "",
    energy: "",
    pain: [], // form rows: { k, part, pos, value, note, label }; stored via wellbeingOf()
    kind: "pass", // form only: "pass" | "rest" | "sick" (a normal pass is stored without kind)
  };
  const [form, setForm] = useState(emptyForm);
  const [statsUser, setStatsUser] = useState(getMe());
  // Historik: own month, person (follows the person who is logging), search and filters
  const [histMonth, setHistMonth] = useState(monthKeyOf(todayISO()));
  const [histUser, setHistUser] = useState(getMe());
  const [histQuery, setHistQuery] = useState("");
  const [histFilters, setHistFilters] = useState({ pain: false, sport: "", typ: "", part: "" });
  const [histCollapsed, setHistCollapsed] = useState(() => new Set());
  const [histMonthData, setHistMonthData] = useState({ key: null, data: [] });
  const [histAllData, setHistAllData] = useState(null);
  // Edit panel (bottom sheet) in Historik: the form lives in the panel; what was in the log form is put aside and put back on close.
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetBase, setSheetBase] = useState("");
  const [histMode, setHistModeState] = useState(getHistMode);
  const [histDay, setHistDay] = useState(null);
  const [histFiltersOpen, setHistFiltersOpen] = useState(false);
  const [statsPart, setStatsPart] = useState(null);
  const [recentData, setRecentData] = useState({ key: null, data: [] }); // this and last month, for the persistent-pain hint
  const setHistMode = (m) => { setHistModeState(m); try { localStorage.setItem(HIST_MODE_KEY, m); } catch (e) {} };
  const sheetOpenRef = React.useRef(false);
  const [sheetVv, setSheetVv] = useState(null);
  const [swipeDir, setSwipeDir] = useState(""); // "l" | "r": which way the page slides in after a swipe (empty after a tab tap)
  const sheetStash = React.useRef(null);
  const [skipYesterday, setSkipYesterday] = useState(loadSkipYesterday);
  const [clockTick, setClockTick] = useState(0); // lets the reminder appear at 06:00 without a reload
  const [users, setUsers] = useState(loadCachedUsers); // last known list, so colours are right from the first paint
  const [usersLoaded, setUsersLoaded] = useState(false); // until the real list is read, a device's own person must not be judged against the default list
  const [showUsers, setShowUsers] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [localHidden, setLocalHidden] = useState(getLocalHidden);
  const visibleUsers = users.filter((u) => !u.hidden && !localHidden.includes(u.id));
  function setLocalHiddenIds(next) {
    setLocalHidden(next);
    try { localStorage.setItem(LOCAL_HIDDEN_KEY, JSON.stringify(next)); } catch (e) {}
  }
  // Statistics start on the person who is logging, and follow when the person is switched.
  // (Picking another person under "Visar statistik för" lasts until the tab or the person changes.)
  useLayoutEffect(() => { setStatsUser(form.user); }, [form.user, view]);
  // Historik follows the person who is logging. Not while the panel is open, and not when closing it restores the log form
  // (editing someone else's pass must not switch the person back).
  const skipHistSync = React.useRef(null);
  useLayoutEffect(() => {
    if (sheetOpenRef.current) return;
    if (skipHistSync.current !== null) {
      const ig = skipHistSync.current; skipHistSync.current = null;
      if (form.user === ig) return;
    }
    setHistUser(form.user);
  }, [form.user, view]);
  useEffect(() => { if (!sheetOpen) skipHistSync.current = null; }, [sheetOpen]);
  // The pill highlights at once; the heavy chart rendering follows in the background (interruptible), so taps are never blocked.
  const statsUserShown = useDeferredValue(statsUser);
  const activeUserId = view === "stats" ? statsUserShown : view === "hist" ? histUser : form.user;
  const [themeMode, setThemeModeState] = useState(getThemeMode);
  const [sysDark, setSysDark] = useState(systemPrefersDark);
  const darkMode = themeMode === "dark" || (themeMode === "auto" && sysDark);
  applyTheme(users.find((u) => u.id === activeUserId) || visibleUsers[0] || DEFAULT_USERS[0], darkMode);
  function setThemeMode(m) {
    setThemeModeState(m);
    try { localStorage.setItem(THEME_KEY, m); } catch (e) {}
  }
  // Follow the phone's setting live while the mode is Auto
  useEffect(() => {
    let mq;
    try { mq = window.matchMedia("(prefers-color-scheme: dark)"); } catch (e) { return undefined; }
    if (!mq) return undefined;
    const on = (e) => setSysDark(!!e.matches);
    if (mq.addEventListener) mq.addEventListener("change", on); else if (mq.addListener) mq.addListener(on);
    return () => { if (mq.removeEventListener) mq.removeEventListener("change", on); else if (mq.removeListener) mq.removeListener(on); };
  }, []);
  // Tell the browser which scheme is active (date picker, selects, scrollbars, status bar)
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = darkMode ? "dark" : "light";
    root.style.colorScheme = darkMode ? "dark" : "light";
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", darkMode ? NEUTRALS.dark.PAPER : NEUTRALS.light.PAPER));
  }, [darkMode]);
  const chipColor = userColor(users.find((u) => u.id === form.user) || visibleUsers[0] || DEFAULT_USERS[0]);
  const userName = (id) => (users.find((u) => u.id === id) || {}).name || id;

  const loadUsers = useCallback(async () => {
    try {
      const res = await window.storage.get("meta:users", true);
      if (res && res.value) {
        const list = JSON.parse(res.value);
        if (Array.isArray(list) && list.length) { setUsers(list); saveCachedUsers(list); }
      }
      setUsersLoaded(true);
    } catch (e) { /* behåll nuvarande lista */ }
  }, []);
  useEffect(() => { loadUsers(); }, [loadUsers]);
  const isAdmin = (users.find((u) => u.id === form.user) || {}).admin === true;
  useEffect(() => {
    if (!isAdmin) return undefined;
    let dead = false;
    (async () => {
      const r = await safeGetResult("meta:backup");
      if (!dead && r.ok) setBackupInfo({ loaded: true, at: r.data && typeof r.data.at === "string" ? r.data.at : null });
    })();
    return () => { dead = true; };
  }, [isAdmin, liveTick]);
  // Schema check: write the version once if it is missing, and lock writes if the data is newer than this app.
  const [schemaTooNew, setSchemaTooNew] = useState(false);
  useEffect(() => {
    if (!usersLoaded) return undefined;
    let dead = false;
    (async () => {
      const r = await safeGetResult("meta:schema");
      if (dead || !r.ok) return;
      const v = r.data && typeof r.data.version === "number" ? r.data.version : null;
      if (v !== null && v > DATA_SCHEMA) { schemaLocked = true; setSchemaTooNew(true); return; }
      schemaLocked = false; setSchemaTooNew(false);
      if (v === null) await saveKey("meta:schema", (cur) => (cur && typeof cur.version === "number" ? NO_CHANGE : { version: DATA_SCHEMA, appVersion: APP_VERSION, at: new Date().toISOString() }), (x) => x, null, { ignoreLock: true });
    })();
    return () => { dead = true; };
  }, [usersLoaded, liveTick]);
  const backupOverdue = isAdmin && backupInfo.loaded && (!backupInfo.at || Date.now() - Date.parse(backupInfo.at) > BACKUP_DAYS * 86400000);

  useEffect(() => {
    if (!usersLoaded) return;
    const vis = users.filter((u) => !u.hidden && !localHidden.includes(u.id));
    if (!vis.length) {
      // säkerhetsnät: om allt ändå blivit dolt på den här enheten, visa alla ej arkiverade igen
      if (users.some((u) => !u.hidden) && localHidden.length) setLocalHiddenIds([]);
      return;
    }
    if (!vis.some((u) => u.id === form.user)) setForm((f) => ({ ...f, user: vis[0].id }));
    if (!vis.some((u) => u.id === statsUser)) setStatsUser(vis[0].id);
  }, [users, localHidden, usersLoaded]); // eslint-disable-line
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
    setUsers(r.value); saveCachedUsers(r.value);
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
      setLiveTick((t) => t + 1);
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

  // Week view: read the one or two months the week touches and keep the entries of that week.
  useEffect(() => {
    if (statsScope !== "week") return undefined;
    let dead = false;
    (async () => {
      setLoadingWeek(true);
      const days = Array.from({ length: 7 }, (_, i) => addDaysIso(statsWeek, i));
      const keys = [...new Set(days.map(monthKeyOf))];
      const results = await Promise.all(keys.map((k) => safeGet(`entries:${k}`)));
      if (dead) return;
      const merged = [];
      results.forEach((r) => { if (r) merged.push(...r); });
      setWeekEntries(merged.filter((e) => e.date >= days[0] && e.date <= days[6]));
      setLoadingWeek(false);
    })();
    return () => { dead = true; };
  }, [statsScope, statsWeek, liveTick]);

  // Previous period for the comparison (Vecka and Månad). cmp = what to load and how to describe it.
  const cmp = useMemo(() => {
    const today = todayISO();
    if (statsScope === "week") {
      const prevMonday = addDaysIso(statsWeek, -7);
      const running = statsWeek === mondayOf(today);
      const n = running ? Math.round((isoToDate(today) - isoToDate(statsWeek)) / MS_DAY) + 1 : 7;
      const wd = (i) => WEEKDAY_SHORT[i].toLowerCase();
      return { key: `w:${prevMonday}:${n}`, kind: "week", from: prevMonday, cut: addDaysIso(prevMonday, n - 1), months: [...new Set(Array.from({ length: 7 }, (_, i) => monthKeyOf(addDaysIso(prevMonday, i))))],
        label: running ? `Jämfört med ${n > 1 ? `${wd(0)}–${wd(n - 1)}` : wd(0)} förra veckan` : `Jämfört med vecka ${isoWeekNumber(prevMonday)}`,
        none: running ? "förra veckan" : `vecka ${isoWeekNumber(prevMonday)}` };
    }
    if (statsScope === "month") {
      const pm = addMonthKey(selectedMonth, -1);
      const running = selectedMonth === monthKeyOf(today);
      const d = parseInt(today.slice(8), 10);
      const name = MONTH_NAMES[parseInt(pm.slice(5), 10) - 1].toLowerCase();
      return { key: `m:${pm}:${running ? d : 31}`, kind: "month", months: [pm], maxDay: running ? d : 31,
        label: running ? `Jämfört med ${d > 1 ? `1–${d}` : "1"} ${name}` : `Jämfört med ${monthLabel(pm).toLowerCase()}`, none: monthLabel(pm).toLowerCase() };
    }
    return null;
  }, [statsScope, statsWeek, selectedMonth]);
  const [prevData, setPrevData] = useState({ key: "", data: [] });
  useEffect(() => {
    if (!cmp) return undefined;
    let dead = false;
    (async () => {
      const results = await Promise.all(cmp.months.map((k) => safeGet(`entries:${k}`)));
      if (dead) return;
      const merged = [];
      results.forEach((r) => { if (r) merged.push(...r); });
      setPrevData({ key: cmp.key, data: merged });
    })();
    return () => { dead = true; };
  }, [cmp, liveTick]);

  // Historik data: one month, or every month while a search is active. Reloads on live sync and after our own saves.
  const histSearching = histQuery.trim() !== "";
  useEffect(() => {
    if (view !== "hist" || histSearching) return undefined;
    let dead = false;
    (async () => {
      const r = await safeGetResult(`entries:${histMonth}`);
      if (dead || !r.ok) return;
      setHistMonthData({ key: histMonth, data: r.data || [] });
    })();
    return () => { dead = true; };
  }, [view, histMonth, histSearching, liveTick]);
  useEffect(() => {
    if (view !== "hist" || !histSearching) return undefined;
    let dead = false;
    (async () => {
      const months = allMonths.length ? allMonths : await safeListMonths();
      const results = await Promise.all(months.map((m) => safeGet(`entries:${m}`)));
      if (dead) return;
      const merged = [];
      results.forEach((r) => { if (r) merged.push(...r); });
      setHistAllData(merged);
    })();
    return () => { dead = true; };
  }, [view, histSearching, allMonths, liveTick]);
  // This and last month: the persistent-pain hint in Statistik and the "Senaste pass" list on Logga pass (independent of the chosen period)
  useEffect(() => {
    if (view !== "stats" && view !== "logga") return undefined;
    let dead = false;
    (async () => {
      const now = monthKeyOf(todayISO());
      const [a, b] = await Promise.all([safeGet(`entries:${addMonthKey(now, -1)}`), safeGet(`entries:${now}`)]);
      if (!dead) setRecentData({ key: now, data: [...(a || []), ...(b || [])] });
    })();
    return () => { dead = true; };
  }, [view, liveTick]);

  // ---- Vanligaste valen: counted once when the app opens (never while logging) ----
  const [usage, setUsage] = useState(null); // { userId: { sport: {code: n}, typ: {code: n}, pain: {part: n} } }
  useEffect(() => {
    let dead = false;
    (async () => {
      const since = isoDaysAgo(30);
      const results = await Promise.all(monthsBetween(since, todayISO()).map((m) => safeGetResult(`entries:${m}`)));
      const u = {};
      results.forEach((r) => (r.data || []).forEach((e) => {
        if (e.date < since) return;
        const slot = (u[e.user || "niva"] = u[e.user || "niva"] || { sport: {}, typ: {}, pain: {} });
        (e.pain || []).forEach((p) => { slot.pain[p.part] = (slot.pain[p.part] || 0) + 1; });
        if (!isRealPass(e)) return;
        (e.sport || []).forEach((c) => { slot.sport[c] = (slot.sport[c] || 0) + 1; });
        (e.typ || []).forEach((c) => { slot.typ[c] = (slot.typ[c] || 0) + 1; });
      }));
      if (!dead) setUsage(u);
    })();
    return () => { dead = true; };
  }, []);

  // Colours of activities and types: depends on the person shown and what they have done most
  setColorMaps(usage && usage[activeUserId], ACCENT, darkMode);

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
    setLiveTick((t) => t + 1);
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
    fmtTid(lastEntry.tid),
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

  const entryToForm = (entry) => ({
    date: entry.date,
    user: entry.user || "niva",
    sport: entry.sport || [],
    typ: entry.typ || [],
    tid: entry.tid || "",
    distance: entry.distance || "",
    kansla: entry.kansla || "",
    anteckningar: entry.anteckningar || "",
    sleep: entry.sleep || "",
    energy: entry.energy || "",
    pain: painToForm(entry.pain),
    kind: isOffDay(entry) ? entry.kind : "pass",
  });
  function startEdit(entry, opts) {
    setEditingPending(null);
    setEditingId(entry.id);
    setEditingOriginalMonth(monthKeyOf(entry.date));
    setForm(entryToForm(entry));
    if (!(opts && opts.noScroll) && typeof window !== "undefined" && window.scrollTo) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
  // ---- Edit panel in Historik ----
  const sheetSig = (f) => JSON.stringify({ ...f, pain: (f.pain || []).map(({ k, ...r }) => r) });
  function openEditSheet(entry) {
    sheetStash.current = { form, editingId, editingOriginalMonth, editingPending };
    const f = entryToForm(entry);
    sheetOpenRef.current = true;
    startEdit(entry, { noScroll: true });
    setSheetBase(sheetSig(f));
    setFormEpoch((n) => n + 1);
    setSaveError(null);
    setSheetOpen(true);
  }
  // Log a pass for a day with nothing registered (the + in the calendar), in the same panel.
  function openNewSheet(dateIso) {
    sheetStash.current = { form, editingId, editingOriginalMonth, editingPending };
    const f = { ...emptyForm, user: histUser, date: dateIso };
    sheetOpenRef.current = true;
    setEditingPending(null);
    setEditingId(null);
    setEditingOriginalMonth(null);
    setForm(f);
    setSheetBase(sheetSig(f));
    setFormEpoch((n) => n + 1);
    setSaveError(null);
    setSheetOpen(true);
  }
  // Put back what was in the log form before the panel opened.
  function closeSheet() {
    const st = sheetStash.current;
    sheetStash.current = null;
    sheetOpenRef.current = false;
    if (st) {
      skipHistSync.current = st.form.user;
      setForm(st.form); setEditingId(st.editingId); setEditingOriginalMonth(st.editingOriginalMonth); setEditingPending(st.editingPending);
    }
    setSheetOpen(false);
    setSaveError(null);
    setFormEpoch((n) => n + 1);
  }
  function requestCloseSheet() {
    if (saving) return;
    if (sheetSig(form) !== sheetBase) setConfirmDlg({ kind: "discard" });
    else closeSheet();
  }
  const requestCloseRef = React.useRef(requestCloseSheet);
  requestCloseRef.current = requestCloseSheet;
  useEffect(() => {
    if (!sheetOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") requestCloseRef.current(); };
    document.addEventListener("keydown", onKey);
    // iOS keeps the layout viewport full height when the keyboard opens, so follow the visual viewport instead.
    const vv = window.visualViewport;
    const onVv = () => {
      if (!vv) return;
      setSheetVv({ top: vv.offsetTop, height: vv.height, kb: window.innerHeight - vv.height > 120 });
    };
    // Keep the focused field visible above the keyboard.
    const onFocus = (e) => {
      const el = e.target;
      if (!el || !/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      setTimeout(() => { try { el.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (err) { /* ignore */ } }, 350);
    };
    onVv();
    if (vv) { vv.addEventListener("resize", onVv); vv.addEventListener("scroll", onVv); }
    document.addEventListener("focusin", onFocus);
    return () => {
      document.body.style.overflow = prev; document.removeEventListener("keydown", onKey);
      if (vv) { vv.removeEventListener("resize", onVv); vv.removeEventListener("scroll", onVv); }
      document.removeEventListener("focusin", onFocus);
      setSheetVv(null);
    };
  }, [sheetOpen]);

  // ---- Swipe between the tabs: Logga pass, Statistik, Historik ----
  const VIEW_ORDER = ["logga", "stats", "hist"];
  const swipeRef = useRef({});
  swipeRef.current.view = view;
  swipeRef.current.blocked = sheetOpen || showChangelog || showUsers || showMenu || !!confirmDlg;
  useEffect(() => {
    const NOSWIPE = "input, textarea, select, [role=slider], [data-noswipe], .recharts-wrapper, [role=dialog], [aria-modal=true]";
    const scrollsSideways = (el) => {
      for (let n = el; n && n !== document.body; n = n.parentElement) {
        const ox = getComputedStyle(n).overflowX;
        if ((ox === "auto" || ox === "scroll") && n.scrollWidth > n.clientWidth + 1) return true;
      }
      return false;
    };
    let g = null;
    const onStart = (e) => {
      g = null;
      if (e.touches.length !== 1 || swipeRef.current.blocked) return;
      const t = e.touches[0];
      if (t.clientX < 24 || t.clientX > window.innerWidth - 24) return; // the phone uses the edges for back/forward
      const el = e.target instanceof Element ? e.target : null;
      if (el && (el.closest(NOSWIPE) || scrollsSideways(el))) return;
      g = { x: t.clientX, y: t.clientY, t: Date.now(), dead: false };
    };
    const onMove = (e) => {
      if (!g || g.dead) return;
      const t = e.touches[0];
      if (Math.abs(t.clientY - g.y) > 40 && Math.abs(t.clientY - g.y) > Math.abs(t.clientX - g.x)) g.dead = true; // it is a scroll
    };
    const onEnd = (e) => {
      const s0 = g; g = null;
      if (!s0 || s0.dead || swipeRef.current.blocked) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - s0.x, dy = t.clientY - s0.y, dt = Date.now() - s0.t;
      if (dt > 700 || Math.abs(dx) < 60 || Math.abs(dx) < 1.5 * Math.abs(dy)) return;
      const i = VIEW_ORDER.indexOf(swipeRef.current.view);
      const j = dx < 0 ? i + 1 : i - 1;
      if (j < 0 || j >= VIEW_ORDER.length) return;
      setSwipeDir(dx < 0 ? "l" : "r");
      setView(VIEW_ORDER[j]);
    };
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart); document.removeEventListener("touchmove", onMove); document.removeEventListener("touchend", onEnd);
    };
  }, []);

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
      distance: a.entry.distance || "",
      kansla: a.entry.kansla || "",
      anteckningar: a.entry.anteckningar || "",
      sleep: a.entry.sleep || "",
      energy: a.entry.energy || "",
      pain: painToForm(a.entry.pain),
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
      return { id, date: form.date, user: form.user, kind, sport: [], typ: [], tid: "", kansla: "", anteckningar: form.anteckningar, ...wellbeingOf(form), cr10: true };
    }
    const { distance, sleep, energy, pain, ...base } = rest;
    const dist = cleanDistance(distance);
    return { id, ...base, ...(parseFloat(dist) > 0 ? { distance: dist } : {}), ...wellbeingOf(form), cr10: true };
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
  const formDirty = form.sport.length > 0 || form.typ.length > 0 || !!form.tid || !!form.distance || !!form.kansla || form.anteckningar.trim() !== "" || hasWellbeing(form);
  // "Rensa": empties what was filled in. Date, user and Pass/Vilodag/Sjukdag stay (handy when logging several days in a row).
  function clearForm() {
    setForm((f) => ({ ...emptyForm, user: f.user, date: f.date, kind: f.kind }));
    setSaveError(null);
    setFormEpoch((n) => n + 1); // "Fler" groups fold back together
  }
  useEffect(() => { setSaveError(null); }, [form.date, form.kind, form.user]);

  async function handleSave() {
    if (!form.date || (!isOff && form.sport.length === 0) || !form.pain.every(painRowOk) || saving) return;
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
    if (sheetOpenRef.current) {
      closeSheet();
    } else {
      setEditingId(null);
      setEditingOriginalMonth(null);
      setEditingPending(null);
      setForm((f) => ({ ...emptyForm, user: f.user }));
      setFormEpoch((n) => n + 1);
    }
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
    if (d.kind === "discard") { setConfirmDlg(null); closeSheet(); return; }
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
      setLiveTick((t) => t + 1);
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

      const header = ["Datum", "Anvandare", "Sport", "Traningstyp", "Tid (min)", "Anstrangning (1-10)", "Anteckningar", "Typ", "Distans (km)", "Somn (1-5)", "Energi (1-5)", "Smarta"];
      const rows = merged.map((e) => [
        e.date,
        userName(e.user || "niva"),
        (e.sport || []).join(" "),
        (e.typ || []).join(" "),
        tidToCsv(e.tid),
        e.kansla || "",
        e.anteckningar || "",
        kindLabel(e.kind),
        distNum(e) ? String(distNum(e)).replace(".", ",") : "",
        e.sleep || "",
        e.energy || "",
        painToCsv(e.pain),
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

  // ---- Backup / restore (administrator only) ----
  async function handleBackup() {
    if (backingUp) return;
    setBackingUp(true);
    setImportMsg(null);
    try {
      const months = allMonths.length ? allMonths : await safeListMonths();
      const results = await Promise.all(months.map((m) => safeGetResult(`entries:${m}`)));
      const ur = await safeGetResult("meta:users");
      if (!ur.ok || results.some((r) => !r.ok)) {
        // never hand out a backup that silently misses something
        setImportMsg({ ok: false, text: "Säkerhetskopian avbröts: kunde inte hämta allt. Försök igen." });
        setBackingUp(false);
        return;
      }
      const map = {};
      let n = 0;
      months.forEach((m, i) => { const d = results[i].data; if (d && d.length) { map[m] = d; n += d.length; } });
      const usersList = Array.isArray(ur.data) && ur.data.length ? ur.data : users;
      const file = buildBackup(usersList, map);
      const blob = new Blob([JSON.stringify(file, null, 1)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `traningsdagbok-backup-${todayISO()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      const at = new Date().toISOString();
      const r = await saveKey("meta:backup", () => ({ at, by: form.user, pass: n }), (v) => v, null);
      if (r.status === "ok") setBackupInfo({ loaded: true, at });
      setImportMsg({ ok: true, text: `Säkerhetskopia sparad: ${n} pass och ${usersList.length} personer. Filen innehåller hälsodata, förvara den privat.` });
    } catch (e) {
      console.error("backup failed", e);
      setImportMsg({ ok: false, text: "Säkerhetskopian misslyckades. Försök igen." });
    }
    setBackingUp(false);
  }

  async function handleRestoreFile(file) {
    setImportMsg(null);
    let parsed;
    try { parsed = readBackup(JSON.parse(await file.text())); } catch (e) { parsed = { error: "Det här är ingen säkerhetskopia från Träningsdagboken." }; }
    if (parsed.error) { setImportMsg({ ok: false, text: parsed.error }); return; }
    // what is already there: by id or by identical content
    const known = {};
    const monthKeys = Object.keys(parsed.months);
    const have = await Promise.all(monthKeys.map((m) => safeGetResult(`entries:${m}`)));
    const ur = await safeGetResult("meta:users");
    if (!ur.ok || have.some((r) => !r.ok)) { setImportMsg({ ok: false, text: "Kunde inte läsa databasen just nu. Försök igen." }); return; }
    let total = 0, toAdd = 0;
    monthKeys.forEach((m, i) => {
      const ex = have[i].data || [];
      const ids = new Set(ex.map((e) => e.id)), sigs = new Set(ex.map(entrySig));
      parsed.months[m].forEach((e) => { total++; if (!ids.has(e.id) && !sigs.has(entrySig(e))) toAdd++; });
      known[m] = true;
    });
    const curUsers = Array.isArray(ur.data) && ur.data.length ? ur.data : users;
    const newUsers = parsed.users.filter((u) => !curUsers.some((c) => c.id === u.id || c.name.toLowerCase() === u.name.toLowerCase()));
    setRestoreError(null);
    setRestorePlan({ data: parsed, counts: { total, toAdd, exist: total - toAdd, newUsers: newUsers.length, users: parsed.users.length, skipped: parsed.skipped } });
  }

  async function doRestore() {
    if (!restorePlan || restoreBusy) return;
    setRestoreBusy(true);
    setRestoreError(null);
    const { data } = restorePlan;
    let failed = 0, added = 0;
    const ur = await updateUsers((list) => {
      const missing = data.users.filter((u) => !list.some((c) => c.id === u.id || c.name.toLowerCase() === u.name.toLowerCase()));
      return missing.length ? [...list, ...missing] : list;
    });
    if (!ur.ok) failed++;
    for (const mk of Object.keys(data.months)) {
      const r = await saveMonth(mk, (existing) => {
        const ids = new Set(existing.map((e) => e.id)), sigs = new Set(existing.map(entrySig));
        const add = data.months[mk].filter((e) => !ids.has(e.id) && !sigs.has(entrySig(e)));
        added += add.length;
        return add.length ? [...existing, ...add].sort(byDate) : NO_CHANGE;
      });
      if (r.status !== "ok") failed++;
    }
    syncProtection();
    await refreshMonthList();
    await loadMonth(selectedMonthRef.current);
    setAllEntries(null);
    setLiveTick((t) => t + 1);
    loadUsers();
    setRestoreBusy(false);
    if (failed) {
      setRestoreError(`${failed} delar kunde inte sparas. Det som redan sparats finns kvar, försök igen så läggs resten till.`);
      return;
    }
    setRestorePlan(null);
    setImportMsg({ ok: true, text: added === 0 ? "Återställning klar: inget saknades." : `Återställning klar: ${added} pass lades till.` });
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
        distance: header.indexOf("distans (km)"), // optional, last column since 1.6.4
        sleep: header.indexOf("somn (1-5)"), // optional, since 1.7.0
        energy: header.indexOf("energi (1-5)"),
        pain: header.indexOf("smarta"),
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
          tid: idx.tid > -1 ? tidFromCsv(r[idx.tid]) : "",
          kansla: idx.kansla > -1 ? scaleImported(r[idx.kansla]) : "",
          ...(idx.distance > -1 && parseFloat(cleanDistance(r[idx.distance])) > 0 && !kind ? { distance: cleanDistance(r[idx.distance]) } : {}),
          cr10: true,
          anteckningar: idx.anteckningar > -1 ? (r[idx.anteckningar] || "") : "",
        };
        if (idx.sleep > -1 && /^[1-5]$/.test((r[idx.sleep] || "").trim())) entry.sleep = r[idx.sleep].trim();
        if (idx.energy > -1 && /^[1-5]$/.test((r[idx.energy] || "").trim())) entry.energy = r[idx.energy].trim();
        if (idx.pain > -1) { const pl = painFromCsv(r[idx.pain]); if (pl.length) entry.pain = pl; }
        const mk = monthKeyOf(date);
        if (!byMonth[mk]) byMonth[mk] = [];
        byMonth[mk].push(entry);
        count++;
      }

      let failedMonths = 0;
      const monthKeys = Object.keys(byMonth);
      for (const mk of monthKeys) {
        const sig = (e) => [e.date, e.user, (e.sport||[]).join(","), (e.typ||[]).join(","), e.tid, e.distance || "", e.kansla, e.anteckningar, e.kind || "", e.sleep || "", e.energy || "", JSON.stringify(e.pain || [])].join("|");
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
    const base = statsScope === "all" ? (allEntries || []) : statsScope === "week" ? weekEntries : monthEntries;
    return base.filter((e) => (e.user || "niva") === statsUserShown);
  }, [statsScope, allEntries, monthEntries, weekEntries, statsUserShown]);
  // Rest/sick days never count as passes: everything below uses real passes only.
  const dataForStats = useMemo(() => statsBase.filter(isRealPass), [statsBase]);
  const painLoadMap = useMemo(() => {
    const m = {};
    dataForStats.forEach((e) => { m[e.date] = (m[e.date] || 0) + (parseFloat(e.tid) || 0) * (parseFloat(e.kansla) || 0); });
    return m;
  }, [dataForStats]);
  const painHints = useMemo(
    () => persistentPain(recentData.data.filter((e) => (e.user || "niva") === statsUserShown && !queuedIds.has(e.id)), todayISO()),
    [recentData, statsUserShown, queuedIds]);
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
    if (statsScope === "week") {
      // all seven days (Mon-Sun), also days without passes
      return Array.from({ length: 7 }, (_, i) => ({ date: WEEKDAY_SHORT[i], load: Math.round(map[addDaysIso(statsWeek, i)] || 0) }));
    }
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, load]) => ({ date: date.slice(5), load: Math.round(load) }));
  }, [dataForStats, statsScope, statsWeek]);

  const sportDist = useMemo(() => {
    const counts = { F: 0, S: 0, A: 0 };
    dataForStats.forEach((e) => (e.sport || []).forEach((s) => { counts[s] = (counts[s] || 0) + 1; }));
    return SPORTS.map((s) => ({ code: s.code, name: s.label, value: counts[s.code] || 0 }));
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
    const totalKm = dataForStats.reduce((s, e) => s + distNum(e), 0);
    return { totalPass, totalTidMin, avgKansla, totalLoad, totalKm };
  }, [dataForStats]);
  // Previous period: the whole period (for the chart ticks) and the comparable slice (for the tiles).
  const prevCmp = useMemo(() => {
    if (!cmp || prevData.key !== cmp.key) return null;
    const all = prevData.data.filter((e) => (e.user || "niva") === statsUserShown && isRealPass(e));
    const inPeriod = cmp.kind === "week"
      ? all.filter((e) => e.date >= cmp.from && e.date <= addDaysIso(cmp.from, 6))
      : all;
    const slice = cmp.kind === "week"
      ? inPeriod.filter((e) => e.date <= cmp.cut)
      : inPeriod.filter((e) => parseInt(e.date.slice(8), 10) <= cmp.maxDay);
    const sum = summarizeEntries(slice);
    return {
      whole: inPeriod, sum, empty: slice.length === 0,
      d: {
        pass: pctDelta(summary.totalPass, sum.totalPass), tid: pctDelta(summary.totalTidMin, sum.totalTidMin),
        load: pctDelta(summary.totalLoad, sum.totalLoad), km: pctDelta(summary.totalKm, sum.totalKm),
        kansla: pointDelta(summary.avgKansla, sum.avgKansla),
      },
    };
  }, [cmp, prevData, statsUserShown, summary]);

  // Week chart: add last week's load per weekday (drawn as thin ticks over the bars).
  const loadChart = useMemo(() => {
    if (statsScope !== "week" || !prevCmp || !cmp || cmp.kind !== "week") return { data: loadByDate, ghost: false };
    const pm = {};
    prevCmp.whole.forEach((e) => { pm[e.date] = (pm[e.date] || 0) + (parseFloat(e.tid) || 0) * (parseFloat(e.kansla) || 0); });
    let ghost = false;
    const data = loadByDate.map((row, i) => {
      const pv = Math.round(pm[addDaysIso(cmp.from, i)] || 0);
      if (pv > 0) ghost = true;
      return pv > 0 ? { ...row, prev: pv } : row;
    });
    return { data, ghost };
  }, [statsScope, prevCmp, cmp, loadByDate]);

  // ---- Historik: what is shown ----
  const histScope = useMemo(() => (histSearching ? (histAllData || []) : (histMonthData.key === histMonth ? histMonthData.data : [])),
                            [histSearching, histAllData, histMonthData, histMonth]);
  const histLoaded = histSearching ? histAllData !== null : histMonthData.key === histMonth;
  const histUserEntries = useMemo(() => histScope.filter((e) => (e.user || "niva") === histUser && !queuedIds.has(e.id)), [histScope, histUser, queuedIds]);
  const histOptions = useMemo(() => {
    const cnt = (get) => { const m = {}; histUserEntries.forEach((e) => get(e).forEach((c) => { m[c] = (m[c] || 0) + 1; })); return m; };
    const sp = cnt((e) => (isRealPass(e) ? e.sport || [] : [])), ty = cnt((e) => (isRealPass(e) ? e.typ || [] : []));
    const pm = {};
    histUserEntries.forEach((e) => (e.pain || []).forEach((q) => { const k = histPartKey(q); pm[k] = pm[k] || { label: histPartName(q), n: 0 }; pm[k].n++; }));
    return {
      sport: SPORTS.filter((x) => sp[x.code]).map((x) => ({ value: x.code, label: `${x.label} (${sp[x.code]})`, short: x.label })),
      typ: TYPES.filter((x) => ty[x.code]).map((x) => ({ value: x.code, label: `${x.label} (${ty[x.code]})`, short: x.label })),
      part: Object.entries(pm).sort((a, b) => b[1].n - a[1].n || a[1].label.localeCompare(b[1].label, "sv")).map(([k, v]) => ({ value: k, label: `${v.label} (${v.n})`, short: v.label })),
    };
  }, [histUserEntries]);
  const histShown = useMemo(() => filterHistory(histUserEntries, { query: histQuery, painOnly: histFilters.pain, sport: histFilters.sport, typ: histFilters.typ, part: histFilters.part, hideOff: hideOffDays }),
                            [histUserEntries, histQuery, histFilters, hideOffDays]);
  const histGroups = useMemo(() => weekGroups(histShown), [histShown]);
  const histOffCount = histUserEntries.filter(isOffDay).length;
  // Calendar: all entries of the month by day (filters only dim, they never hide a registered day)
  const histByDay = useMemo(() => {
    const m = {};
    histUserEntries.forEach((e) => { (m[e.date] = m[e.date] || []).push(e); });
    return m;
  }, [histUserEntries]);
  const histShownIds = useMemo(() => new Set(histShown.map((e) => e.id)), [histShown]);
  const histCalOn = histMode === "cal" && !histSearching;
  const histSelDay = useMemo(() => {
    if (histDay && histDay.slice(0, 7) === histMonth && histByDay[histDay]) return histDay;
    const days = Object.keys(histByDay).filter((d) => d.slice(0, 7) === histMonth).sort();
    return days.length ? days[days.length - 1] : null;
  }, [histDay, histMonth, histByDay]);
  const histFiltering = histFilters.pain || !!histFilters.sport || !!histFilters.typ || !!histFilters.part;
  const toggleWeek = (monday) => setHistCollapsed((prev) => { const n = new Set(prev); if (n.has(monday)) n.delete(monday); else n.add(monday); return n; });

  // Logga pass shows only the 5 latest real passes (no rest/sick days), across the month boundary. Everything else is in Historik.
  const RECENT_LIMIT = 5;
  const recentPasses = useMemo(
    () => recentData.data
      .filter((e) => (e.user || "niva") === form.user && !queuedIds.has(e.id) && isRealPass(e))
      .sort((a, b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id)))
      .slice(0, RECENT_LIMIT),
    [recentData, form.user, queuedIds]
  );
  useEffect(() => { const t = setInterval(() => setClockTick((n) => n + 1), 300000); return () => clearInterval(t); }, []);
  const remindOn = (users.find((u) => u.id === form.user) || {}).remindYesterday === true;
  const yIso = addDaysIso(todayISO(), -1);
  const yLogged = recentData.data.some((e) => (e.user || "niva") === form.user && e.date === yIso)
    || pending.some((a) => (a.entry.user || "niva") === form.user && a.entry.date === yIso);
  const showYesterday = remindOn && usersLoaded && recentData.key !== null && new Date().getHours() >= REMIND_FROM_HOUR && !yLogged
    && skipYesterday[form.user] !== yIso && !editingId && !editingPending && clockTick >= 0;
  const yName = WEEKDAY_LONG[(isoToDate(yIso).getUTCDay() + 6) % 7];
  const dismissYesterday = () => setSkipYesterday((prev) => { const n = { ...prev, [form.user]: yIso }; saveSkipYesterday(n); return n; });
  const openHistoryFromLog = () => { setHistMonth(monthKeyOf(todayISO())); setSwipeDir(""); setView("hist"); };

  const painTrendCard = (
    <PainTrendCard entries={statsBase} loadMap={painLoadMap} scope={statsScope} week={statsWeek} month={selectedMonth}
                   hints={painHints} part={statsPart} onPart={setStatsPart} />
  );
  const offDayCard = (
    <Card>
      <div className="text-xs font-bold mb-1" style={{ color: ACCENT_DARK }}>REGISTRERADE VILO-/SJUKDAGAR</div>
      <div className="text-sm" data-testid="offday-stats" style={{ color: INK }}>
        Vilodagar <span className="font-bold">{offDayCounts.rest}</span> · Sjukdagar <span className="font-bold">{offDayCounts.sick}</span>
      </div>
    </Card>
  );


  const painOk = form.pain.every(painRowOk);
  const canSave = form.date && (isOff || form.sport.length > 0) && painOk && !saving;

  // The log form is rendered in two places: on the Logga pass tab and in the edit panel of Historik (never both at once).
  function renderFormFields() {
    return (
      <>
              {/* What is logged (Pass / Vilodag / Sjukdag) comes before the date, so the date is not forgotten when logging several days */}
              <div role="group" aria-label="Typ" data-testid="kind-group" className="flex w-full rounded-lg border overflow-hidden mb-4"
                   style={{ borderColor: LINE2 }}>
                {["pass", "rest", "sick"].map((k, i) => {
                  const on = form.kind === k;
                  return (
                    <button key={k} type="button" data-testid={`kind-${k}`} aria-pressed={on}
                            onClick={() => setForm((f) => ({ ...f, kind: k }))}
                            className="flex-1 py-2 text-sm font-semibold"
                            style={{ backgroundColor: on ? ACCENT : CARD, color: on ? ON_ACCENT : CTRL, borderLeft: i ? `1px solid ${LINE2}` : "none" }}>
                      {kindLabel(k)}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 mb-4">
                <CalendarDays size={18} style={{ color: ACCENT }} />
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="border rounded-lg px-3 py-2 text-sm"
                  style={{ borderColor: LINE2 }}
                />
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
                <div className="text-xs font-bold mb-2" style={{ color: LABEL }}>
                  TRÄNINGSTYP
                </div>
                <ChoiceGroup key={`typ-${formEpoch}`} testId="typ-group" items={TYPES} defaults={DEFAULT_TYPES} color={NEUTRAL_FILL}
                             counts={(usage && usage[form.user] && usage[form.user].typ) || NO_COUNTS}
                             selected={form.typ} onToggle={toggleTyp} />
              </div>

              <div className="mb-4 flex gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold mb-2" style={{ color: LABEL }}>
                    TID (MIN : SEK)
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="text" inputMode="numeric" placeholder="min" data-testid="tid-min" aria-label="Minuter"
                      value={splitTid(form.tid).m}
                      onChange={(e) => setForm((f) => ({ ...f, tid: joinTid(e.target.value.replace(/\D/g, "").slice(0, 4), splitTid(f.tid).s) }))}
                      className="border rounded-lg px-3 py-2 text-sm w-full min-w-0"
                      style={{ borderColor: LINE2 }}
                    />
                    <span className="text-sm" style={{ color: MUTED }}>:</span>
                    <input
                      type="text" inputMode="numeric" placeholder="sek" data-testid="tid-sec" aria-label="Sekunder (valfritt)"
                      value={splitTid(form.tid).s}
                      onChange={(e) => setForm((f) => ({ ...f, tid: joinTid(splitTid(f.tid).m, e.target.value.replace(/\D/g, "").slice(0, 2)) }))}
                      className="border rounded-lg px-3 py-2 text-sm w-full min-w-0"
                      style={{ borderColor: LINE2 }}
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold mb-2" style={{ color: LABEL }}>
                    DISTANS (KM)
                  </div>
                  <input
                    type="text" inputMode="decimal" placeholder="t.ex. 5,2" data-testid="distance-input" aria-label="Distans i kilometer"
                    value={String(form.distance || "").replace(".", ",")}
                    onChange={(e) => setForm((f) => ({ ...f, distance: cleanDistance(e.target.value) }))}
                    className="border rounded-lg px-3 py-2 text-sm w-full"
                    style={{ borderColor: LINE2 }}
                  />
                </div>
              </div>
              <div className="mb-4">
                <div className="text-xs font-bold mb-2" style={{ color: LABEL }}>
                  ANSTRÄNGNING (1–10) <span className="font-normal ml-1" style={{ color: FAINT }}>Skala enligt Borg CR10</span>
                </div>
                <RangeSlider value={form.kansla} onChange={(v) => setForm((f) => ({ ...f, kansla: v }))} min={1} max={10} testId="effort" label="Ansträngning 1 till 10" />
                <p className="text-xs" style={{ color: HINT }}>
                  1 = Mycket lätt · 3 = Måttligt · 5 = Tungt · 7 = Mycket tungt · 10 = Maximalt
                </p>
              </div>
              </>)}
              <WellbeingSection key={`well-${formEpoch}-${editingId || (editingPending && editingPending.qid) || ""}`}
                                form={form} setForm={setForm} isOff={isOff}
                                counts={(usage && usage[form.user] && usage[form.user].pain) || NO_COUNTS} />
              <div className="mb-4">
                <div className="text-xs font-bold mb-2" style={{ color: LABEL }}>
                  SAMMANFATTNING
                </div>
                <textarea
                  value={form.anteckningar}
                  onChange={(e) => setForm((f) => ({ ...f, anteckningar: e.target.value }))}
                  placeholder={isOff ? (form.kind === "sick" ? "Hur mår du? Något som är bra att komma ihåg?" : "Hur kändes kroppen? Varför vila?") : "Vad gjorde ni? Hur kändes det?"}
                  rows={3}
                  className="border rounded-lg px-3 py-2 text-sm w-full resize-none"
                  style={{ borderColor: LINE2 }}
                />
              </div>

      </>
    );
  }
  function renderFormActions(inSheet) {
    return (
      <>
              <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={!canSave}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold text-on-accent transition-opacity flex items-center justify-center gap-2"
                style={{ backgroundColor: ACCENT, opacity: canSave ? 1 : 0.45 }}
              >
                {saving ? (<><Loader2 size={16} className="animate-spin" /> Sparar…</>)
                  : savedFlash === "queued" ? (<><AlertTriangle size={16} /> Ej sparat, försöker igen</>)
                  : savedFlash ? (<><Check size={16} /> Sparat</>)
                  : (editingId || editingPending) ? "Spara ändringar"
                  : form.kind === "rest" ? "Spara vilodag" : form.kind === "sick" ? "Spara sjukdag" : "Spara pass"}
              </button>
              {/* Small outline button, no fill. Editing: it cancels the edit. Otherwise: empties what was filled in (date, user and kind stay). */}
              <button type="button" data-testid="clear-form"
                      onClick={inSheet ? requestCloseSheet : (editingId || editingPending) ? cancelEdit : clearForm}
                      disabled={!(editingId || editingPending) && !formDirty}
                      className="px-4 py-2.5 rounded-lg text-sm font-semibold border bg-transparent transition-opacity"
                      style={{ borderColor: ACCENT, color: ACCENT_DARK, opacity: (editingId || editingPending || formDirty) ? 1 : 0.45 }}>
                {(editingId || editingPending) ? "Avbryt" : "Rensa"}
              </button>
              </div>
              {!painOk && (
                <p className="text-xs mt-2" data-testid="pain-hint" style={{ color: ERR }}>Fyll i smärta (0–10) för alla kroppsdelar, eller ta bort dem.</p>
              )}
              {saveError && (
                <p className="text-sm mt-2" role="alert" data-testid="save-error" style={{ color: ERR }}>{saveError}</p>
              )}
              {!isOff && form.sport.length === 0 && (
                <p className="text-xs mt-2" style={{ color: MUTED }}>
                  Välj minst en aktivitet för att spara.
                </p>
              )}
      </>
    );
  }

  // One row of a list (used by "Loggade pass" and by Historik; mode "hist" shows pain chips and opens the edit panel).
  function renderHistCalendar() {
    const today = todayISO();
    const first = `${histMonth}-01`;
    const start = mondayOf(first);
    // last day of the month
    let lastDay = first; while (addDaysIso(lastDay, 1).slice(0, 7) === histMonth) lastDay = addDaysIso(lastDay, 1);
    const weeks = [];
    for (let mon = start; mon <= lastDay; mon = addDaysIso(mon, 7)) weeks.push(mon);
    const filtering = histFiltering;
    const selEntries = histSelDay ? [...(histByDay[histSelDay] || [])].sort((a, b) => (a.id < b.id ? -1 : 1)) : [];
    return (
      <div data-testid="hist-calendar">
        <div className="grid text-center text-xs font-bold mb-1" style={{ gridTemplateColumns: "1.5rem repeat(7, 1fr)", color: MUTED }}>
          <div />
          {["M", "T", "O", "T", "F", "L", "S"].map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div className="space-y-1">
          {weeks.map((mon) => (
            <div key={mon} className="grid items-stretch gap-1" style={{ gridTemplateColumns: "1.5rem repeat(7, 1fr)" }}>
              <div className="text-xs flex items-center justify-center" style={{ color: FAINT }} data-testid="cal-week-no">{isoWeekNumber(mon)}</div>
              {[0, 1, 2, 3, 4, 5, 6].map((i) => {
                const d = addDaysIso(mon, i);
                if (d.slice(0, 7) !== histMonth) return <div key={d} />;
                const list = histByDay[d] || [];
                const future = d > today, isToday = d === today, sel = d === histSelDay && list.length > 0;
                const passes = list.filter((e) => !isOffDay(e));
                const off = list.find(isOffDay);
                const pain = list.some((e) => (e.pain || []).length > 0);
                const dim = filtering && list.length > 0 && !list.some((e) => histShownIds.has(e.id));
                const plus = list.length === 0 && !future && !filtering;
                const dots = [];
                passes.forEach((e) => { const code = (e.sport || [])[0]; dots.push(code ? sportColor(code) : MUTED); });
                const click = () => { if (list.length) setHistDay(d); else if (plus) openNewSheet(d); };
                return (
                  <button key={d} type="button" data-testid={`cal-day-${d}`} data-state={list.length ? "filled" : plus ? "empty" : "none"} data-selected={sel ? "1" : "0"}
                          disabled={!list.length && !plus} onClick={click}
                          aria-label={`${dayTitle(d)}${list.length ? `, ${list.length} loggat` : plus ? ", inget loggat, lägg till" : ""}`}
                          className="relative rounded-lg border flex flex-col items-center justify-between py-1"
                          style={{ minHeight: 48, borderColor: isToday ? ACCENT : sel ? ACCENT : LINE, borderWidth: isToday || sel ? 2 : 1,
                                   backgroundColor: sel ? SUBTLE : CARD, opacity: dim ? 0.35 : future ? 0.5 : 1, color: INK }}>
                    <span className="text-xs font-semibold" style={{ color: future ? FAINT : INK }}>{parseInt(d.slice(8), 10)}</span>
                    {pain && <span data-testid="cal-pain" className="absolute rounded-full" style={{ top: 4, right: 4, width: 6, height: 6, backgroundColor: DANGER }} />}
                    {list.length > 0 ? (
                      <span className="flex items-center gap-0.5" style={{ minHeight: 12 }}>
                        {dots.slice(0, 3).map((c, k) => <span key={k} data-testid="cal-dot" className="inline-block rounded-full" style={{ width: 7, height: 7, backgroundColor: c }} />)}
                        {dots.length > 3 && <Plus size={8} style={{ color: MUTED }} />}
                        {off && (off.kind === "sick" ? <Thermometer size={12} data-testid="cal-off" style={{ color: MUTED }} /> : <Moon size={12} data-testid="cal-off" style={{ color: MUTED }} />)}
                      </span>
                    ) : plus ? (
                      <Plus size={16} data-testid="cal-plus" style={{ color: MUTED }} />
                    ) : <span style={{ minHeight: 12 }} />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <p className="text-xs mt-2" style={{ color: MUTED }}>Tryck på ett plus för att logga en dag du missat.</p>

        {histSelDay && (
          <div className="mt-4" data-testid="cal-preview">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold" style={{ color: MUTED }} data-testid="cal-preview-title">{dayTitle(histSelDay).toUpperCase()}</div>
              {histSelDay <= today && (
                <button type="button" data-testid="cal-preview-add" aria-label="Logga mer den här dagen" title="Logga mer den här dagen"
                        onClick={() => openNewSheet(histSelDay)} className="p-2 rounded hover-soft">
                  <Plus size={18} style={{ color: ACCENT }} />
                </button>
              )}
            </div>
            <div className="space-y-2">{selEntries.map((e) => renderEntryRow(e, "hist"))}</div>
          </div>
        )}
        {!histSelDay && histUserEntries.length === 0 && (
          <p className="text-sm mt-3" style={{ color: MUTED }} data-testid="cal-none">Inga pass loggade den här månaden ännu.</p>
        )}
      </div>
    );
  }

  function renderEntryRow(e, mode) {
                    const isExpanded = expandedIds.has(e.id);
                    const hasNote = e.anteckningar && e.anteckningar.trim().length > 0;
                    const preview = hasNote && e.anteckningar.length > 42
                      ? e.anteckningar.slice(0, 42) + "…"
                      : e.anteckningar;
                    const off = isOffDay(e);
                    const pains = e.pain || [];
                    // "Häl V 6" when it fits on the row, otherwise just a dot
                    const shownFacts = [`${e.date.slice(8)}/${e.date.slice(5, 7)}`, off ? kindLabel(e.kind) : (e.sport || []).join(" "), ...(off ? [] : [(e.typ || []).join(" "), fmtTid(e.tid), distNum(e) ? `${fmtKm(distNum(e))} km` : "", e.kansla ? `${e.kansla}/10` : ""])].filter(Boolean);
                    const factsLen = shownFacts.join(" · ").length;
                    const painInline = pains.length === 1 && factsLen + 3 + painShort(pains[0]).length <= 36;
                    return (
                      <div key={e.id} data-testid={off ? "offday-row" : "pass-row"} className="rounded-lg border text-sm overflow-hidden"
                           style={{ borderColor: LINE, backgroundColor: off ? OFFROW : CARD }}>
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
                                    {fmtTid(e.tid) && <span data-testid="tid-text" style={{ color: MUTED }}> · {fmtTid(e.tid)}</span>}
                                    {distNum(e) > 0 && <span data-testid="distance" style={{ color: MUTED }}> · {fmtKm(distNum(e))} km</span>}
                                    {e.kansla && <span data-testid="effort" style={{ color: MUTED }}> · {e.kansla}/10</span>}
                                  </>
                                )}
                                {mode !== "hist" && pains.length > 0 && (painInline
                                  ? <span data-testid="pain-badge" style={{ color: DANGER }}> · {painShort(pains[0])}</span>
                                  : <span data-testid="pain-dot" title="Smärta" aria-label="Smärta" className="inline-block rounded-full align-middle ml-1.5"
                                          style={{ width: 8, height: 8, backgroundColor: DANGER }} />)}
                              </span>
                              {hasNote && !isExpanded && (
                                <span className="truncate min-w-0 flex-1" style={{ color: FAINT }}>· {preview}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0 ml-2">
                            <button
                              onClick={(ev) => { ev.stopPropagation(); if (mode === "hist") openEditSheet(e); else startEdit(e); }}
                              className="p-1 rounded hover-soft"
                              title="Redigera"
                            >
                              <Pencil size={14} style={{ color: MUTED }} />
                            </button>
                            <button
                              onClick={(ev) => { ev.stopPropagation(); askDelete(e); }}
                              className="p-1 rounded hover-soft"
                              title="Ta bort"
                            >
                              <Trash2 size={15} style={{ color: DANGER }} />
                            </button>
                          </div>
                        </div>
                        {mode === "hist" && pains.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pb-2" style={{ paddingLeft: "2rem", paddingRight: "0.75rem" }} data-testid="pain-chips">
                            {pains.map((p, i) => {
                              const hit = histFilters.part && histPartKey(p) === histFilters.part;
                              return (
                                <span key={i} data-testid="pain-chip" data-hit={hit ? "1" : "0"} className="px-2 py-0.5 rounded-full text-xs font-semibold border"
                                      style={{ borderColor: DANGER, color: hit ? ON_ACCENT : DANGER, backgroundColor: hit ? DANGER : "transparent" }}>
                                  {painShort(p)}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        {isExpanded && (
                          <div className="px-3 pb-3 pt-0.5" style={{ paddingLeft: "2rem" }}>
                            {!off && paceOf(e) && (
                              <p className="text-sm mb-1" data-testid="pace" style={{ color: INK }}>
                                <span style={{ color: MUTED }}>Tempo </span>{paceOf(e)}
                              </p>
                            )}
                            {(e.sleep || e.energy) && (
                              <p className="text-sm mb-1" data-testid="well-line" style={{ color: INK }}>
                                {e.sleep && <><span style={{ color: MUTED }}>Sömn </span>{e.sleep} – {SLEEP_LABELS[Number(e.sleep) - 1]}</>}
                                {e.sleep && e.energy && <span style={{ color: MUTED }}> · </span>}
                                {e.energy && <><span style={{ color: MUTED }}>Energi </span>{e.energy} – {ENERGY_LABELS[Number(e.energy) - 1]}</>}
                              </p>
                            )}
                            {pains.length > 0 && (
                              <div className="mb-1" data-testid="pain-lines">
                                <div className="text-xs font-bold" style={{ color: MUTED }}>{off ? "SMÄRTA IDAG" : "SMÄRTA UNDER PASSET"}</div>
                                {pains.map((p, i) => <p key={i} className="text-sm" data-testid="pain-line" style={{ color: INK }}>{painLong(p)}</p>)}
                              </div>
                            )}
                            {hasNote ? (
                              <div data-testid="note-block" className={(e.sleep || e.energy || pains.length) ? "mt-2 pt-2 border-t" : ""} style={{ borderColor: LINE }}>
                                {!!(e.sleep || e.energy || pains.length) && <div className="text-xs font-bold" style={{ color: MUTED }}>SAMMANFATTNING</div>}
                                <p className="text-sm whitespace-pre-wrap" style={{ color: INK }}>
                                  {e.anteckningar}
                                </p>
                              </div>
                            ) : (
                              <p className="text-xs italic" style={{ color: FAINT }}>
                                Ingen sammanfattning för {off ? (e.kind === "sick" ? "den här sjukdagen" : "den här vilodagen") : "det här passet"}.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
  }

  return (
    <div className="w-full" style={{ backgroundColor: PAPER, color: INK }}>
      <div className="max-w-3xl mx-auto px-4 pt-4 pb-2" style={{ paddingTop: "max(2.5rem, calc(env(safe-area-inset-top) + 1.5rem))", paddingLeft: "max(1rem, env(safe-area-inset-left))", paddingRight: "max(1rem, env(safe-area-inset-right))" }}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h1 className="text-3xl font-bold tracking-tight min-w-0" style={{ color: INK }}>
            Träningsdagbok
          </h1>
          {/* Person menu: who is using the app, plus the rarely used actions */}
          <div className="relative mt-1 shrink-0">
            <button type="button" data-testid="person-chip" aria-haspopup="menu" aria-expanded={showMenu}
                    onClick={() => { setLinkCopied(false); setShowMenu((v) => !v); }}
                    className="relative z-40 flex items-center gap-2 pl-3 pr-2 py-2 rounded-full text-sm font-semibold border bg-card"
                    style={{ borderColor: chipColor, color: INK }}>
              <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: chipColor }} />
              {userName(form.user)}
              {(exporting || importing) ? <Loader2 size={14} className="animate-spin" style={{ color: MUTED }} /> : <ChevronDown size={14} style={{ color: MUTED }} />}
            </button>
            <input ref={importRef} type="file" accept=".csv,text/csv" className="hidden" aria-label="Importera"
                   onChange={(e) => {
                     const file = e.target.files && e.target.files[0];
                     if (file) handleImportFile(file);
                     e.target.value = "";
                   }} />
            {isAdmin && (
              <input ref={restoreRef} type="file" accept=".json,application/json" className="hidden" aria-label="Återställ" data-testid="restore-input"
                     onChange={(e) => {
                       const file = e.target.files && e.target.files[0];
                       if (file) handleRestoreFile(file);
                       e.target.value = "";
                     }} />
            )}
            {showMenu && (
              <>
                <div className="fixed inset-0 z-30" data-testid="person-menu-backdrop" onClick={() => setShowMenu(false)} />
                <div role="menu" data-testid="person-menu" className="absolute right-0 top-full mt-2 z-40 w-64 rounded-xl border bg-card shadow-lg overflow-hidden"
                     style={{ borderColor: LINE }}>
                  <div className="px-4 pt-3 pb-1 text-xs font-bold" style={{ color: MUTED }}>LOGGAR SOM</div>
                  {visibleUsers.map((u) => (
                    <button key={u.id} type="button" role="menuitemradio" aria-checked={form.user === u.id} data-testid={`person-${u.id}`}
                            onClick={() => { setForm((f) => ({ ...f, user: u.id })); setShowMenu(false); }}
                            className="w-full flex items-center gap-3 px-4 text-sm text-left" style={{ minHeight: 44, color: INK }}>
                      <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: userColor(u) }} />
                      <span className="flex-1" style={{ fontWeight: form.user === u.id ? 700 : 500 }}>{u.name}</span>
                      {form.user === u.id && <Check size={16} style={{ color: userColor(u) }} />}
                    </button>
                  ))}
                  <button type="button" role="menuitem" data-testid="person-manage" onClick={() => { setShowMenu(false); setShowUsers(true); }}
                          className="w-full flex items-center gap-3 px-4 text-sm text-left" style={{ minHeight: 44, color: MUTED }}>
                    <Users size={16} /> Hantera användare
                  </button>
                  <div className="border-t my-1" style={{ borderColor: LINE }} />
                  <div className="px-4 pt-2 pb-2" data-testid="theme-row">
                    <div className="flex items-center gap-2 text-sm mb-2" style={{ color: INK }}>
                      {darkMode ? <Moon size={16} style={{ color: MUTED }} /> : <Sun size={16} style={{ color: MUTED }} />} Utseende
                    </div>
                    <div role="radiogroup" aria-label="Utseende" className="flex rounded-lg border overflow-hidden" style={{ borderColor: LINE2 }}>
                      {THEME_MODES.map((m, i) => {
                        const on = themeMode === m.id;
                        return (
                          <button key={m.id} type="button" role="radio" aria-checked={on} data-testid={`theme-${m.id}`}
                                  onClick={() => setThemeMode(m.id)}
                                  className="flex-1 text-sm font-semibold"
                                  style={{ minHeight: 44, backgroundColor: on ? ACCENT : CARD, color: on ? ON_ACCENT : CTRL, borderLeft: i ? `1px solid ${LINE2}` : "none" }}>
                            {m.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="border-t my-1" style={{ borderColor: LINE }} />
                  <button type="button" role="menuitem" data-testid="menu-import" disabled={importing}
                          onClick={() => { setShowMenu(false); importRef.current && importRef.current.click(); }}
                          title="Importera pass från en tidigare CSV-export (t.ex. efter en uppdatering)"
                          className="w-full flex items-center gap-3 px-4 text-sm text-left" style={{ minHeight: 44, color: INK }}>
                    <Upload size={16} style={{ color: MUTED }} /> Importera (CSV)
                  </button>
                  <button type="button" role="menuitem" data-testid="menu-export" disabled={exporting}
                          onClick={() => { setShowMenu(false); handleExport(); }}
                          title="Ladda ner alla loggade pass som CSV-fil (säkerhetskopia)"
                          className="w-full flex items-center gap-3 px-4 text-sm text-left" style={{ minHeight: 44, color: INK }}>
                    <Download size={16} style={{ color: MUTED }} /> Exportera (CSV)
                  </button>
                  {isAdmin && (
                    <>
                      <div className="border-t my-1" style={{ borderColor: LINE }} />
                      <div className="px-4 pt-2 pb-1 text-xs font-bold" style={{ color: MUTED }}>SÄKERHETSKOPIA</div>
                      <button type="button" role="menuitem" data-testid="menu-backup" disabled={backingUp}
                              onClick={() => { setShowMenu(false); handleBackup(); }}
                              className="w-full flex items-center gap-3 px-4 text-sm text-left" style={{ minHeight: 44, color: INK }}>
                        <Download size={16} style={{ color: MUTED }} /> Säkerhetskopia (JSON)
                      </button>
                      <button type="button" role="menuitem" data-testid="menu-restore"
                              onClick={() => { setShowMenu(false); restoreRef.current && restoreRef.current.click(); }}
                              className="w-full flex items-center gap-3 px-4 text-sm text-left" style={{ minHeight: 44, color: INK }}>
                        <Upload size={16} style={{ color: MUTED }} /> Återställ från säkerhetskopia
                      </button>
                      <div className="px-4 pb-2 text-xs" data-testid="backup-status" style={{ color: backupOverdue ? DANGER : MUTED }}>
                        {!backupInfo.loaded ? "…" : backupInfo.at ? `Senaste: ${agoText(backupInfo.at)}` : "Ingen säkerhetskopia tagen än"}
                      </div>
                    </>
                  )}
                  {connLink && (
                    <>
                      <div className="border-t my-1" style={{ borderColor: LINE }} />
                      <button type="button" role="menuitem" data-testid="menu-copylink"
                              onClick={() => {
                                try { const r = navigator.clipboard && navigator.clipboard.writeText(connLink); if (r && r.catch) r.catch(() => {}); } catch (e) {}
                                setLinkCopied(true);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-left" style={{ minHeight: 44, color: INK }}>
                        <Copy size={16} className="shrink-0" style={{ color: MUTED }} />
                        {linkCopied ? "Länk kopierad. Skicka den till rätt person" : "Kopiera kopplingslänk till annan enhet"}
                      </button>
                      <button type="button" role="menuitem" data-testid="menu-disconnect"
                              onClick={() => { setShowMenu(false); setConfirmError(null); setConfirmDlg({ kind: "disconnect" }); }}
                              className="w-full flex items-center gap-3 px-4 text-sm text-left" style={{ minHeight: 44, color: DANGER }}>
                        <Unplug size={16} /> Koppla bort enheten
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        {importMsg && (
          <p className="text-xs font-semibold mb-1 text-right" style={{ color: importMsg.ok ? ACCENT_DARK : DANGER }}>
            {importMsg.text}
          </p>
        )}
        <p className="text-xs font-semibold mb-4" style={{ color: ACCENT }}>
          BASTUBACKENS FINEST
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 border-b" style={{ borderColor: LINE }}>
          <button
            onClick={() => { setSwipeDir(""); setView("logga"); }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors"
            style={{
              borderColor: view === "logga" ? ACCENT : "transparent",
              color: view === "logga" ? ACCENT_DARK : MUTED,
            }}
          >
            <ClipboardList size={16} /> Logga pass
          </button>
          <button
            onClick={() => { setSwipeDir(""); setView("stats"); }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors"
            style={{
              borderColor: view === "stats" ? ACCENT : "transparent",
              color: view === "stats" ? ACCENT_DARK : MUTED,
            }}
          >
            <BarChart3 size={16} /> Statistik
          </button>
          <button
            onClick={() => { setSwipeDir(""); setView("hist"); }} data-testid="tab-hist"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors"
            style={{
              borderColor: view === "hist" ? ACCENT : "transparent",
              color: view === "hist" ? ACCENT_DARK : MUTED,
            }}
          >
            <History size={16} /> Historik
          </button>
        </div>

        {queued.length > 0 && (
          <div role="status" className="rounded-lg p-3 mb-4 flex items-start gap-2 text-sm"
               style={maxAttempts >= 3
                 ? { backgroundColor: ERRBOX_BG, border: `1px solid ${ERRBOX_BORDER}`, color: ERRBOX_TEXT }
                 : { backgroundColor: WARN_BG, border: `1px solid ${WARN_BORDER}`, color: WARN_TEXT }}>
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

        {schemaTooNew && (
          <div className="rounded-lg text-sm p-3 mb-3" data-testid="schema-warning" role="alert"
               style={{ backgroundColor: WARN_BG, border: `1px solid ${WARN_BORDER}`, color: WARN_TEXT }}>
            Datan är sparad med en nyare version av appen. Den här versionen kan inte spara, så inget skrivs över.{" "}
            <button type="button" className="underline font-semibold" onClick={() => { location.replace(location.pathname + "?v=" + Date.now()); }}>Uppdatera sidan</button>
          </div>
        )}
        <div key={view} data-testid="view-wrap" data-dir={swipeDir || ""} className={swipeDir ? `swipe-in-${swipeDir}` : ""}>
        {view === "logga" && (
          <div className="space-y-5">
            {showYesterday && (
              <div data-testid="yesterday-reminder" className="flex items-stretch rounded-xl border" style={{ borderColor: LINE, backgroundColor: CARD }}>
                <button type="button" data-testid="yesterday-log" onClick={() => setForm((f) => ({ ...f, date: yIso }))}
                        className="flex-1 text-left text-sm px-3 py-2" style={{ minHeight: 44, color: INK }}>
                  Igår ({yName}) är inte loggad. <span className="font-bold underline" style={{ color: ACCENT_DARK }}>Gör det nu</span>.
                </button>
                <button type="button" data-testid="yesterday-dismiss" aria-label="Dölj påminnelsen för igår" onClick={dismissYesterday}
                        className="flex items-center justify-center shrink-0" style={{ width: 44, minHeight: 44, color: MUTED }}>
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
            )}
            <Card>
              {(editingId || editingPending) && (
                <div className="flex items-center justify-between mb-4 pb-3 border-b"
                     style={{ borderColor: LINE }}>
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

              {renderFormFields()}
              {renderFormActions(false)}
            </Card>

            <div>
              <div className="text-xs font-bold mb-2" style={{ color: MUTED }} data-testid="recent-title">
                SENASTE PASS · {userName(form.user)}
              </div>
              {queued.length > 0 && (
                <div className="space-y-2 mb-3">
                  {queued.map((a) => (
                    <div key={a.qid} data-testid="pending-card" className="rounded-lg p-3 text-sm"
                         style={{ border: `1.5px dashed ${WARN_BORDER}`, backgroundColor: WARN_BG }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: WARN_BADGE, color: WARN_TEXT }}>Ej sparat</span>
                        <span className="font-semibold">{userName(a.entry.user || "niva")}</span>
                      </div>
                      <div style={{ color: INK }} data-testid="pending-line">{entryLine(a.entry)}</div>
                      {a.stage === 1 && (
                        <p className="text-xs mt-1" style={{ color: WARN_TEXT }}>
                          Passet är sparat i den nya månaden men finns kvar i den gamla tills flytten är klar.
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <button type="button" onClick={() => retryPending(a.qid)} disabled={retryingQid === a.qid}
                                className="flex items-center gap-1.5 px-3 rounded-lg text-xs font-bold border"
                                style={{ minHeight: 40, borderColor: ACCENT, color: ACCENT_DARK, backgroundColor: CARD }}>
                          {retryingQid === a.qid ? <Loader2 size={13} className="animate-spin" /> : <RotateCw size={13} />} Spara igen
                        </button>
                        {a.stage !== 1 && (
                          <>
                            <button type="button" onClick={() => startEditPending(a)}
                                    className="flex items-center gap-1.5 px-3 rounded-lg text-xs font-semibold border"
                                    style={{ minHeight: 40, borderColor: LINE2, color: CTRL, backgroundColor: CARD }}>
                              <Pencil size={13} /> Redigera
                            </button>
                            <button type="button" onClick={() => askDeletePending(a)}
                                    className="flex items-center gap-1.5 px-3 rounded-lg text-xs font-semibold border"
                                    style={{ minHeight: 40, borderColor: LINE2, color: DANGER, backgroundColor: CARD }}>
                              <Trash2 size={13} /> Radera
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {recentData.key === null ? (
                <p className="text-sm" style={{ color: MUTED }}>Laddar…</p>
              ) : recentPasses.length === 0 ? (
                <p className="text-sm" style={{ color: MUTED }} data-testid="empty-list">Inga pass de senaste två månaderna.</p>
              ) : (
                <div className="space-y-2" data-testid="recent-list">
                  {recentPasses.map((e) => renderEntryRow(e, "log"))}
                </div>
              )}
              <button type="button" data-testid="to-history" onClick={openHistoryFromLog}
                      className="mt-2 inline-flex items-center gap-1 text-sm font-semibold underline"
                      style={{ minHeight: 44, color: ACCENT_DARK }}>
                Historik <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {view === "hist" && (
          <div className="space-y-4" data-testid="history">
            <div>
              <div className="text-xs font-bold mb-2" style={{ color: ACCENT_DARK }}>VISAR HISTORIK FÖR</div>
              <div className="flex flex-wrap gap-2">
                {visibleUsers.map((u) => (
                  <Pill key={u.id} active={histUser === u.id} color={userColor(u)} onClick={() => setHistUser(u.id)}>{u.name}</Pill>
                ))}
              </div>
            </div>

            {!histSearching && (
              <div role="group" aria-label="Visa som" data-testid="hist-mode" className="flex w-full rounded-lg border overflow-hidden" style={{ borderColor: LINE2 }}>
                {[["list", "Lista"], ["cal", "Kalender"]].map(([k, label], i) => {
                  const on = histMode === k;
                  return (
                    <button key={k} type="button" data-testid={`hist-mode-${k}`} aria-pressed={on} onClick={() => setHistMode(k)}
                            className="flex-1 py-2 text-sm font-semibold"
                            style={{ backgroundColor: on ? ACCENT : CARD, color: on ? ON_ACCENT : CTRL, borderLeft: i ? `1px solid ${LINE2}` : "none" }}>
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {!histSearching && (() => {
              const nowKey = monthKeyOf(todayISO());
              const firstKey = allMonths[0] || nowKey;
              const options = [...new Set([...allMonths, histMonth])].sort().reverse();
              return (
                <div data-testid="hist-month-picker">
                  <PeriodStepper id="hist-month" prevLabel="Föregående månad" nextLabel="Nästa månad"
                                 canPrev={histMonth > firstKey} canNext={histMonth < nowKey}
                                 onPrev={() => setHistMonth(addMonthKey(histMonth, -1))}
                                 onNext={() => setHistMonth(addMonthKey(histMonth, 1))}
                                 overlay={(
                                   <select value={histMonth} aria-label="Välj månad" data-testid="hist-month-jump"
                                           onChange={(e) => setHistMonth(e.target.value)}
                                           className="absolute inset-0 w-full h-full cursor-pointer" style={{ opacity: 0 }}>
                                     {options.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
                                   </select>
                                 )}>
                    <span className="font-bold">{monthLabel(histMonth)}</span>
                  </PeriodStepper>
                  {histMonth !== nowKey && (
                    <div className="text-center mt-1">
                      <button type="button" data-testid="hist-month-now" onClick={() => setHistMonth(nowKey)}
                              className="text-sm font-semibold underline px-1" style={{ minHeight: 44, color: ACCENT_DARK }}>
                        Denna månad
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            <div>
              <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute" style={{ left: 12, top: 13, color: MUTED }} />
                <input type="text" value={histQuery} onChange={(e) => setHistQuery(e.target.value)} placeholder="Sök" data-testid="hist-search" aria-label="Sök"
                       className="border rounded-lg py-2 text-sm w-full" style={{ borderColor: LINE2, paddingLeft: 36, paddingRight: 40, minHeight: 42 }} />
                {histQuery && (
                  <button type="button" aria-label="Rensa sökningen" data-testid="hist-search-clear" onClick={() => setHistQuery("")}
                          className="absolute p-2 rounded hover-soft" style={{ right: 4, top: 1 }}>
                    <X size={16} style={{ color: MUTED }} />
                  </button>
                )}
              </div>
              <button type="button" data-testid="hist-filter-toggle" aria-expanded={histFiltersOpen} aria-label="Filter" title="Filter"
                      onClick={() => setHistFiltersOpen((o) => !o)}
                      className="relative shrink-0 rounded-lg border flex items-center justify-center"
                      style={{ width: 42, height: 42, borderColor: histFiltersOpen || histFiltering ? ACCENT : LINE2, backgroundColor: histFiltersOpen ? SUBTLE : CARD }}>
                <SlidersHorizontal size={18} style={{ color: histFiltering ? ACCENT : MUTED }} />
                {histFiltering && (
                  <span data-testid="hist-filter-count" className="absolute flex items-center justify-center rounded-full text-xs font-bold"
                        style={{ top: -6, right: -6, minWidth: 18, height: 18, padding: "0 4px", backgroundColor: ACCENT, color: ON_ACCENT }}>
                    {(histFilters.pain ? 1 : 0) + (histFilters.sport ? 1 : 0) + (histFilters.typ ? 1 : 0) + (histFilters.part ? 1 : 0)}
                  </span>
                )}
              </button>
              </div>
              {histSearching && (
                <p className="text-xs mt-1.5" data-testid="hist-searching" style={{ color: MUTED }}>
                  Söker i alla månader{histLoaded ? ` · ${histShown.length === 1 ? "1 träff" : `${histShown.length} träffar`}` : ""}
                </p>
              )}
            </div>

            {histFiltersOpen && (
            <div className="flex flex-wrap gap-2 items-center" data-testid="hist-filters">
              <button type="button" data-testid="hist-f-pain" aria-pressed={histFilters.pain}
                      onClick={() => setHistFilters((f) => ({ ...f, pain: !f.pain }))}
                      className="px-3 rounded-full text-sm font-semibold border"
                      style={{ minHeight: 40, borderColor: histFilters.pain ? ACCENT : LINE2, backgroundColor: histFilters.pain ? ACCENT : CARD, color: histFilters.pain ? ON_ACCENT : CTRL }}>
                Bara med smärta
              </button>
              <FilterSelect testId="hist-f-sport" label="Aktivitet" value={histFilters.sport} options={histOptions.sport} onChange={(v) => setHistFilters((f) => ({ ...f, sport: v }))} />
              <FilterSelect testId="hist-f-typ" label="Träningstyp" value={histFilters.typ} options={histOptions.typ} onChange={(v) => setHistFilters((f) => ({ ...f, typ: v }))} />
              <FilterSelect testId="hist-f-part" label="Kroppsdel" value={histFilters.part} options={histOptions.part} onChange={(v) => setHistFilters((f) => ({ ...f, part: v }))} />
              {histFiltering && (
                <button type="button" data-testid="hist-f-clear" onClick={() => setHistFilters({ pain: false, sport: "", typ: "", part: "" })}
                        className="text-sm font-semibold underline px-1" style={{ minHeight: 40, color: ACCENT_DARK }}>
                  Rensa filter
                </button>
              )}
            </div>
            )}
            {histOffCount > 0 && !histCalOn && (
              <button type="button" onClick={toggleHideOffDays} data-testid="hist-toggle-offdays" aria-pressed={hideOffDays}
                      title={hideOffDays ? "Visa vilo- och sjukdagar" : "Dölj vilo- och sjukdagar"}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold border bg-transparent"
                      style={{ borderColor: LINE2, color: hideOffDays ? FAINT : MUTED }}>
                {hideOffDays ? <EyeOff size={14} /> : <Eye size={14} />}
                Vilo-/sjukdagar ({histOffCount})
              </button>
            )}

            {!histLoaded ? (
              <p className="text-sm" style={{ color: MUTED }}>Laddar…</p>
            ) : histCalOn ? (
              renderHistCalendar()
            ) : histGroups.length === 0 ? (
              <p className="text-sm" style={{ color: MUTED }} data-testid="hist-empty">
                {histSearching || histFiltering ? "Inga träffar."
                  : histUserEntries.length === 0 ? "Inga pass loggade den här månaden ännu."
                  : `Inga pass den här månaden. ${histOffCount === 1 ? "1 vilo-/sjukdag är dold" : `${histOffCount} vilo-/sjukdagar är dolda`}.`}
              </p>
            ) : (
              <div className="space-y-5">
                {histGroups.map((g) => {
                  const wl = weekLabel(g.monday), sm = weekSummary(g.entries);
                  const partial = !histSearching && (g.monday.slice(0, 7) !== histMonth || addDaysIso(g.monday, 6).slice(0, 7) !== histMonth);
                  const open = !histCollapsed.has(g.monday);
                  return (
                    <div key={g.monday} data-testid="hist-week">
                      <button type="button" data-testid="hist-week-toggle" aria-expanded={open} onClick={() => toggleWeek(g.monday)}
                              className="w-full flex items-center justify-between text-left" style={{ minHeight: 32 }}>
                        <span className="text-xs font-bold" style={{ color: MUTED }} data-testid="hist-week-title">
                          VECKA {wl.week} · {wl.range}{partial ? " (del av vecka)" : ""}
                        </span>
                        <ChevronDown size={16} style={{ color: MUTED, transform: open ? "none" : "rotate(-90deg)" }} />
                      </button>
                      <div className="text-xs mb-2" data-testid="hist-week-summary" style={{ color: INK }}>
                        {sm.text}{(histFiltering || histSearching) ? <span style={{ color: FAINT }}> (filtrerat)</span> : null}
                        {sm.painList.length > 0 && (
                          <div data-testid="hist-week-pain" style={{ color: DANGER }}>
                            Smärta: {sm.painList.slice(0, 2).map((x) => `${x.short} (högst ${x.max})`).join(", ")}{sm.painList.length > 2 ? ` +${sm.painList.length - 2}` : ""}
                          </div>
                        )}
                      </div>
                      {open && <div className="space-y-2">{g.entries.map((e) => renderEntryRow(e, "hist"))}</div>}
                    </div>
                  );
                })}
              </div>
            )}
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
                  <Pill key={u.id} active={statsUser === u.id} color={userColor(u)}
                        onClick={() => setStatsUser(u.id)}>
                    {u.name}
                  </Pill>
                ))}
              </div>
            </div>

            <div role="group" aria-label="Period" data-testid="scope-group" className="flex w-full rounded-lg border overflow-hidden"
                 style={{ borderColor: LINE2 }}>
              {[["week", "Vecka"], ["month", "Månad"], ["all", "Alla månader"]].map(([k, label], i) => {
                const on = statsScope === k;
                return (
                  <button key={k} type="button" data-testid={`scope-${k}`} aria-pressed={on} onClick={() => setStatsScope(k)}
                          className="flex-1 text-sm font-semibold"
                          style={{ minHeight: 44, backgroundColor: on ? ACCENT : CARD, color: on ? ON_ACCENT : CTRL, borderLeft: i ? `1px solid ${LINE2}` : "none" }}>
                    {label}
                  </button>
                );
              })}
            </div>

            {statsScope === "month" && (() => {
              const nowKey = monthKeyOf(todayISO());
              const firstKey = allMonths[0] || nowKey;
              const options = [...new Set([...allMonths, selectedMonth])].sort().reverse();
              return (
                <div data-testid="month-picker">
                  <PeriodStepper id="month" prevLabel="Föregående månad" nextLabel="Nästa månad"
                                 canPrev={selectedMonth > firstKey} canNext={selectedMonth < nowKey}
                                 onPrev={() => setSelectedMonth(addMonthKey(selectedMonth, -1))}
                                 onNext={() => setSelectedMonth(addMonthKey(selectedMonth, 1))}
                                 overlay={(
                                   <select value={selectedMonth} aria-label="Välj månad" data-testid="month-jump"
                                           onChange={(e) => setSelectedMonth(e.target.value)}
                                           className="absolute inset-0 w-full h-full cursor-pointer" style={{ opacity: 0 }}>
                                     {options.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
                                   </select>
                                 )}>
                    <span className="font-bold">{monthLabel(selectedMonth)}</span>
                  </PeriodStepper>
                  {selectedMonth !== nowKey && (
                    <div className="text-center mt-1">
                      <button type="button" data-testid="month-now" onClick={() => setSelectedMonth(nowKey)}
                              className="text-sm font-semibold underline px-1" style={{ minHeight: 44, color: ACCENT_DARK }}>
                        Denna månad
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {statsScope === "week" && (() => {
              const thisMonday = mondayOf(todayISO());
              const firstDay = (allMonths[0] || monthKeyOf(todayISO())) + "-01";
              const firstMonday = mondayOf(firstDay);
              const wl = weekLabel(statsWeek);
              const isCurrent = statsWeek === thisMonday;
              return (
                <div data-testid="week-picker">
                  <PeriodStepper id="week" prevLabel="Föregående vecka" nextLabel="Nästa vecka"
                                 canPrev={statsWeek > firstMonday} canNext={statsWeek < thisMonday}
                                 onPrev={() => setStatsWeek((w) => addDaysIso(w, -7))}
                                 onNext={() => setStatsWeek((w) => addDaysIso(w, 7))}
                                 overlay={(
                                   <input type="date" data-testid="week-jump" aria-label="Välj ett datum, så visas veckan som datumet ligger i"
                                          min={firstDay} max={todayISO()} value=""
                                          onChange={(e) => { if (e.target.value) setStatsWeek(mondayOf(e.target.value)); }}
                                          className="absolute inset-0 w-full h-full cursor-pointer" style={{ opacity: 0 }} />
                                 )}>
                    <span className="font-bold">Vecka {wl.week}</span> <span style={{ color: MUTED }}>· {wl.range}</span>
                  </PeriodStepper>
                  {!isCurrent && (
                    <div className="text-center mt-1">
                      <button type="button" data-testid="week-now" onClick={() => setStatsWeek(thisMonday)}
                              className="text-sm font-semibold underline px-1" style={{ minHeight: 44, color: ACCENT_DARK }}>
                        Denna vecka
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {(loadingMonth && statsScope === "month") || (loadingAll && statsScope === "all") || (loadingWeek && statsScope === "week") ? (
              <p className="text-sm" style={{ color: MUTED }}>Laddar…</p>
            ) : dataForStats.length === 0 ? (
              <>
                <Card>
                  <p className="text-sm" style={{ color: MUTED }}>
                    {statsScope === "week" ? "Inga pass den här veckan." : 'Inga pass loggade än för det här urvalet. Gå till "Logga pass" för att komma igång.'}
                  </p>
                </Card>
                {offDayCard}
                {painTrendCard}
              </>
            ) : (
              <>
                {prevCmp && (
                  <p className="text-xs" data-testid="compare-label" style={{ color: MUTED }}>
                    {prevCmp.empty ? `Ingen jämförelse: inga pass i ${cmp.none}.` : `${cmp.label}.`}
                  </p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Card>
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-2xl font-bold" style={{ color: ACCENT_DARK }}>{summary.totalPass}</div>
                      {prevCmp && <Delta d={prevCmp.d.pass} testid="delta-pass" />}
                    </div>
                    <div className="text-xs" style={{ color: MUTED }}>Antal pass</div>
                  </Card>
                  <Card>
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-2xl font-bold" style={{ color: ACCENT_DARK }}>
                        {(summary.totalTidMin / 60).toFixed(1)}
                      </div>
                      {prevCmp && <Delta d={prevCmp.d.tid} testid="delta-tid" />}
                    </div>
                    <div className="text-xs" style={{ color: MUTED }}>Timmar totalt</div>
                  </Card>
                  <Card>
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-2xl font-bold" style={{ color: ACCENT_DARK }}>
                        {summary.avgKansla ? summary.avgKansla.toFixed(1) : "–"}
                      </div>
                      {prevCmp && <Delta d={prevCmp.d.kansla} testid="delta-kansla" />}
                    </div>
                    <div className="text-xs" style={{ color: MUTED }}>Snittansträngning</div>
                  </Card>
                  <Card>
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-2xl font-bold" style={{ color: ACCENT_DARK }}>
                        {Math.round(summary.totalLoad).toLocaleString("sv-SE")}
                      </div>
                      {prevCmp && <Delta d={prevCmp.d.load} testid="delta-load" />}
                    </div>
                    <div className="text-xs" style={{ color: MUTED }}>Belastning (AU)</div>
                  </Card>
                  {summary.totalKm > 0 && (
                    <Card className="col-span-2">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="text-2xl font-bold" data-testid="distance-total" style={{ color: ACCENT_DARK }}>{fmtKm(summary.totalKm)}</div>
                        {prevCmp && <Delta d={prevCmp.d.km} testid="delta-km" />}
                      </div>
                      <div className="text-xs" style={{ color: MUTED }}>Distans totalt (km)</div>
                    </Card>
                  )}
                </div>

                {offDayCard}

                <Card>
                  <div className="text-xs font-bold mb-3" style={{ color: ACCENT_DARK }}>
                    BELASTNING PER DAG &nbsp;<span className="font-normal" style={{ color: MUTED }}>(tid × ansträngning)</span>
                  </div>
                  {loadChart.ghost && (
                    <div className="text-xs mb-2 flex items-center gap-1.5" data-testid="load-ghost-legend" style={{ color: MUTED }}>
                      <span className="inline-block" style={{ width: 14, height: 0, borderTop: `2px solid ${INK}` }} /> {cmp.kind === "week" ? `Vecka ${isoWeekNumber(cmp.from)}` : ""}
                    </div>
                  )}
                  <ResponsiveContainer width="100%" height={180}>
                    <ComposedChart data={loadChart.data} margin={CHART_MARGIN}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRIDC} vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: MUTED }} axisLine={{ stroke: AXISC }} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} width={40} />
                      <Tooltip {...tipProps()} />
                      <Bar dataKey="load" name="Belastning" fill={ACCENT} radius={[3, 3, 0, 0]} isAnimationActive={false} />
                      {loadChart.ghost && (
                        <Line dataKey="prev" name={`Vecka ${isoWeekNumber(cmp.from)}`} stroke="none" isAnimationActive={false} connectNulls={false} legendType="none"
                              dot={(pr) => (pr.cx == null || pr.cy == null || pr.value == null ? <g key={pr.index} /> : <line key={pr.index} data-testid="load-ghost-tick" x1={pr.cx - 14} x2={pr.cx + 14} y1={pr.cy} y2={pr.cy} stroke={INK} strokeWidth={2.5} strokeLinecap="round" />)}
                              activeDot={false} />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </Card>

                {painTrendCard}

                <div className="grid sm:grid-cols-2 gap-4">
                  <Card>
                    <div className="text-xs font-bold mb-3" style={{ color: ACCENT_DARK }}>FÖRDELNING AKTIVITET</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={sportDist} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2} isAnimationActive={false}>
                          {sportDist.map((entry, i) => (
                            <Cell key={entry.name} fill={sportColor(entry.code)} />
                          ))}
                        </Pie>
                        <Tooltip {...tipProps()} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-3 justify-center mt-1">
                      {sportDist.map((s, i) => (
                        <div key={s.name} className="flex items-center gap-1.5 text-xs" style={{ color: MUTED }}>
                          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sportColor(s.code) }} />
                          {s.name} ({s.value})
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card>
                    <div className="text-xs font-bold mb-3" style={{ color: ACCENT_DARK }}>ANSTRÄNGNING ÖVER TID</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={kanslaTrend} margin={CHART_MARGIN}>
                        <CartesianGrid strokeDasharray="3 3" stroke={GRIDC} vertical={false} />
                        <XAxis dataKey="date" padding={{ left: 12, right: 12 }} tick={{ fontSize: 10, fill: MUTED }} axisLine={{ stroke: AXISC }} tickLine={false} />
                        <YAxis domain={[1, 10]} ticks={[1,2,3,4,5,6,7,8,9,10]} tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} width={26} />
                        <Tooltip {...tipProps()} />
                        <Line type="monotone" dataKey="kansla" stroke={ACCENT} strokeWidth={2} dot={{ r: 3, fill: ACCENT }} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>
                </div>

                <Card>
                  <div className="text-xs font-bold mb-3" style={{ color: LABEL }}>FÖRDELNING TRÄNINGSTYP</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={typeDist} margin={CHART_MARGIN}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRIDC} vertical={false} />
                      <XAxis dataKey="code" tick={{ fontSize: 10, fill: MUTED }} axisLine={{ stroke: AXISC }} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                      <Tooltip
                        {...tipProps()}
                        formatter={(value, name, props) => [value, props.payload.name]}
                      />
                      <Bar dataKey="count" name="Antal pass" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                        {typeDist.map((entry, i) => (
                          <Cell key={entry.code} fill={typeColor(entry.code)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </>
            )}
          </div>
        )}

        </div>

        {sheetOpen && (
          <div className="fixed left-0 right-0 z-40 flex flex-col justify-end" data-testid="edit-sheet-backdrop"
               style={{ backgroundColor: "rgba(0,0,0,0.4)", top: sheetVv ? sheetVv.top : 0, height: sheetVv ? sheetVv.height : "100%" }}
               onClick={(e) => { if (e.target === e.currentTarget) requestCloseSheet(); }}>
            <div role="dialog" aria-modal="true" aria-label="Redigera" data-testid="edit-sheet" className="bg-card w-full max-w-xl mx-auto rounded-t-2xl flex flex-col sheet-up"
                 style={{ height: sheetVv && sheetVv.kb ? "calc(100% - 12px)" : "calc(100% - 92px)", color: INK }}>
              <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: LINE }}>
                <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color: ACCENT_DARK }}>
                  <Pencil size={14} /> {editingId ? "Redigerar loggat pass" : `Logga ${dayTitle(form.date)}`}
                </div>
                <button type="button" aria-label="Stäng" data-testid="sheet-close" onClick={requestCloseSheet} className="p-2 rounded hover-soft">
                  <X size={18} style={{ color: MUTED }} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 pt-4" data-testid="sheet-body" style={{ overscrollBehavior: "contain" }}>
                {renderFormFields()}
              </div>
              <div className="px-4 pt-3 border-t shrink-0" style={{ borderColor: LINE, paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
                {renderFormActions(true)}
              </div>
            </div>
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
        {confirmDlg && confirmDlg.kind === "discard" && (
          <ConfirmModal title="Släng ändringarna?" text="Det du har ändrat sparas inte."
                        confirmLabel="Släng" busy={false} error={null} onConfirm={doConfirm} onCancel={closeConfirm} />
        )}
        {confirmDlg && confirmDlg.kind === "disconnect" && (
          <ConfirmModal title="Koppla bort den här enheten?"
                        text={queued.length > 0
                          ? `Datan finns kvar i molnet, men ${queued.length === 1 ? "1 osparat pass" : `${queued.length} osparade pass`} på den här telefonen försvinner.`
                          : "Datan finns kvar i molnet."}
                        confirmLabel="Koppla bort" busy={false} error={null} onConfirm={doConfirm} onCancel={closeConfirm} />
        )}
        {restorePlan && (
          <ConfirmModal neutral title="Återställ från säkerhetskopia?"
                        text={`${restorePlan.data.createdAt ? `Kopia från ${restorePlan.data.createdAt.slice(0, 10)}: ` : ""}${restorePlan.counts.total} pass och ${restorePlan.counts.users} personer. ${restorePlan.counts.exist} finns redan, ${restorePlan.counts.toAdd} läggs till${restorePlan.counts.newUsers ? `, och ${restorePlan.counts.newUsers === 1 ? "1 person saknas och läggs" : `${restorePlan.counts.newUsers} personer saknas och läggs`} till` : ""}. Inget skrivs över och inget raderas.${restorePlan.counts.skipped ? ` ${restorePlan.counts.skipped} poster i filen var trasiga och hoppas över.` : ""}`}
                        confirmLabel="Återställ" busy={restoreBusy} error={restoreError} onConfirm={doRestore} onCancel={() => { if (!restoreBusy) setRestorePlan(null); }} />
        )}
        {showUsers && (
          <UserManager users={users} localHidden={localHidden} onLocalHide={setLocalHiddenIds} onUpdate={updateUsers} onClose={() => setShowUsers(false)} />
        )}

        <p className="text-xs text-center mt-8" style={{ color: FAINT }} data-testid="footer-info">
          Live-delad med alla som har samma länk.
          {protection && (<><br /><span data-testid="protection">Skydd mot överskrivning: {protection === "on" ? "på" : "begränsat"}</span></>)}
        </p>
        {backupOverdue && (
          <p className="text-xs text-center mt-3" data-testid="backup-reminder" style={{ color: MUTED }}>
            {backupInfo.at ? `Senaste säkerhetskopia: ${agoText(backupInfo.at)}.` : "Ingen säkerhetskopia är tagen än."}{" "}
            <button type="button" data-testid="backup-now" onClick={handleBackup} disabled={backingUp} className="underline font-semibold" style={{ color: ACCENT_DARK }}>
              Ta en kopia nu
            </button>
          </p>
        )}

        {connLink && (
          <div className="text-center" style={{ marginTop: 24 }}>
            <button
              type="button"
              onClick={() => { location.replace(location.pathname + "?v=" + Date.now()); }}
              className="inline-flex items-center justify-center rounded-lg text-sm font-semibold border"
              style={{ minHeight: 44, paddingLeft: 20, paddingRight: 20, borderColor: ACCENT, color: ACCENT_DARK }}
            >
              Uppdatera sidan
            </button>
          </div>
        )}

        {/* Footer row: credit left, version + release notes right (usual convention) */}
        <div className="flex items-center justify-between gap-3 text-xs" data-testid="footer-row"
             style={{ color: FAINT, marginTop: 24, paddingBottom: "max(2.5rem, calc(env(safe-area-inset-bottom) + 1.5rem))" }}>
          <span data-testid="credit">© 2026 Grim</span>
          <span className="flex items-center gap-1 text-right">
            <span data-testid="version">v{APP_VERSION}</span> ·
            <button type="button" className="underline" data-testid="open-changelog"
                    style={{ color: FAINT, minHeight: 44, paddingLeft: 4, paddingRight: 4 }} onClick={() => setShowChangelog(true)}>Vad är nytt?</button>
          </span>
        </div>
      </div>
    </div>
  );
}
