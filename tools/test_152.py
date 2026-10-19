"""Acceptance tests for 1.5.2 (run: python3 tools/test_152.py [path/to/index.html]).
Rest day / sick day (field `kind`), effort in the list ("6/10"), statistics, CSV round trip.
Mobile viewport 390x844, two browser contexts = two phones. The seed is generated relative to today."""
import sys, os, json, subprocess, time, urllib.request, pathlib, tempfile, datetime, re
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = sys.argv[1] if len(sys.argv) > 1 else str(ROOT / "index.html")
SHOTS = pathlib.Path(os.environ.get("SHOTS", "/tmp/shots_152")); SHOTS.mkdir(exist_ok=True, parents=True)
CODE = "testcode12345"
results = []

def check(name, cond, extra=""):
    results.append((name, bool(cond)))
    print(("PASS " if cond else "FAIL ") + name + (f"  [{extra}]" if extra else ""))

TODAY = datetime.datetime.now(datetime.timezone.utc).date()
M = TODAY.strftime("%Y-%m")
def day(n): return f"{M}-{n:02d}"

USERS = [{"id": "niva", "name": "Niva", "color": "#C2477A"}, {"id": "grim", "name": "Grim", "color": "#004B26"},
         {"id": "anna", "name": "Anna", "color": "#1D6FA5"}]

def E(i, n, user, sport, typ, tid, kansla, note="", kind=None):
    e = {"id": f"s{i}", "date": day(n), "user": user, "sport": sport, "typ": typ, "tid": str(tid), "kansla": str(kansla), "anteckningar": note, "cr10": True}
    if kind: e["kind"] = kind
    return e

SEED = [
    E(1, 1, "niva", ["F"], ["TE"], 60, 5),
    E(2, 2, "niva", ["LÖ"], ["KO"], 30, 6),
    E(3, 3, "niva", ["LÖ", "PR"], ["ST", "IN", "KO"], 120, 10, "en ganska lång anteckning som inte får trycka bort siffran"),
    E(4, 4, "niva", [], [], "", "", "vilar kroppen", "rest"),
    E(5, 5, "niva", ["A"], [], 99, 9, "vila med skräpdata (ska ignoreras)", "rest"),
    E(6, 6, "niva", [], [], "", "", "feber", "sick"),
    # grim: only rest days, with junk sport data that must not influence 'most used' or 'Samma som senast'
    *[E(10 + k, 7 + k, "grim", ["A"], [], 50, 5, "", "rest") for k in range(4)],
]

def seed_file(entries):
    by = {}
    for e in entries: by.setdefault(e["date"][:7], []).append(e)
    data = {"diaries": {CODE: {"meta:users": json.dumps(USERS), **{f"entries:{m}": json.dumps(v) for m, v in by.items()}}}}
    f = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False); json.dump(data, f); f.close()
    return f.name

def start_mock(port, seed):
    p = subprocess.Popen(["node", str(ROOT / "tools/mock-firebase.js"), str(port), seed], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(50):
        try: urllib.request.urlopen(f"http://localhost:{port}/__stats"); return p
        except Exception: time.sleep(0.1)
    raise RuntimeError("mock did not start")

def ctl(port, **kw):
    urllib.request.urlopen(f"http://localhost:{port}/__ctl?" + "&".join(f"{k}={v}" for k, v in kw.items())).read()

def month_raw(port, key=M):
    raw = json.load(urllib.request.urlopen(f"http://localhost:{port}/__raw?path=diaries/{CODE}/entries:{key}"))
    return json.loads(raw) if raw else []

def open_app(browser, port, me="niva", accept_downloads=False):
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True, accept_downloads=accept_downloads)
    page = ctx.new_page(); page.errors = []
    page.on("pageerror", lambda e: page.errors.append(str(e)))
    page.add_init_script(f"try {{ localStorage.setItem('nivadagbok-me', '{me}') }} catch (e) {{}}")
    page.goto(f"file://{HTML}#db=http://localhost:{port}&code={CODE}")
    page.wait_for_selector("button:has-text('Spara')")
    page.wait_for_timeout(700)
    return ctx, page

def set_kind(page, k): page.locator(f"[data-testid=kind-{k}]").click()
def save_btn(page): return page.locator("button.flex-1", has_text=re.compile("^(Spara|Sparar|Sparat|Ej sparat)")).first
def pressed(page, k): return page.locator(f"[data-testid=kind-{k}]").get_attribute("aria-pressed") == "true"
def digits(t): return int(re.sub(r"\D", "", t) or 0)
def rows(page, kind): return page.locator(f"[data-testid={kind}]")
def go_stats(page): page.get_by_role("button", name="Statistik").click(); page.wait_for_timeout(500)
def go_log(page): page.get_by_role("button", name="Logga pass").click(); page.wait_for_timeout(300)
def stat_user(page, name):
    page.locator("button[aria-pressed]", has_text=name).first.click() if page.locator("button[aria-pressed]", has_text=name).count() else page.get_by_role("button", name=name, exact=True).first.click()
    page.wait_for_timeout(400)
def stat_card(page, label):
    c = page.locator("div.rounded-xl, div.rounded-lg", has_text=re.compile(f"^{label}$")).filter(has=page.locator(f"text={label}")).last
    return c.inner_text() if c.count() else ""
def norm(es):
    return sorted((e["date"], e.get("user"), e.get("kind") or "", " ".join(e.get("sport") or []), " ".join(e.get("typ") or []), str(e.get("tid") or ""), str(e.get("kansla") or ""), e.get("anteckningar") or "") for e in es)

with sync_playwright() as pw:
    browser = pw.chromium.launch()
    port = 9401; m = start_mock(port, seed_file(SEED))
    try:
        ctx, P = open_app(browser, port, "niva")

        # ---- 1. Effort in the list ----
        r3 = rows(P, "pass-row").filter(has_text="120 min").first
        eff = r3.locator("[data-testid=effort]")
        check("1 Effort shown as 6/10 style (short row)", rows(P, "pass-row").filter(has_text="30 min").first.locator("[data-testid=effort]").inner_text().strip().endswith("6/10"),
              rows(P, "pass-row").filter(has_text="30 min").first.inner_text())
        rb, eb = r3.bounding_box(), eff.bounding_box()
        check("1 Effort 10/10 visible on the long row (not clipped by the note)", eff.inner_text().strip().endswith("10/10") and eb["x"] + eb["width"] <= rb["x"] + rb["width"] - 50, f"{eb} {rb}")
        P.screenshot(path=str(SHOTS / "1_lista.png"), full_page=True)

        # ---- 2. Form: kind choice ----
        kb = P.locator("[data-testid=kind-group]").bounding_box(); db = P.locator("input[type=date]").bounding_box()
        check("2 Kind group exists with Pass pressed by default", pressed(P, "pass") and not pressed(P, "rest") and not pressed(P, "sick"))
        check("2 Kind group fits the screen (right edge <= 390)", kb["x"] + kb["width"] <= 390, str(kb))
        print("INFO kind group", "next to the date" if kb["y"] < db["y"] + db["height"] else "below the date", kb, db)
        P.screenshot(path=str(SHOTS / "2_form_pass.png"), full_page=True)
        set_kind(P, "rest")
        check("2 Rest day: activity, type, time, effort and 'Samma som senast' are hidden",
              P.locator("[data-testid=sport-group]").count() == 0 and P.locator("[data-testid=typ-group]").count() == 0
              and P.locator("input[inputmode=numeric]").count() == 0 and P.locator("[data-testid=same-as-last]").count() == 0
              and "ANSTRÄNGNING" not in P.locator("body").inner_text())
        check("2 Rest day: save button says 'Spara vilodag' and is enabled without activity", save_btn(P).inner_text().strip() == "Spara vilodag" and save_btn(P).is_enabled())
        check("2 Rest day: no 'Välj minst en aktivitet' hint", "Välj minst en aktivitet" not in P.locator("body").inner_text())
        P.screenshot(path=str(SHOTS / "2_form_rest.png"), full_page=True)
        set_kind(P, "sick")
        check("2 Sick day: button says 'Spara sjukdag'", save_btn(P).inner_text().strip() == "Spara sjukdag")
        set_kind(P, "pass")
        check("2 Back to Pass: choices are back, save disabled without activity", P.locator("[data-testid=sport-group]").count() == 1 and not save_btn(P).is_enabled())

        # ---- 3. Save a rest day ----
        set_kind(P, "rest"); P.fill("input[type=date]", day(12)); P.fill("textarea", "lugn dag")
        save_btn(P).click(); P.wait_for_timeout(1500)
        got = [e for e in month_raw(port) if e["date"] == day(12)]
        check("3 Rest day stored with kind=rest and empty pass fields", len(got) == 1 and got[0].get("kind") == "rest" and got[0]["sport"] == [] and got[0]["typ"] == [] and got[0]["tid"] == "" and got[0]["kansla"] == "" and got[0]["anteckningar"] == "lugn dag", str(got))
        row = rows(P, "offday-row").filter(has_text="lugn dag").first
        check("3 Rest day shown as its own row (Vilodag, no time/effort)", row.count() == 1 and "Vilodag" in row.inner_text() and " min" not in row.inner_text() and row.locator("[data-testid=effort]").count() == 0, row.inner_text() if row.count() else "")
        check("3 Form returns to Pass after saving", pressed(P, "pass"))
        P.screenshot(path=str(SHOTS / "3_lista_med_vila.png"), full_page=True)

        # ---- 4. One rest/sick day per user and date; a pass may share the date ----
        set_kind(P, "sick"); P.fill("input[type=date]", day(12)); save_btn(P).click(); P.wait_for_timeout(900)
        err = P.locator("[data-testid=save-error]")
        check("4 Second rest/sick day on the same date is refused with a message", err.count() == 1 and "redan" in err.inner_text() and len([e for e in month_raw(port) if e["date"] == day(12)]) == 1, err.inner_text() if err.count() else "no message")
        P.screenshot(path=str(SHOTS / "4_dubblett.png"), full_page=True)
        P.fill("input[type=date]", day(13)); P.wait_for_timeout(200)
        check("4 Message disappears when the date changes", P.locator("[data-testid=save-error]").count() == 0)
        set_kind(P, "pass"); P.fill("input[type=date]", day(12))
        P.locator("[data-testid=sport-group] button[aria-pressed]").first.click(); P.fill("input[inputmode=numeric]", "20"); P.get_by_role("button", name="3", exact=True).first.click()
        save_btn(P).click(); P.wait_for_timeout(1500)
        d12 = [e for e in month_raw(port) if e["date"] == day(12)]
        check("4 A pass on the same date as a rest day is allowed", len(d12) == 2 and sorted(bool(e.get("kind")) for e in d12) == [False, True], str(d12))

        # other phone saved a rest day for another date: phone A (stale) must still be refused
        ctxB, B = open_app(browser, port, "niva")
        set_kind(B, "rest"); B.fill("input[type=date]", day(14)); save_btn(B).click(); B.wait_for_timeout(1500)
        set_kind(P, "sick"); P.fill("input[type=date]", day(14)); save_btn(P).click(); P.wait_for_timeout(1200)
        check("4 Refused also when the other day was saved from another phone", P.locator("[data-testid=save-error]").count() == 1 and len([e for e in month_raw(port) if e["date"] == day(14)]) == 1)
        ctxB.close()
        # another user may log a rest day on the same date
        P.locator("button[aria-pressed]", has_text="Grim").first.click(); P.wait_for_timeout(200)
        set_kind(P, "rest"); P.fill("input[type=date]", day(14)); save_btn(P).click(); P.wait_for_timeout(1500)
        check("4 Another user can log a rest day on the same date", len([e for e in month_raw(port) if e["date"] == day(14) and e["user"] == "grim"]) == 1)
        P.locator("button[aria-pressed]", has_text="Niva").first.click(); P.wait_for_timeout(200)

        # ---- 5. Statistics ----
        # Niva now has: real passes day 1, 2, 3, 12 (20 min x3). rest: 4, 5, 12, 14 = 4 ; sick: 6 = 1
        go_stats(P); stat_user(P, "Niva")
        body = P.locator("body").inner_text()
        check("5 Pass count excludes rest/sick days (4 passes)", re.search(r"\n4\nAntal pass", body) is not None, body[:300].replace("\n", "|"))
        hours = (60 + 30 + 120 + 20) / 60
        check("5 Hours exclude rest/sick (junk data on a rest day ignored)", f"{hours:.1f}" in body, f"{hours:.1f}")
        load = 60 * 5 + 30 * 6 + 120 * 10 + 20 * 3
        check("5 Load (AU) excludes rest/sick", str(load) in re.sub(r"[\s ]", "", body), str(load))
        off = P.locator("[data-testid=offday-stats]")
        check("5 Card 'Registrerade vilo-/sjukdagar' shows 'Vilodagar 4 · Sjukdagar 1'", "REGISTRERADE VILO-/SJUKDAGAR" in body and re.sub(r"\s+", " ", off.inner_text()) == "Vilodagar 4 · Sjukdagar 1", off.inner_text() if off.count() else "none")
        P.screenshot(path=str(SHOTS / "5_statistik_niva.png"), full_page=True)
        stat_user(P, "Grim")
        body = P.locator("body").inner_text()
        check("5 Grim (only rest days): 'no passes' message AND the card is still shown",
              "Inga pass loggade" in body and re.sub(r"\s+", " ", P.locator("[data-testid=offday-stats]").inner_text()) == "Vilodagar 5 · Sjukdagar 0", re.sub(r"\s+", " ", P.locator("[data-testid=offday-stats]").inner_text()) if P.locator("[data-testid=offday-stats]").count() else "none")
        stat_user(P, "Anna")
        check("5 User with no entries: card shows zeros (always visible)", re.sub(r"\s+", " ", P.locator("[data-testid=offday-stats]").inner_text()) == "Vilodagar 0 · Sjukdagar 0")
        P.screenshot(path=str(SHOTS / "5_statistik_anna.png"), full_page=True)
        stat_user(P, "Niva"); P.get_by_role("button", name="Alla månader").click(); P.wait_for_timeout(900)
        check("5 'Alla månader' also counts rest/sick separately", re.sub(r"\s+", " ", P.locator("[data-testid=offday-stats]").inner_text()) == "Vilodagar 4 · Sjukdagar 1", P.locator("[data-testid=offday-stats]").inner_text())
        go_log(P)

        # ---- 6. 'Samma som senast' and 'Vanligaste valen' ignore rest/sick ----
        ctxG, G = open_app(browser, port, "grim")
        s_pills = G.locator("[data-testid=sport-group] button[aria-pressed]").all_inner_texts()
        check("6 Grim (only rest days with sport A): defaults, no 'Samma som senast'", s_pills == ["Skidor", "Fotboll", "Löpning"] and G.locator("[data-testid=same-as-last]").count() == 0, str(s_pills))
        ctxG.close()
        ctx2, N = open_app(browser, port, "niva")
        txt = N.locator("[data-testid=same-as-last]").inner_text()
        check("6 Niva 'Samma som senast' = latest real pass (Pass on day 12, not the rest days)", "20 min" in txt and "Skidor" not in txt and "Aktivitet" not in txt, txt)

        # ---- 7. Edit ----
        row = rows(N, "offday-row").filter(has_text="lugn dag").first
        row.locator("button[title=Redigera]").click(); N.wait_for_timeout(400)
        check("7 Editing a rest day opens the form with Vilodag selected, notes filled", pressed(N, "rest") and N.input_value("textarea") == "lugn dag" and save_btn(N).inner_text().strip() == "Spara ändringar")
        N.fill("textarea", "lugn dag, redigerad"); set_kind(N, "sick")
        save_btn(N).click(); N.wait_for_timeout(1500)
        got = [e for e in month_raw(port) if e["anteckningar"] == "lugn dag, redigerad"]
        check("7 Rest day edited into a sick day: same id, kind=sick, still one entry on the date", len(got) == 1 and got[0]["kind"] == "sick" and got[0]["id"] != "" and len([e for e in month_raw(port) if e["date"] == day(12) and e.get("kind")]) == 1, str(got))
        # convert a pass to a rest day through edit: junk fields are emptied
        r1 = rows(N, "pass-row").filter(has_text="60 min").first
        pid = [e for e in month_raw(port) if e["date"] == day(1)][0]["id"]
        r1.locator("button[title=Redigera]").click(); N.wait_for_timeout(300)
        set_kind(N, "rest"); save_btn(N).click(); N.wait_for_timeout(1500)
        got = [e for e in month_raw(port) if e["id"] == pid]
        check("7 Pass edited into a rest day: same id, kind=rest, pass fields emptied", len(got) == 1 and got[0].get("kind") == "rest" and got[0]["sport"] == [] and got[0]["tid"] == "" and got[0]["kansla"] == "", str(got))

        # ---- 8. Delete ----
        row = rows(N, "offday-row").filter(has_text="redigerad").first
        row.locator("button[title='Ta bort']").click(); N.wait_for_timeout(300)
        title = N.locator("h2, [role=dialog] div.font-bold, .font-bold", has_text="Ta bort").first.inner_text()
        check("8 Delete dialog for a sick day says 'Ta bort sjukdagen?'", "Ta bort sjukdagen?" in N.locator("body").inner_text(), title)
        N.get_by_role("button", name="Ta bort", exact=True).last.click(); N.wait_for_timeout(1500)
        check("8 Sick day deleted", not [e for e in month_raw(port) if e["anteckningar"] == "lugn dag, redigerad"])

        # ---- 9. Offline: a rest day is queued as Ej sparat and sent later ----
        ctl(port, offline=1)
        set_kind(N, "rest"); N.fill("input[type=date]", day(22)); N.fill("textarea", "offline vila"); save_btn(N).click(); N.wait_for_timeout(2500)
        card = N.locator("[data-testid=pending-card]")
        check("9 Offline rest day shows as Ej sparat with 'Vilodag'", card.count() == 1 and "Vilodag" in card.first.inner_text(), card.first.inner_text() if card.count() else "no card")
        ctl(port, offline=0); N.evaluate("window.dispatchEvent(new Event('online'))"); N.wait_for_timeout(2500)
        got = [e for e in month_raw(port) if e["date"] == day(22)]
        check("9 After reconnecting the rest day is saved, queue empty", len(got) == 1 and got[0].get("kind") == "rest" and N.locator("[data-testid=pending-card]").count() == 0, str(got))
        check("9 No page errors", not N.errors and not P.errors, str(N.errors + P.errors))
        ctx2.close(); ctx.close()

        # ---- 10. CSV round trip + old CSV without 'Typ' ----
        before = norm(month_raw(port))
        ctxE, X = open_app(browser, port, "niva", accept_downloads=True)
        with X.expect_download() as dl:
            X.get_by_role("button", name="Exportera").click()
        csv_path = SHOTS / "export.csv"; dl.value.save_as(str(csv_path))
        text = csv_path.read_text(encoding="utf-8-sig")
        lines = text.strip().splitlines()
        check("10 CSV header ends with a new 'Typ' column", lines[0].split(";")[-1] == "Typ" and lines[0].split(";")[:7] == ["Datum", "Anvandare", "Sport", "Traningstyp", "Tid (min)", "Anstrangning (1-10)", "Anteckningar"], lines[0])
        check("10 CSV has Pass / Vilodag / Sjukdag values", {"Pass", "Vilodag"} <= {l.split(";")[-1] for l in lines[1:]} or False, str({l.split(";")[-1] for l in lines[1:]}))
        ctxE.close()
        port2 = 9402
        empty = seed_file([])
        m2 = start_mock(port2, empty)
        try:
            ctxI, I = open_app(browser, port2, "niva")
            I.locator("input[type=file]").set_input_files(str(csv_path)); I.wait_for_timeout(2500)
            after = norm(month_raw(port2))
            check("10 Round trip: export, empty database, import gives the same entries (incl. rest/sick)", after == before, f"{len(before)} vs {len(after)}\n  only before: {[x for x in before if x not in after][:3]}\n  only after: {[x for x in after if x not in before][:3]}")
            I.locator("input[type=file]").set_input_files(str(csv_path)); I.wait_for_timeout(2500)
            check("10 Importing the same file again creates no duplicates", norm(month_raw(port2)) == before)
            old = SHOTS / "old.csv"
            old.write_text("﻿Datum;Anvandare;Sport;Traningstyp;Tid (min);Anstrangning (1-10);Anteckningar\r\n" + f"{M}-28;Niva;F;TE;45;6;gammal fil\r\n", encoding="utf-8")
            I.locator("input[type=file]").set_input_files(str(old)); I.wait_for_timeout(2500)
            o = [e for e in month_raw(port2) if e["anteckningar"] == "gammal fil"]
            check("10 Old CSV without 'Typ' imports as a normal pass", len(o) == 1 and not o[0].get("kind") and o[0]["sport"] == ["F"] and o[0]["tid"] == "45", str(o))
            ctxI.close()
        finally:
            m2.terminate()

        # ---- 11. Old data without kind behaves as before ----
        ctxO, O = open_app(browser, port, "niva")
        check("11 Entries without kind are shown as normal passes", rows(O, "pass-row").filter(has_text="30 min").count() == 1)
        ctxO.close()
    finally:
        m.terminate()
    browser.close()

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
