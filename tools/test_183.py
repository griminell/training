"""Acceptance tests for 1.8.5: the Mående card (sleep / energy) in Statistik."""
import re, sys, os, json, math, pathlib, datetime as dt
HTML = sys.argv[1] if len(sys.argv) > 1 else str(pathlib.Path(__file__).resolve().parent.parent / "index.html")
sys.argv = [sys.argv[0], HTML]
src = open(pathlib.Path(__file__).resolve().parent / "test_160.py", encoding="utf-8").read().split("with sync_playwright()")[0]
__file__ = str(pathlib.Path(__file__).resolve())
os.environ.setdefault("SHOTS", "/tmp/shots_183")
exec(src)
from playwright.sync_api import sync_playwright

mon = TODAY - dt.timedelta(days=TODAY.weekday()); pm = mon - dt.timedelta(days=7); pm2 = pm - dt.timedelta(days=7)
n_run = (TODAY - mon).days + 1
def iso(d): return d.isoformat()
def E(i, d, sleep=None, energy=None, user="anna", kind=None, pain=None):
    e = {"id": i, "date": iso(d), "user": user, "sport": ["LÖ"], "typ": ["KO"], "tid": "30", "kansla": "5", "anteckningar": "", "cr10": True}
    if kind: e.update({"kind": kind, "sport": [], "typ": [], "tid": "", "kansla": ""})
    if sleep: e["sleep"] = sleep
    if energy: e["energy"] = energy
    if pain: e["pain"] = pain
    return e
SEEDED = [
    E("c0", mon, "4", "3", pain=[{"part": "knee", "pos": "R", "value": "4"}]),   # Monday: first pass of the day
    E("c0b", mon, "2", "5"),                                                     # Monday: second pass: sleep must NOT win, energy is averaged (3+5)/2
    *([E("c1", mon + dt.timedelta(1), "2", "2", kind="rest")] if n_run >= 2 else []),   # a rest day also carries sleep/energy
    E("niva1", mon, "1", "1", user="niva"),                                     # other user: must not leak
    E("g1", mon, None, "4", user="grim"),                                       # Grim: energy only, no sleep
    E("b1", mon, user="bo"),                                                    # Bo: a pass without any wellbeing
    E("p0", pm, "3", "2"), E("p1", pm + dt.timedelta(1), "5", "5"), E("p4", pm + dt.timedelta(4), "1", "1"),
    E("q0", pm2, "2", "3"), E("q1", pm2 + dt.timedelta(3), "4", "4"),
]
first = TODAY.replace(day=1); lastp = first - dt.timedelta(days=1)
SEEDED += [E("m1", lastp.replace(day=2), "5", "4"), E("m2", lastp.replace(day=27), "1", "2"), E("m3", first, "3", "3")]
def seed_file():
    by = {}
    for e in SEEDED: by.setdefault(e["date"][:7], []).append(e)
    d = {"meta:users": json.dumps(USERS)}
    for k, v in by.items(): d[f"entries:{k}"] = json.dumps(sorted(v, key=lambda x: x["date"]))
    f = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False); json.dump({"diaries": {CODE: d}}, f); f.close(); return f.name

# reference implementation (independent of the app code)
def per_day(es, field):
    out = {}
    for e in sorted(es, key=lambda x: str(x["id"])):
        v = e.get(field)
        if v and re.fullmatch("[1-5]", v): out.setdefault(e["date"], []).append(int(v))
    return {d: (v[0] if field == "sleep" else sum(v) / len(v)) for d, v in out.items()}
def stat(es, field):
    v = list(per_day(es, field).values())
    return (sum(v) / len(v), len(v)) if v else None
def fmt(x): return f"{x:.1f}".replace(".", ",")
def jsround(x): return math.floor(x + 0.5)
def pts(c, p):
    if not (c > 0 and p > 0): return "none"
    d = jsround((c - p) * 10) / 10
    return "flat" if d == 0 else ("up " if d > 0 else "down ") + f"{abs(d):.1f}".replace(".", ",")
def of(user, a, b): return [e for e in SEEDED if e["user"] == user and iso(a) <= e["date"] <= iso(b)]
def delta_ui(P, k):
    el = P.locator(f"[data-testid=well-delta-{k}]")
    if el.count() == 0: return "absent"
    d = el.get_attribute("data-dir")
    if d in ("none", "flat"): return d
    return f"{d} {re.search(r'([\d,]+)', el.inner_text()).group(1)}"
def set_scope(P, label): P.get_by_role("button", name=label, exact=True).first.click(); P.wait_for_timeout(800)
def toggle(P, k): P.locator(f"[data-testid=well-metric][data-metric={k}]").click(); P.wait_for_timeout(500)
def pressed(P, k): return P.locator(f"[data-testid=well-metric][data-metric={k}]").get_attribute("aria-pressed") == "true"
def read(P, k):
    g = lambda tid: P.locator(f"[data-testid={tid}-{k}]").inner_text() if P.locator(f"[data-testid={tid}-{k}]").count() else None
    return (g("well-avg"), g("well-days"))
def verify(P, label, cur, prev, field):
    s = stat(cur, field); p = stat(prev, field) if prev is not None else None
    got = read(P, field); want = (fmt(s[0]), str(s[1])) if s else (None, None)
    check(f"{label}: {field} average and days match the data", got == want, f"got {got} want {want}")
    if prev is not None and s:
        want_d = pts(s[0], p[0]) if p else "none"
        check(f"{label}: {field} delta matches", delta_ui(P, field) == want_d, f"got {delta_ui(P, field)} want {want_d}")
def curves(P):
    return P.evaluate("() => [...document.querySelectorAll('[data-testid=well-chart] .recharts-line-curve')].map(p => [p.getAttribute('stroke'), p.getAttribute('stroke-dasharray')])")
def ytexts(P, tid): return [x for x in P.evaluate("(t) => [...document.querySelectorAll(`[data-testid=${t}] svg text`)].map(x => x.textContent.trim())", tid) if re.fullmatch(r"\d+", x)]

with sync_playwright() as pw:
    browser = pw.chromium.launch(); port = 9791; m = start_mock(port)
    try:
        check("0 Reference: Monday sleep is the first value (4) and energy the mean (4)", per_day(of("anna", mon, mon), "sleep")[iso(mon)] == 4 and per_day(of("anna", mon, mon), "energy")[iso(mon)] == 4)
        ctx, P = open_app(browser, port, "anna", "light", "light")
        tab(P, "Statistik"); P.wait_for_timeout(900); set_scope(P, "Vecka")
        check("1 The Mående card exists, below the Smärta card", P.locator("[data-testid=well-chart]").count() == 1 and P.locator("[data-testid=pain-chart]").count() == 1 and
              P.locator("[data-testid=pain-chart]").bounding_box()["y"] < P.locator("[data-testid=well-chart]").bounding_box()["y"])
        check("1 Pain chart still works (one point, knee)", P.locator("[data-testid=pain-chart] .recharts-line-dot").count() == 1)
        check("1 Both Sömn and Energi are on by default", pressed(P, "sleep") and pressed(P, "energy"))
        cur = of("anna", mon, mon + dt.timedelta(6)); prev = of("anna", pm, pm + dt.timedelta(n_run - 1))
        verify(P, "2 Running week", cur, prev, "sleep"); verify(P, "2 Running week", cur, prev, "energy")
        check("2 Compare label says mot förra veckan on both rows", all("mot förra veckan" in P.locator(f"[data-testid=well-cmp-label-{k}]").inner_text() for k in ("sleep", "energy")))
        cv = curves(P)
        check("2 Two lines are drawn, with different colours", len(cv) == 2 and cv[0][0] != cv[1][0], str(cv))
        sleep_c = next(c for c in cv if not c[1]); energy_c = next((c for c in cv if c[1]), None)
        check("2 Sleep is a solid line, energy is dashed", energy_c is not None and sleep_c[1] in (None, "") and energy_c[1] == "6 4", str(cv))
        check("2 Sleep dots are round (one per day with a value), energy dots are square (one per day)",
              P.locator("[data-testid=well-chart] .recharts-line-dot").count() == stat(cur, "sleep")[1] and P.locator("[data-testid=well-dot-energy]").count() == stat(cur, "energy")[1],
              f"{P.locator('[data-testid=well-chart] .recharts-line-dot').count()} / {P.locator('[data-testid=well-dot-energy]').count()}")
        sw = P.evaluate("() => Object.fromEntries([...document.querySelectorAll('[data-testid=well-metrics] [data-testid=well-swatch]')].map(s => [s.dataset.metric, s.querySelector('line').getAttribute('stroke')]))")
        check("2 The button marks use the same colours as the lines", sw.get("sleep") == sleep_c[0] and sw.get("energy") == energy_c[0], f"{sw} vs {cv}")
        check("2 Y axis shows 1 to 5, with grid lines", ytexts(P, "well-chart") == ["1", "2", "3", "4", "5"] and P.locator("[data-testid=well-chart] .recharts-cartesian-grid-horizontal line").count() >= 4, str(ytexts(P, "well-chart")))
        check("2 The Smärta chart shows its Y axis too (0, 5, 10)", ytexts(P, "pain-chart") == ["0", "5", "10"], str(ytexts(P, "pain-chart")))
        note = P.locator("[data-testid=well-note]").inner_text()
        check("2 Note explains both lines and the 1-5 scale", "Heldragen linje: sömn" in note and "Streckad linje: energi" in note and "toppen respektive laddad" in note, note)
        heights = [P.locator("[data-testid=well-metric]").nth(i).bounding_box()["height"] for i in range(2)]
        check("2 Tap targets are at least 44 px high", all(h >= 44 for h in heights), str(heights))
        clr = P.evaluate("() => [getComputedStyle(document.querySelector('[data-testid=well-delta-sleep]')).color, getComputedStyle(document.querySelector('[data-testid=well-stat]')).color]")
        check("2 The delta is neutral (the row's muted colour, no green/red)", clr[0] == clr[1], str(clr))
        P.locator("[data-testid=well-metrics]").locator("xpath=ancestor::div[contains(@class,'rounded-xl')][1]").screenshot(path=str(SHOTS / "maende_vecka_ljust.png"))

        # switching one off / on again; the last one cannot be switched off
        toggle(P, "sleep")
        check("3 Sleep off: button released, its row and line are gone, energy stays", not pressed(P, "sleep") and pressed(P, "energy") and P.locator("[data-testid=well-stat][data-metric=sleep]").count() == 0 and len(curves(P)) == 1 and curves(P)[0][1] == "6 4")
        verify(P, "3 Energy only", cur, prev, "energy")
        toggle(P, "energy")
        check("3 The last active one cannot be switched off", pressed(P, "energy") and len(curves(P)) == 1)
        toggle(P, "sleep")
        check("3 Sleep back on: both shown again", pressed(P, "sleep") and pressed(P, "energy") and len(curves(P)) == 2)
        toggle(P, "energy")   # sleep only
        check("3 Sleep only: solid line, no energy dots", len(curves(P)) == 1 and not curves(P)[0][1] and P.locator("[data-testid=well-dot-energy]").count() == 0)
        toggle(P, "energy")   # both on again
        check("3 No script errors", not P.errors, str(P.errors[:2]))

        # finished week: whole week vs whole week before it
        P.locator("[data-testid=week-prev]").click(); P.wait_for_timeout(900)
        verify(P, "4 Finished week", of("anna", pm, pm + dt.timedelta(6)), of("anna", pm2, pm2 + dt.timedelta(6)), "sleep")
        verify(P, "4 Finished week", of("anna", pm, pm + dt.timedelta(6)), of("anna", pm2, pm2 + dt.timedelta(6)), "energy")
        # month: running month vs the same days last month
        set_scope(P, "Månad")
        d = TODAY.day
        mcur = [e for e in SEEDED if e["user"] == "anna" and e["date"][:7] == TODAY.strftime("%Y-%m")]
        mprev = [e for e in SEEDED if e["user"] == "anna" and e["date"][:7] == lastp.strftime("%Y-%m") and int(e["date"][8:]) <= d]
        verify(P, "5 Running month", mcur, mprev, "sleep"); verify(P, "5 Running month", mcur, mprev, "energy")
        check("5 Compare label says mot förra månaden", "mot förra månaden" in P.locator("[data-testid=well-cmp-label-sleep]").inner_text())
        # all months: no comparison at all
        set_scope(P, "Alla månader")
        check("6 Alla månader: no delta and no compare label", P.locator("[data-testid^=well-delta-]").count() == 0 and P.locator("[data-testid^=well-cmp-label-]").count() == 0)
        alla = [e for e in SEEDED if e["user"] == "anna"]
        check("6 Alla månader: averages and days over all of Anna's data", all(read(P, k) == (fmt(stat(alla, k)[0]), str(stat(alla, k)[1])) for k in ("sleep", "energy")), f"{read(P, 'sleep')} {read(P, 'energy')}")
        ctx.close()

        # Grim: energy only
        ctx, P = open_app(browser, port, "grim", "light", "light"); tab(P, "Statistik"); P.wait_for_timeout(900); set_scope(P, "Vecka")
        check("7 Sleep has no data: its row says so, energy still shown", "Ingen sömn noterad den här perioden." in P.locator("[data-testid=well-metric-empty][data-metric=sleep]").inner_text() and read(P, "energy") == ("4,0", "1"), str(read(P, "energy")))
        check("7 Only the energy line is drawn", len(curves(P)) == 1 and curves(P)[0][1] == "6 4")
        ctx.close()
        # Bo: no wellbeing at all
        ctx, P = open_app(browser, port, "bo", "light", "light"); tab(P, "Statistik"); P.wait_for_timeout(900); set_scope(P, "Vecka")
        check("8 Nothing logged: one message, no buttons", P.locator("[data-testid=well-empty]").count() == 1 and P.locator("[data-testid=well-metric]").count() == 0 and "Ingen sömn eller energi noterad den här perioden." in P.locator("[data-testid=well-empty]").inner_text())
        ctx.close()
        # dark mode
        ctx, P = open_app(browser, port, "anna", "dark", "dark"); tab(P, "Statistik"); P.wait_for_timeout(900); set_scope(P, "Vecka")
        check("9 Dark mode: card renders with two lines", P.locator("[data-testid=well-chart]").count() == 1 and len(curves(P)) == 2)
        cd = curves(P)
        check("9 Dark mode: the two line colours differ", cd[0][0] != cd[1][0], str(cd))
        audit(P, "maende dark", True)
        P.locator("[data-testid=well-metrics]").locator("xpath=ancestor::div[contains(@class,'rounded-xl')][1]").screenshot(path=str(SHOTS / "maende_vecka_morkt.png"))
        check("9 No script errors (dark)", not P.errors, str(P.errors[:2]))
        ctx.close()
    finally:
        m.terminate(); browser.close()
bad = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(bad)}/{len(results)} passed"); sys.exit(1 if bad else 0)
