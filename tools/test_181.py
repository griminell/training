"""Acceptance tests for 1.8.1: Logga pass lists the 5 latest real passes (across months) with a link to Historik."""
import re, sys, os, json, pathlib, datetime as dt
HTML = sys.argv[1] if len(sys.argv) > 1 else str(pathlib.Path(__file__).resolve().parent.parent / "index.html")
sys.argv = [sys.argv[0], HTML]
src = open(pathlib.Path(__file__).resolve().parent / "test_160.py", encoding="utf-8").read().split("with sync_playwright()")[0]
__file__ = str(pathlib.Path(__file__).resolve())
os.environ.setdefault("SHOTS", "/tmp/shots_181")
exec(src)
from playwright.sync_api import sync_playwright

def D(back): return TODAY - dt.timedelta(days=back)
def E(i, d, user="anna", tid="30", k="5", kind=None, note=""):
    e = {"id": i, "date": d.isoformat(), "user": user, "sport": ["LÖ"], "typ": ["KO"], "tid": tid, "kansla": k, "anteckningar": note, "cr10": True}
    if kind: e.update({"kind": kind, "sport": [], "typ": [], "tid": "", "kansla": ""})
    return e
SEEDED = [E("a0", D(0), note="idag"), E("a2", D(2), note="p2"), E("a5", D(5), note="p5"), E("a9", D(9), note="p9"), E("a14", D(14), note="p14"),
          E("a20", D(20), note="p20"), E("a30", D(30), note="p30"),
          E("r1", D(1), kind="rest", note="vila igår"),                    # newer than most passes: must not be listed
          E("n0", D(0), user="niva", note="nivas pass")]
def seed_file():
    by = {}
    for e in SEEDED: by.setdefault(e["date"][:7], []).append(e)
    d = {"meta:users": json.dumps(USERS)}
    for k, v in by.items(): d[f"entries:{k}"] = json.dumps(sorted(v, key=lambda x: x["date"]))
    f = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False); json.dump({"diaries": {CODE: d}}, f); f.close(); return f.name
def row_dates(P):
    return [re.match(r"\s*(\d\d)/(\d\d)", r.inner_text()).groups() for r in P.locator("[data-testid=pass-row]").all()]
def fmt(d): return (f"{d.day:02d}", f"{d.month:02d}")
def raw_all(port):
    out = []
    for mk in {e["date"][:7] for e in SEEDED} | {TODAY.strftime("%Y-%m")}:
        try:
            v = json.load(urllib.request.urlopen(f"http://localhost:{port}/__raw?path=diaries/{CODE}/entries:{mk}"))
            while isinstance(v, str): v = json.loads(v)
            out += v
        except Exception: pass
    return out

with sync_playwright() as pw:
    browser = pw.chromium.launch(); port = 9787; m = start_mock(port)
    try:
        ctx, P = open_app(browser, port, "anna", "light", "light"); P.wait_for_timeout(900)
        check("1 Title is SENASTE PASS · Anna", P.locator("[data-testid=recent-title]").inner_text().strip() == "SENASTE PASS · Anna", P.locator("[data-testid=recent-title]").inner_text())
        got = row_dates(P); exp = [fmt(D(b)) for b in (0, 2, 5, 9, 14)]
        check("2 Exactly the 5 newest real passes, newest first (across the month boundary)", got == exp, f"{got} vs {exp}")
        check("2 The rest day (newer than most passes) is not listed", P.locator("[data-testid=offday-row]").count() == 0 and "vila igår" not in P.locator("[data-testid=recent-list]").inner_text())
        check("2 Another person's pass is not listed", "nivas pass" not in P.locator("body").inner_text())
        check("3 No month picker and no eye button on Logga pass", P.locator("[data-testid=toggle-offdays]").count() == 0 and P.locator("select[aria-label='Välj månad']").count() == 0)
        lnk = P.locator("[data-testid=to-history]")
        check("4 Link 'Historik' with an arrow sits under the list", lnk.count() == 1 and lnk.inner_text().strip() == "Historik" and lnk.locator("svg").count() == 1)
        lb = lnk.bounding_box(); ll = P.locator("[data-testid=recent-list]").bounding_box()
        check("4 It is below the last row, left-aligned with the list, and tall enough to tap (>= 44)", lb["y"] >= ll["y"] + ll["height"] and abs(lb["x"] - ll["x"]) < 12 and lb["height"] >= 44, f"{lb} {ll}")
        P.screenshot(path=str(SHOTS / "logga_senaste.png"), full_page=True)
        # edit from the list still works (loads into the form)
        P.locator("[data-testid=pass-row]").first.locator("div").first.click(); P.wait_for_timeout(200)
        P.locator("[data-testid=pass-row]").first.locator("button[title=Redigera]").click(); P.wait_for_timeout(400)
        check("5 Pencil on a row still loads the pass into the form", P.locator("button.flex-1", has_text="Spara ändringar").count() == 1 and P.input_value("textarea") == "idag")
        P.locator("[data-testid=clear-form]").click(); P.wait_for_timeout(300)
        # save a new pass today: list updates, still 5
        P.locator("[data-testid=sport-group] button[aria-pressed]").first.click(); P.fill("[data-testid=tid-min]", "45"); P.fill("textarea", "ny idag")
        P.locator("button.flex-1", has_text=re.compile("^Spara")).first.click(); P.wait_for_timeout(1800)
        rows_now = P.locator("[data-testid=pass-row]")
        check("6 A saved pass appears at once, list is still 5, the oldest (14 days back) dropped out", rows_now.count() == 5 and "ny idag" in rows_now.first.inner_text() + P.locator("[data-testid=recent-list]").inner_text() and fmt(D(14)) not in row_dates(P), str(row_dates(P)))
        # offline: a pass becomes an Ej sparat card on top, not a row
        ctl(port, offline=1)
        P.locator("[data-testid=sport-group] button[aria-pressed]").first.click(); P.fill("[data-testid=tid-min]", "20"); P.fill("textarea", "offline pass")
        P.locator("button.flex-1", has_text=re.compile("^Spara")).first.click(); P.wait_for_timeout(2500)
        check("7 Offline pass shows as Ej sparat card and is not counted among the 5 rows", P.locator("[data-testid=pending-card]").count() == 1 and P.locator("[data-testid=pass-row]").count() == 5)
        ctl(port, offline=0); P.evaluate("window.dispatchEvent(new Event('online'))"); P.wait_for_timeout(2500)
        check("7 After reconnecting the card is gone and the list still shows 5", P.locator("[data-testid=pending-card]").count() == 0 and P.locator("[data-testid=pass-row]").count() == 5 and "offline pass" in P.locator("[data-testid=recent-list]").inner_text())
        # link goes to Historik for the same person and this month
        lnk.click(); P.wait_for_timeout(900)
        pressed_ = [b.inner_text().strip() for b in P.locator("[data-testid=history] button[aria-pressed=true]").all() if b.inner_text().strip() in ("Niva", "Grim", "Anna", "Bo")]
        check("8 Link opens Historik for the same person (Anna)", P.locator("[data-testid=history]").count() == 1 and pressed_ == ["Anna"], str(pressed_))
        check("8 ...and Historik lists the rest day that Logga pass leaves out", P.locator("[data-testid=offday-row]").count() >= 1)
        MN = ["Januari","Februari","Mars","April","Maj","Juni","Juli","Augusti","September","Oktober","November","December"]
        check("8 The month shown is the current month", f"{MN[TODAY.month - 1]} {TODAY.year}" in P.locator("[data-testid=hist-month-label]").inner_text(), P.locator("[data-testid=hist-month-label]").inner_text() if P.locator("[data-testid=hist-month-label]").count() else "no label")
        check("8 No script errors", not P.errors, str(P.errors[:2]))
        ctx.close()
        # person without passes
        ctx, P = open_app(browser, port, "bo", "light", "light"); P.wait_for_timeout(900)
        check("9 No passes in two months: message and the link is still there", P.locator("[data-testid=empty-list]").inner_text().strip() == "Inga pass de senaste två månaderna." and P.locator("[data-testid=to-history]").count() == 1)
        ctx.close()
        # switching person on the device updates the list
        ctx, P = open_app(browser, port, "niva", "light", "light"); P.wait_for_timeout(900)
        check("10 Niva sees only her own pass", row_dates(P) == [fmt(D(0))] and "nivas pass" in P.locator("[data-testid=recent-list]").inner_text())
        open_menu(P); P.locator("[data-testid=person-anna]").click(); P.wait_for_timeout(700)
        check("10 Switching to Anna in the menu shows Anna's 5", len(row_dates(P)) == 5 and "SENASTE PASS · Anna" in P.locator("[data-testid=recent-title]").inner_text())
        ctx.close()
        # dark mode
        ctx, P = open_app(browser, port, "anna", "dark", "dark"); P.wait_for_timeout(900)
        audit(P, "senaste pass dark", True)
        P.screenshot(path=str(SHOTS / "logga_senaste_morkt.png"), full_page=True)
        check("11 No script errors (dark)", not P.errors, str(P.errors[:2]))
        ctx.close()
    finally:
        m.terminate(); browser.close()
bad = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(bad)}/{len(results)} passed"); sys.exit(1 if bad else 0)
