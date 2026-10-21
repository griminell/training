"""Acceptance tests for 1.7.4: edit panel follows the visual viewport (iOS keyboard)."""
import re, sys, os, json, pathlib
HTML = sys.argv[1] if len(sys.argv) > 1 else str(pathlib.Path(__file__).resolve().parent.parent / "index.html")
sys.argv = [sys.argv[0], HTML]
src = open(pathlib.Path(__file__).resolve().parent / "test_160.py", encoding="utf-8").read().split("with sync_playwright()")[0]
__file__ = str(pathlib.Path(__file__).resolve())
os.environ.setdefault("SHOTS", "/tmp/shots_174")
exec(src)
from playwright.sync_api import sync_playwright

FAKE_VV = """(() => { const t = new EventTarget(); const vv = { offsetTop: 0, height: window.innerHeight, width: window.innerWidth, scale: 1,
  addEventListener: (...a) => t.addEventListener(...a), removeEventListener: (...a) => t.removeEventListener(...a) };
  Object.defineProperty(window, 'visualViewport', { value: vv, configurable: true });
  window.__setVv = (h, top = 0) => { vv.height = h; vv.offsetTop = top; t.dispatchEvent(new Event('resize')); }; })();"""

with sync_playwright() as pw:
    browser = pw.chromium.launch(); port = 9774; m = start_mock(port)
    try:
        ctx, P = open_app(browser, port, "niva", "light", "light")
        P.add_init_script(FAKE_VV); P.reload(); P.wait_for_timeout(1200)
        tab(P, "Historik"); P.wait_for_timeout(600)
        P.locator("[data-testid=history] button[title='Redigera']").first.click(); P.wait_for_timeout(600)
        vh = P.evaluate("window.innerHeight")
        bb = P.locator("[data-testid=edit-sheet]").bounding_box()
        check("1 Without keyboard: panel starts ~92 px from the top", abs(bb["y"] - 92) <= 3, str(bb))
        P.evaluate("window.__setVv(%d)" % (vh - 336)); P.wait_for_timeout(500)
        bb = P.locator("[data-testid=edit-sheet]").bounding_box()
        check("2 With keyboard (visual viewport 336 px shorter): panel ends above the keyboard", bb["y"] + bb["height"] <= vh - 336 + 1 and bb["height"] > 300, f"{bb} vh={vh}")
        sv = P.get_by_role("button", name="Spara ändringar").bounding_box()
        check("2 Save button is above the keyboard", sv["y"] + sv["height"] <= vh - 336 + 1, str(sv))
        P.evaluate("window.__setVv(%d)" % vh); P.wait_for_timeout(500)
        bb = P.locator("[data-testid=edit-sheet]").bounding_box()
        check("3 Keyboard closed: panel returns to normal height", abs(bb["y"] - 92) <= 3, str(bb))
        check("4 No script errors", not P.errors, str(P.errors[:2]))
    finally:
        try: m.terminate()
        except Exception: pass
        browser.close()
bad = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(bad)}/{len(results)} passed"); sys.exit(1 if bad else 0)
