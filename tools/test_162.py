"""Acceptance tests for 1.6.2: new activities Handboll, Yoga, Pilates and new training type Stretching."""
import re, sys, os, json, pathlib
HTML = sys.argv[1] if len(sys.argv) > 1 else str(pathlib.Path(__file__).resolve().parent.parent / "index.html")
sys.argv = [sys.argv[0], HTML]
src = open(pathlib.Path(__file__).resolve().parent / "test_160.py", encoding="utf-8").read().split("with sync_playwright()")[0]
__file__ = str(pathlib.Path(__file__).resolve())
os.environ.setdefault("SHOTS", "/tmp/shots_162")
exec(src)
from playwright.sync_api import sync_playwright

def set_effort(P, n):
    """Tap the effort slider at the position of value n (1-10)."""
    sl = P.locator("[data-testid=effort-slider]"); sl.scroll_into_view_if_needed(); b = sl.bounding_box()
    P.mouse.click(b["x"] + 16 + (b["width"] - 32) * (n - 1) / 9, b["y"] + b["height"] / 2); P.wait_for_timeout(100)
def pills(P, g): return [b.inner_text().strip() for b in P.locator(f"[data-testid={g}] button[aria-pressed]").all()]
def more(P, g):
    l = P.locator(f"[data-testid={g}-more]"); return l.inner_text().strip() if l.count() else None
with sync_playwright() as pw:
    browser = pw.chromium.launch(); port = 9731; m = start_mock(port)
    try:
        ctx, P = open_app(browser, port, "niva", "light", "light")
        P.locator("[data-testid=sport-group-more]").click(); P.locator("[data-testid=typ-group-more]").click(); P.wait_for_timeout(200)
        sp = pills(P, "sport-group"); ty = pills(P, "typ-group")
        check("1 Activities in order, Handboll after Fotboll, Yoga and Pilates before Annat, Barmarksträning before Pingis", sp[-3:] == ["Yoga", "Pilates", "Annat"] and sp.index("Handboll") == sp.index("Fotboll") + 1 and sp.index("Barmarksträning") == sp.index("Pingis") - 1 and len(sp) == 13, str(sp))
        check("1 Training type Stretching exists (11 types)", "Stretching" in ty and len(ty) == 11, str(ty))
        # Log one pass with the new activities and type
        for a in ("Handboll", "Yoga", "Pilates"): P.locator("[data-testid=sport-group] button[aria-pressed]", has_text=re.compile(f"^{a}$")).click()
        P.locator("[data-testid=typ-group] button[aria-pressed]", has_text=re.compile("^Stretching$")).click()
        P.fill("input[inputmode=numeric]", "40"); set_effort(P, 3)
        P.fill("input[type=date]", TODAY.isoformat())
        P.locator("button.flex-1", has_text=re.compile("^Spara")).first.click(); P.wait_for_timeout(1500)
        raw = json.loads(json.load(urllib.request.urlopen(f"http://localhost:{port}/__raw?path=diaries/{CODE}/entries:{M}")))
        mine = [e for e in raw if e.get("date") == TODAY.isoformat() and e.get("user") == "niva" and "H" in (e.get("sport") or [])]
        check("2 Saved with codes H, YO, PL and SR", len(mine) == 1 and sorted(mine[0]["sport"]) == ["H", "PL", "YO"] and mine[0]["typ"] == ["SR"], str(mine))
        row = P.locator("[data-testid=pass-row]", has_text="05/10") if False else P.locator("[data-testid=pass-row]").filter(has_text=re.compile(r"H\b.*YO.*PL"))
        check("2 The pass shows in the list", row.count() >= 1)
        # Statistics: legend lists 12 activities with distinct colours, chart colours differ
        tab(P, "Statistik"); P.wait_for_timeout(700)
        dots = P.evaluate("[...document.querySelectorAll('span.rounded-full.inline-block.h-2\\\\.5')].map(e => e.style.backgroundColor)")
        legend = P.locator("body").inner_text()
        check("3 Legend has Handboll, Yoga and Pilates with their own colours", all(w in legend for w in ("Handboll (1)", "Yoga (1)", "Pilates (1)")) and len(set(dots)) == len(dots) and len(dots) >= 13, f"{len(dots)} {len(set(dots))}")
        check("3 Type chart shows Stretching", "SR" in P.locator(".recharts-wrapper").last.inner_text() or "SR" in P.locator("body").inner_text())
        P.screenshot(path=str(SHOTS / "statistik_ljust.png"), full_page=True)
        # Dark mode: all 12 chart colours visible
        open_menu(P); menu(P).locator("[data-testid=theme-dark]").click(); close_menu(P); P.wait_for_timeout(500)
        dd = P.evaluate("[...document.querySelectorAll('span.rounded-full.inline-block.h-2\\\\.5')].map(e => e.style.backgroundColor)")
        weak = [d for d in set(to_hex(x) for x in dd) if cr(d, "#1C1C1C") < 3]
        check("3 Dark: 13 distinct activity colours, all visible (>= 3)", len(set(dd)) == len(dd) and len(dd) >= 13 and not weak, f"{len(dd)} {weak}")
        fills = [to_hex(x) for x in chart_fills(P) if x and x != 'none']
        check("3 Dark: all chart colours visible (>= 3)", not [f for f in set(fills) if cr(f, '#1C1C1C') < 3], str([f for f in set(fills) if cr(f, '#1C1C1C') < 3]))
        P.screenshot(path=str(SHOTS / "statistik_morkt.png"), full_page=True)
        # CSV round trip keeps the codes
        tab(P, "Logga pass")
        open_menu(P)
        with P.expect_download() as d: menu(P).locator("[data-testid=menu-export]").click()
        path = d.value.path(); txt = open(path, encoding="utf-8-sig").read()
        check("4 CSV export contains the new activities and type", re.search(r";H[^;]*YO[^;]*PL;SR;", txt) is not None or re.search(r"H.YO.PL;SR", txt) is not None, [l for l in txt.splitlines() if "2026-10-05" in l][:1])
        check("5 No script errors", not P.errors, str(P.errors[:2]))
        ctx.close()
    finally:
        m.terminate(); browser.close()
bad = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(bad)}/{len(results)} passed"); sys.exit(1 if bad else 0)
