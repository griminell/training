"""Acceptance tests for 1.7.0: Mående (sleep, energy, pain)."""
import re, sys, os, json, pathlib
HTML = sys.argv[1] if len(sys.argv) > 1 else str(pathlib.Path(__file__).resolve().parent.parent / "index.html")
sys.argv = [sys.argv[0], HTML]
src = open(pathlib.Path(__file__).resolve().parent / "test_160.py", encoding="utf-8").read().split("with sync_playwright()")[0]
__file__ = str(pathlib.Path(__file__).resolve())
os.environ.setdefault("SHOTS", "/tmp/shots_170")
exec(src)
from playwright.sync_api import sync_playwright

def row_for(P, day):
    return P.locator("[data-testid=pass-row],[data-testid=offday-row]").filter(has_text=re.compile(rf"^\s*{day:02d}/{M[5:]}"))
def raw_entries(port):
    return json.loads(json.load(urllib.request.urlopen(f"http://localhost:{port}/__raw?path=diaries/{CODE}/entries:{M}")))
def save(P):
    P.locator("button.flex-1", has_text=re.compile("^Spara")).first.click(); P.wait_for_timeout(1500)
def sport(P, label):
    if P.locator("[data-testid=sport-group] button[aria-pressed]", has_text=re.compile(f"^{label}$")).count() == 0:
        P.locator("[data-testid=sport-group-more]").click(); P.wait_for_timeout(150)
    P.locator("[data-testid=sport-group] button[aria-pressed]", has_text=re.compile(f"^{label}$")).click()
def pain_set(row, n):
    """Tap the slider track at the position of value n (row = locator of one pain row)."""
    sl = row.locator("[data-testid=pain-slider]"); sl.scroll_into_view_if_needed()
    b = sl.bounding_box(); pad = 16
    x = b["x"] + pad + (b["width"] - 2 * pad) * n / 10
    row.page.mouse.click(x, b["y"] + b["height"] / 2); row.page.wait_for_timeout(120)
def save_enabled(P):
    return P.locator("button.flex-1", has_text=re.compile("^Spara")).first.is_enabled()
def mine(port, day):
    return [e for e in raw_entries(port) if e["date"] == f"{M}-{day:02d}" and e["user"] == "niva" and "seed" not in e["id"]]

with sync_playwright() as pw:
    browser = pw.chromium.launch(); port = 9770; m = start_mock(port)
    try:
        ctx, P = open_app(browser, port, "niva", "light", "light")
        # 1. collapsed by default
        check("1 Mående is collapsed by default, with a hint", P.locator("[data-testid=sleep]").count() == 0 and "valfritt" in P.locator("[data-testid=wellbeing-summary]").inner_text())
        order = P.evaluate("""() => { const w = document.querySelector('[data-testid=wellbeing]'); const t = [...document.querySelectorAll('textarea')][0]; return w.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING ? 'above' : 'below'; }""")
        check("1 Mående sits above Anteckningar", order == "above", order)
        P.locator("[data-testid=wellbeing-toggle]").click(); P.wait_for_timeout(200)
        check("1 Opens on tap, no value preselected", P.locator("[data-testid=sleep] button[aria-pressed=true]").count() == 0 and P.locator("[data-testid=energy] button[aria-pressed=true]").count() == 0)
        check("1 Headline for a pass: SMÄRTA UNDER PASSET", "SMÄRTA UNDER PASSET" in P.locator("body").inner_text())
        # 2. scales
        hint = P.locator("[data-testid=sleep-hint]").inner_text()
        check("2 Sleep ends named Dålig / Toppen", "Dålig" in hint and "Toppen" in hint, hint)
        hint = P.locator("[data-testid=energy-hint]").inner_text()
        check("2 Energy ends named Tömd / Laddad", "Tömd" in hint and "Laddad" in hint, hint)
        P.locator("[data-testid=energy-2]").click(); P.locator("[data-testid=sleep-4]").click()
        check("2 Chosen step shows its name (4 – Bra, 2 – Låg)", "4 – Bra" in P.locator("[data-testid=sleep-hint]").inner_text() and "2 – Låg" in P.locator("[data-testid=energy-hint]").inner_text())
        P.locator("[data-testid=sleep-4]").click()
        check("2 Tapping the same button again clears it", P.locator("[data-testid=sleep] button[aria-pressed=true]").count() == 0)
        P.locator("[data-testid=sleep-4]").click()
        # 3. pain: quick buttons, required value and side
        q = [b.inner_text().strip() for b in P.locator("[data-testid=pain-add] button").all()]
        check("3 Quick choices start as Häl, Knä, Rygg", q == ["Häl", "Knä", "Rygg"], str(q))
        sport(P, "Löpning"); P.locator("[data-testid=tid-min]").fill("30"); P.fill("input[type=date]", f"{M}-27")
        P.locator("[data-testid=pain-quick-heel]").click()
        check("3 Heel row has Vänster/Höger", P.locator("[data-testid=pain-pos-L]").count() == 1 and P.locator("[data-testid=pain-pos-R]").count() == 1)
        check("3 Save is blocked without side and value, with a hint", not save_enabled(P) and P.locator("[data-testid=pain-hint]").count() == 1 and P.locator("[data-testid=pain-missing]").count() == 1)
        P.locator("[data-testid=pain-pos-L]").click()
        check("3 Still blocked without value", not save_enabled(P))
        pain_set(P.locator("[data-testid=pain-row]").last, 6); P.locator("[data-testid=pain-note]").fill("ont vid start")
        check("3 Save enabled when side and value are set", save_enabled(P) and P.locator("[data-testid=pain-hint]").count() == 0)
        # 4. back: upper/lower; value 0 is valid
        P.locator("[data-testid=pain-quick-back]").click()
        check("4 Back offers Övre/Nedre", P.locator("[data-testid=pain-pos-up]").count() == 1 and P.locator("[data-testid=pain-pos-low]").count() == 1)
        P.locator("[data-testid=pain-pos-low]").click(); pain_set(P.locator("[data-testid=pain-row]").nth(1), 0)
        check("4 Value 0 is valid", save_enabled(P))
        # 5. other: needs a name
        P.locator("[data-testid=pain-select]").select_option("other")
        check("5 'Annat' needs a name before saving", not save_enabled(P) and P.locator("[data-testid=pain-label]").count() == 1)
        P.locator("[data-testid=pain-label]").fill("Revben"); pain_set(P.locator("[data-testid=pain-row]").nth(2), 3)
        P.locator("[data-testid=pain-select]").select_option("knee")
        P.locator("[data-testid=pain-row]").nth(3).locator("[data-testid=pain-pos-R]").click(); pain_set(P.locator("[data-testid=pain-row]").nth(3), 2)
        # remove the knee again
        P.locator("[data-testid=pain-row]").nth(3).locator("[data-testid=pain-remove]").click()
        check("5 A row can be removed", P.locator("[data-testid=pain-row]").count() == 3)
        # 5b. slider behaviour (row 0 = heel, value 6)
        r0 = P.locator("[data-testid=pain-row]").first
        check("5b Slider: value 6 shown, thumb visible, no number buttons", r0.locator("[data-testid=pain-value-text]").inner_text() == "6" and r0.locator("[data-testid=pain-thumb]").count() == 1 and P.locator("[data-testid^=pain-v-]").count() == 0)
        r0.locator("[data-testid=pain-slider]").scroll_into_view_if_needed(); P.wait_for_timeout(200)
        sb = r0.locator("[data-testid=pain-slider]").bounding_box(); pad = 16
        xs = lambda n: sb["x"] + pad + (sb["width"] - 2 * pad) * n / 10
        P.mouse.move(xs(6), sb["y"] + 22); P.mouse.down(); P.mouse.move(xs(7), sb["y"] + 22, steps=4); P.mouse.move(xs(9), sb["y"] + 22, steps=4); P.mouse.up(); P.wait_for_timeout(150)
        check("5b Dragging sets the value (9)", r0.locator("[data-testid=pain-value-text]").inner_text() == "9", r0.locator("[data-testid=pain-value-text]").inner_text())
        pain_set(r0, 10); v10 = r0.locator("[data-testid=pain-value-text]").inner_text(); pain_set(r0, 0); v0 = r0.locator("[data-testid=pain-value-text]").inner_text()
        check("5b Both ends reachable (0 and 10)", v10 == "10" and v0 == "0", f"{v10} {v0}")
        r0.locator("[data-testid=pain-slider]").focus(); P.keyboard.press("ArrowRight"); P.keyboard.press("ArrowRight")
        check("5b Keyboard arrows change the value", r0.locator("[data-testid=pain-value-text]").inner_text() == "2")
        r0.locator("[data-testid=pain-clear]").click(); P.wait_for_timeout(100)
        check("5b Clear goes back to 'not chosen': dash, no thumb, hint, save blocked", r0.locator("[data-testid=pain-value-text]").inner_text() == "–" and r0.locator("[data-testid=pain-thumb]").count() == 0 and r0.locator("[data-testid=pain-slider-hint]").count() == 1 and not save_enabled(P))
        h_slider = r0.locator("[data-testid=pain-slider]").bounding_box()["height"]; h_row = r0.bounding_box()["height"]
        pain_set(r0, 6)
        P.screenshot(path=str(SHOTS / "mående_öppen.png"), full_page=True)
        save(P)
        e = mine(port, 27)
        check("6 Saved fields: sleep, energy, pain list", len(e) == 1 and e[0].get("sleep") == "4" and e[0].get("energy") == "2" and len(e[0].get("pain", [])) == 3, str(e))
        pn = e[0]["pain"] if e else []
        check("6 Pain items: heel L 6 + note, back low 0, other label", pn[0] == {"part": "heel", "pos": "L", "value": "6", "note": "ont vid start"} and pn[1] == {"part": "back", "pos": "low", "value": "0"} and pn[2] == {"part": "other", "value": "3", "label": "Revben"}, str(pn))
        check("6 Form and section are reset after saving", P.locator("[data-testid=sleep]").count() == 0 and "valfritt" in P.locator("[data-testid=wellbeing-summary]").inner_text())
        # 7. list
        r = row_for(P, 27)
        check("7 Several pains => a dot on the row (not text)", r.locator("[data-testid=pain-dot]").count() == 1 and r.locator("[data-testid=pain-badge]").count() == 0, r.inner_text().replace("\n", " "))
        r.locator("div").first.click(); P.wait_for_timeout(250)
        txt = r.inner_text()
        check("7 Opened pass shows sleep, energy and every pain line", "Sömn 4 – Bra" in txt and "Energi 2 – Låg" in txt and "Häl, vänster: 6/10 – ont vid start" in txt and "Rygg, nedre: 0/10" in txt and "Revben: 3/10" in txt, txt.replace("\n", " "))
        r.locator("div").first.click()
        # single pain => inline text
        sport(P, "Promenad"); P.locator("[data-testid=tid-min]").fill("20"); P.fill("input[type=date]", f"{M}-26")
        P.locator("[data-testid=wellbeing-toggle]").click(); P.locator("[data-testid=pain-quick-heel]").click()
        P.locator("[data-testid=pain-pos-R]").click(); pain_set(P.locator("[data-testid=pain-row]").last, 4); P.fill("textarea", "Vibes-pass, rutor"); save(P)
        r = row_for(P, 26)
        r.locator("div").first.click(); P.wait_for_timeout(250)
        nb = r.locator("[data-testid=note-block]")
        check("7 Note after pain has its own ANTECKNING heading and divider", nb.count() == 1 and "ANTECKNING" in nb.inner_text() and "Vibes-pass" in nb.inner_text() and nb.evaluate("el => getComputedStyle(el).borderTopWidth") == "1px")
        r.locator("div").first.click(); P.wait_for_timeout(150)
        check("7 One pain on a short row => 'Häl H 4' on the row", r.locator("[data-testid=pain-badge]").count() == 1 and "Häl H 4" in r.inner_text(), r.inner_text().replace("\n", " "))
        w = P.evaluate("() => [document.documentElement.scrollWidth, window.innerWidth]")
        check("7 No horizontal scroll at 390 px", w[0] <= w[1], str(w))
        # long row falls back to dot
        sport(P, "Skidor"); P.locator("[data-testid=tid-min]").fill("125"); P.locator("[data-testid=tid-sec]").fill("30"); P.locator("[data-testid=distance-input]").fill("12,5"); P.fill("input[type=date]", f"{M}-25")
        P.get_by_role("button", name="8", exact=True).first.click()
        P.locator("[data-testid=wellbeing-toggle]").click(); P.locator("[data-testid=pain-quick-knee]").click()
        P.locator("[data-testid=pain-pos-L]").click(); pain_set(P.locator("[data-testid=pain-row]").last, 5); save(P)
        r = row_for(P, 25)
        check("7 One pain on a long row => just a dot", r.locator("[data-testid=pain-dot]").count() == 1 and r.locator("[data-testid=pain-badge]").count() == 0, r.inner_text().replace("\n", " "))
        # 7c. Borg text sits right after the effort heading
        bt = P.evaluate("""() => { const h = [...document.querySelectorAll('div')].find(d => d.textContent.startsWith('ANSTRÄNGNING (1–10)') && d.children.length === 1); return h ? h.textContent : ''; }""")
        check("7c 'Skala enligt Borg CR10' is part of the Ansträngning heading, not below the buttons", "Skala enligt Borg CR10" in bt and P.locator("text=Skala enligt Borg CR10.").count() == 0, bt)
        # 8. plain pass keeps no new fields
        sport(P, "Löpning"); P.locator("[data-testid=tid-min]").fill("40"); P.fill("input[type=date]", f"{M}-24"); save(P)
        e = mine(port, 24)
        check("8 A pass without Mående has no sleep/energy/pain fields", len(e) == 1 and not any(k in e[0] for k in ("sleep", "energy", "pain")), str(e))
        check("8 Old seeded passes untouched", all(not any(k in x for k in ("sleep", "energy", "pain")) for x in raw_entries(port) if x["id"].startswith("n")))
        # 9. Samma som senast / Rensa
        P.locator("[data-testid=same-as-last]").click(); P.wait_for_timeout(300)
        check("9 'Samma som senast' never copies Mående", "valfritt" in P.locator("[data-testid=wellbeing-summary]").inner_text())
        P.locator("[data-testid=wellbeing-toggle]").click(); P.locator("[data-testid=energy-5]").click()
        check("9 Filling Mående makes the form dirty (Rensa enabled)", P.locator("[data-testid=clear-form]").is_enabled())
        P.locator("[data-testid=clear-form]").click(); P.wait_for_timeout(300)
        check("9 Rensa empties Mående", "valfritt" in P.locator("[data-testid=wellbeing-summary]").inner_text() and P.locator("[data-testid=energy]").count() == 0)
        # 10. edit loads everything
        r = row_for(P, 27); r.locator("div").first.click(); P.wait_for_timeout(200)
        r.locator("button[title='Redigera']").first.click(); P.wait_for_timeout(500)
        check("10 Edit opens Mående with values loaded", P.locator("[data-testid=sleep-4][aria-pressed=true]").count() == 1 and P.locator("[data-testid=pain-row]").count() == 3 and P.locator("[data-testid=pain-pos-L][aria-pressed=true]").count() == 1)
        pain_set(P.locator("[data-testid=pain-row]").first, 3); save(P)
        e = mine(port, 27)
        check("10 Editing the pain value saves", len(e) == 1 and e[0]["pain"][0]["value"] == "3" and e[0]["pain"][0]["note"] == "ont vid start", str(e))
        # 11. rest day
        P.locator("[data-testid=kind-rest]").click(); P.fill("input[type=date]", f"{M}-23")
        P.locator("[data-testid=wellbeing-toggle]").click()
        check("11 Rest day: headline SMÄRTA IDAG, no activity needed", "SMÄRTA IDAG" in P.locator("body").inner_text())
        P.locator("[data-testid=sleep-2]").click(); P.locator("[data-testid=pain-quick-heel]").click(); P.locator("[data-testid=pain-pos-L]").click(); pain_set(P.locator("[data-testid=pain-row]").last, 7); save(P)
        e = mine(port, 23)
        check("11 Rest day saved with kind and Mående", len(e) == 1 and e[0].get("kind") == "rest" and e[0].get("sleep") == "2" and e[0]["pain"][0]["value"] == "7", str(e))
        r = row_for(P, 23)
        check("11 Rest day row shows the pain", r.locator("[data-testid=pain-badge]").count() == 1 and "Häl V 7" in r.inner_text(), r.inner_text().replace("\n", " "))
        r.locator("div").first.click(); P.wait_for_timeout(200)
        check("11 Opened rest day says SMÄRTA IDAG", "SMÄRTA IDAG" in r.inner_text())
        # 12. statistics unaffected by rest-day mående, page ok
        tab(P, "Statistik"); P.wait_for_timeout(500)
        check("12 Statistik renders without errors", not P.errors, str(P.errors[:2]))
        tab(P, "Logga pass")
        # 13. CSV round trip
        open_menu(P)
        with P.expect_download() as d: menu(P).locator("[data-testid=menu-export]").click()
        txt = open(d.value.path(), encoding="utf-8-sig").read(); lines = txt.splitlines(); hdr = lines[0].split(";")
        check("13 CSV has Somn, Energi, Smarta as the last columns", hdr[-3:] == ["Somn (1-5)", "Energi (1-5)", "Smarta"], str(hdr))
        l27 = [l for l in lines if l.startswith(f"{M}-27;Niva")][0]
        check("13 Pain is written as readable text", "Häl vänster:3:ont vid start | Rygg nedre:0: | Annat (Revben):3:" in l27, l27)
        ctx.close()
        open("/tmp/t170.csv", "w", encoding="utf-8-sig").write(txt)
        m.terminate(); SEED.clear(); m = start_mock(port)
        ctx, P = open_app(browser, port, "niva", "light", "light")
        open_menu(P)
        with P.expect_file_chooser() as fc: menu(P).locator("[data-testid=menu-import]").click()
        fc.value.set_files("/tmp/t170.csv"); P.wait_for_timeout(2500)
        got = {x["date"]: x for x in raw_entries(port) if x["user"] == "niva"}
        a, b = got.get(f"{M}-27", {}), got.get(f"{M}-23", {})
        check("13 Import restores sleep, energy and the pain list", a.get("sleep") == "4" and a.get("energy") == "2" and a.get("pain") == [{"part": "heel", "pos": "L", "value": "3", "note": "ont vid start"}, {"part": "back", "pos": "low", "value": "0"}, {"part": "other", "value": "3", "label": "Revben"}], str(a))
        check("13 Rest day Mående restored too", b.get("kind") == "rest" and b.get("pain", [{}])[0].get("value") == "7", str(b))
        before = len(raw_entries(port))
        open_menu(P)
        with P.expect_file_chooser() as fc: menu(P).locator("[data-testid=menu-import]").click()
        fc.value.set_files("/tmp/t170.csv"); P.wait_for_timeout(2000)
        check("13 Importing the same file again does not duplicate", len(raw_entries(port)) == before)
        old = "Datum;Anvandare;Sport;Traningstyp;Tid (min);Anstrangning (1-10);Anteckningar;Typ;Distans (km)\r\n" + f"{M}-03;Niva;LÖ;KO;30;5;gammal;Pass;\r\n"
        open("/tmp/t170old.csv", "w", encoding="utf-8-sig").write(old)
        open_menu(P)
        with P.expect_file_chooser() as fc: menu(P).locator("[data-testid=menu-import]").click()
        fc.value.set_files("/tmp/t170old.csv"); P.wait_for_timeout(2000)
        o = [x for x in raw_entries(port) if x["date"] == f"{M}-03" and x["anteckningar"] == "gammal"]
        check("13 Old CSV without the new columns still imports", len(o) == 1 and not any(k in o[0] for k in ("sleep", "energy", "pain")))
        # 14. usage ranking: calf used most -> first quick choice
        ctx.close(); m.terminate(); SEED.clear()
        for i, day in enumerate((20, 21, 22)):
            SEED.append({"id": f"p{i}", "date": f"{M}-{day:02d}", "user": "niva", "sport": ["LÖ"], "typ": ["KO"], "tid": "30", "kansla": "5", "anteckningar": "", "cr10": True, "pain": [{"part": "calf", "pos": "R", "value": "4"}]})
        m = start_mock(port)
        ctx, P = open_app(browser, port, "niva", "light", "light")
        P.locator("[data-testid=wellbeing-toggle]").click()
        q = [b.inner_text().strip() for b in P.locator("[data-testid=pain-add] button").all()]
        check("14 Most used body part (last 30 days) comes first: Vad, then Häl, Knä", q[:3] == ["Vad", "Häl", "Knä"], str(q))
        ctx.close()
        # 15. dark mode
        ctx, P = open_app(browser, port, "niva", "dark", "dark")
        P.locator("[data-testid=wellbeing-toggle]").click(); P.locator("[data-testid=pain-quick-heel]").click(); pain_set(P.locator("[data-testid=pain-row]").last, 5)
        P.screenshot(path=str(SHOTS / "mående_mörkt.png"), full_page=True)
        bad = P.evaluate("""() => { const out = []; document.querySelectorAll('[data-testid=wellbeing] *').forEach(el => { const c = getComputedStyle(el).backgroundColor; const m = c.match(/\\d+/g); if (m && m.length >= 3 && (+m[0] + +m[1] + +m[2]) / 3 > 215 && getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)') out.push(el.tagName + ':' + c); }); return out; }""")
        check("15 Dark mode: no light backgrounds inside Mående", not bad, str(bad[:4]))
        check("15 No script errors", not P.errors, str(P.errors[:2]))
        ctx.close()
    finally:
        try: m.terminate()
        except Exception: pass
        browser.close()
bad = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(bad)}/{len(results)} passed"); sys.exit(1 if bad else 0)
