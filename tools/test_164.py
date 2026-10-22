"""Acceptance tests for 1.6.4: distance (km) + pace, and statistics that follow the person who is logging."""
import re, sys, os, json, pathlib
HTML = sys.argv[1] if len(sys.argv) > 1 else str(pathlib.Path(__file__).resolve().parent.parent / "index.html")
sys.argv = [sys.argv[0], HTML]
src = open(pathlib.Path(__file__).resolve().parent / "test_160.py", encoding="utf-8").read().split("with sync_playwright()")[0]
__file__ = str(pathlib.Path(__file__).resolve())
os.environ.setdefault("SHOTS", "/tmp/shots_164")
exec(src)
from playwright.sync_api import sync_playwright

def dpass(i, d, sport, tid, dist=None):
    e = entry(i, d, "niva", sport, ["KO"], str(tid), "5", "")
    if dist is not None: e["distance"] = dist
    return e
SEED.extend([dpass("d1", 22, ["LÖ"], 30, "5"), dpass("d2", 23, ["PR"], 60, "5"), dpass("d3", 24, ["CY"], 60, "25"),
             dpass("d4", 25, ["S"], 90, "12"), dpass("d5", 26, ["LÖ", "PR"], 40, "6"), dpass("d6", 27, ["LÖ"], 30),
             dpass("d7", 28, ["LÖ"], 45, "7.5")])
def row_for(P, day):
    return P.locator("[data-testid=pass-row]").filter(has_text=re.compile(rf"^\s*{day:02d}/{M[5:]}"))
def open_row(P, day):
    r = row_for(P, day)
    if r.locator("[data-testid=pace]").count() == 0 and r.locator("p").count() == 0: r.locator("div").first.click(); P.wait_for_timeout(200)
    return r
def stats_scope_all(P):
    P.get_by_role("button", name="Alla månader").click(); P.wait_for_timeout(700)
def pill_pressed(P):
    return [b.inner_text().strip() for b in P.locator("button[aria-pressed=true]").all() if b.inner_text().strip() in ("Niva", "Grim", "Anna", "Bo")]

with sync_playwright() as pw:
    browser = pw.chromium.launch(); port = 9741; m = start_mock(port)
    try:
        ctx, P = open_app(browser, port, "niva", "light", "light")
        # ---- 1. Field ----
        tb = P.locator("[data-testid=tid-min]").bounding_box(); sb = P.locator("[data-testid=tid-sec]").bounding_box(); tb = dict(tb, width=sb["x"] + sb["width"] - tb["x"]); db = P.locator("[data-testid=distance-input]").bounding_box()
        check("1 Distance field sits next to Tid on the same row, same width", abs(tb["y"] - db["y"]) < 3 and db["x"] > tb["x"] + tb["width"] and abs(tb["width"] - db["width"]) < 4 and db["x"] + db["width"] <= 390 - 12, f"{tb} {db}")
        check("1 Label reads DISTANS (KM)", "DISTANS (KM)" in P.locator("body").inner_text())
        P.locator("[data-testid=distance-input]").fill("5,2abc.9")
        check("1 Input accepts comma, strips letters, keeps max 2 decimals", P.locator("[data-testid=distance-input]").input_value() in ("5,29", "5,2"), P.locator("[data-testid=distance-input]").input_value())
        P.locator("[data-testid=distance-input]").fill("5,2")
        P.locator("[data-testid=sport-group] button[aria-pressed]", has_text=re.compile("^Löpning$")).click()
        P.fill("[data-testid=tid-min]", "30"); P.fill("input[type=date]", f"{M}-29")
        P.locator("button.flex-1", has_text=re.compile("^Spara")).first.click(); P.wait_for_timeout(1500)
        raw = json.loads(json.load(urllib.request.urlopen(f"http://localhost:{port}/__raw?path=diaries/{CODE}/entries:{M}")))
        mine = [e for e in raw if e["date"] == f"{M}-29" and e["user"] == "niva" and e.get("distance")]
        check("1 Saved as the text '5.2' in the field `distance`", len(mine) == 1 and mine[0]["distance"] == "5.2", str(mine))
        check("1 Old passes have no `distance` field and are untouched", all("distance" not in e for e in raw if e["id"].startswith("n")))
        check("1 Form is emptied after saving (distance too)", P.locator("[data-testid=distance-input]").input_value() == "")
        # ---- 2. List ----
        tab(P, "Historik"); P.wait_for_timeout(700)   # since 1.8.1 Logga pass lists only the 5 latest passes; the full month is in Historik
        r10 = row_for(P, 29)
        check("2 List row shows ' · 5,2 km' after the time", "30 min" in r10.inner_text() and "5,2 km" in r10.inner_text(), r10.inner_text().replace("\n", " "))
        r1 = row_for(P, 1)
        check("2 Passes without distance show no km", "km" not in r1.inner_text())
        # ---- 3. Pace ----
        P.locator("[data-testid=pass-row]").first.scroll_into_view_if_needed()
        def pace(day):
            r = row_for(P, day); r.locator("div").first.click(); P.wait_for_timeout(250)
            t = r.locator("[data-testid=pace]"); v = t.inner_text().strip() if t.count() else None
            r.locator("div").first.click(); P.wait_for_timeout(150); return v
        collapsed = row_for(P, 22).locator("[data-testid=pace]").count()
        check("3 Pace is not shown in the collapsed row", collapsed == 0)
        check("3 Löpning 5 km / 30 min = 6:00 min/km", pace(22) == "Tempo 6:00 min/km", str(pace(22)))
        check("3 Promenad 5 km / 60 min = 12:00 min/km", pace(23) == "Tempo 12:00 min/km", str(pace(23)))
        check("3 Cykel 25 km / 60 min = 25,0 km/h", pace(24) == "Tempo 25,0 km/h", str(pace(24)))
        check("3 Löpning 7,5 km / 45 min = 6:00 min/km", pace(28) == "Tempo 6:00 min/km", str(pace(28)))
        check("3 Skidor with distance: no pace", pace(25) is None)
        check("3 Two activities (Löpning + Promenad): no pace", pace(26) is None)
        check("3 Löpning without distance: no pace", pace(27) is None)
        tab(P, "Logga pass"); P.wait_for_timeout(500)
        # rest day never has distance
        P.locator("[data-testid=kind-rest]").click(); P.fill("input[type=date]", f"{M}-12"); P.fill("textarea", "vila")
        check("3 Rest/sick form has no distance field", P.locator("[data-testid=distance-input]").count() == 0)
        P.locator("[data-testid=kind-pass]").click()
        # ---- 4. Edit loads the distance; Rensa clears it; Samma som senast does not copy it ----
        row_for(P, 28).locator("button[title=Redigera]").click(); P.wait_for_timeout(300)   # day 28 is among the 5 latest passes on Logga pass
        check("4 Editing loads the distance into the field", P.locator("[data-testid=distance-input]").input_value() in ("7.5", "7,5"), P.locator("[data-testid=distance-input]").input_value())
        P.locator("[data-testid=clear-form]").click(); P.wait_for_timeout(200)
        check("4 'Avbryt' while editing leaves the saved pass as it was", [e for e in json.loads(json.load(urllib.request.urlopen(f"http://localhost:{port}/__raw?path=diaries/{CODE}/entries:{M}"))) if e["id"] == "d7"][0]["distance"] == "7.5")
        P.locator("[data-testid=distance-input]").fill("3"); 
        P.locator("[data-testid=clear-form]").click(); P.wait_for_timeout(200)
        check("4 Rensa empties the distance", P.locator("[data-testid=distance-input]").input_value() == "")
        P.locator("[data-testid=same-as-last]").click(); P.wait_for_timeout(200)
        check("4 'Samma som senast' fills time but not distance", P.locator("[data-testid=distance-input]").input_value() == "")
        P.locator("[data-testid=clear-form]").click()
        # ---- 5. Statistics card ----
        tab(P, "Statistik"); stats_scope_all(P)
        tot = P.locator("[data-testid=distance-total]")
        check("5 'Distans totalt (km)' card shows the sum (Niva: 5+5+25+12+6+7,5+5,2 = 65,7)", tot.count() == 1 and tot.inner_text().strip() == "65,7", tot.inner_text() if tot.count() else "none")
        check("5 Card label is 'Distans totalt (km)'", "Distans totalt (km)" in P.locator("body").inner_text())
        P.screenshot(path=str(SHOTS / "statistik_distans.png"), full_page=True)
        P.get_by_role("button", name="Grim", exact=True).click(); P.wait_for_timeout(500)
        check("5 No distance logged => the card is hidden (Grim)", P.locator("[data-testid=distance-total]").count() == 0)
        # ---- 6. CSV ----
        tab(P, "Logga pass"); open_menu(P)
        with P.expect_download() as d: menu(P).locator("[data-testid=menu-export]").click()
        txt = open(d.value.path(), encoding="utf-8-sig").read(); lines = txt.splitlines()
        hdr = lines[0].split(";")
        check("6 CSV has 'Distans (km)' as the column after Typ", hdr[8] == "Distans (km)" and hdr[7] == "Typ", str(hdr))
        l22 = [l for l in lines if l.startswith(f"{M}-22;Niva")][0].split(";"); l28 = [l for l in lines if l.startswith(f"{M}-28;Niva")][0].split(";"); l01 = [l for l in lines if l.startswith(f"{M}-01;Niva")][0].split(";")
        check("6 Distances use a decimal comma, empty when not logged", l22[8] == "5" and l28[8].strip('"') == "7,5" and l01[8] == "", f"{l22[8]!r} {l28[8]!r} {l01[8]!r}")
        ctx.close()
        # import into an empty diary keeps distance (round trip), and an old CSV without the column still imports
        csv_path = "/tmp/t164.csv"; open(csv_path, "w", encoding="utf-8-sig").write(txt)
        m.terminate()
        SEED.clear(); m = start_mock(port)
        ctx, P = open_app(browser, port, "niva", "light", "light")
        open_menu(P)
        with P.expect_file_chooser() as fc: menu(P).locator("[data-testid=menu-import]").click()
        fc.value.set_files(csv_path); P.wait_for_timeout(2500)
        raw = json.loads(json.load(urllib.request.urlopen(f"http://localhost:{port}/__raw?path=diaries/{CODE}/entries:{M}")))
        got = {e["date"]: e.get("distance") for e in raw if e["user"] == "niva"}
        check("6 Import restores the distances (5, 7.5, 5.2) and leaves others without the field", got.get(f"{M}-22") == "5" and got.get(f"{M}-28") == "7.5" and got.get(f"{M}-29") == "5.2" and got.get(f"{M}-01") is None, str({k: v for k, v in got.items() if v}))
        # an old CSV (no distance column) still imports
        old = "Datum;Anvandare;Sport;Traningstyp;Tid (min);Anstrangning (1-10);Anteckningar;Typ\r\n" + f"{M}-03;Niva;LÖ;KO;30;5;gammal;Pass\r\n"
        open("/tmp/t164old.csv", "w", encoding="utf-8-sig").write(old)
        open_menu(P)
        with P.expect_file_chooser() as fc: menu(P).locator("[data-testid=menu-import]").click()
        fc.value.set_files("/tmp/t164old.csv"); P.wait_for_timeout(2000)
        raw = json.loads(json.load(urllib.request.urlopen(f"http://localhost:{port}/__raw?path=diaries/{CODE}/entries:{M}")))
        check("6 An old CSV without the distance column still imports", any(e["date"] == f"{M}-03" and e["anteckningar"] == "gammal" and "distance" not in e for e in raw))
        ctx.close()

        # ---- 7. Statistics follow the person who is logging ----
        ctx, P = open_app(browser, port, "grim", "light", "light")
        tab(P, "Statistik")
        check("7 Logging as Grim: Statistik opens on Grim", pill_pressed(P) == ["Grim"], str(pill_pressed(P)))
        open_menu(P); menu(P).locator("[data-testid=person-niva]").click(); P.wait_for_timeout(500)
        check("7 Switching person in the menu while on Statistik switches the statistics", pill_pressed(P) == ["Niva"], str(pill_pressed(P)))
        P.get_by_role("button", name="Grim", exact=True).click(); P.wait_for_timeout(300)
        check("7 Picking another person under 'Visar statistik för' still works", pill_pressed(P) == ["Grim"])
        tab(P, "Logga pass"); tab(P, "Statistik")
        check("7 Leaving and coming back resets to the person who is logging (Niva)", pill_pressed(P) == ["Niva"], str(pill_pressed(P)))
        check("7 Chip still says Niva (logging person unchanged by the pill)", chip(P).inner_text().strip() == "Niva")
        open_menu(P); menu(P).locator("[data-testid=person-grim]").click(); P.wait_for_timeout(300)
        check("7 Switching person on Statistik, then back to Logga: logging as Grim", chip(P).inner_text().strip() == "Grim" and pill_pressed(P) == ["Grim"])
        check("7 No script errors", not P.errors, str(P.errors[:2]))
        ctx.close()
    finally:
        try: m.terminate()
        except Exception: pass
        browser.close()
bad = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(bad)}/{len(results)} passed"); sys.exit(1 if bad else 0)
