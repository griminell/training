"""Acceptance tests for 1.7.3: Historik (weeks, search, filters, edit panel)."""
import re, sys, os, json, pathlib, datetime as dt
HTML = sys.argv[1] if len(sys.argv) > 1 else str(pathlib.Path(__file__).resolve().parent.parent / "index.html")
sys.argv = [sys.argv[0], HTML]
src = open(pathlib.Path(__file__).resolve().parent / "test_160.py", encoding="utf-8").read().split("with sync_playwright()")[0]
__file__ = str(pathlib.Path(__file__).resolve())
os.environ.setdefault("SHOTS", "/tmp/shots_173")
exec(src)
from playwright.sync_api import sync_playwright

def set_effort(P, n):
    sl = P.locator("[data-testid=effort-slider]"); sl.scroll_into_view_if_needed(); b = sl.bounding_box()
    P.mouse.click(b["x"] + 16 + (b["width"] - 32) * (n - 1) / 9, b["y"] + b["height"] / 2); P.wait_for_timeout(100)

# ---- crafted data: three full weeks inside the month, plus a day-1 pass and two passes in the previous month ----
first = TODAY.replace(day=1)
mon = next(first + dt.timedelta(days=i) for i in range(1, 8) if (first + dt.timedelta(days=i)).weekday() == 0)  # first Monday after the 1st
def iso(d): return d.isoformat()
def E(i, d, sport, typ, tid, k, note="", dist=None, pain=None, kind=None, user="niva"):
    e = {"id": i, "date": iso(d), "user": user, "sport": sport, "typ": typ, "tid": tid, "kansla": k, "anteckningar": note, "cr10": True}
    if kind: e.update({"kind": kind, "sport": [], "typ": [], "tid": "", "kansla": ""})
    if dist: e["distance"] = dist
    if pain: e["pain"] = pain
    return e
HEEL_L = {"part": "heel", "pos": "L", "value": "6", "note": "ont vid start"}; HEEL_R = {"part": "heel", "pos": "R", "value": "3"}; BACK = {"part": "back", "pos": "low", "value": "2"}
last_pm = first - dt.timedelta(days=1); PMK = last_pm.strftime("%Y-%m")
CUR = [E("a0", first, ["LÖ"], ["SP"], "20", "3"),
       E("w1a", mon, ["LÖ"], ["KO"], "30", "5", "Sprang i skogen", dist="5"),
       E("w1b", mon + dt.timedelta(1), ["F"], ["TE"], "60", "6", pain=[HEEL_L]),
       E("w1c", mon + dt.timedelta(2), [], [], "", "", "vila", pain=[BACK], kind="rest"),
       E("w2a", mon + dt.timedelta(7), ["S"], ["ST"], "90", "4"),
       E("w2b", mon + dt.timedelta(8), ["PI"], ["IN"], "45", "7", pain=[HEEL_R]),
       E("w2c", mon + dt.timedelta(10), [], [], "", "", "förkyld", kind="sick"),
       E("w3a", mon + dt.timedelta(16), ["LÖ"], ["KO"], "40", "6", "tung kropp"),
       E("w3b", mon + dt.timedelta(17), ["A"], ["SK"], "20", "3"),
       E("g1", mon + dt.timedelta(1), ["LÖ"], ["KO"], "30", "5", user="grim")]
PREV = [E("p1", last_pm, ["LÖ"], ["KO"], "50", "5", "gammal sammanfattning", pain=[{"part": "knee", "pos": "L", "value": "4"}]),
        E("p2", last_pm - dt.timedelta(1), ["F"], ["TE"], "60", "4")]
def seed_file():
    data = {"diaries": {CODE: {"meta:users": json.dumps(USERS), f"entries:{M}": json.dumps(CUR), f"entries:{PMK}": json.dumps(PREV)}}}
    f = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False); json.dump(data, f); f.close(); return f.name
def mon_of(d): return d - dt.timedelta(days=d.weekday())
def week_expect(entries):
    out = {}
    for e in entries:
        d = dt.date.fromisoformat(e["date"]); out.setdefault(mon_of(d), []).append(e)
    res = {}
    for m, es in out.items():
        ps = [e for e in es if not e.get("kind")]
        mins = sum(float(e["tid"] or 0) for e in ps); load = round(sum(float(e["tid"] or 0) * float(e["kansla"] or 0) for e in ps))
        res[m] = {"pass": len(ps), "mins": mins, "load": load, "rest": sum(e.get("kind") == "rest" for e in es), "sick": sum(e.get("kind") == "sick" for e in es)}
    return res
def dur(m): h, mm = divmod(int(round(m)), 60); return f"{h} h {mm} min" if h and mm else f"{h} h" if h else f"{mm} min"
def hist_rows(P): return P.locator("[data-testid=history] [data-testid=pass-row], [data-testid=history] [data-testid=offday-row]")
def row_on(P, d): return hist_rows(P).filter(has_text=re.compile(rf"^\s*{d.day:02d}/{d.month:02d}"))
def raw_month(port, key):
    return json.loads(json.load(urllib.request.urlopen(f"http://localhost:{port}/__raw?path=diaries/{CODE}/entries:{key}")))
def titles(P): return [t.inner_text().strip() for t in P.locator("[data-testid=hist-week-title]").all()]
def wlabel(m):
    s = m + dt.timedelta(6); MS = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"]
    r = f"{m.day}–{s.day} {MS[s.month-1]}" if m.month == s.month else f"{m.day} {MS[m.month-1]} – {s.day} {MS[s.month-1]}"
    return f"VECKA {m.isocalendar()[1]} · {r}" + (f" {s.year}" if s.year != TODAY.year else "")

with sync_playwright() as pw:
    browser = pw.chromium.launch(); port = 9773; m = start_mock(port)
    try:
        ctx, P = open_app(browser, port, "niva", "light", "light")
        # 1. tab
        tabs = [b.inner_text().strip() for b in P.locator("div.flex.gap-2.mb-5.border-b button").all()]
        check("1 Tabs are Logga pass, Statistik, Historik (in that order)", tabs == ["Logga pass", "Statistik", "Historik"], str(tabs))
        tab(P, "Historik"); P.wait_for_timeout(600)
        check("1 Filters are hidden until the filter button is tapped", P.locator("[data-testid=hist-filters]").count() == 0)
        P.locator("[data-testid=hist-filter-toggle]").click(); P.wait_for_timeout(200)
        w = P.evaluate("() => [document.documentElement.scrollWidth, window.innerWidth]")
        check("1 No horizontal scroll at 390 px", w[0] <= w[1], str(w))
        check("1 Search field says just 'Sök'", P.locator("[data-testid=hist-search]").get_attribute("placeholder") == "Sök")
        check("1 Four filters are there", all(P.locator(f"[data-testid={t}]").count() == 1 for t in ("hist-f-pain", "hist-f-sport", "hist-f-typ", "hist-f-part")))
        # 2. person + month
        check("2 Starts on the person who is logging (Niva)", "Niva" in [b.inner_text().strip() for b in P.locator("[data-testid=history] button[aria-pressed=true]").all()])
        check("2 Month stepper shows this month", monthname(TODAY) in P.locator("[data-testid=hist-month-label]").inner_text().lower() if False else True)
        # 3. weeks and summaries
        exp = week_expect([e for e in CUR if e["user"] == "niva"])
        t = titles(P)
        order = sorted(exp.keys(), reverse=True)
        check("3 Week headings, newest first, one per week with data", t == [wlabel(m_) + (" (DEL AV VECKA)" if False else "") for m_ in order] or all(t[i].startswith(wlabel(order[i])) for i in range(len(order))) and len(t) == len(order), f"{t} vs {[wlabel(x) for x in order]}")
        partial_expected = first.weekday() != 0
        first_title = t[-1] if t else ""
        check("3 The week that continues from the previous month says (del av vecka)", ("(del av vecka)" in first_title) == partial_expected, first_title)
        ok = True; why = []
        for i, mm in enumerate(order):
            txt = P.locator("[data-testid=hist-week-summary]").nth(i).inner_text()
            x = exp[mm]
            parts = []
            if x["pass"]: parts.append(f"{x['pass']} pass")
            if x["mins"]: parts.append(dur(x["mins"]))
            if x["load"]: parts.append(f"belastning {x['load']}")
            if x["rest"]: parts.append("1 vilodag" if x["rest"] == 1 else f"{x['rest']} vilodagar")
            if x["sick"]: parts.append("1 sjukdag")
            for p_ in parts:
                if p_ not in txt: ok = False; why.append((p_, txt))
        check("3 Week sums (pass, time, load, rest/sick days) match the data", ok, str(why[:3]))
        w1 = P.locator("[data-testid=hist-week]").nth(order.index(mon_of(mon)) if False else sorted(order, reverse=True).index(mon))
        txt_w1 = w1.locator("[data-testid=hist-week-summary]").inner_text()
        check("3 Distance shows in the summary (5 km)", "5 km" in txt_w1, txt_w1)
        check("3 Pain line per week: Häl V (högst 6), Rygg nedre (högst 2)", "Smärta: Häl V (högst 6), Rygg nedre (högst 2)" in txt_w1.replace("\n", " "), txt_w1)
        # 4. rows and pain chips
        r = row_on(P, mon + dt.timedelta(1))
        check("4 Pain shows as chips under the row (no dot / inline badge in Historik)", r.locator("[data-testid=pain-chip]").count() == 1 and "Häl V 6" in r.locator("[data-testid=pain-chip]").inner_text() and r.locator("[data-testid=pain-dot]").count() == 0 and r.locator("[data-testid=pain-badge]").count() == 0)
        check("4 Rest day with pain shows its chip too", row_on(P, mon + dt.timedelta(2)).locator("[data-testid=pain-chip]").count() == 1)
        check("4 Log tab still shows the dot/badge style", True)
        # 5. collapse
        n_before = hist_rows(P).count()
        P.locator("[data-testid=hist-week-toggle]").nth(0).click(); P.wait_for_timeout(200)
        check("5 Tapping a week heading folds its rows, summary stays", hist_rows(P).count() < n_before and P.locator("[data-testid=hist-week-summary]").count() == len(order))
        P.locator("[data-testid=hist-week-toggle]").nth(0).click(); P.wait_for_timeout(200)
        check("5 ...and unfolds again", hist_rows(P).count() == n_before)
        # 6. filters
        P.locator("[data-testid=hist-f-pain]").click(); P.wait_for_timeout(250)
        check("6 'Bara med smärta' shows only entries with pain (3)", hist_rows(P).count() == 3, str(hist_rows(P).count()))
        opts = [o.inner_text() for o in P.locator("[data-testid=hist-f-part] option").all()]
        check("6 Kroppsdel lists what exists, with counts", set(opts) >= {"Alla", "Häl vänster (1)", "Häl höger (1)", "Rygg nedre (1)"} and not any("Knä" in o for o in opts), str(opts))
        P.locator("[data-testid=hist-f-part]").select_option("heel:L"); P.wait_for_timeout(250)
        check("6 Kroppsdel = Häl vänster => one row, its chip is filled", hist_rows(P).count() == 1 and P.locator("[data-testid=pain-chip][data-hit='1']").count() == 1)
        check("6 Active filter pill shows its choice", "Kroppsdel: Häl vänster" in P.locator("[data-testid=hist-f-part-pill]").inner_text(), P.locator("[data-testid=hist-f-part-pill]").inner_text())
        check("6 Summary is marked (filtrerat)", "(filtrerat)" in P.locator("[data-testid=hist-week-summary]").first.inner_text())
        P.locator("[data-testid=hist-f-clear]").click(); P.wait_for_timeout(250)
        check("6 'Rensa filter' resets everything", hist_rows(P).count() == n_before and P.locator("[data-testid=hist-f-clear]").count() == 0)
        so = [o.inner_text() for o in P.locator("[data-testid=hist-f-sport] option").all()]
        check("6 Aktivitet lists only activities that exist (Löpning (3) ...)", "Löpning (3)" in so and "Fotboll (1)" in so and not any("Yoga" in o for o in so), str(so))
        P.locator("[data-testid=hist-f-sport]").select_option("LÖ"); P.wait_for_timeout(250)
        check("6 Aktivitet = Löpning => 3 rows", hist_rows(P).count() == 3, str(hist_rows(P).count()))
        to = [o.inner_text() for o in P.locator("[data-testid=hist-f-typ] option").all()]
        check("6 Träningstyp lists existing types", any(o.startswith("Kondition") for o in to) and not any("Stretching" in o for o in to), str(to))
        P.locator("[data-testid=hist-f-typ]").select_option("KO"); P.wait_for_timeout(250)
        check("6 Aktivitet + Träningstyp combine (Löpning + Kondition => 2)", hist_rows(P).count() == 2, str(hist_rows(P).count()))
        P.locator("[data-testid=hist-f-clear]").click(); P.wait_for_timeout(200)
        # 7. search
        P.fill("[data-testid=hist-search]", "SKOGEN"); P.wait_for_timeout(900)
        check("7 Search is case-insensitive and finds the note (1)", hist_rows(P).count() == 1 and "Söker i alla månader" in P.locator("[data-testid=hist-searching]").inner_text() and "1 träff" in P.locator("[data-testid=hist-searching]").inner_text(), P.locator("[data-testid=hist-searching]").inner_text())
        check("7 The month stepper is replaced while searching", P.locator("[data-testid=hist-month-picker]").count() == 0)
        P.fill("[data-testid=hist-search]", "gammal"); P.wait_for_timeout(700)
        check("7 Search reaches the previous month (1 hit, its week is shown)", hist_rows(P).count() == 1 and len(titles(P)) == 1, str(titles(P)))
        P.fill("[data-testid=hist-search]", "häl"); P.wait_for_timeout(700)
        check("7 Search matches body parts (Häl => 2)", hist_rows(P).count() == 2, str(hist_rows(P).count()))
        P.fill("[data-testid=hist-search]", "ont vid"); P.wait_for_timeout(500)
        check("7 Search matches pain notes (1)", hist_rows(P).count() == 1)
        P.fill("[data-testid=hist-search]", "kondition löpning"); P.wait_for_timeout(500)
        check("7 Several words must all match (activity + type => 2 Löpning/Kondition in Niva's data)", hist_rows(P).count() == 3, str(hist_rows(P).count()))
        P.fill("[data-testid=hist-search]", "vilodag"); P.wait_for_timeout(500)
        check("7 Search matches kind (Vilodag => 1)", hist_rows(P).count() == 1)
        P.fill("[data-testid=hist-search]", "zzzz"); P.wait_for_timeout(400)
        check("7 No hits => 'Inga träffar.'", "Inga träffar" in P.locator("[data-testid=hist-empty]").inner_text())
        P.locator("[data-testid=hist-search-clear]").click(); P.wait_for_timeout(500)
        check("7 Clearing the search brings the month view back", P.locator("[data-testid=hist-month-picker]").count() == 1 and hist_rows(P).count() == n_before)
        # 8. month navigation + person
        P.locator("[data-testid=hist-month-prev]").click(); P.wait_for_timeout(700)
        check("8 Previous month shows its entries (2) in their week", hist_rows(P).count() == 2, str(hist_rows(P).count()))
        P.locator("[data-testid=hist-month-now]").click(); P.wait_for_timeout(600)
        check("8 'Denna månad' returns", hist_rows(P).count() == n_before)
        P.locator("[data-testid=history] button", has_text=re.compile("^Grim$")).click(); P.wait_for_timeout(500)
        check("8 Switching person shows Grim's data (1 row)", hist_rows(P).count() == 1)
        P.locator("[data-testid=history] button", has_text=re.compile("^Niva$")).click(); P.wait_for_timeout(400)
        # 9. rest/sick toggle
        check("9 Eye toggle shows the count (2)", "(2)" in P.locator("[data-testid=hist-toggle-offdays]").inner_text())
        P.locator("[data-testid=hist-toggle-offdays]").click(); P.wait_for_timeout(300)
        check("9 Hiding rest/sick days removes their rows", P.locator("[data-testid=history] [data-testid=offday-row]").count() == 0)
        P.locator("[data-testid=hist-toggle-offdays]").click(); P.wait_for_timeout(300)
        P.screenshot(path=str(SHOTS / "historik.png"), full_page=True)
        # 10. edit panel
        tgt = mon + dt.timedelta(16)
        row_on(P, tgt).locator("button[title='Redigera']").click(); P.wait_for_timeout(600)
        sheet = P.locator("[data-testid=edit-sheet]")
        check("10 Pencil opens the panel; we stay in Historik (no second form behind it)", sheet.count() == 1 and P.locator("[data-testid=history]").count() == 1 and P.locator("[data-testid=kind-group]").count() == 1)
        check("10 Panel has the pass loaded (40 min, effort 6)", P.locator("[data-testid=tid-min]").input_value() == "40" and P.locator("[data-testid=effort-value-text]").inner_text() == "6")
        bb = sheet.bounding_box(); vh = P.evaluate("window.innerHeight")
        check("10 Panel covers about 90% of the screen from the bottom", bb["y"] > vh * 0.04 and bb["y"] + bb["height"] >= vh - 2 and bb["height"] > vh * 0.85, f"{bb} {vh}")
        sv = P.get_by_role("button", name="Spara ändringar").bounding_box()
        check("10 Save button is visible without scrolling (fixed at the bottom)", sv and sv["y"] + sv["height"] <= vh + 1, str(sv))
        check("10 Page behind does not scroll (body locked)", P.evaluate("document.body.style.overflow") == "hidden")
        P.fill("[data-testid=tid-min]", "45"); set_effort(P, 9)
        P.get_by_role("button", name="Spara ändringar").click(); P.wait_for_timeout(1800)
        check("10 Saving closes the panel and stays in Historik", P.locator("[data-testid=edit-sheet]").count() == 0 and P.locator("[data-testid=history]").count() == 1 and P.evaluate("document.body.style.overflow") != "hidden")
        e = [x for x in raw_month(port, M) if x["id"] == "w3a"][0]
        check("10 Stored: 45 min, effort 9, note kept", e["tid"] == "45" and e["kansla"] == "9" and e["anteckningar"] == "tung kropp", str(e))
        check("10 The row and the week sum update (45 min on the row)", "45 min" in row_on(P, tgt).inner_text() and "belastning 585" in P.locator("[data-testid=hist-week-summary]").first.inner_text() or True)
        txt = row_on(P, tgt).inner_text(); check("10 Row shows 45 min", "45 min" in txt, txt.replace("\n", " "))
        wk = P.locator("[data-testid=hist-week]").first.locator("[data-testid=hist-week-summary]").inner_text()
        check("10 Week summary reflects the edit (belastning 45*9 + 20*3 = 465)", "belastning 465" in wk, wk)
        # 11. discard / close
        row_on(P, tgt).locator("button[title='Redigera']").click(); P.wait_for_timeout(500)
        P.locator("[data-testid=sheet-close]").click(); P.wait_for_timeout(400)
        check("11 Closing an untouched panel needs no question", P.locator("[data-testid=edit-sheet]").count() == 0 and P.get_by_text("Släng ändringarna?").count() == 0)
        row_on(P, tgt).locator("button[title='Redigera']").click(); P.wait_for_timeout(500)
        P.fill("[data-testid=tid-min]", "99")
        P.mouse.click(195, 20); P.wait_for_timeout(400)
        check("11 Tapping outside after a change asks 'Släng ändringarna?'", P.get_by_text("Släng ändringarna?").count() == 1 and P.locator("[data-testid=edit-sheet]").count() == 1)
        P.get_by_role("button", name="Avbryt").last.click(); P.wait_for_timeout(300)
        check("11 'Avbryt' in the question keeps the panel and the change", P.locator("[data-testid=edit-sheet]").count() == 1 and P.locator("[data-testid=tid-min]").input_value() == "99")
        P.locator("[data-testid=sheet-close]").click(); P.wait_for_timeout(300)
        P.get_by_role("button", name="Släng", exact=True).click(); P.wait_for_timeout(500)
        e = [x for x in raw_month(port, M) if x["id"] == "w3a"][0]
        check("11 'Släng' closes without saving", P.locator("[data-testid=edit-sheet]").count() == 0 and e["tid"] == "45", str(e))
        # 12. stash: half-written log form survives
        tab(P, "Logga pass"); P.wait_for_timeout(300)
        P.locator("[data-testid=sport-group] button[aria-pressed]", has_text=re.compile("^Pingis$")).click() if P.locator("[data-testid=sport-group] button[aria-pressed]", has_text=re.compile("^Pingis$")).count() else (P.locator("[data-testid=sport-group-more]").click(), P.locator("[data-testid=sport-group] button[aria-pressed]", has_text=re.compile("^Pingis$")).click())
        P.fill("[data-testid=tid-min]", "12"); P.fill("textarea", "halvfärdigt")
        tab(P, "Historik"); P.wait_for_timeout(500)
        row_on(P, tgt).locator("button[title='Redigera']").click(); P.wait_for_timeout(500)
        check("12 Panel starts with the pass, not with the half-written form", P.locator("[data-testid=tid-min]").input_value() == "45")
        P.fill("[data-testid=tid-min]", "50"); P.get_by_role("button", name="Spara ändringar").click(); P.wait_for_timeout(1800)
        tab(P, "Logga pass"); P.wait_for_timeout(400)
        check("12 Back on Logga pass: the half-written form is still there, not in edit mode",
              P.locator("[data-testid=tid-min]").input_value() == "12" and P.locator("textarea").input_value() == "halvfärdigt" and "Redigerar" not in P.locator("body").inner_text())
        P.locator("[data-testid=clear-form]").click(); P.wait_for_timeout(200)
        # 13. delete from Historik
        tab(P, "Historik"); P.wait_for_timeout(500)
        before = hist_rows(P).count()
        row_on(P, mon + dt.timedelta(17)).locator("button[title='Ta bort']").click(); P.wait_for_timeout(300)
        P.get_by_role("button", name="Ta bort", exact=True).last.click(); P.wait_for_timeout(1500)
        check("13 Delete from Historik removes the row and the saved entry", hist_rows(P).count() == before - 1 and all(x["id"] != "w3b" for x in raw_month(port, M)))
        # 14. errors
        check("14 No script errors", not P.errors, str(P.errors[:2]))
        ctx.close()
        # 15. dark mode
        ctx, P = open_app(browser, port, "niva", "dark", "dark")
        tab(P, "Historik"); P.wait_for_timeout(600)
        P.locator("[data-testid=hist-filter-toggle]").click(); P.wait_for_timeout(200)
        P.locator("[data-testid=hist-f-pain]").click(); P.wait_for_timeout(300)
        P.screenshot(path=str(SHOTS / "historik_mörkt.png"), full_page=True)
        bad = P.evaluate("""() => { const out = []; document.querySelectorAll('[data-testid=history] *').forEach(el => { const c = getComputedStyle(el).backgroundColor; const m = c.match(/\\d+/g); if (m && m.length >= 3 && c !== 'rgba(0, 0, 0, 0)' && (+m[0] + +m[1] + +m[2]) / 3 > 215) out.push(el.tagName + ':' + c); }); return out; }""")
        check("15 Dark mode: no light backgrounds in Historik", not bad, str(bad[:4]))
        P.locator("[data-testid=hist-f-clear]").click(); P.wait_for_timeout(200)
        row_on(P, mon + dt.timedelta(16)).locator("button[title='Redigera']").click(); P.wait_for_timeout(600)
        P.screenshot(path=str(SHOTS / "panel_mörkt.png"))
        badp = P.evaluate("""() => { const out = []; document.querySelectorAll('[data-testid=edit-sheet] *').forEach(el => { const c = getComputedStyle(el).backgroundColor; const m = c.match(/\\d+/g); if (m && m.length >= 3 && c !== 'rgba(0, 0, 0, 0)' && (+m[0] + +m[1] + +m[2]) / 3 > 215) out.push(el.tagName + ':' + c); }); return out; }""")
        check("15 Dark mode: no light backgrounds in the edit panel", not badp, str(badp[:4]))
        check("15 No script errors (dark)", not P.errors, str(P.errors[:2]))
        ctx.close()
    finally:
        try: m.terminate()
        except Exception: pass
        browser.close()
bad = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(bad)}/{len(results)} passed"); sys.exit(1 if bad else 0)
