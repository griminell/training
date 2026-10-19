"""Acceptance tests for 1.5.0 (run: python3 tools/test_150.py [path/to/index.html]).
Starts its own mock Firebase servers. Mobile viewport 390x844, two browser contexts = two phones."""
import re, sys, os, json, subprocess, time, urllib.request, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = sys.argv[1] if len(sys.argv) > 1 else str(ROOT / "index.html")
SHOTS = pathlib.Path(os.environ.get("SHOTS", "/tmp/shots_150")); SHOTS.mkdir(exist_ok=True, parents=True)
results = []

def check(name, cond, extra=""):
    results.append((name, bool(cond)))
    print(("PASS " if cond else "FAIL ") + name + (f"  [{extra}]" if extra else ""))

def start_mock(port, *flags):
    p = subprocess.Popen(["node", str(ROOT / "tools/mock-firebase.js"), str(port), str(ROOT / "tools/seed.json"), *flags],
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(50):
        try: urllib.request.urlopen(f"http://localhost:{port}/__stats"); return p
        except Exception: time.sleep(0.1)
    raise RuntimeError("mock did not start")

def ctl(port, **kw):
    q = "&".join(f"{k}={v}" for k, v in kw.items())
    urllib.request.urlopen(f"http://localhost:{port}/__ctl?{q}").read()

def stats(port): return json.load(urllib.request.urlopen(f"http://localhost:{port}/__stats"))

def month(port, key):
    raw = json.load(urllib.request.urlopen(f"http://localhost:{port}/__raw?path=diaries/testcode12345/entries:{key}"))
    return json.loads(raw) if raw else []

def open_app(browser, port):
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    page = ctx.new_page()
    page.errors = []
    page.on("pageerror", lambda e: page.errors.append(str(e)))
    page.goto(f"file://{HTML}#db=http://localhost:{port}&code=testcode12345")
    page.wait_for_selector("button:has-text('Spara pass')")
    return ctx, page

def log_pass(page, sport="Fotboll", note="", minutes="30", effort="5", date=None):
    if date: page.fill("input[type=date]", date)
    # since 1.5.1 only the 3 most used choices are visible: open "Fler" if needed
    btn = page.locator("[data-testid=sport-group] button[aria-pressed]", has_text=re.compile(f"^{sport}$"))
    if btn.count() == 0:
        page.locator("[data-testid=sport-group-more]").click()
        btn = page.locator("[data-testid=sport-group] button[aria-pressed]", has_text=re.compile(f"^{sport}$"))
    btn.first.click()
    page.fill("input[inputmode=numeric]", minutes)
    page.get_by_role("button", name=effort, exact=True).first.click()
    if note: page.fill("textarea", note)

def click_save(page): page.get_by_role("button", name="Spara pass").click()

with sync_playwright() as pw:
    browser = pw.chromium.launch()

    # ---------- 1. Concurrency: two phones save to the same month at the same time ----------
    port = 9101; m = start_mock(port)
    try:
        ctxA, A = open_app(browser, port); ctxB, B = open_app(browser, port)
        A.wait_for_timeout(500)
        before = len(month(port, "2026-10"))
        ctl(port, delayGet=400)           # both read the same (soon stale) version
        log_pass(A, "Fotboll", "fran A", date="2026-10-18"); log_pass(B, "Skidor", "fran B", date="2026-10-18")
        click_save(A); click_save(B)
        A.wait_for_timeout(3500); ctl(port, delayGet=0)
        notes = sorted(e["anteckningar"] for e in month(port, "2026-10"))
        st = stats(port)
        check("1 Concurrency: both passes kept", "fran A" in notes and "fran B" in notes and len(notes) == before + 2, f"{notes} conflicts={st['conflicts']}")
        check("1 Concurrency: the race really happened (a 412 occurred)", st["conflicts"] >= 1, f"conflicts={st['conflicts']}")
        check("1 Footer says protection on", A.locator("[data-testid=protection]").inner_text().endswith("på"), A.locator("[data-testid=protection]").inner_text())
        check("1 No page errors", not A.errors and not B.errors, str(A.errors + B.errors))
        ctxA.close(); ctxB.close()
    finally:
        m.terminate()

    # ---------- 2. Network off -> Ej sparat -> auto-save when back, no duplicates ----------
    port = 9102; m = start_mock(port)
    try:
        ctx, P = open_app(browser, port); P.wait_for_timeout(500)
        before = len(month(port, "2026-10"))
        ctl(port, offline=1)
        log_pass(P, "Löpning", "offline pass", date="2026-10-19"); click_save(P)
        P.wait_for_selector("[data-testid=pending-card]", timeout=15000)
        check("2 Pass shows as Ej sparat card", P.locator("[data-testid=pending-card]").count() == 1)
        check("2 Banner says 1 pass väntar", P.locator("text=1 pass väntar på att sparas").count() == 1)
        check("2 Not saved on server", len(month(port, "2026-10")) == before)
        P.screenshot(path=str(SHOTS / "2_ej_sparat.png"), full_page=True)
        stored = P.evaluate("JSON.parse(localStorage.getItem('nivadagbok-pending'))")
        check("2 Queue persisted in localStorage", len(stored) == 1 and stored[0]["entry"]["anteckningar"] == "offline pass")
        # reload while offline: queue survives
        P.reload(); P.wait_for_selector("button:has-text('Spara pass')"); P.wait_for_selector("[data-testid=pending-card]", timeout=15000)
        check("2 Queue survives reload", P.locator("[data-testid=pending-card]").count() == 1)
        # Manual 'Spara igen' while still offline: stays, attempts grow -> red banner at >=3
        for _ in range(2):
            P.get_by_role("button", name="Spara igen").click(); P.wait_for_timeout(1500)
        attempts = P.evaluate("JSON.parse(localStorage.getItem('nivadagbok-pending'))[0].attempts")
        check("2 Attempts counted", attempts >= 3, f"attempts={attempts}")
        check("2 Red warning after >=3 failures", P.locator("text=Rensa inte webbläsardata").count() == 1)
        P.screenshot(path=str(SHOTS / "2_roed_banner.png"), full_page=True)
        # network back -> automatic retry (we trigger the 'online' event like the browser would)
        ctl(port, offline=0)
        P.evaluate("window.dispatchEvent(new Event('online'))")
        P.wait_for_function("document.querySelectorAll('[data-testid=pending-card]').length === 0", timeout=15000)
        P.wait_for_timeout(500)
        got = [e for e in month(port, "2026-10") if e["anteckningar"] == "offline pass"]
        check("2 Auto-saved when back online, exactly once", len(got) == 1 and len(month(port, "2026-10")) == before + 1)
        check("2 Queue empty afterwards", P.evaluate("JSON.parse(localStorage.getItem('nivadagbok-pending')).length") == 0)
        P.screenshot(path=str(SHOTS / "2_efter_online.png"), full_page=True)
        check("2 No page errors", not P.errors, str(P.errors))
        ctx.close()
    finally:
        m.terminate()

    # ---------- 3. Lost response: server saved but client saw failure -> retry must not duplicate ----------
    port = 9103; m = start_mock(port)
    try:
        ctx, P = open_app(browser, port); P.wait_for_timeout(500)
        before = len(month(port, "2026-10"))
        # the server APPLIES the PUTs but the answers never arrive (every try in the first attempt)
        ctl(port, dropPutResponse=40)
        log_pass(P, "Fotboll", "lost response", date="2026-10-19"); click_save(P)
        P.wait_for_selector("[data-testid=pending-card]", timeout=20000)
        applied = len([e for e in month(port, "2026-10") if e["anteckningar"] == "lost response"])
        check("3 Server did apply the pass although the app saw a failure", applied == 1, f"applied={applied}")
        ctl(port, dropPutResponse=0)
        P.evaluate("window.dispatchEvent(new Event('online'))")
        P.wait_for_function("document.querySelectorAll('[data-testid=pending-card]').length === 0", timeout=15000)
        final = len([e for e in month(port, "2026-10") if e["anteckningar"] == "lost response"])
        check("3 No duplicate after retry (replace by id)", final == 1, f"applied-before-retry={applied}, final={final}")
        ctx.close()
    finally:
        m.terminate()

    # ---------- 4. Ej sparat: Redigera and Radera ----------
    port = 9104; m = start_mock(port)
    try:
        ctx, P = open_app(browser, port); P.wait_for_timeout(500)
        before = len(month(port, "2026-10"))
        ctl(port, offline=1)
        log_pass(P, "Fotboll", "to edit", date="2026-10-19"); click_save(P)
        P.wait_for_selector("[data-testid=pending-card]", timeout=15000)
        P.get_by_role("button", name="Redigera").first.click()
        check("4 Redigera loads pass back in form", P.input_value("textarea") == "to edit" and P.locator("text=Redigerar osparat pass").count() == 1)
        P.fill("textarea", "edited offline")
        P.get_by_role("button", name="Spara ändringar").click()
        P.wait_for_selector("[data-testid=pending-card]", timeout=15000); P.wait_for_timeout(500)
        q = P.evaluate("JSON.parse(localStorage.getItem('nivadagbok-pending'))")
        check("4 Edit replaces the queued pass (still one)", len(q) == 1 and q[0]["entry"]["anteckningar"] == "edited offline", str(len(q)))
        P.get_by_role("button", name="Radera").click()
        check("4 Radera asks for confirmation", P.locator("text=Ta bort det osparade passet?").count() == 1 and P.locator("text=Det finns inte på någon annan enhet.").count() == 1)
        P.screenshot(path=str(SHOTS / "4_radera_ej_sparat.png"))
        P.get_by_role("button", name="Avbryt").click()
        check("4 Avbryt keeps it", P.locator("[data-testid=pending-card]").count() == 1)
        P.get_by_role("button", name="Radera").click(); P.locator("[role=dialog]").get_by_role("button", name="Ta bort", exact=True).click()
        P.wait_for_timeout(300)
        check("4 Confirmed delete removes it", P.locator("[data-testid=pending-card]").count() == 0 and P.evaluate("JSON.parse(localStorage.getItem('nivadagbok-pending')).length") == 0)
        ctl(port, offline=0); P.evaluate("window.dispatchEvent(new Event('online'))"); P.wait_for_timeout(1500)
        check("4 Nothing reaches server after delete", len(month(port, "2026-10")) == before)
        ctx.close()
    finally:
        m.terminate()

    # ---------- 5. Delete of a saved pass: confirmation, needs connection ----------
    port = 9105; m = start_mock(port)
    try:
        ctx, P = open_app(browser, port); P.wait_for_timeout(800)
        before = len(month(port, "2026-10"))
        P.locator("button[title='Ta bort']").first.click()
        check("5 Delete asks for confirmation", P.locator("text=Ta bort passet?").count() == 1)
        P.screenshot(path=str(SHOTS / "5_radera_sparat.png"))
        P.get_by_role("button", name="Avbryt").click(); P.wait_for_timeout(200)
        check("5 Avbryt deletes nothing", len(month(port, "2026-10")) == before)
        ctl(port, offline=1)
        P.locator("button[title='Ta bort']").first.click(); P.locator("[role=dialog]").get_by_role("button", name="Ta bort", exact=True).click()
        P.wait_for_selector("text=Kunde inte ta bort, försök igen.", timeout=15000)
        check("5 Offline: 'Kunde inte ta bort' and pass kept", len(month(port, "2026-10")) == before)
        ctl(port, offline=0)
        P.locator("[role=dialog]").get_by_role("button", name="Ta bort", exact=True).click()
        P.wait_for_function("document.body.innerText.indexOf('Ta bort passet?') === -1", timeout=10000)
        check("5 Online: confirmed delete works", len(month(port, "2026-10")) == before - 1)
        ctx.close()
    finally:
        m.terminate()

    # ---------- 6. Move pass to another month: new month first, old removed after; survives failure in between ----------
    port = 9106; m = start_mock(port)
    try:
        ctx, P = open_app(browser, port); P.wait_for_timeout(800)
        oct0, aug0 = len(month(port, "2026-10")), len(month(port, "2026-08"))
        P.locator("button[title='Redigera']").first.click()   # newest October pass
        P.fill("input[type=date]", "2026-08-20")
        P.get_by_role("button", name="Spara ändringar").click()
        P.wait_for_timeout(1500)
        check("6 Move: pass now in August, gone from October", len(month(port, "2026-08")) == aug0 + 1 and len(month(port, "2026-10")) == oct0 - 1)
        # now with failure after step 1: fail the next PUT after the first succeeds
        ctx.close()
        ctx, P = open_app(browser, port); P.wait_for_timeout(800)
        oct1, aug1 = len(month(port, "2026-10")), len(month(port, "2026-08"))
        P.locator("button[title='Redigera']").first.click()
        P.fill("input[type=date]", "2026-08-21")
        # first PUT ok, second PUT (removing from October) fails with 500
        P.evaluate("""() => { const o = window.fetch; window.__origFetch = o; let puts = 0; window.fetch = (u, opts) => { if (opts && opts.method === 'PUT') { puts++; if (puts === 2 || puts === 3) return Promise.reject(new TypeError('boom')); } return o(u, opts); }; }""")
        P.get_by_role("button", name="Spara ändringar").click()
        P.wait_for_selector("[data-testid=pending-card]", timeout=15000)
        check("6 Step 1 done, step 2 failed: pass exists in August (never lost)", len(month(port, "2026-08")) == aug1 + 1 and len(month(port, "2026-10")) == oct1)
        P.evaluate("() => { window.fetch = window.__origFetch; }")
        P.evaluate("window.dispatchEvent(new Event('online'))")
        P.wait_for_function("document.querySelectorAll('[data-testid=pending-card]').length === 0", timeout=15000)
        check("6 Retry finishes the move, no duplicates", len(month(port, "2026-08")) == aug1 + 1 and len(month(port, "2026-10")) == oct1 - 1)
        ctx.close()
    finally:
        m.terminate()

    # ---------- 7. Fallback: browser cannot read ETag ----------
    port = 9107; m = start_mock(port, "--no-expose-etag")
    try:
        ctxA, A = open_app(browser, port); ctxB, B = open_app(browser, port); A.wait_for_timeout(800)
        check("7 Footer says 'begränsat'", A.locator("[data-testid=protection]").inner_text().endswith("begränsat"), A.locator("[data-testid=protection]").inner_text())
        before = len(month(port, "2026-10"))
        ctl(port, delayGet=300)
        log_pass(A, "Fotboll", "fb A", date="2026-10-18"); log_pass(B, "Skidor", "fb B", date="2026-10-18")
        click_save(A); click_save(B)
        A.wait_for_timeout(4000); ctl(port, delayGet=0)
        notes = sorted(e["anteckningar"] for e in month(port, "2026-10"))
        check("7 Fallback mode: both passes kept", "fb A" in notes and "fb B" in notes and len(notes) == before + 2, str(notes))
        ctxA.close(); ctxB.close()
    finally:
        m.terminate()

    # ---------- 8. Fallback: server rejects the if-match header (CORS) ----------
    port = 9108; m = start_mock(port, "--no-ifmatch-cors")
    try:
        ctx, P = open_app(browser, port); P.wait_for_timeout(800)
        before = len(month(port, "2026-10"))
        log_pass(P, "Fotboll", "nocors", date="2026-10-18"); click_save(P)
        P.wait_for_timeout(2500)
        check("8 Save works even if if-match is refused", len(month(port, "2026-10")) == before + 1 and P.locator("[data-testid=pending-card]").count() == 0)
        check("8 Footer says 'begränsat'", P.locator("[data-testid=protection]").inner_text().endswith("begränsat"), P.locator("[data-testid=protection]").inner_text())
        ctx.close()
    finally:
        m.terminate()

    # ---------- 9. Old data, export, import round trip, users ----------
    port = 9109; m = start_mock(port)
    try:
        ctx, P = open_app(browser, port); P.wait_for_timeout(800)
        P.get_by_role("button", name="Statistik").click(); P.wait_for_timeout(500)
        check("9 Old passes still load in stats", P.locator("text=Antal pass").count() == 1)
        P.get_by_role("button", name="Logga pass").click()
        # CSV import (new rows) through saveMonth
        csv = "Datum;Anvandare;Sport;Traningstyp;Tid (min);Anstrangning (1-10);Anteckningar\r\n2026-10-10;Niva;F;KO;40;5;imp1\r\n2026-07-04;Niva;S;TE;50;6;imp2\r\n"
        pathlib.Path("/tmp/imp.csv").write_text(csv)
        P.set_input_files("input[type=file]", "/tmp/imp.csv"); P.wait_for_timeout(2000)
        check("9 Import added to both months", any(e["anteckningar"] == "imp1" for e in month(port, "2026-10")) and any(e["anteckningar"] == "imp2" for e in month(port, "2026-07")))
        P.set_input_files("input[type=file]", "/tmp/imp.csv"); P.wait_for_timeout(2000)
        check("9 Importing same file again adds no duplicates", sum(e["anteckningar"] == "imp1" for e in month(port, "2026-10")) == 1)
        # export aborts when a month cannot be fetched
        ctl(port, offline=1)
        P.get_by_role("button", name="Exportera").click(); P.wait_for_timeout(1500)
        check("9 Export refuses to make an incomplete file", P.locator("text=Exporten avbröts").count() == 1)
        ctl(port, offline=0)
        # users: add a user (goes through saveKey too)
        P.get_by_role("button", name="Hantera användare").click(); P.wait_for_timeout(300)
        P.get_by_role("button", name="Lägg till användare").click()
        P.fill("input[placeholder='t.ex. Alva']", "Alva")
        P.locator("[role=dialog], .fixed").get_by_role("button", name="Spara", exact=True).click(); P.wait_for_timeout(1000)
        users = json.loads(json.load(urllib.request.urlopen(f"http://localhost:{port}/__raw?path=diaries/testcode12345/meta:users")))
        check("9 User list saved via saveKey (Alva added, others kept)", any(u["name"] == "Alva" for u in users) and len(users) == 3, str([u["name"] for u in users]))
        ctx.close()
    finally:
        m.terminate()

    # ---------- 10. Disconnect confirmation (no browser confirm()) ----------
    port = 9110; m = start_mock(port)
    try:
        ctx, P = open_app(browser, port); P.wait_for_timeout(500)
        dialogs = []
        P.on("dialog", lambda d: (dialogs.append(d.message), d.dismiss()))
        P.get_by_role("button", name="Koppla bort enheten").click()
        check("10 Disconnect uses app modal", P.locator("text=Koppla bort den här enheten?").count() == 1 and not dialogs)
        P.get_by_role("button", name="Avbryt").click()
        ctx.close()
    finally:
        m.terminate()

    browser.close()

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
