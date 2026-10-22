"""Acceptance tests for 1.7.2: effort (1-10) as a slider that starts unset."""
import re, sys, os, json, pathlib
HTML = sys.argv[1] if len(sys.argv) > 1 else str(pathlib.Path(__file__).resolve().parent.parent / "index.html")
sys.argv = [sys.argv[0], HTML]
src = open(pathlib.Path(__file__).resolve().parent / "test_160.py", encoding="utf-8").read().split("with sync_playwright()")[0]
__file__ = str(pathlib.Path(__file__).resolve())
os.environ.setdefault("SHOTS", "/tmp/shots_172")
exec(src)
from playwright.sync_api import sync_playwright

def set_effort(P, n):
    sl = P.locator("[data-testid=effort-slider]"); sl.scroll_into_view_if_needed(); b = sl.bounding_box()
    P.mouse.click(b["x"] + 16 + (b["width"] - 32) * (n - 1) / 9, b["y"] + b["height"] / 2); P.wait_for_timeout(100)
def raw_entries(port):
    return json.loads(json.load(urllib.request.urlopen(f"http://localhost:{port}/__raw?path=diaries/{CODE}/entries:{M}")))
def save(P):
    P.locator("button.flex-1", has_text=re.compile("^Spara")).first.click(); P.wait_for_timeout(1500)
def val(P): return P.locator("[data-testid=effort-value-text]").inner_text()

with sync_playwright() as pw:
    browser = pw.chromium.launch(); port = 9772; m = start_mock(port)
    try:
        ctx, P = open_app(browser, port, "niva", "light", "light")
        check("1 Effort starts unset: dash, no thumb, hint, no number buttons", val(P) == "–" and P.locator("[data-testid=effort-thumb]").count() == 0 and P.locator("[data-testid=effort-slider-hint]").count() == 1 and P.get_by_role("button", name="7", exact=True).count() == 0)
        check("1 Borg text and anchors are still shown", "Skala enligt Borg CR10" in P.locator("body").inner_text() and "1 = Mycket lätt" in P.locator("body").inner_text())
        set_effort(P, 7)
        check("2 Tap sets 7 and shows the thumb", val(P) == "7" and P.locator("[data-testid=effort-thumb]").count() == 1)
        set_effort(P, 1); v1 = val(P); set_effort(P, 10); v10 = val(P)
        check("2 Both ends reachable (1 and 10)", v1 == "1" and v10 == "10", f"{v1} {v10}")
        sb = P.locator("[data-testid=effort-slider]").bounding_box(); xs = lambda n: sb["x"] + 16 + (sb["width"] - 32) * (n - 1) / 9; y = sb["y"] + 22
        P.mouse.move(xs(10), y); P.mouse.down(); P.mouse.move(xs(8), y, steps=4); P.mouse.move(xs(4), y, steps=6); P.mouse.up(); P.wait_for_timeout(150)
        check("2 Dragging sets the value (4)", val(P) == "4", val(P))
        P.locator("[data-testid=effort-slider]").focus(); P.keyboard.press("ArrowRight")
        check("2 Arrow key changes the value (5)", val(P) == "5")
        P.locator("[data-testid=effort-clear]").click(); P.wait_for_timeout(100)
        check("2 Clear goes back to unset", val(P) == "–" and P.locator("[data-testid=effort-thumb]").count() == 0)
        # saving
        P.locator("[data-testid=sport-group] button[aria-pressed]").first.click(); P.fill("[data-testid=tid-min]", "30"); P.fill("input[type=date]", f"{M}-27")
        set_effort(P, 6); save(P)
        e = [x for x in raw_entries(port) if x["date"] == f"{M}-27" and x["user"] == "niva" and x["id"].startswith(("m", "q", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "n", "o", "p", "r", "s", "t", "u", "v", "w", "x", "y", "z")) or False]
        e = [x for x in raw_entries(port) if x["date"] == f"{M}-27" and x["user"] == "niva" and x.get("tid") == "30"]
        check("3 Stored as text '6' in kansla", len(e) == 1 and e[0]["kansla"] == "6", str(e))
        check("3 Form reset after saving: effort unset again", val(P) == "–")
        # a pass without effort still saves (effort stays optional)
        P.locator("[data-testid=sport-group] button[aria-pressed]").first.click(); P.fill("input[type=date]", f"{M}-26"); save(P)
        e = [x for x in raw_entries(port) if x["date"] == f"{M}-26" and x["user"] == "niva" and x["id"] not in ("",) and x.get("kansla", "x") == ""]
        check("3 A pass without effort can still be saved (kansla empty)", len(e) >= 1)
        # Samma som senast does not copy effort
        P.locator("[data-testid=same-as-last]").click(); P.wait_for_timeout(300)
        check("4 'Samma som senast' never copies effort", val(P) == "–")
        P.locator("[data-testid=clear-form]").click(); P.wait_for_timeout(200)
        # edit loads
        r = P.locator("[data-testid=pass-row]").filter(has_text=re.compile(rf"^\s*27/{M[5:]}")); r.locator("div").first.click(); P.wait_for_timeout(200)
        r.locator("button[title='Redigera']").first.click(); P.wait_for_timeout(400)
        check("5 Edit shows the saved effort on the slider (6)", val(P) == "6")
        set_effort(P, 9); save(P)
        e = [x for x in raw_entries(port) if x["date"] == f"{M}-27" and x["user"] == "niva" and x.get("tid") == "30"]
        check("5 Editing the effort saves (9)", len(e) == 1 and e[0]["kansla"] == "9", str(e))
        # old seeded pass opens with its effort
        tab(P, "Historik"); P.wait_for_timeout(700)   # since 1.8.1 older passes are opened from Historik (edit panel)
        r = P.locator("[data-testid=pass-row]").filter(has_text=re.compile(rf"^\s*10/{M[5:]}")); r.locator("div").first.click(); P.wait_for_timeout(200)
        r.locator("button[title='Redigera']").first.click(); P.wait_for_timeout(500)
        check("5 An old seeded pass loads its effort", val(P) != "–", val(P))
        P.locator("[data-testid=clear-form]").click(); P.wait_for_timeout(400)
        tab(P, "Logga pass"); P.wait_for_timeout(300)
        # rest day hides effort
        P.locator("[data-testid=kind-rest]").click()
        check("6 Rest day has no effort slider", P.locator("[data-testid=effort-slider]").count() == 0)
        P.locator("[data-testid=kind-pass]").click()
        # layout
        w = P.evaluate("() => [document.documentElement.scrollWidth, window.innerWidth]")
        check("7 No horizontal scroll at 390 px", w[0] <= w[1], str(w))
        P.locator("[data-testid=effort-slider]").scroll_into_view_if_needed(); set_effort(P, 5)
        P.screenshot(path=str(SHOTS / "anstrangning_slider.png"))
        check("7 No script errors", not P.errors, str(P.errors[:2]))
        ctx.close()
        ctx, P = open_app(browser, port, "niva", "dark", "dark")
        set_effort(P, 8)
        P.screenshot(path=str(SHOTS / "anstrangning_mork.png"))
        bad = P.evaluate("""() => { const out = []; document.querySelector('[data-testid=effort-slider-wrap]').querySelectorAll('*').forEach(el => { const c = getComputedStyle(el).backgroundColor; const m = c.match(/\\d+/g); if (m && m.length >= 3 && (+m[0] + +m[1] + +m[2]) / 3 > 215 && c !== 'rgba(0, 0, 0, 0)') out.push(el.tagName + ':' + c); }); return out; }""")
        check("8 Dark mode: no light backgrounds in the slider", not bad, str(bad[:3]))
        ctx.close()
    finally:
        try: m.terminate()
        except Exception: pass
        browser.close()
bad = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(bad)}/{len(results)} passed"); sys.exit(1 if bad else 0)
