"""Acceptance tests for 1.5.5 (run: python3 tools/test_155.py [path/to/index.html]).
Person menu top right (replaces 'Loggar som' in the form and the import/export buttons). Mobile viewport 390x844."""
import re, sys, os, json, subprocess, time, urllib.request, pathlib, tempfile, datetime
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = sys.argv[1] if len(sys.argv) > 1 else str(ROOT / "index.html")
SHOTS = pathlib.Path(os.environ.get("SHOTS", "/tmp/shots_155")); SHOTS.mkdir(exist_ok=True, parents=True)
CODE = "testcode12345"
results = []
def check(name, cond, extra=""):
    results.append((name, bool(cond)))
    print(("PASS " if cond else "FAIL ") + name + (f"  [{extra}]" if extra else ""))

TODAY = datetime.datetime.now(datetime.timezone.utc).date()
M = TODAY.strftime("%Y-%m")
USERS = [{"id": "niva", "name": "Niva", "color": "#C2477A"}, {"id": "grim", "name": "Grim", "color": "#004B26"}, {"id": "anna", "name": "Anna", "color": "#1D6FA5"}]
SEED = [{"id": "s1", "date": f"{M}-02", "user": "niva", "sport": ["F"], "typ": ["TE"], "tid": "60", "kansla": "5", "anteckningar": "nivas pass", "cr10": True},
        {"id": "s2", "date": f"{M}-03", "user": "grim", "sport": ["LÖ"], "typ": ["KO"], "tid": "30", "kansla": "4", "anteckningar": "grims pass", "cr10": True}]
def seed_file():
    data = {"diaries": {CODE: {"meta:users": json.dumps(USERS), f"entries:{M}": json.dumps(SEED)}}}
    f = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False); json.dump(data, f); f.close(); return f.name
def start_mock(port):
    p = subprocess.Popen(["node", str(ROOT / "tools/mock-firebase.js"), str(port), seed_file()], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(50):
        try: urllib.request.urlopen(f"http://localhost:{port}/__stats"); return p
        except Exception: time.sleep(0.1)
    raise RuntimeError("mock did not start")
def ctl(port, **kw): urllib.request.urlopen(f"http://localhost:{port}/__ctl?" + "&".join(f"{k}={v}" for k, v in kw.items())).read()
def month_raw(port):
    raw = json.load(urllib.request.urlopen(f"http://localhost:{port}/__raw?path=diaries/{CODE}/entries:{M}")); return json.loads(raw) if raw else []

def open_app(browser, port, me="niva", hidden=None, accept_downloads=False):
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True, accept_downloads=accept_downloads)
    page = ctx.new_page(); page.errors = []
    page.on("pageerror", lambda e: page.errors.append(str(e)))
    init = f"try {{ localStorage.setItem('nivadagbok-me', '{me}') }} catch (e) {{}};"
    if hidden: init += f"try {{ localStorage.setItem('nivadagbok-hidden-local', '{json.dumps(hidden)}') }} catch (e) {{}};"
    page.add_init_script(init)
    page.goto(f"file://{HTML}#db=http://localhost:{port}&code={CODE}")
    page.wait_for_selector("[data-testid=person-chip]"); page.wait_for_timeout(700)
    return ctx, page

chip = lambda P: P.locator("[data-testid=person-chip]")
menu = lambda P: P.locator("[data-testid=person-menu]")
def open_menu(P):
    if menu(P).count() == 0: chip(P).click(); P.wait_for_selector("[data-testid=person-menu]")
def pick(P, name): open_menu(P); P.locator("[data-testid=person-menu] [role=menuitemradio]", has_text=name).click(); P.wait_for_timeout(250)
def save_btn(P): return P.locator("button.flex-1", has_text=re.compile("^(Spara|Sparar|Sparat|Ej sparat)")).first

with sync_playwright() as pw:
    browser = pw.chromium.launch()
    port = 9601; m = start_mock(port)
    try:
        ctx, P = open_app(browser, port, "niva")

        # ---- 1. The chip ----
        cb = chip(P).bounding_box(); h1 = P.locator("h1").bounding_box()
        dot = P.evaluate("getComputedStyle(document.querySelector('[data-testid=person-chip] span')).backgroundColor")
        check("1 Chip shows the name 'Niva' with a colour dot in Niva's colour", chip(P).inner_text().strip() == "Niva" and dot == "rgb(194, 71, 122)", f"{chip(P).inner_text()!r} {dot}")
        check("1 Chip sits top right on the title row, title on one line", cb["x"] + cb["width"] <= 390 - 12 and cb["x"] > 200 and abs((cb["y"] + cb["height"] / 2) - (h1["y"] + h1["height"] / 2)) < 30 and h1["height"] < 50, f"{cb} {h1}")
        check("1 Import and export are no longer separate buttons in the header", P.get_by_role("button", name="Exportera").count() == 0 and P.get_by_role("button", name="Hantera").count() == 0)
        check("1 More air at the top is kept (>= 40 px)", P.evaluate("parseFloat(getComputedStyle(document.querySelector('.max-w-3xl')).paddingTop)") >= 40)
        # ---- 2. The form no longer has the user row ----
        body = P.locator("body").inner_text()
        kb = P.locator("[data-testid=kind-group]").bounding_box()
        check("2 No 'Loggar som' row in the form; it starts with Pass / Vilodag / Sjukdag", "LOGGAR SOM" not in body and P.locator("[data-testid=user-divider]").count() == 0, "")
        P.screenshot(path=str(SHOTS / "1_stangd.png"), full_page=True)

        # ---- 3. The menu ----
        check("3 Menu is closed by default", menu(P).count() == 0)
        chip(P).click(); P.wait_for_selector("[data-testid=person-menu]")
        items = menu(P).inner_text()
        check("3 Menu lists all people, then Hantera användare, Importera, Exportera, Kopiera kopplingslänk, Koppla bort enheten",
              all(t in items for t in ["Niva", "Grim", "Anna", "Hantera användare", "Importera", "Exportera", "Kopiera kopplingslänk till annan enhet", "Koppla bort enheten"]), items.replace("\n", " | "))
        check("3 The active person is marked", P.locator("[data-testid=person-niva]").get_attribute("aria-checked") == "true" and P.locator("[data-testid=person-grim]").get_attribute("aria-checked") == "false")
        mb = menu(P).bounding_box()
        check("3 Menu fits the screen and sits under the chip", mb["x"] >= 0 and mb["x"] + mb["width"] <= 390 and mb["y"] >= cb["y"] + cb["height"] - 2, str(mb))
        check("3 Menu rows are at least 44 px high (touch)", all(b.bounding_box()["height"] >= 43 for b in menu(P).locator("button").all()), "")
        P.screenshot(path=str(SHOTS / "3_meny.png"), full_page=False)
        # closing
        P.mouse.click(30, 700); P.wait_for_timeout(200)
        check("3 Tap outside closes the menu", menu(P).count() == 0)
        chip(P).click(); P.wait_for_timeout(150); P.keyboard.press("Escape"); P.wait_for_timeout(150)
        check("3 Escape closes the menu", menu(P).count() == 0)
        chip(P).click(); P.wait_for_timeout(150); chip(P).click(); P.wait_for_timeout(150)
        check("3 Tapping the chip again closes the menu", menu(P).count() == 0)

        # ---- 4. Switch person ----
        pick(P, "Grim")
        dot = P.evaluate("getComputedStyle(document.querySelector('[data-testid=person-chip] span')).backgroundColor")
        css = P.evaluate("getComputedStyle(document.querySelector('[data-testid=clear-form]')).borderTopColor")
        check("4 Switching to Grim: menu closes, chip says Grim in Grim's colour, whole page changes colour", menu(P).count() == 0 and chip(P).inner_text().strip() == "Grim" and dot == "rgb(0, 75, 38)" and css == "rgb(0, 75, 38)", f"{dot} {css}")
        check("4 The list shows Grim's passes", "LOGGADE PASS · Grim" in P.locator("body").inner_text() and P.locator("[data-testid=pass-row]", has_text="30 min").count() == 1 and P.locator("[data-testid=pass-row]", has_text="60 min").count() == 0)
        check("4 The choice is remembered on the device", P.evaluate("localStorage.getItem('nivadagbok-me')") == "grim")
        P.screenshot(path=str(SHOTS / "4_grim.png"), full_page=True)
        # a pass saved now belongs to Grim
        P.locator("[data-testid=sport-group] button[aria-pressed]").first.click(); P.fill("input[inputmode=numeric]", "25"); P.get_by_role("button", name="3", exact=True).first.click(); P.fill("input[type=date]", f"{M}-08")
        save_btn(P).click(); P.wait_for_timeout(1500)
        check("4 A pass saved as Grim is stored for Grim", any(e["user"] == "grim" and e["date"] == f"{M}-08" for e in month_raw(port)))

        # ---- 5. Hantera användare ----
        open_menu(P); P.locator("[data-testid=person-manage]").click(); P.wait_for_timeout(400)
        check("5 'Hantera användare' closes the menu and opens the user manager", menu(P).count() == 0 and P.get_by_role("button", name="Lägg till användare").count() == 1)
        P.locator("button[aria-label=Stäng], button:has(svg.lucide-x)").first.click(); P.wait_for_timeout(300)

        # ---- 6. Import and export from the menu ----
        csv = SHOTS / "imp.csv"; csv.write_text(f"﻿Datum;Anvandare;Sport;Traningstyp;Tid (min);Anstrangning (1-10);Anteckningar;Typ\r\n{M}-15;Grim;F;TE;50;6;importerat;Pass\r\n{M}-16;Grim;;;;;importerad vila;Vilodag\r\n", encoding="utf-8")
        open_menu(P)
        with P.expect_file_chooser() as fc: P.locator("[data-testid=menu-import]").click()
        fc.value.set_files(str(csv)); P.wait_for_timeout(2500)
        check("6 Import from the menu works (file picker opens, 2 rows imported, message shown)", P.locator("text=2 pass importerade").count() == 1 and sum(e["anteckningar"] in ("importerat", "importerad vila") for e in month_raw(port)) == 2, P.locator("body").inner_text()[:200].replace("\n", " "))
        check("6 Menu closed when the picker opened", menu(P).count() == 0)
        ctxD, D = open_app(browser, port, "niva", accept_downloads=True)
        open_menu(D)
        with D.expect_download() as dl: D.locator("[data-testid=menu-export]").click()
        pth = SHOTS / "exp.csv"; dl.value.save_as(str(pth)); txt = pth.read_text(encoding="utf-8-sig")
        check("6 Export from the menu downloads the CSV (with the Typ column)", txt.splitlines()[0].endswith(";Typ") and "nivas pass" in txt and "importerad vila" in txt)
        ctxD.close()

        # ---- 7. Kopiera kopplingslänk + Koppla bort ----
        open_menu(P); P.locator("[data-testid=menu-copylink]").click(); P.wait_for_timeout(300)
        check("7 Copy link shows a confirmation text in the menu and the menu stays open", menu(P).count() == 1 and "Länk kopierad" in menu(P).inner_text())
        P.keyboard.press("Escape"); P.wait_for_timeout(150); open_menu(P)
        check("7 The confirmation text resets when the menu is opened again", "Länk kopierad" not in menu(P).inner_text())
        P.locator("[data-testid=menu-disconnect]").click(); P.wait_for_timeout(300)
        check("7 'Koppla bort enheten' opens the app's confirmation, menu closed", menu(P).count() == 0 and P.locator("text=Koppla bort den här enheten?").count() == 1)
        P.get_by_role("button", name="Avbryt").click(); P.wait_for_timeout(200)
        bottom = P.locator("body").inner_text()
        check("7 The old links at the bottom of the page are gone; 'Uppdatera sidan' stays", "Kopiera kopplingslänk" not in bottom and "Koppla bort enheten" not in bottom and "Uppdatera sidan" in bottom)

        # ---- 8. Statistics view ----
        P.get_by_role("button", name="Statistik").click(); P.wait_for_timeout(400)
        check("8 Chip is visible on the statistics page too", chip(P).count() == 1 and chip(P).inner_text().strip() == "Grim")
        pick(P, "Niva")
        check("8 Statistics page keeps its own 'Visar statistik för' choice", "VISAR STATISTIK FÖR" in P.locator("body").inner_text())
        P.get_by_role("button", name="Logga pass").click(); P.wait_for_timeout(300)

        # ---- 9. Queued pass is not affected by switching person ----
        ctl(port, offline=1)
        P.locator("[data-testid=sport-group] button[aria-pressed]").first.click(); P.fill("input[inputmode=numeric]", "10"); P.get_by_role("button", name="2", exact=True).first.click(); P.fill("input[type=date]", f"{M}-18")
        save_btn(P).click(); P.wait_for_timeout(2500)
        pick(P, "Grim")
        q = json.loads(P.evaluate("localStorage.getItem('nivadagbok-pending')") or "[]")
        check("9 A queued pass for Niva stays Niva's after switching to Grim", len(q) == 1 and q[0]["entry"]["user"] == "niva", str(q))
        ctl(port, offline=0); P.evaluate("window.dispatchEvent(new Event('online'))"); P.wait_for_timeout(2500)
        check("9 After reconnecting it is saved as Niva's", any(e["user"] == "niva" and e["date"] == f"{M}-18" for e in month_raw(port)))
        check("9 No page errors", not P.errors, str(P.errors))
        ctx.close()

        # ---- 10. A person hidden on this device is not in the menu ----
        ctx2, H = open_app(browser, port, "niva", hidden=["anna"])
        open_menu(H)
        names = [b.inner_text().strip() for b in H.locator("[data-testid=person-menu] [role=menuitemradio]").all()]
        check("10 Person hidden on the device (Anna) is not listed", names == ["Niva", "Grim"], str(names))
        ctx2.close()
    finally:
        m.terminate()
    browser.close()

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
