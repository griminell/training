"""Acceptance tests for 1.7.7: swipe between tabs, pain hint counted on logged days."""
import re, sys, os, json, pathlib, datetime as dt
HTML = sys.argv[1] if len(sys.argv) > 1 else str(pathlib.Path(__file__).resolve().parent.parent / "index.html")
sys.argv = [sys.argv[0], HTML]
_t = open(pathlib.Path(__file__).resolve().parent / "test_176.py", encoding="utf-8").read()
src = _t[:_t.index("\nwith sync_playwright() as pw:\n")]
__file__ = str(pathlib.Path(__file__).resolve())
os.environ.setdefault("SHOTS", "/tmp/shots_177")
exec(src)
from playwright.sync_api import sync_playwright

# Bo: logs every day for 14 days, pain 6 on 10 of them, only 4 of the last 7 -> the 14 rule
BO = []
for k in range(14):
    pain = [PN("knee", "L", 6)] if k not in (1, 3, 5, 13) else None
    BO.append(E(f"zo{k}", D(k), ["CY"], ["KO"], "30", "3", user="bo", pain=pain))
# Grim: old pain (30-36 days ago, every day) must not trigger; recent logged days are pain free
GR = [E(f"zg{k}", D(k), ["LÖ"], ["KO"], "30", "3", user="grim", pain=[PN("heel", "L", 7)]) for k in range(30, 37)] + \
     [E("zgx", D(1), ["LÖ"], ["KO"], "30", "3", user="grim"), E("zgy", D(2), ["LÖ"], ["KO"], "30", "3", user="grim")]
def seed_file():
    entries = CUR + EX + ANNA + BO + GR
    cur = [e for e in entries if e["date"][:7] == M]
    prev = [e for e in entries if e["date"][:7] == PMK] + PREV
    data = {"diaries": {CODE: {"meta:users": json.dumps(USERS), f"entries:{M}": json.dumps(cur), f"entries:{PMK}": json.dumps(prev)}}}
    f = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False); json.dump(data, f); f.close(); return f.name

T = """([type, x, y]) => { const el = document.elementFromPoint(x, y) || document.body; const t = new Touch({ identifier: 1, target: el, clientX: x, clientY: y });
  el.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches: type === 'touchend' ? [] : [t], targetTouches: type === 'touchend' ? [] : [t], changedTouches: [t] })); }"""
def swipe(P, x1, y1, x2, y2, ms=160):
    P.evaluate(T, ["touchstart", x1, y1]); P.wait_for_timeout(ms // 2)
    P.evaluate(T, ["touchmove", (x1 + x2) // 2, (y1 + y2) // 2]); P.wait_for_timeout(ms // 2)
    P.evaluate(T, ["touchend", x2, y2]); P.wait_for_timeout(350)
def where(P):
    if P.locator("[data-testid=kind-group]").count(): return "logga"
    if P.locator("[data-testid=scope-group]").count(): return "stats"
    if P.locator("[data-testid=history]").count(): return "hist"
    return "?"
def hint_texts(P): return [h.inner_text() for h in P.locator("[data-testid=pain-hint]").all()]

with sync_playwright() as pw:
    browser = pw.chromium.launch(); port = 9778; m = start_mock(port)
    try:
        ctx, P = open_app(browser, port, "niva", "light", "light")
        check("1 Starts on Logga pass", where(P) == "logga")
        swipe(P, 300, 85, 120, 95); check("1 Swipe left: Logga pass -> Statistik", where(P) == "stats", where(P))
        check("1 The page slides in (direction l)", P.locator("[data-testid=view-wrap]").get_attribute("data-dir") == "l")
        swipe(P, 300, 85, 120, 95); check("1 Swipe left: Statistik -> Historik", where(P) == "hist", where(P))
        swipe(P, 300, 85, 120, 95); check("1 Swipe left on the last tab: stays (no wrap-around)", where(P) == "hist")
        swipe(P, 120, 85, 300, 95); check("1 Swipe right: Historik -> Statistik", where(P) == "stats" and P.locator("[data-testid=view-wrap]").get_attribute("data-dir") == "r", where(P))
        swipe(P, 120, 85, 300, 95); check("1 Swipe right: Statistik -> Logga pass", where(P) == "logga", where(P))
        swipe(P, 120, 85, 300, 95); check("1 Swipe right on the first tab: stays", where(P) == "logga")
        tab(P, "Statistik"); check("1 Tapping a tab still works and does not slide", where(P) == "stats" and P.locator("[data-testid=view-wrap]").get_attribute("data-dir") == "")
        tab(P, "Logga pass")
        # things that must NOT swipe
        swipe(P, 200, 85, 280, 235); check("2 A mostly vertical drag (scroll) does nothing", where(P) == "logga")
        swipe(P, 260, 85, 220, 90); check("2 A short drag (40 px) does nothing", where(P) == "logga")
        swipe(P, 300, 85, 120, 95, ms=1000); check("2 A slow drag does nothing", where(P) == "logga")
        swipe(P, 8, 85, 200, 95); check("2 Starting at the left screen edge does nothing", where(P) == "logga")
        swipe(P, 383, 85, 190, 95); check("2 Starting at the right screen edge does nothing", where(P) == "logga")
        sl = P.locator("[data-testid=effort-slider]"); sl.scroll_into_view_if_needed(); b = sl.bounding_box()
        swipe(P, int(b["x"] + b["width"] - 20), int(b["y"] + b["height"] / 2), int(b["x"] + 40), int(b["y"] + b["height"] / 2))
        check("2 Dragging a slider never changes tab", where(P) == "logga")
        P.evaluate("window.scrollTo(0, 0)")
        inp = P.locator("[data-testid=tid-min]"); inp.scroll_into_view_if_needed(); b = inp.bounding_box()
        swipe(P, int(b["x"] + b["width"] - 10), int(b["y"] + b["height"] / 2), int(b["x"] - 5 if b["x"] > 70 else 30), int(b["y"] + b["height"] / 2) + 5)
        check("2 Starting on a text field does nothing", where(P) == "logga")
        P.evaluate("window.scrollTo(0, 0)")
        tab(P, "Statistik"); P.wait_for_timeout(500)
        ch = P.locator(".recharts-wrapper").first; ch.scroll_into_view_if_needed(); b = ch.bounding_box()
        swipe(P, int(b["x"] + b["width"] - 30), int(b["y"] + b["height"] / 2), int(b["x"] + 40), int(b["y"] + b["height"] / 2))
        check("2 Dragging on a chart does nothing", where(P) == "stats")
        P.evaluate("window.scrollTo(0, 0)")
        # overlays
        P.get_by_text("Vad är nytt?").first.click(); P.wait_for_timeout(400)
        swipe(P, 300, 600, 120, 610); check("3 Changelog open: swipe does nothing", where(P) == "stats")
        P.get_by_role("button", name="Stäng").first.click(); P.wait_for_timeout(300)
        P.evaluate("window.scrollTo(0, 0)"); chip(P).click(); P.wait_for_timeout(300)
        swipe(P, 300, 700, 120, 710); check("3 Person menu open: swipe does nothing", where(P) == "stats")
        chip(P).click(); P.wait_for_timeout(300)
        tab(P, "Historik"); P.wait_for_timeout(400)
        P.locator("[data-testid=history] button[title='Redigera']").first.click(); P.wait_for_timeout(600)
        swipe(P, 300, 500, 120, 510); check("3 Edit panel open: swipe does nothing", P.locator("[data-testid=edit-sheet]").count() == 1 and P.locator("[data-testid=history]").count() == 1 and P.locator("[data-testid=scope-group]").count() == 0)
        P.locator("[data-testid=sheet-close]").click(); P.wait_for_timeout(400)
        swipe(P, 300, 85, 120, 95); check("3 Closed again: swipe works as before (stays on last tab)", where(P) == "hist")
        swipe(P, 120, 85, 300, 95); check("3 ...and right goes to Statistik", where(P) == "stats")
        check("4 No script errors", not P.errors, str(P.errors[:2]))
        ctx.close()
        # ---- pain hint on logged days ----
        ctx, P = open_app(browser, port, "bo", "light", "light"); tab(P, "Statistik"); P.wait_for_timeout(900)
        h = hint_texts(P)
        check("5 Bo logs every day, pain 6 on 10 of 14 (4 of the last 7): the 14 rule gives a hint", len(h) == 1 and "Smärta på 5 eller mer i Knä V har noterats 10 av de senaste 14 loggade dagarna" in h[0].replace("Knä V", "Knä V") or (len(h) == 1 and "10 av de senaste 14 loggade dagarna" in h[0]), str(h))
        P.screenshot(path=str(SHOTS / "bo.png"), full_page=True)
        ctx.close()
        ctx, P = open_app(browser, port, "grim", "light", "light"); tab(P, "Statistik"); P.wait_for_timeout(900)
        check("5 Old pain (30-36 days ago) does not trigger a hint, recent logged days are pain free", len(hint_texts(P)) == 0, str(hint_texts(P)))
        ctx.close()
        ctx, P = open_app(browser, port, "niva", "light", "light"); tab(P, "Statistik"); P.wait_for_timeout(900)
        h = hint_texts(P)
        check("5 Niva: 6 of the last 7 logged days with heel pain 5+ -> hint says loggade dagar", len(h) == 1 and "Häl V har noterats 6 av de senaste 7 loggade dagarna" in h[0], str(h))
        check("5 Pain hint sits under the chart, not above it", P.evaluate("""() => { const h = document.querySelector('[data-testid=pain-hint]'), c = document.querySelector('[data-testid=pain-chart]'); return !!h && !!c && (c.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING) > 0; }"""))
        # palette: many colours, the user's own colour goes to the most used activity
        legend = P.evaluate("""() => [...document.querySelectorAll('span.rounded-full.inline-block')].map(s => [s.parentElement.innerText.trim(), s.style.backgroundColor])""")
        legend = [x for x in legend if "(" in x[0]]
        cols = [c for _, c in legend]
        check("6 Activity legend: all colours different", len(set(cols)) == len(cols) and len(cols) >= 12, str(legend))
        top = [c for n, c in legend if n.startswith("Löpning")]
        check("6 Niva's own colour (pink) is on the most used activity (Löpning)", top == ["rgb(194, 71, 122)"], str(top))
        others = [c for n, c in legend if not n.startswith("Löpning")]
        hues = P.evaluate("""(cs) => cs.map(c => { const m = c.match(/\\d+/g).map(Number); const [r, g, b] = m.map(v => v / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx === mn) return -1; const d = mx - mn; let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return Math.round(((h * 60) + 360) % 360 / 30); })""", others)
        check("6 The other activities use several different hues (not just shades of pink)", len(set(h for h in hues if h >= 0)) >= 5, str(sorted(set(hues))))
        check("6 No script errors (hint)", not P.errors, str(P.errors[:2]))
        ctx.close()
    finally:
        try: m.terminate()
        except Exception: pass
        browser.close()
bad = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(bad)}/{len(results)} passed"); sys.exit(1 if bad else 0)
