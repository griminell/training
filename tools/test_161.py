"""Acceptance tests for 1.6.1 footer layout (run: python3 tools/test_161.py [path/to/index.html])."""
import re, sys, os, json, pathlib
HTML = sys.argv[1] if len(sys.argv) > 1 else str(pathlib.Path(__file__).resolve().parent.parent / "index.html")
sys.argv = [sys.argv[0], HTML]
src = open(pathlib.Path(__file__).resolve().parent / "test_160.py", encoding="utf-8").read().split("with sync_playwright()")[0]
__file__ = str(pathlib.Path(__file__).resolve())
os.environ.setdefault("SHOTS", "/tmp/shots_161")
exec(src)
from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
    browser = pw.chromium.launch(); port = 9721; m = start_mock(port)
    try:
        for mode in ("light", "dark"):
            ctx, P = open_app(browser, port, "niva", mode, "light")
            P.locator("[data-testid=footer-row]").scroll_into_view_if_needed(); P.wait_for_timeout(200)
            row = P.locator("[data-testid=footer-row]").bounding_box(); cr = P.locator("[data-testid=credit]"); ver = P.locator("[data-testid=version]"); lnk = P.locator("[data-testid=open-changelog]")
            cb, vb, lb = cr.bounding_box(), ver.bounding_box(), lnk.bounding_box()
            check(f"{mode}: credit reads '© 2026 Grim' (no Bastubacken)", cr.inner_text().strip() == "© 2026 Grim")
            check(f"{mode}: credit left, version + link right, same row", cb["x"] < 40 and lb["x"] + lb["width"] > 390 - 40 and abs((cb["y"] + cb["height"] / 2) - (vb["y"] + vb["height"] / 2)) < 8, f"{cb} {vb} {lb}")
            check(f"{mode}: version is 'v1.x.y' and the date is not in the footer", re.fullmatch(r"v1\.\d+\.\d+", ver.inner_text().strip()) and "2026-10-20" not in P.locator("[data-testid=footer-row]").inner_text())
            check(f"{mode}: nothing overflows 390 px", P.evaluate("document.documentElement.scrollWidth") <= 390 and row["x"] >= 0 and row["x"] + row["width"] <= 390)
            col = P.evaluate("[getComputedStyle(document.querySelector('[data-testid=credit]')).color, getComputedStyle(document.querySelector('[data-testid=open-changelog]')).color, getComputedStyle(document.querySelector('[data-testid=open-changelog]')).textDecorationLine]")
            check(f"{mode}: link has the same colour as the text and keeps the underline", col[0] == col[1] and "underline" in col[2], str(col))
            check(f"{mode}: link tap target >= 44 px high", lb["height"] >= 43, str(lb))
            info = P.locator("[data-testid=footer-info]"); ib = info.bounding_box()
            check(f"{mode}: info text: live sharing line, then protection on its own line", ib["height"] < 56 and P.locator("[data-testid=protection]").bounding_box()["y"] > ib["y"] + 12 and "Live-delad" in info.inner_text() and "Skydd mot överskrivning: på" in info.inner_text(), f"{ib['height']} {info.inner_text()!r}")
            ub = P.get_by_role("button", name="Uppdatera sidan").bounding_box()
            check(f"{mode}: order is info, Uppdatera sidan, footer row", ib["y"] < ub["y"] < row["y"])
            bot = P.evaluate("document.documentElement.scrollHeight") - (lb["y"] + lb["height"] + P.evaluate("window.scrollY"))
            check(f"{mode}: some air below the link (>= 24 px)", bot >= 24, str(bot))
            P.screenshot(path=str(SHOTS / f"footer_{mode}.png"))
            lnk.click(); P.wait_for_timeout(300)
            check(f"{mode}: link opens Vad är nytt, which shows the version date", P.get_by_role("heading", name="Vad är nytt").count() == 1 and "Version 1.8.0" in P.locator("body").inner_text() and "2026-10-22" in P.locator("body").inner_text())
            body = P.locator("[data-testid=cl-body-1\\.8]")
            check(f"{mode}: newest group (1.8) is open and shows 1.8.0", P.locator("[data-testid=cl-toggle-1\\.8]").get_attribute("aria-expanded") == "true" and "Version 1.8.0" in body.inner_text())
            older = ["1.7", "1.6", "1.5", "1.4"]
            check(f"{mode}: older groups are collapsed with their content hidden", all(P.locator(f"[data-testid=cl-toggle-{k.replace('.', chr(92)+'.')}]").count() == 1 and P.locator(f"[data-testid=cl-toggle-{k.replace('.', chr(92)+'.')}]").get_attribute("aria-expanded") == "false" and P.locator(f"[data-testid=cl-body-{k.replace('.', chr(92)+'.')}]").count() == 0 for k in older))
            t15 = P.locator("[data-testid=cl-toggle-1\\.5]"); t15.click(); P.wait_for_timeout(200)
            check(f"{mode}: tapping a group opens it (1.5.6 .. 1.5.0) and keeps 1.8 open", "Version 1.5.6" in P.locator("[data-testid=cl-body-1\\.5]").inner_text() and "Version 1.5.0" in P.locator("[data-testid=cl-body-1\\.5]").inner_text() and P.locator("[data-testid=cl-body-1\\.8]").count() == 1)
            tb = t15.bounding_box()
            check(f"{mode}: group headers are >= 44 px high", tb["height"] >= 44, str(tb))
            P.screenshot(path=str(SHOTS / f"changelog_{mode}.png"))
            t15.click(); P.wait_for_timeout(200)
            check(f"{mode}: tapping again collapses it", P.locator("[data-testid=cl-body-1\\.5]").count() == 0)
            check(f"{mode}: no script errors", not P.errors, str(P.errors[:2]))
            ctx.close()
    finally:
        m.terminate(); browser.close()
bad = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(bad)}/{len(results)} passed"); sys.exit(1 if bad else 0)
