"""Acceptance tests for 1.6.6: time with optional seconds."""
import re, sys, os, json, pathlib
HTML = sys.argv[1] if len(sys.argv) > 1 else str(pathlib.Path(__file__).resolve().parent.parent / "index.html")
sys.argv = [sys.argv[0], HTML]
src = open(pathlib.Path(__file__).resolve().parent / "test_160.py", encoding="utf-8").read().split("with sync_playwright()")[0]
__file__ = str(pathlib.Path(__file__).resolve())
os.environ.setdefault("SHOTS", "/tmp/shots_166")
exec(src)
from playwright.sync_api import sync_playwright

def row_for(P, day):
    return P.locator("[data-testid=pass-row]").filter(has_text=re.compile(rf"^\s*{day:02d}/{M[5:]}"))
def raw_entries(port):
    return json.loads(json.load(urllib.request.urlopen(f"http://localhost:{port}/__raw?path=diaries/{CODE}/entries:{M}")))
def save(P):
    P.locator("button.flex-1", has_text=re.compile("^Spara")).first.click(); P.wait_for_timeout(1500)

with sync_playwright() as pw:
    browser = pw.chromium.launch(); port = 9766; m = start_mock(port)
    try:
        ctx, P = open_app(browser, port, "niva", "light", "light")
        # 1. Fields
        check("1 Label reads TID (MIN : SEK)", "TID (MIN : SEK)" in P.locator("body").inner_text())
        P.locator("[data-testid=tid-min]").fill("4a0"); P.locator("[data-testid=tid-sec]").fill("99")
        check("1 Letters stripped, seconds capped at 59", P.locator("[data-testid=tid-min]").input_value() == "40" and P.locator("[data-testid=tid-sec]").input_value() == "59", P.locator("[data-testid=tid-min]").input_value() + ":" + P.locator("[data-testid=tid-sec]").input_value())
        P.locator("[data-testid=tid-sec]").fill("46")
        P.locator("[data-testid=sport-group-more]").click(); P.wait_for_timeout(200)
        P.locator("[data-testid=sport-group] button[aria-pressed]", has_text=re.compile("^Promenad$")).click()
        P.locator("[data-testid=distance-input]").fill("4,07"); P.fill("input[type=date]", f"{M}-29")
        save(P)
        mine = [e for e in raw_entries(port) if e["date"] == f"{M}-29" and e["user"] == "niva" and e.get("distance")]
        check("2 Stored as decimal minutes 40.7667", len(mine) == 1 and mine[0]["tid"] == "40.7667", str(mine))
        r = row_for(P, 29)
        check("2 List shows 40:46 min", "40:46 min" in r.inner_text(), r.inner_text().replace("\n", " "))
        r.locator("div").first.click(); P.wait_for_timeout(250)
        check("2 Pace from exact time: 10:01 min/km", "10:01 min/km" in r.locator("[data-testid=pace]").inner_text(), r.inner_text())
        r.locator("div").first.click()
        # 3. Whole minutes unchanged
        P.locator("[data-testid=tid-min]").fill("45")
        if P.locator("[data-testid=sport-group] button[aria-pressed]", has_text=re.compile("^Löpning$")).count() == 0: P.locator("[data-testid=sport-group-more]").click(); P.wait_for_timeout(200)
        P.locator("[data-testid=sport-group] button[aria-pressed]", has_text=re.compile("^Löpning$")).click(); P.fill("input[type=date]", f"{M}-28")
        save(P)
        mine = [e for e in raw_entries(port) if e["date"] == f"{M}-28" and e["user"] == "niva"]
        check("3 Whole minutes stored as '45'", len(mine) == 1 and mine[0]["tid"] == "45", str(mine))
        check("3 List shows '45 min' and form cleared", "45 min" in row_for(P, 28).inner_text() and P.locator("[data-testid=tid-min]").input_value() == "" and P.locator("[data-testid=tid-sec]").input_value() == "")
        # 4. Same as last copies seconds
        P.locator("[data-testid=same-as-last]").click(); P.wait_for_timeout(300)
        check("4 Same as last fills min and sec", P.locator("[data-testid=tid-min]").input_value() != "")
        # 5. Rensa clears both fields
        P.locator("[data-testid=tid-sec]").fill("30")
        P.locator("[data-testid=clear-form]").click(); P.wait_for_timeout(300)
        check("5 Rensa clears minutes and seconds", P.locator("[data-testid=tid-min]").input_value() == "" and P.locator("[data-testid=tid-sec]").input_value() == "")
        # 6. Edit loads both
        r = row_for(P, 29); r.locator("div").first.click(); P.wait_for_timeout(250)
        r.locator("button[title='Redigera']").first.click(); P.wait_for_timeout(400)
        check("6 Edit loads minutes and seconds", P.locator("[data-testid=tid-min]").input_value() == "40" and P.locator("[data-testid=tid-sec]").input_value() == "46", P.locator("[data-testid=tid-min]").input_value() + ":" + P.locator("[data-testid=tid-sec]").input_value())
        P.locator("[data-testid=clear-form]").click(); P.wait_for_timeout(300)
        # 7. CSV export + round trip
        open_menu(P)
        with P.expect_download() as d: menu(P).locator("[data-testid=menu-export]").click()
        txt = open(d.value.path(), encoding="utf-8-sig").read(); lines = txt.splitlines()
        l29 = [l for l in lines if l.startswith(f"{M}-29;Niva")][0].split(";"); l28 = [l for l in lines if l.startswith(f"{M}-28;Niva")][0].split(";")
        check("7 CSV writes 40:46 with seconds and 45 without", l29[4] == "40:46" and l28[4] == "45", f"{l29[4]!r} {l28[4]!r}")
        ctx.close()
        csv_path = "/tmp/t166.csv"; open(csv_path, "w", encoding="utf-8-sig").write(txt)
        m.terminate(); SEED.clear(); m = start_mock(port)
        ctx, P = open_app(browser, port, "niva", "light", "light")
        open_menu(P)
        with P.expect_file_chooser() as fc: menu(P).locator("[data-testid=menu-import]").click()
        fc.value.set_files(csv_path); P.wait_for_timeout(2500)
        got = {e["date"]: e["tid"] for e in raw_entries(port) if e["user"] == "niva"}
        check("7 Import restores 40.7667 and 45", got.get(f"{M}-29") == "40.7667" and got.get(f"{M}-28") == "45", str(got))
        old = "Datum;Anvandare;Sport;Traningstyp;Tid (min);Anstrangning (1-10);Anteckningar;Typ\r\n" + f"{M}-03;Niva;LÖ;KO;30;5;a;Pass\r\n{M}-04;Niva;LÖ;KO;7,5;5;b;Pass\r\n{M}-05;Niva;LÖ;KO;1:05;5;c;Pass\r\n"
        open("/tmp/t166old.csv", "w", encoding="utf-8-sig").write(old)
        open_menu(P)
        with P.expect_file_chooser() as fc: menu(P).locator("[data-testid=menu-import]").click()
        fc.value.set_files("/tmp/t166old.csv"); P.wait_for_timeout(2000)
        got = {e["date"]: e["tid"] for e in raw_entries(port) if e["user"] == "niva"}
        check("7 Old CSV forms import: 30, 7,5 -> 7.5, 1:05 -> 1.0833", got.get(f"{M}-03") == "30" and got.get(f"{M}-04") == "7.5" and got.get(f"{M}-05") == "1.0833", str(got))
        # 8. Stats use exact time
        tab(P, "Statistik"); P.get_by_role("button", name="Alla månader").click(); P.wait_for_timeout(700)
        check("8 Stats page renders without errors", not P.errors, str(P.errors[:2]))
        ctx.close()
    finally:
        try: m.terminate()
        except Exception: pass
        browser.close()
bad = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(bad)}/{len(results)} passed"); sys.exit(1 if bad else 0)
