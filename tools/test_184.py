"""Acceptance tests for 1.8.6: the new activity Inomhus (IH): choosable under Fler, saved, shown, coloured, filterable, in CSV."""
import re, sys, os, json, pathlib, datetime as dt
HTML = sys.argv[1] if len(sys.argv) > 1 else str(pathlib.Path(__file__).resolve().parent.parent / "index.html")
sys.argv = [sys.argv[0], HTML]
src = open(pathlib.Path(__file__).resolve().parent / "test_160.py", encoding="utf-8").read().split("with sync_playwright()")[0]
__file__ = str(pathlib.Path(__file__).resolve())
os.environ.setdefault("SHOTS", "/tmp/shots_184")
exec(src)
from playwright.sync_api import sync_playwright

def raw_all(port):
    out = []
    for mk in {TODAY.strftime("%Y-%m")}:
        try:
            v = json.load(urllib.request.urlopen(f"http://localhost:{port}/__raw?path=diaries/{CODE}/entries:{mk}"))
            while isinstance(v, str): v = json.loads(v)
            out += v
        except Exception: pass
    return out

with sync_playwright() as pw:
    browser = pw.chromium.launch(); port = 9792; m = start_mock(port)
    try:
        ctx, P = open_app(browser, port, "anna", "light", "light"); P.wait_for_timeout(900)
        grp = P.locator("[data-testid=sport-group]")
        check("1 Inomhus is not among the default choices (hidden under Fler)", grp.locator("button[aria-pressed]", has_text="Inomhus").count() == 0)
        P.locator("[data-testid=sport-group-more]").click(); P.wait_for_timeout(200)
        names = [b.inner_text().strip() for b in grp.locator("button[aria-pressed]").all()]
        check("2 Under Fler: Inomhus sits right after Barmarksträning and before Pingis", "Inomhus" in names and names.index("Inomhus") == names.index("Barmarksträning") + 1 and names.index("Inomhus") == names.index("Pingis") - 1, str(names))
        btn = grp.locator("button[aria-pressed]", has_text="Inomhus")
        btn.click(); P.fill("[data-testid=tid-min]", "50"); P.fill("textarea", "gympass")
        P.locator("button.flex-1", has_text=re.compile("^Spara")).first.click(); P.wait_for_timeout(1800)
        saved = [e for e in raw_all(port) if e.get("anteckningar") == "gympass"]
        check("3 Saved with sport code IH", len(saved) == 1 and saved[0]["sport"] == ["IH"], str(saved))
        check("3 Shown with its code IH in Senaste pass, like other activities", "IH" in P.locator("[data-testid=recent-list]").inner_text(), P.locator("[data-testid=recent-list]").inner_text()[:120])
        tab(P, "Statistik"); P.wait_for_timeout(700)
        check("4 Statistics legend has Inomhus (1)", "Inomhus (1)" in P.locator("body").inner_text())
        dots = P.evaluate("[...document.querySelectorAll('span.rounded-full.inline-block.h-2\\\\.5')].map(e => e.style.backgroundColor)")
        check("4 All activity colours are different (14)", len(dots) == 14 and len(set(dots)) == 14, f"{len(dots)} {len(set(dots))}")
        P.screenshot(path=str(SHOTS / "statistik_inomhus.png"), full_page=True)
        tab(P, "Historik"); P.wait_for_timeout(700)
        check("5 Historik shows the pass with IH", "IH" in P.locator("[data-testid=history]").inner_text())
        P.locator("[data-testid=hist-filter-toggle]").click(); P.wait_for_timeout(300)
        check("5 The activity filter offers Inomhus (1)", "Inomhus (1)" in P.locator("[data-testid=hist-filters]").inner_text(), P.locator("[data-testid=hist-filters]").inner_text()[:200])
        open_menu(P)
        with P.expect_download() as d: menu(P).locator("[data-testid=menu-export]").click()
        txt = open(d.value.path(), encoding="utf-8-sig").read()
        row = [l for l in txt.splitlines() if "gympass" in l]
        check("6 CSV export contains the pass with code IH in the activity column", len(row) == 1 and row[0].split(";")[2] == "IH", str(row))
        check("7 No script errors", not P.errors, str(P.errors[:2]))
        ctx.close()
        ctx, P = open_app(browser, port, "anna", "dark", "dark"); P.wait_for_timeout(900)
        tab(P, "Statistik"); P.wait_for_timeout(700)
        dd = P.evaluate("[...document.querySelectorAll('span.rounded-full.inline-block.h-2\\\\.5')].map(e => e.style.backgroundColor)")
        weak = [x for x in set(to_hex(c) for c in dd) if cr(x, "#1C1C1C") < 3]
        check("8 Dark: 14 distinct colours, all visible (>= 3)", len(set(dd)) == len(dd) == 14 and not weak, f"{len(dd)} {weak}")
        check("8 No script errors (dark)", not P.errors, str(P.errors[:2]))
        ctx.close()
    finally:
        m.terminate(); browser.close()
bad = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(bad)}/{len(results)} passed"); sys.exit(1 if bad else 0)
