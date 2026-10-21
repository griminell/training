"""Acceptance tests for 1.5.3 (run: python3 tools/test_153.py [path/to/index.html]).
Rensa button, Pass/Vilodag/Sjukdag above the date, divider under the user choice. Mobile viewport 390x844."""
import sys, os, json, subprocess, time, urllib.request, pathlib, tempfile, datetime, re
from playwright.sync_api import sync_playwright

def set_effort(P, n):
    """Tap the effort slider at the position of value n (1-10)."""
    sl = P.locator("[data-testid=effort-slider]"); sl.scroll_into_view_if_needed(); b = sl.bounding_box()
    P.mouse.click(b["x"] + 16 + (b["width"] - 32) * (n - 1) / 9, b["y"] + b["height"] / 2); P.wait_for_timeout(100)

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = sys.argv[1] if len(sys.argv) > 1 else str(ROOT / "index.html")
SHOTS = pathlib.Path(os.environ.get("SHOTS", "/tmp/shots_153")); SHOTS.mkdir(exist_ok=True, parents=True)
CODE = "testcode12345"
results = []
def check(name, cond, extra=""):
    results.append((name, bool(cond)))
    print(("PASS " if cond else "FAIL ") + name + (f"  [{extra}]" if extra else ""))

# Person menu (1.5.5): who is using the app + import/export/manage/disconnect live behind the chip top right
def menu_open(page):
    if page.locator("[data-testid=person-menu]").count() == 0:
        page.locator("[data-testid=person-chip]").click(); page.wait_for_selector("[data-testid=person-menu]")
def switch_user(page, name):
    menu_open(page); page.locator("[data-testid=person-menu] [role=menuitemradio]", has_text=name).click(); page.wait_for_timeout(250)


TODAY = datetime.datetime.now(datetime.timezone.utc).date()
M = TODAY.strftime("%Y-%m")
USERS = [{"id": "niva", "name": "Niva", "color": "#C2477A"}, {"id": "grim", "name": "Grim", "color": "#004B26"}, {"id": "anna", "name": "Anna", "color": "#1D6FA5"}]
SEED = [{"id": "s1", "date": f"{M}-02", "user": "niva", "sport": ["F"], "typ": ["TE"], "tid": "60", "kansla": "5", "anteckningar": "gammalt pass", "cr10": True},
        {"id": "s2", "date": f"{M}-03", "user": "niva", "kind": "rest", "sport": [], "typ": [], "tid": "", "kansla": "", "anteckningar": "vilodag A", "cr10": True},
        {"id": "s3", "date": f"{M}-04", "user": "niva", "kind": "sick", "sport": [], "typ": [], "tid": "", "kansla": "", "anteckningar": "sjukdag B", "cr10": True},
        {"id": "s4", "date": f"{M}-05", "user": "anna", "kind": "rest", "sport": [], "typ": [], "tid": "", "kansla": "", "anteckningar": "annas vila", "cr10": True}]
def seed_file():
    data = {"diaries": {CODE: {"meta:users": json.dumps(USERS), f"entries:{M}": json.dumps(SEED)}}}
    f = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False); json.dump(data, f); f.close(); return f.name
def start_mock(port):
    p = subprocess.Popen(["node", str(ROOT / "tools/mock-firebase.js"), str(port), seed_file()], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(50):
        try: urllib.request.urlopen(f"http://localhost:{port}/__stats"); return p
        except Exception: time.sleep(0.1)
    raise RuntimeError("mock did not start")
def puts(port): return json.load(urllib.request.urlopen(f"http://localhost:{port}/__stats"))["puts"]
def open_app(browser, port, me="niva"):
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    page = ctx.new_page(); page.errors = []
    page.on("pageerror", lambda e: page.errors.append(str(e)))
    page.add_init_script(f"try {{ localStorage.setItem('nivadagbok-me', '{me}') }} catch (e) {{}}")
    page.goto(f"file://{HTML}#db=http://localhost:{port}&code={CODE}")
    page.wait_for_selector("button:has-text('Spara')"); page.wait_for_timeout(700)
    return ctx, page
def clear_btn(P): return P.locator("[data-testid=clear-form]")
def pressed(P, k): return P.locator(f"[data-testid=kind-{k}]").get_attribute("aria-pressed") == "true"
def effort_set(P): return P.evaluate("[...document.querySelectorAll('button')].filter(b => /^(10|[1-9])$/.test(b.textContent.trim())).some(b => b.style.backgroundColor !== 'rgb(255, 255, 255)')")

with sync_playwright() as pw:
    browser = pw.chromium.launch()
    port = 9501; m = start_mock(port)
    try:
        ctx, P = open_app(browser, port, "niva")

        # ---- 1. Layout ----
        kb = P.locator("[data-testid=kind-group]").bounding_box(); db = P.locator("input[type=date]").bounding_box()
        check("1 Pass/Vilodag/Sjukdag sits above the date picker", kb["y"] + kb["height"] <= db["y"], f"{kb} {db}")
        check("1 Kind group has the full width", kb["width"] > 300 and kb["x"] + kb["width"] <= 390, str(kb))
        check("1 (1.5.5) The 'Loggar som' row and its divider are gone from the form", P.locator("[data-testid=user-divider]").count() == 0 and "LOGGAR SOM" not in P.locator("body").inner_text())
        pt = P.evaluate("parseFloat(getComputedStyle(document.querySelector('.max-w-3xl')).paddingTop)")
        check("1 (1.5.4) More air at the top (>= 40 px) so the title stays clear of the iOS soft edge", pt >= 40, str(pt))
        P.screenshot(path=str(SHOTS / "1_layout.png"), full_page=True)

        # ---- 2. Rensa: look ----
        sv = P.locator("button.w-full, button.flex-1", has_text=re.compile("^Spara")).first.bounding_box(); cb = clear_btn(P).bounding_box()
        css = P.evaluate("(() => { const b = document.querySelector('[data-testid=clear-form]'); const c = getComputedStyle(b); return [c.backgroundColor, c.borderTopColor, c.borderTopWidth] })()")
        check("2 Rensa sits next to Spara, smaller, same row", abs((cb["y"] + cb["height"] / 2) - (sv["y"] + sv["height"] / 2)) < 4 and cb["width"] < sv["width"] / 2 and cb["x"] > sv["x"], f"{cb} {sv}")
        check("2 Rensa has no fill and a border in the user colour (Niva #C2477A)", css[0] in ("rgba(0, 0, 0, 0)", "transparent") and css[1] == "rgb(194, 71, 122)" and css[2] == "1px", str(css))
        check("2 Rensa is dimmed/disabled while the form is empty", clear_btn(P).is_disabled() and clear_btn(P).inner_text().strip() == "Rensa")
        switch_user(P, "Grim")
        css2 = P.evaluate("getComputedStyle(document.querySelector('[data-testid=clear-form]')).borderTopColor")
        check("2 Rensa border follows the user colour (Grim #004B26)", css2 == "rgb(0, 75, 38)", css2)
        switch_user(P, "Niva")

        # ---- 3. Rensa: clears what was filled in, keeps date, user, kind ----
        P.fill("input[type=date]", f"{M}-10")
        P.locator("[data-testid=sport-group-more]").click()
        P.locator("[data-testid=sport-group] button[aria-pressed]", has_text=re.compile("^Pingis$")).first.click()
        P.locator("[data-testid=typ-group] button[aria-pressed]").first.click()
        P.fill("input[inputmode=numeric]", "45"); set_effort(P, 7); P.fill("textarea", "något jag skrev")
        check("3 Rensa is enabled once something is filled in", clear_btn(P).is_enabled())
        p0 = puts(port)
        clear_btn(P).click(); P.wait_for_timeout(300)
        check("3 Activity, type, time, effort and notes are emptied",
              P.locator("[data-testid=sport-group] button[aria-pressed=true]").count() == 0 and P.locator("[data-testid=typ-group] button[aria-pressed=true]").count() == 0
              and P.input_value("input[inputmode=numeric]") == "" and not effort_set(P) and P.input_value("textarea") == "")
        check("3 Date is kept", P.input_value("input[type=date]") == f"{M}-10", P.input_value("input[type=date]"))
        check("3 User and Pass stay selected", pressed(P, "pass") and P.locator("[data-testid=person-chip]").inner_text().strip() == "Niva")
        check("3 'Fler' folds back together", "Fler" in P.locator("[data-testid=sport-group-more]").inner_text())
        check("3 Rensa writes nothing to the database", puts(port) == p0)
        check("3 Rensa is disabled again", clear_btn(P).is_disabled())

        # kind stays (rest day)
        P.locator("[data-testid=kind-rest]").click(); P.fill("textarea", "vilotext")
        clear_btn(P).click(); P.wait_for_timeout(300)
        check("3 Rest day: notes emptied, Vilodag and date kept", pressed(P, "rest") and P.input_value("textarea") == "" and P.input_value("input[type=date]") == f"{M}-10")
        P.locator("[data-testid=kind-pass]").click()

        # ---- 4. Editing: the button is "Avbryt" ----
        P.locator("button[title=Redigera]").first.click(); P.wait_for_timeout(400)
        check("4 While editing the button reads 'Avbryt' and is enabled", clear_btn(P).inner_text().strip() == "Avbryt" and clear_btn(P).is_enabled())
        clear_btn(P).click(); P.wait_for_timeout(300)
        check("4 Avbryt ends the edit and empties the form, the saved pass is untouched",
              "Redigerar" not in P.locator("body").inner_text() and P.locator("[data-testid=sport-group] button[aria-pressed=true]").count() == 0
              and puts(port) == p0 and clear_btn(P).inner_text().strip() == "Rensa")

        # ---- 5. New activities: Cykel and Rullskidor, default order ----
        ctxG, G = open_app(browser, port, "grim")
        G.locator("[data-testid=sport-group-more]").click()
        order = G.locator("[data-testid=sport-group] button[aria-pressed]").all_inner_texts()
        check("5 New user: defaults (in default order) first, then Rullskidor, Alpint, Handboll, Promenad, Cykel, Barmarksträning, Pingis, Yoga, Pilates, Annat",
              order == ["Skidor", "Fotboll", "Löpning", "Rullskidor", "Alpint", "Handboll", "Promenad", "Cykel", "Barmarksträning", "Pingis", "Yoga", "Pilates", "Annat"], str(order))
        G.screenshot(path=str(SHOTS / "5_aktiviteter.png"), full_page=True)
        ctxG.close()
        P.locator("[data-testid=sport-group-more]").click()
        P.locator("[data-testid=sport-group] button[aria-pressed]", has_text=re.compile("^Cykel$")).click()
        P.fill("input[type=date]", f"{M}-11"); P.fill("input[inputmode=numeric]", "90"); set_effort(P, 5)
        P.locator("button.flex-1", has_text=re.compile("^Spara")).first.click(); P.wait_for_timeout(1500)
        raw = json.loads(json.load(urllib.request.urlopen(f"http://localhost:{port}/__raw?path=diaries/{CODE}/entries:{M}")))
        check("5 A Cykel pass is saved with code CY and shown in the list", any(e["sport"] == ["CY"] for e in raw) and P.locator("[data-testid=pass-row]", has_text="CY").count() == 1)
        P.locator("[data-testid=sport-group-more]").click()
        P.locator("[data-testid=sport-group] button[aria-pressed]", has_text=re.compile("^Rullskidor$")).click()
        P.fill("input[type=date]", f"{M}-12"); P.fill("[data-testid=tid-min]", "60"); set_effort(P, 6)
        P.locator("button.flex-1", has_text=re.compile("^Spara")).first.click(); P.wait_for_timeout(1500)
        raw = json.loads(json.load(urllib.request.urlopen(f"http://localhost:{port}/__raw?path=diaries/{CODE}/entries:{M}")))
        check("5 A Rullskidor pass is saved with code RU", any(e["sport"] == ["RU"] for e in raw))

        # ---- 6. Hide / show rest and sick days in the list ----
        tg = P.locator("[data-testid=toggle-offdays]")
        hb = tg.bounding_box(); hd = P.locator("div", has_text=re.compile("^LOGGADE PASS")).last.bounding_box()
        check("6 (1.5.4) Button sits left-aligned directly under the 'Loggade pass' heading", abs(hb["x"] - hd["x"]) < 3 and 0 <= hb["y"] - (hd["y"] + hd["height"]) < 16, f"{hb} {hd}")
        check("6 Button 'Vilo-/sjukdagar (2)' with open eye is shown (2 off days for Niva)", tg.count() == 1 and tg.inner_text().strip() == "Vilo-/sjukdagar (2)" and tg.locator("svg.lucide-eye").count() == 1, tg.inner_text() if tg.count() else "none")
        check("6 Off days are visible by default", P.locator("[data-testid=offday-row]").count() == 2)
        P.screenshot(path=str(SHOTS / "6_visas.png"), full_page=True)
        tg.click(); P.wait_for_timeout(300)
        check("6 Click hides the rest/sick rows, passes stay", P.locator("[data-testid=offday-row]").count() == 0 and P.locator("[data-testid=pass-row]").count() == 3, f"{P.locator('[data-testid=offday-row]').count()} {P.locator('[data-testid=pass-row]').count()}")
        check("6 Crossed-out eye and the count stay on the button", tg.locator("svg.lucide-eye-off").count() == 1 and "(2)" in tg.inner_text() and tg.get_attribute("aria-pressed") == "true")
        check("6 The choice is stored on the device", P.evaluate("localStorage.getItem('nivadagbok-hide-offdays')") == "1")
        P.screenshot(path=str(SHOTS / "6_dolda.png"), full_page=True)
        # applies to all persons: Grim has none (button gone), Anna only has a rest day (empty list message)
        switch_user(P, "Grim")
        check("6 Person without rest/sick days: no button", P.locator("[data-testid=toggle-offdays]").count() == 0)
        switch_user(P, "Anna")
        msg = P.locator("[data-testid=empty-list]")
        check("6 Same choice for another person: only a rest day -> 'Inga pass den här månaden. 1 vilo-/sjukdag är dold.'", msg.count() == 1 and msg.inner_text().strip() == "Inga pass den här månaden. 1 vilo-/sjukdag är dold.", msg.inner_text() if msg.count() else "none")
        P.screenshot(path=str(SHOTS / "6_anna_tom.png"), full_page=True)
        switch_user(P, "Niva")
        # statistics are not affected
        P.get_by_role("button", name="Statistik").click(); P.wait_for_timeout(500)
        P.locator("button[aria-pressed]", has_text="Niva").first.click() if P.locator("button[aria-pressed]", has_text="Niva").count() else None
        st = re.sub(r"\s+", " ", P.locator("[data-testid=offday-stats]").inner_text())
        check("6 Statistics still count the hidden days", st == "Vilodagar 1 · Sjukdagar 1", st)
        dots = P.evaluate("[...document.querySelectorAll('span.rounded-full.inline-block.h-2\\\\.5')].map(e => e.style.backgroundColor)")
        check("6 Activity chart: 13 activities have 13 different colours", len(dots) == 13 and len(set(dots)) == 13, str(dots))
        P.screenshot(path=str(SHOTS / "6_statistik.png"), full_page=True)
        P.get_by_role("button", name="Logga pass").click(); P.wait_for_timeout(300)
        # queued rest day stays visible although rest/sick days are hidden
        urllib.request.urlopen(f"http://localhost:{port}/__ctl?offline=1").read()
        P.locator("[data-testid=kind-rest]").click(); P.fill("input[type=date]", f"{M}-20"); P.fill("textarea", "köad vila")
        P.locator("button.flex-1", has_text=re.compile("^Spara")).first.click(); P.wait_for_timeout(2500)
        check("6 A queued (Ej sparat) rest day stays visible while rest/sick days are hidden", P.locator("[data-testid=pending-card]").count() == 1 and "Vilodag" in P.locator("[data-testid=pending-card]").inner_text())
        urllib.request.urlopen(f"http://localhost:{port}/__ctl?offline=0").read(); P.evaluate("window.dispatchEvent(new Event('online'))"); P.wait_for_timeout(2500)
        check("6 After reconnecting it is saved and the button counts 3", P.locator("[data-testid=pending-card]").count() == 0 and "(3)" in P.locator("[data-testid=toggle-offdays]").inner_text())
        P.locator("[data-testid=toggle-offdays]").click(); P.wait_for_timeout(300)
        check("6 Click again shows them again (open eye)", P.locator("[data-testid=offday-row]").count() == 3 and P.locator("[data-testid=toggle-offdays] svg.lucide-eye").count() == 1 and P.evaluate("localStorage.getItem('nivadagbok-hide-offdays')") == "0")

        # ---- 7. Still saves as before, and Rensa after a save ----
        P.fill("input[type=date]", f"{M}-11")
        P.locator("[data-testid=sport-group] button[aria-pressed]").first.click(); P.fill("input[inputmode=numeric]", "30"); set_effort(P, 4)
        P.locator("button.flex-1", has_text=re.compile("^Spara")).first.click(); P.wait_for_timeout(1500)
        raw = json.loads(json.load(urllib.request.urlopen(f"http://localhost:{port}/__raw?path=diaries/{CODE}/entries:{M}")))
        check("7 Saving still works (a normal pass after all that)", sum(1 for e in raw if e["sport"] == ["F"] or e["sport"]) >= 4, str(len(raw)))
        P.screenshot(path=str(SHOTS / "5_efter_sparning.png"), full_page=True)
        check("7 No page errors", not P.errors, str(P.errors))
        ctx.close()
    finally:
        m.terminate()
    browser.close()

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
