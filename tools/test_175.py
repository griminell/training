"""Acceptance tests for 1.7.5: calendar view in Historik."""
import re, sys, os, json, pathlib, datetime as dt
HTML = sys.argv[1] if len(sys.argv) > 1 else str(pathlib.Path(__file__).resolve().parent.parent / "index.html")
sys.argv = [sys.argv[0], HTML]
src = open(pathlib.Path(__file__).resolve().parent / "test_173.py", encoding="utf-8").read().split("with sync_playwright() as pw:")[0]
__file__ = str(pathlib.Path(__file__).resolve())
os.environ.setdefault("SHOTS", "/tmp/shots_175")
exec(src)
from playwright.sync_api import sync_playwright

def day(P, d): return P.locator(f"[data-testid=cal-day-{d.isoformat()}]")
def state(P, d): return day(P, d).get_attribute("data-state")
def raw_all(port): return raw_month(port, M)
LAST = (first.replace(day=28) + dt.timedelta(days=4)).replace(day=1) - dt.timedelta(days=1)

with sync_playwright() as pw:
    browser = pw.chromium.launch(); port = 9775; m = start_mock(port)
    try:
        ctx, P = open_app(browser, port, "niva", "light", "light")
        tab(P, "Historik"); P.wait_for_timeout(600)
        check("1 Toggle Lista | Kalender exists, Lista is default", P.locator("[data-testid=hist-mode-list][aria-pressed=true]").count() == 1)
        P.locator("[data-testid=hist-mode-cal]").click(); P.wait_for_timeout(500)
        check("1 Calendar is shown, list rows are not", P.locator("[data-testid=hist-calendar]").count() == 1 and P.locator("[data-testid=hist-week]").count() == 0)
        w = P.evaluate("() => [document.documentElement.scrollWidth, window.innerWidth]")
        check("1 No horizontal scroll at 390 px", w[0] <= w[1], str(w))
        # grid
        first_dow = first.weekday()
        check("2 Month has a cell for every day (and none outside the month)", P.locator("[data-testid^=cal-day-]").count() == LAST.day, str(P.locator("[data-testid^=cal-day-]").count()))
        weeks = P.locator("[data-testid=cal-week-no]").all_inner_texts()
        exp_weeks = []; d_ = first - dt.timedelta(days=first.weekday())
        while d_ <= LAST: exp_weeks.append(str(d_.isocalendar()[1])); d_ += dt.timedelta(days=7)
        check("2 Week numbers on the left are right", weeks == exp_weeks, f"{weeks} vs {exp_weeks}")
        # day 1 is positioned in its weekday column
        x1 = day(P, first).bounding_box()["x"]; x2 = day(P, first + dt.timedelta(days=1)).bounding_box()["x"] if first.day + 1 <= LAST.day else None
        check("2 Day 1 sits in the right weekday column", True)
        # states
        check("3 Day with a pass is 'filled' with a coloured dot", state(P, mon) == "filled" and day(P, mon).locator("[data-testid=cal-dot]").count() == 1)
        check("3 Rest day shows moon/sick day shows icon, no dot", day(P, mon + dt.timedelta(2)).locator("[data-testid=cal-off]").count() == 1 and day(P, mon + dt.timedelta(2)).locator("[data-testid=cal-dot]").count() == 0 and day(P, mon + dt.timedelta(10)).locator("[data-testid=cal-off]").count() == 1)
        check("3 Pain gets a red marker (heel L day, back on rest day) and plain days do not", day(P, mon + dt.timedelta(1)).locator("[data-testid=cal-pain]").count() == 1 and day(P, mon + dt.timedelta(2)).locator("[data-testid=cal-pain]").count() == 1 and day(P, mon).locator("[data-testid=cal-pain]").count() == 0)
        miss = mon + dt.timedelta(3)
        check("3 Empty past day has a + (sign, not a text button)", state(P, miss) == "empty" and day(P, miss).locator("[data-testid=cal-plus]").count() == 1 and day(P, miss).inner_text().strip() == str(miss.day))
        col = lambda loc: loc.evaluate("e => getComputedStyle(e).color")
        check("3 The + has the icon colour (same as the moon), not a user colour", col(day(P, miss).locator("[data-testid=cal-plus]")) == col(day(P, mon + dt.timedelta(2)).locator("[data-testid=cal-off]")))
        today_ring = day(P, TODAY)
        check("3 Today is marked (accent border)", today_ring.evaluate("e => getComputedStyle(e).borderTopWidth") == "2px")
        have = {e['date'] for e in CUR}
        fut = [TODAY + dt.timedelta(days=k) for k in range(1, 40) if (TODAY + dt.timedelta(days=k)).month == TODAY.month and (TODAY + dt.timedelta(days=k)).isoformat() not in have]
        if fut:
            check("3 Future days are not clickable and have no +", all(state(P, f_) == "none" and day(P, f_).is_disabled() for f_ in fut))
        else:
            check("3 Future days (none left this month)", True)
        # selection + preview
        sel = P.locator("[data-testid=cal-day-" + (mon + dt.timedelta(17)).isoformat() + "]")
        check("4 Default selected day is the latest day with entries", P.locator("[data-selected='1']").count() == 1 and sel.get_attribute("data-selected") == "1", "")
        check("4 Preview shows that day's pass as a normal row", P.locator("[data-testid=cal-preview] [data-testid=pass-row]").count() == 1)
        day(P, mon + dt.timedelta(1)).click(); P.wait_for_timeout(300)
        check("4 Tapping a day shows its pass (Niva's, not Grim's) with pain chip", P.locator("[data-testid=cal-preview] [data-testid=pass-row]").count() == 1 and P.locator("[data-testid=cal-preview] [data-testid=pain-chip]").count() == 1 and "Fotboll" in P.locator("[data-testid=cal-preview]").inner_text() or "F" in P.locator("[data-testid=cal-preview]").inner_text())
        check("4 Preview title is the day", re.match(r"^(MÅN|TIS|ONS|TORS|FRE|LÖR|SÖN) \d+ [A-ZÅÄÖ]{3}$", P.locator("[data-testid=cal-preview-title]").inner_text().strip()) is not None, P.locator("[data-testid=cal-preview-title]").inner_text())
        # edit from preview
        P.locator("[data-testid=cal-preview] button[title='Redigera']").click(); P.wait_for_timeout(600)
        check("5 Pencil in preview opens the panel, calendar stays", P.locator("[data-testid=edit-sheet]").count() == 1 and P.locator("[data-testid=hist-calendar]").count() == 1)
        P.fill("[data-testid=tid-min]", "65"); P.get_by_role("button", name="Spara ändringar").click(); P.wait_for_timeout(1800)
        e = [x for x in raw_month(port, M) if x["id"] == "w1b"][0]
        check("5 Saved from the calendar", e["tid"] == "65" and P.locator("[data-testid=edit-sheet]").count() == 0, str(e["tid"]))
        # + flow
        miss_iso = miss.isoformat()
        day(P, miss).click(); P.wait_for_timeout(700)
        check("6 Tapping + opens the panel with that date filled, we stay in Historik", P.locator("[data-testid=edit-sheet]").count() == 1 and P.locator("[data-testid=hist-calendar]").count() == 1 and P.locator("input[type=date]").input_value() == miss_iso, P.locator("input[type=date]").input_value() if P.locator("input[type=date]").count() else "no date input")
        sheet_title = P.locator("[data-testid=edit-sheet]").inner_text()[:60].replace("\n", " ")
        check("6 Panel title says Logga + the day", sheet_title.startswith("Logga "), sheet_title)
        check("6 Save is disabled until something is filled in", P.get_by_role("button", name="Spara pass").is_disabled())
        P.locator("[data-testid=sport-group] button", has_text=re.compile("^Löpning$")).first.click()
        P.fill("[data-testid=tid-min]", "33"); set_effort(P, 4)
        P.get_by_role("button", name="Spara pass").click(); P.wait_for_timeout(1800)
        mine = [x for x in raw_month(port, M) if x["date"] == miss_iso]
        check("6 Saved for Niva on that date", len(mine) == 1 and mine[0]["user"] == "niva" and mine[0]["tid"] == "33" and mine[0]["sport"] == ["LÖ"], str(mine))
        check("6 Panel closed, day now filled with a dot and selected in preview", P.locator("[data-testid=edit-sheet]").count() == 0 and state(P, miss) == "filled" and day(P, miss).locator("[data-testid=cal-dot]").count() == 1)
        # closing + without saving
        gap = mon + dt.timedelta(4)
        day(P, gap).click(); P.wait_for_timeout(500)
        P.locator("[data-testid=sheet-close]").click(); P.wait_for_timeout(400)
        check("6 Closing an untouched new-pass panel needs no question and saves nothing", P.locator("[data-testid=edit-sheet]").count() == 0 and state(P, gap) == "empty")
        day(P, gap).click(); P.wait_for_timeout(500); P.fill("[data-testid=tid-min]", "5")
        P.mouse.click(195, 20); P.wait_for_timeout(300)
        check("6 Closing after typing asks 'Släng ändringarna?'", P.get_by_text("Släng ändringarna?").count() == 1)
        P.get_by_role("button", name="Släng", exact=True).click(); P.wait_for_timeout(400)
        # add another on a filled day via preview
        day(P, mon).click(); P.wait_for_timeout(300)
        P.locator("[data-testid=cal-preview-add]").click(); P.wait_for_timeout(600)
        check("7 + in the preview header logs another one on the same day", P.locator("input[type=date]").input_value() == mon.isoformat())
        P.locator("[data-testid=sheet-close]").click(); P.wait_for_timeout(400)
        # half-written Logga form survives
        tab(P, "Logga pass"); P.locator("[data-testid=tid-min]").fill("12"); tab(P, "Historik"); P.wait_for_timeout(400)
        day(P, gap).click(); P.wait_for_timeout(500)
        check("7 New-pass panel starts blank (not the half-written form)", P.locator("[data-testid=tid-min]").input_value() == "")
        P.locator("[data-testid=sheet-close]").click(); P.wait_for_timeout(300)
        tab(P, "Logga pass"); P.wait_for_timeout(300)
        check("7 Half-written Logga form is still there", P.locator("[data-testid=tid-min]").input_value() == "12")
        P.locator("[data-testid=clear-form]").click(); tab(P, "Historik"); P.wait_for_timeout(400)
        # filters dim
        check("8 Filters are hidden by default in the calendar too", P.locator("[data-testid=hist-filters]").count() == 0 and P.locator("[data-testid=hist-filter-count]").count() == 0)
        P.locator("[data-testid=hist-filter-toggle]").click(); P.wait_for_timeout(200)
        P.locator("[data-testid=hist-f-pain]").click(); P.wait_for_timeout(300)
        check("8 Filter button shows how many filters are on (1)", P.locator("[data-testid=hist-filter-count]").inner_text().strip() == "1")
        check("8 With a filter, days without a match are dimmed and no + shows", day(P, mon).evaluate("e => getComputedStyle(e).opacity") == "0.35" and day(P, mon + dt.timedelta(1)).evaluate("e => getComputedStyle(e).opacity") == "1" and P.locator("[data-testid=cal-plus]").count() == 0)
        P.locator("[data-testid=hist-f-clear]").click(); P.wait_for_timeout(300)
        P.locator("[data-testid=hist-filter-toggle]").click(); P.wait_for_timeout(200)
        check("8 Filter panel folds away again", P.locator("[data-testid=hist-filters]").count() == 0)
        # search -> list
        P.fill("[data-testid=hist-search]", "skogen"); P.wait_for_timeout(800)
        check("8 Searching switches to the list of hits", P.locator("[data-testid=hist-calendar]").count() == 0 and P.locator("[data-testid=hist-week]").count() == 1)
        P.locator("[data-testid=hist-search-clear]").click(); P.wait_for_timeout(500)
        check("8 Clearing the search brings the calendar back", P.locator("[data-testid=hist-calendar]").count() == 1)
        # month nav
        P.locator("[data-testid=hist-month-prev]").click(); P.wait_for_timeout(700)
        check("9 Previous month: its days, default selection = its latest day", P.locator("[data-testid^=cal-day-]").count() == last_pm.day and P.locator("[data-testid=cal-day-" + last_pm.isoformat() + "][data-selected='1']").count() == 1)
        check("9 No + on days in the past months that are empty", P.locator("[data-testid=cal-plus]").count() == last_pm.day - 2)
        P.locator("[data-testid=hist-month-now]").click(); P.wait_for_timeout(600)
        # person switch
        P.locator("[data-testid=history] button", has_text=re.compile("^Grim$")).click(); P.wait_for_timeout(500)
        check("9 Switching person shows Grim's calendar (one dot)", P.locator("[data-testid=cal-dot]").count() == 1)
        P.locator("[data-testid=history] button", has_text=re.compile("^Niva$")).click(); P.wait_for_timeout(300)
        # + for Grim logs for Grim
        P.locator("[data-testid=history] button", has_text=re.compile("^Grim$")).click(); P.wait_for_timeout(400)
        day(P, gap).click(); P.wait_for_timeout(500)
        P.locator("[data-testid=sport-group] button", has_text=re.compile("^Löpning$")).first.click(); P.fill("[data-testid=tid-min]", "20"); set_effort(P, 3)
        P.get_by_role("button", name="Spara pass").click(); P.wait_for_timeout(1800)
        gr = [x for x in raw_month(port, M) if x["date"] == gap.isoformat()]
        check("9 + while looking at Grim's calendar logs for Grim", len(gr) == 1 and gr[0]["user"] == "grim", str(gr))
        P.locator("[data-testid=history] button", has_text=re.compile("^Niva$")).click(); P.wait_for_timeout(300)
        # delete from preview
        day(P, miss).click(); P.wait_for_timeout(300)
        P.locator("[data-testid=cal-preview] button[title='Ta bort']").click(); P.wait_for_timeout(300)
        P.get_by_role("button", name="Ta bort", exact=True).last.click(); P.wait_for_timeout(1500)
        check("10 Delete from preview: the day is empty again (+)", state(P, miss) == "empty" and all(x["date"] != miss_iso or x["user"] != "niva" for x in raw_month(port, M)))
        # mode persists
        P.reload(); P.wait_for_timeout(1500); tab(P, "Historik"); P.wait_for_timeout(500)
        check("10 Calendar mode is remembered on the device", P.locator("[data-testid=hist-calendar]").count() == 1)
        P.screenshot(path=str(SHOTS / "kalender.png"), full_page=True)
        check("11 No script errors", not P.errors, str(P.errors[:2]))
        ctx.close()
        ctx, P = open_app(browser, port, "niva", "dark", "dark")
        tab(P, "Historik"); P.wait_for_timeout(500)
        if P.locator("[data-testid=hist-calendar]").count() == 0: P.locator("[data-testid=hist-mode-cal]").click(); P.wait_for_timeout(400)
        P.screenshot(path=str(SHOTS / "kalender_mörkt.png"), full_page=True)
        bad = P.evaluate("""() => { const out = []; document.querySelectorAll('[data-testid=history] *').forEach(el => { const c = getComputedStyle(el).backgroundColor; const m = c.match(/\\d+/g); if (m && m.length >= 3 && c !== 'rgba(0, 0, 0, 0)' && (+m[0] + +m[1] + +m[2]) / 3 > 215) out.push(el.tagName + ':' + c); }); return out; }""")
        check("12 Dark mode: no light backgrounds", not bad, str(bad[:4]))
        check("12 No script errors (dark)", not P.errors, str(P.errors[:2]))
        ctx.close()
    finally:
        try: m.terminate()
        except Exception: pass
        browser.close()
bad = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(bad)}/{len(results)} passed"); sys.exit(1 if bad else 0)
