"""Acceptance tests for 1.5.1 (run: python3 tools/test_151.py [path/to/index.html]).
Covers "Vanligaste valen + Fler" and "Samma som senast". Mobile viewport 390x844.
The seed is generated relative to today, so the tests do not age."""
import re, sys, os, json, subprocess, time, urllib.request, pathlib, tempfile, datetime
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = sys.argv[1] if len(sys.argv) > 1 else str(ROOT / "index.html")
SHOTS = pathlib.Path(os.environ.get("SHOTS", "/tmp/shots_151")); SHOTS.mkdir(exist_ok=True, parents=True)
results = []
# The page is served over http: with file:// headless Chromium sometimes forgets localStorage on reload (test harness flake, not the app).
HTTP_PORT = 8751
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(HTTP_PORT), "--bind", "127.0.0.1", "--directory", str(pathlib.Path(HTML).resolve().parent)],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
import atexit; atexit.register(srv.terminate)
time.sleep(0.8)

def check(name, cond, extra=""):
    results.append((name, bool(cond)))
    print(("PASS " if cond else "FAIL ") + name + (f"  [{extra}]" if extra else ""))

TODAY = datetime.datetime.now(datetime.timezone.utc).date()
def d(n): return (TODAY - datetime.timedelta(days=n)).isoformat()

def entry(i, n, user, sport, typ, tid, kansla, note=""):
    return {"id": f"s{i}", "date": d(n), "user": user, "sport": sport, "typ": typ, "tid": str(tid), "kansla": str(kansla), "anteckningar": note, "cr10": True}

def build_seed():
    es = [
        # niva, last 30 days. sports: LÖ x3, PR x2, F x1, S x1. types: ST x3, IN x2, KO x1, TE x1, SK x1
        entry(1, 1, "niva", ["LÖ"], ["KO"], 45, 7),
        entry(2, 3, "niva", ["LÖ"], ["ST"], 30, 6),
        entry(3, 5, "niva", ["LÖ"], ["ST", "IN"], 40, 5),
        entry(4, 7, "niva", ["PR"], ["IN"], 50, 3),
        entry(5, 9, "niva", ["PR"], ["ST"], 20, 2),
        entry(6, 11, "niva", ["F"], ["TE"], 60, 4),
        entry(7, 13, "niva", ["S"], ["SK"], 60, 4),
        # niva, older than 30 days: must NOT count (5x F + TE would otherwise take the lead)
        *[entry(10 + k, 40 + k, "niva", ["F"], ["TE"], 60, 5) for k in range(5)],
        # grim: only one pass, ~75 days ago (another month than today): defaults + look-back test
        entry(30, 75, "grim", ["S"], ["IN"], 90, 8),
    ]
    by = {}
    for e in es: by.setdefault(e["date"][:7], []).append(e)
    data = {"diaries": {"testcode12345": {
        "meta:users": json.dumps([{"id": "niva", "name": "Niva", "color": "#C2477A"}, {"id": "grim", "name": "Grim", "color": "#004B26"}]),
        **{f"entries:{m}": json.dumps(sorted(v, key=lambda e: e["date"])) for m, v in by.items()}}}}
    f = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False); json.dump(data, f); f.close()
    return f.name

def start_mock(port, seed):
    p = subprocess.Popen(["node", str(ROOT / "tools/mock-firebase.js"), str(port), seed], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(50):
        try: urllib.request.urlopen(f"http://localhost:{port}/__stats"); return p
        except Exception: time.sleep(0.1)
    raise RuntimeError("mock did not start")

def open_app(browser, port, me="niva"):
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    page = ctx.new_page(); page.errors = []
    page.on("pageerror", lambda e: page.errors.append(str(e)))
    page.add_init_script(f"try {{ localStorage.setItem('nivadagbok-me', '{me}') }} catch (e) {{}}")
    page.goto(f"http://127.0.0.1:{HTTP_PORT}/{pathlib.Path(HTML).name}#db=http://localhost:{port}&code=testcode12345")
    page.wait_for_selector("button:has-text('Spara pass')")
    page.wait_for_timeout(700)  # usage counted once at open
    return ctx, page

def reload_ready(page):
    page.reload()
    try:
        page.wait_for_selector("button:has-text('Spara pass')", timeout=10000)
    except Exception:
        print("DIAG reload failed. errors:", page.errors, "url:", page.url)
        print("DIAG body:", page.evaluate("document.body.innerText")[:400].replace("\n", " | "))
        print("DIAG localStorage keys:", page.evaluate("(() => { try { return Object.keys(localStorage) } catch (e) { return 'ERR ' + e } })()"))
        page.screenshot(path=str(SHOTS / "diag_reload.png"))
        raise
    page.wait_for_timeout(900)

def pills(page, group):
    return page.locator(f"[data-testid={group}] button[aria-pressed]").all_inner_texts()
def pressed(page, group):
    return page.locator(f"[data-testid={group}] button[aria-pressed=true]").all_inner_texts()
def more(page, group):
    loc = page.locator(f"[data-testid={group}-more]")
    return loc.inner_text() if loc.count() else None

def pick(page, group, label):
    btn = page.locator(f"[data-testid={group}] button[aria-pressed]", has_text=re.compile(f"^{label}$"))
    if btn.count() == 0:
        page.locator(f"[data-testid={group}-more]").click()
        btn = page.locator(f"[data-testid={group}] button[aria-pressed]", has_text=re.compile(f"^{label}$"))
    btn.first.click()

seed = build_seed()
with sync_playwright() as pw:
    browser = pw.chromium.launch()
    port = 9301; m = start_mock(port, seed)
    try:
        ctx, P = open_app(browser, port, "niva")

        # 1. Most used, last 30 days only, per user
        check("1 Niva sports: 3 most used first (older passes ignored)", pills(P, "sport-group") == ["Löpning", "Promenad", "Skidor"], str(pills(P, "sport-group")))
        check("1 Niva sports: 'Fler (6)'", more(P, "sport-group") == "Fler (6)", str(more(P, "sport-group")))
        check("1 Niva types: Styrka, Intervall, Teknik", pills(P, "typ-group") == ["Styrka", "Intervall", "Teknik"], str(pills(P, "typ-group")))
        check("1 Niva types: 'Fler (7)'", more(P, "typ-group") == "Fler (7)", str(more(P, "typ-group")))
        P.screenshot(path=str(SHOTS / "1_niva_forst.png"), full_page=True)

        # 2. Fler / Färre, selected hidden choice stays visible
        P.locator("[data-testid=sport-group-more]").click()
        check("2 Fler shows all 9 sports + Färre", len(pills(P, "sport-group")) == 9 and more(P, "sport-group") == "Färre", str(pills(P, "sport-group")))
        P.screenshot(path=str(SHOTS / "2_fler_utfallt.png"), full_page=True)
        P.locator("[data-testid=sport-group] button[aria-pressed]", has_text=re.compile("^Alpint$")).click()
        P.locator("[data-testid=sport-group-more]").click()   # Färre
        check("2 Selected hidden choice (Alpint) stays visible after Färre", pills(P, "sport-group") == ["Löpning", "Promenad", "Skidor", "Alpint"] and pressed(P, "sport-group") == ["Alpint"], str(pills(P, "sport-group")))
        check("2 'Fler (5)' counts only the still hidden", more(P, "sport-group") == "Fler (5)", str(more(P, "sport-group")))
        P.locator("[data-testid=sport-group] button[aria-pressed]", has_text=re.compile("^Alpint$")).click()  # deselect again
        check("2 Deselected: back to the top 3", pills(P, "sport-group") == ["Löpning", "Promenad", "Skidor"])

        # 3. Order does not change while logging; recalculated when the app is opened again
        for k in range(2):
            pick(P, "sport-group", "Pingis")
            P.fill("input[inputmode=numeric]", "20"); P.get_by_role("button", name="3", exact=True).first.click()
            P.get_by_role("button", name="Spara pass").click(); P.wait_for_timeout(1200)
            check(f"3 After saving Pingis pass #{k + 1}: order unchanged", pills(P, "sport-group") == ["Löpning", "Promenad", "Skidor"], str(pills(P, "sport-group")))
        reload_ready(P)
        check("3 After reopening: recalculated (Pingis now in top 3; ties follow the default order)", pills(P, "sport-group") == ["Löpning", "Promenad", "Pingis"], str(pills(P, "sport-group")))
        ctx.close()

        # 4. New user without recent history gets the defaults; look-back over month boundaries
        ctx, G = open_app(browser, port, "grim")
        check("4 Grim sports: defaults", pills(G, "sport-group") == ["Skidor", "Fotboll", "Löpning"], str(pills(G, "sport-group")))
        check("4 Grim types: defaults", pills(G, "typ-group") == ["Teknik", "Kondition", "Styrka"], str(pills(G, "typ-group")))
        txt = G.locator("[data-testid=same-as-last]").inner_text() if G.locator("[data-testid=same-as-last]").count() else ""
        check("4 Samma som senast looks back over months (75 days)", txt == "Samma som senast: Skidor · Intervall · 90 min", txt)
        G.screenshot(path=str(SHOTS / "4_grim.png"), full_page=True)
        G.locator("[data-testid=same-as-last]").click()
        check("4 Intervall is selected although it was hidden (always visible when selected)", "Intervall" in pressed(G, "typ-group") and "Intervall" in pills(G, "typ-group"), str(pills(G, "typ-group")))
        ctx.close()

        # 5. Samma som senast fills activity, type and time only
        ctx, P = open_app(browser, port, "niva")
        # the newest niva pass is seed pass 1 (yesterday)... unless the Pingis passes added above are newer
        P.fill("input[type=date]", d(2)); P.fill("textarea", "mina anteckningar")
        txt = P.locator("[data-testid=same-as-last]").inner_text()
        check("5 Button shows the latest pass (the Pingis one saved today)", txt == "Samma som senast: Pingis · 20 min", txt)
        P.get_by_role("button", name="9", exact=True).first.click()   # user already chose effort 9: must stay
        P.locator("[data-testid=same-as-last]").click()
        check("5 Activity and time filled", pressed(P, "sport-group") == ["Pingis"] and P.input_value("input[inputmode=numeric]") == "20", f"{pressed(P, 'sport-group')} {P.input_value('input[inputmode=numeric]')}")
        check("5 Date and notes untouched", P.input_value("input[type=date]") == d(2) and P.input_value("textarea") == "mina anteckningar")
        bg9 = P.evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.trim() === '9').style.backgroundColor")
        check("5 Effort not overwritten", bg9 != "white", bg9)
        # fresh form: effort is empty after Samma som senast
        reload_ready(P)
        P.locator("[data-testid=same-as-last]").click()
        any_effort = P.evaluate("[...document.querySelectorAll('button')].filter(b => /^(10|[1-9])$/.test(b.textContent.trim())).some(b => b.style.backgroundColor !== 'white')")
        check("5 Effort is NOT filled in by Samma som senast", not any_effort)
        # hidden while editing a saved pass
        P.locator("button[title='Redigera']").first.click(); P.wait_for_timeout(300)
        check("5 Button hidden while editing", P.locator("[data-testid=same-as-last]").count() == 0)
        P.screenshot(path=str(SHOTS / "5_redigerar.png"), full_page=True)
        check("5 No page errors", not P.errors, str(P.errors))
        ctx.close()
    finally:
        m.terminate()
    browser.close()

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
