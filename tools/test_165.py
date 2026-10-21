"""Acceptance tests for 1.6.5: statistics per week (Vecka / Månad / Alla månader)."""
import re, sys, os, json, pathlib, datetime, tempfile
HTML = sys.argv[1] if len(sys.argv) > 1 else str(pathlib.Path(__file__).resolve().parent.parent / "index.html")
sys.argv = [sys.argv[0], HTML]
src = open(pathlib.Path(__file__).resolve().parent / "test_160.py", encoding="utf-8").read().split("with sync_playwright()")[0]
__file__ = str(pathlib.Path(__file__).resolve())
os.environ.setdefault("SHOTS", "/tmp/shots_165")
exec(src)
from playwright.sync_api import sync_playwright

def monday(d): return d - datetime.timedelta(days=d.weekday())
cur_mon = monday(TODAY); prev_mon = cur_mon - datetime.timedelta(days=7)
MS = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"]
def label_for(mon):
    sun = mon + datetime.timedelta(days=6)
    rng = f"{mon.day}–{sun.day} {MS[sun.month-1]}" if mon.month == sun.month else f"{mon.day} {MS[mon.month-1]} – {sun.day} {MS[sun.month-1]}"
    if sun.year != TODAY.year: rng += f" {sun.year}"
    return f"Vecka {mon.isocalendar()[1]} · {rng}"
# extra seed: passes in the previous month (last days) and one year back
prev_month_first = (TODAY.replace(day=1) - datetime.timedelta(days=1)).replace(day=1)
PM = prev_month_first.strftime("%Y-%m")
def pm_entry(i, day, user="niva"): return {"id": i, "date": f"{PM}-{day:02d}", "user": user, "sport": ["LÖ"], "typ": ["KO"], "tid": "60", "kansla": "5", "anteckningar": "", "cr10": True}
last_pm = (TODAY.replace(day=1) - datetime.timedelta(days=1)).day
OLD = f"{TODAY.year - 1}-{TODAY.month:02d}"
old_entry = {"id": "old1", "date": f"{OLD}-14", "user": "niva", "sport": ["F"], "typ": ["MA"], "tid": "70", "kansla": "6", "anteckningar": "", "cr10": True}
def seed_file():
    data = {"diaries": {CODE: {"meta:users": json.dumps(USERS), f"entries:{M}": json.dumps(SEED),
            f"entries:{PM}": json.dumps([pm_entry("p1", last_pm - 1), pm_entry("p2", last_pm)]), f"entries:{OLD}": json.dumps([old_entry])}}}
    f = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False); json.dump(data, f); f.close(); return f.name

def scope(P, k): P.locator(f"[data-testid=scope-{k}]").click(); P.wait_for_timeout(700)
def cards(P):
    t = P.locator("body").inner_text(); return t
def stat_value(P, label):
    return P.evaluate("(l) => { const e = [...document.querySelectorAll('div.text-xs')].find(x => x.textContent.trim() === l); return e ? e.previousElementSibling.textContent.trim() : null }", label)
MN = ["Januari","Februari","Mars","April","Maj","Juni","Juli","Augusti","September","Oktober","November","December"]
def wlabel(P): return re.sub(r"\s+", " ", P.locator("[data-testid=week-label]").inner_text()).strip()

with sync_playwright() as pw:
    browser = pw.chromium.launch(); port = 9761; m = start_mock(port)
    try:
        ctx, P = open_app(browser, port, "niva", "light", "light")
        tab(P, "Statistik"); P.wait_for_timeout(500)
        # ---- 1. Controls ----
        names = [b.inner_text().strip() for b in P.locator("[data-testid=scope-group] button").all()]
        check("1 Three modes: Vecka, Månad, Alla månader", names == ["Vecka", "Månad", "Alla månader"], str(names))
        check("1 Default is Månad, with the month selector and no week picker", P.locator("[data-testid=scope-month]").get_attribute("aria-pressed") == "true" and P.locator("[data-testid=month-picker]").count() == 1 and P.locator("[data-testid=week-picker]").count() == 0)
        scope(P, "all")
        check("1 Alla månader: no month selector, no week picker", P.locator("[data-testid=month-picker]").count() == 0 and P.locator("[data-testid=week-picker]").count() == 0)
        scope(P, "month")
        # ---- 2. Current week ----
        scope(P, "week")
        check("2 Week mode shows the current week with number and dates", wlabel(P) == label_for(cur_mon), f"{wlabel(P)!r} vs {label_for(cur_mon)!r}")
        check("2 'Nästa' is disabled on the current week, 'Föregående' is enabled, no 'Denna vecka' button", P.locator("[data-testid=week-next]").is_disabled() and P.locator("[data-testid=week-prev]").is_enabled() and P.locator("[data-testid=week-now]").count() == 0)
        check("2 Controls are >= 44 px", all(P.locator(f"[data-testid={t}]").bounding_box()["height"] >= 43 for t in ("week-prev", "week-next", "scope-week")))
        # ---- 3. Content of weeks ----
        def week_expected(mon, user="niva"):
            days = {(mon + datetime.timedelta(days=i)).isoformat() for i in range(7)}
            real = [e for e in SEED if e["date"] in days and e["user"] == user and not e.get("kind")]
            return real
        cur_real = week_expected(cur_mon)
        if not cur_real:
            check("3 Empty week: 'Inga pass den här veckan.'", "Inga pass den här veckan." in cards(P))
        check("3 Rest/sick days of the week are counted (Niva: 1 + 1)", re.sub(r"\s+", " ", P.locator("[data-testid=offday-stats]").inner_text()) == "Vilodagar 1 · Sjukdagar 1" if TODAY.day in range(19, 26) else True)
        P.locator("[data-testid=week-prev]").click(); P.wait_for_timeout(700)
        pw_real = week_expected(prev_mon)
        check("3 Previous week label", wlabel(P) == label_for(prev_mon), wlabel(P))
        check("3 Antal pass for the week matches the diary", stat_value(P, "Antal pass") == str(len(pw_real)), f"{stat_value(P, 'Antal pass')} vs {len(pw_real)}")
        hours = sum(float(e["tid"]) for e in pw_real) / 60
        check("3 Timmar totalt for the week is right", stat_value(P, "Timmar totalt") == f"{hours:.1f}", f"{stat_value(P, 'Timmar totalt')} vs {hours:.1f}")
        ticks = P.evaluate("[...document.querySelectorAll('.recharts-cartesian-axis-tick-value')].map(t => t.textContent).filter(x => ['Mån','Tis','Ons','Tors','Fre','Lör','Sön'].includes(x))")
        check("3 'Belastning per dag' shows all seven days Mån–Sön", ticks == ["Mån", "Tis", "Ons", "Tors", "Fre", "Lör", "Sön"], str(ticks))
        lb = P.locator("[data-testid=week-label]").bounding_box()
        check("3 Week label stays on one line (also with the 'Denna vecka' link)", lb["height"] < 24 and P.locator("[data-testid=week-now]").count() == 1, str(lb))
        P.screenshot(path=str(SHOTS / "vecka_ljust.png"), full_page=True)
        P.locator("[data-testid=week-prev]").click(); P.wait_for_timeout(500)
        check("3 Clicking the left arrow again goes to the week before the shown one (week 41)", wlabel(P) == label_for(prev_mon - datetime.timedelta(days=7)), wlabel(P))
        P.locator("[data-testid=week-next]").click(); P.wait_for_timeout(500)
        check("3 The right arrow goes forward one week again", wlabel(P) == label_for(prev_mon), wlabel(P))
        wbox = {k: P.locator(f"[data-testid={k}]").bounding_box() for k in ("week-prev", "week-next", "week-label")}
        # ---- 3b. Month picker looks and works the same ----
        scope(P, "month")
        mbox = {k: P.locator(f"[data-testid={k}]").bounding_box() for k in ("month-prev", "month-next", "month-label")}
        same = all(abs(wbox[a]["x"] - mbox[b]["x"]) < 2 and abs(wbox[a]["y"] - mbox[b]["y"]) < 2 and abs(wbox[a]["width"] - mbox[b]["width"]) < 2 and abs(wbox[a]["height"] - mbox[b]["height"]) < 2
                   for a, b in (("week-prev", "month-prev"), ("week-next", "month-next")))
        check("3b Month picker has the same arrows, size and position as the week picker", same, f"{wbox} {mbox}")
        mname = P.locator("[data-testid=month-label]").inner_text().strip()
        check("3b Month label shows the selected month; 'Nästa' is disabled on the current month", mname.startswith(MN[TODAY.month - 1]) and P.locator("[data-testid=month-next]").is_disabled() and P.locator("[data-testid=month-now]").count() == 0, mname)
        P.locator("[data-testid=month-prev]").click(); P.wait_for_timeout(700)
        pm_name = P.locator("[data-testid=month-label]").inner_text().strip()
        check("3b Left arrow goes to the month before the shown one", pm_name.startswith(MN[prev_month_first.month - 1]) and str(prev_month_first.year) in pm_name, pm_name)
        check("3b That month's numbers are shown (Niva: 2 passes) and 'Denna månad' appears", stat_value(P, "Antal pass") == "2" and P.locator("[data-testid=month-now]").count() == 1, str(stat_value(P, "Antal pass")))
        P.screenshot(path=str(SHOTS / "manad_ljust.png"), clip={"x": 0, "y": 0, "width": 390, "height": 560})
        P.locator("[data-testid=month-jump]").select_option(OLD); P.wait_for_timeout(700)
        check("3b Tapping the month opens the list: jump to a month a year back", str(TODAY.year - 1) in P.locator("[data-testid=month-label]").inner_text() and stat_value(P, "Antal pass") == "1")
        check("3b 'Föregående' is disabled at the first month with data", P.locator("[data-testid=month-prev]").is_disabled())
        P.locator("[data-testid=month-now]").click(); P.wait_for_timeout(700)
        check("3b 'Denna månad' returns to the current month", P.locator("[data-testid=month-label]").inner_text().strip().startswith(MN[TODAY.month - 1]) and P.locator("[data-testid=month-next]").is_disabled())
        scope(P, "week")
        P.screenshot(path=str(SHOTS / "vecka_ljust_topp.png"), clip={"x": 0, "y": 0, "width": 390, "height": 560})
        # ---- 4. Week across a month boundary ----
        first_of_month = TODAY.replace(day=1); boundary_mon = monday(first_of_month)
        if boundary_mon.month != first_of_month.month:
            P.locator("[data-testid=week-jump]").fill(first_of_month.isoformat()); P.wait_for_timeout(900)
            days = {(boundary_mon + datetime.timedelta(days=i)).isoformat() for i in range(7)}
            exp = [e for e in SEED + [pm_entry("p1", last_pm - 1), pm_entry("p2", last_pm)] if e["date"] in days and e["user"] == "niva" and not e.get("kind")]
            check("4 A week over a month change loads both months", wlabel(P) == label_for(boundary_mon) and stat_value(P, "Antal pass") == str(len(exp)), f"{wlabel(P)!r} {stat_value(P, 'Antal pass')} vs {len(exp)}")
        else:
            check("4 (week over a month change not testable this month: month starts on a Monday)", True)
        # ---- 5. Jump far back ----
        P.locator("[data-testid=week-jump]").fill(f"{OLD}-14"); P.wait_for_timeout(900)
        om = monday(datetime.date.fromisoformat(f"{OLD}-14"))
        check("5 Tapping the week and picking a date a year back shows that week (with year)", wlabel(P) == label_for(om) and str(TODAY.year - 1) in wlabel(P), wlabel(P))
        check("5 ...and its pass is counted", stat_value(P, "Antal pass") == "1", str(stat_value(P, "Antal pass")))
        check("5 'Denna vecka' appears and 'Nästa' is enabled", P.locator("[data-testid=week-now]").count() == 1 and P.locator("[data-testid=week-next]").is_enabled())
        P.locator("[data-testid=week-jump]").fill(f"{OLD}-01"); P.wait_for_timeout(700)
        for _ in range(3):
            if P.locator("[data-testid=week-prev]").is_enabled(): P.locator("[data-testid=week-prev]").click(); P.wait_for_timeout(300)
        check("5 'Föregående' stops at the first week with data", P.locator("[data-testid=week-prev]").is_disabled())
        P.locator("[data-testid=week-now]").click(); P.wait_for_timeout(700)
        check("5 'Denna vecka' jumps back, 'Nästa' disabled again", wlabel(P) == label_for(cur_mon) and P.locator("[data-testid=week-next]").is_disabled() and P.locator("[data-testid=week-now]").count() == 0)
        # ---- 6. Persons and the other modes ----
        P.locator("[data-testid=week-prev]").click(); P.wait_for_timeout(600)
        n_val = stat_value(P, "Timmar totalt")
        P.locator("button[aria-pressed]", has_text="Grim").first.click(); P.wait_for_timeout(900)
        g_real = week_expected(prev_mon, "grim"); g_hours = sum(float(e["tid"]) for e in g_real) / 60
        check("6 Switching person keeps the week and shows the other person's numbers", wlabel(P) == label_for(prev_mon) and stat_value(P, "Timmar totalt") == f"{g_hours:.1f}" and n_val != stat_value(P, "Timmar totalt"), f"{wlabel(P)!r} {stat_value(P, 'Timmar totalt')} vs {g_hours:.1f}")
        scope(P, "month"); scope(P, "week")
        check("6 Månad and Alla månader still work and Vecka remembers the chosen week", wlabel(P) == label_for(prev_mon))
        scope(P, "all")
        check("6 Alla månader shows data", int(stat_value(P, "Antal pass") or 0) >= 18, str(stat_value(P, "Antal pass")))
        # ---- 7. A new pass in the viewed week shows up ----
        scope(P, "week"); P.locator("button[aria-pressed]", has_text="Niva").first.click(); P.wait_for_timeout(700)
        before = int(stat_value(P, "Antal pass") or 0)
        tab(P, "Logga pass")
        P.locator("[data-testid=sport-group] button[aria-pressed]", has_text=re.compile("^Löpning$")).click(); P.fill("input[type=number]", "30")
        P.fill("input[type=date]", (prev_mon + datetime.timedelta(days=2)).isoformat())
        P.locator("button.flex-1", has_text=re.compile("^Spara")).first.click(); P.wait_for_timeout(1800)
        tab(P, "Statistik"); P.wait_for_timeout(1200)
        check("7 A pass saved on a day in the viewed week is counted", int(stat_value(P, "Antal pass") or 0) == before + 1, f"{before} -> {stat_value(P, 'Antal pass')}")
        # ---- 8. Dark mode: readable, no light surfaces ----
        open_menu(P); menu(P).locator("[data-testid=theme-dark]").click(); close_menu(P); P.wait_for_timeout(500)
        r = P.evaluate(AUDIT)
        check("8 Dark: week view text reads (>= 4.5)", not r["low"], "; ".join(r["low"][:5]))
        check("8 Dark: no light surfaces", not r["light"], "; ".join(r["light"][:3]))
        P.screenshot(path=str(SHOTS / "vecka_morkt.png"), full_page=True)
        check("9 No script errors", not P.errors, str(P.errors[:2]))
        ctx.close()
    finally:
        m.terminate(); browser.close()
bad = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(bad)}/{len(results)} passed"); sys.exit(1 if bad else 0)
