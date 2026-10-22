"""Acceptance tests for 1.8.0: comparison with the previous period in Statistik (week and month)."""
import re, sys, os, json, math, pathlib, datetime as dt
HTML = sys.argv[1] if len(sys.argv) > 1 else str(pathlib.Path(__file__).resolve().parent.parent / "index.html")
sys.argv = [sys.argv[0], HTML]
src = open(pathlib.Path(__file__).resolve().parent / "test_160.py", encoding="utf-8").read().split("with sync_playwright()")[0]
__file__ = str(pathlib.Path(__file__).resolve())
os.environ.setdefault("SHOTS", "/tmp/shots_180")
exec(src)
from playwright.sync_api import sync_playwright

mon = TODAY - dt.timedelta(days=TODAY.weekday()); pm = mon - dt.timedelta(days=7); pm2 = pm - dt.timedelta(days=7)
n_run = (TODAY - mon).days + 1            # days of the running week so far (1..7)
def iso(d): return d.isoformat()
def E(i, d, tid, k, dist=None, user="anna"):
    e = {"id": i, "date": iso(d), "user": user, "sport": ["LÖ"], "typ": ["KO"], "tid": tid, "kansla": k, "anteckningar": "", "cr10": True}
    if dist: e["distance"] = dist
    return e
SEEDED = [
    E("c0", mon, "30", "5", "5"),                                   # running week: Monday
    *([E("c1", mon + dt.timedelta(1), "90", "6")] if n_run >= 2 else []),
    E("p0", pm, "30", "5", "5"), E("p1", pm + dt.timedelta(1), "60", "6"), E("p2", pm + dt.timedelta(2), "45", "4"), E("p4", pm + dt.timedelta(4), "30", "5"),
    E("q0", pm2, "40", "5"), E("q1", pm2 + dt.timedelta(3), "20", "7"),
]
# previous month: some passes early in the month and one late (after today's day number)
first = TODAY.replace(day=1); lastp = first - dt.timedelta(days=1)
SEEDED += [E("m1", lastp.replace(day=2), "60", "5", "8"), E("m2", lastp.replace(day=min(28, 27)), "100", "6", "10"),
           E("niva1", mon, "50", "5", user="niva")]   # other user: must not leak into Anna's numbers
def seed_file():
    by = {}
    for e in SEEDED: by.setdefault(e["date"][:7], []).append(e)
    d = {"meta:users": json.dumps(USERS)}
    for k, v in by.items(): d[f"entries:{k}"] = json.dumps(sorted(v, key=lambda x: x["date"]))
    f = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False); json.dump({"diaries": {CODE: d}}, f); f.close(); return f.name

def summ(es, user="anna"):
    es = [e for e in es if e["user"] == user]
    ks = [float(e["kansla"]) for e in es if e["kansla"]]
    return {"pass": len(es), "tid": sum(float(e["tid"]) for e in es), "load": sum(float(e["tid"]) * float(e["kansla"]) for e in es),
            "km": sum(float(e.get("distance", 0)) for e in es), "k": (sum(ks) / len(ks) if ks else 0)}
def jsround(x): return math.floor(x + 0.5)
def pct(c, p):
    if not p > 0: return "none"
    r = (c - p) / p
    if abs(r) < 0.01: return "flat"
    return ("up " if r > 0 else "down ") + f"{jsround(abs(r) * 100)}"
def pts(c, p):
    if not (c > 0 and p > 0): return "none"
    d = round((c - p) * 10) / 10
    return "flat" if d == 0 else ("up " if d > 0 else "down ") + f"{abs(d):.1f}".replace(".", ",")
def ui(P, tid):
    el = P.locator(f"[data-testid={tid}]")
    if el.count() == 0: return "absent"
    d = el.get_attribute("data-dir"); t = el.inner_text()
    if d == "none": return "none"
    if d == "flat": return "flat"
    m = re.search(r"([\d,]+)", t)
    return f"{d} {m.group(1) if m else ''}"
def in_range(a, b): return [e for e in SEEDED if iso(a) <= e["date"] <= iso(b)]
def tiles_ok(P, cur, prev):
    c, p = summ(cur), summ(prev)
    exp = {"delta-pass": pct(c["pass"], p["pass"]), "delta-tid": pct(c["tid"], p["tid"]), "delta-load": pct(c["load"], p["load"]), "delta-kansla": pts(c["k"], p["k"])}
    if c["km"] > 0: exp["delta-km"] = pct(c["km"], p["km"])
    got = {k: ui(P, k) for k in exp}
    return got == exp, f"got {got} exp {exp}"
def set_scope(P, label): P.get_by_role("button", name=label, exact=True).first.click(); P.wait_for_timeout(700)
def lab(P): return P.locator("[data-testid=compare-label]").inner_text() if P.locator("[data-testid=compare-label]").count() else ""

with sync_playwright() as pw:
    browser = pw.chromium.launch(); port = 9786; m = start_mock(port)
    try:
        ctx, P = open_app(browser, port, "anna", "light", "light")
        tab(P, "Statistik"); P.wait_for_timeout(900)
        set_scope(P, "Vecka")
        wd = lambda i: ["mån", "tis", "ons", "tors", "fre", "lör", "sön"][i]
        want = f"Jämfört med {wd(0)}{'–' + wd(n_run - 1) if n_run > 1 else ''} förra veckan."
        check("1 Running week: label names the same days last week", lab(P) == want, lab(P))
        cur = in_range(mon, TODAY); prev = in_range(pm, pm + dt.timedelta(n_run - 1))
        ok, why = tiles_ok(P, cur, prev); check("1 Running week: tiles compare with the SAME days last week", ok, why)
        check("1 Other users' passes are not mixed in (pass count = Anna's)", P.locator("text=Antal pass").locator("xpath=..").inner_text().split()[0] == str(len([e for e in cur if e["user"] == "anna"])), P.locator("text=Antal pass").locator("xpath=..").inner_text())
        ticks = P.locator("[data-testid=load-ghost-tick]").count()
        check("1 Chart: one tick for each weekday last week that had load (4)", ticks == 4, f"{ticks}")
        check("1 Chart legend names last week", P.locator("[data-testid=load-ghost-legend]").count() == 1 and f"Vecka {pm.isocalendar()[1]}" in P.locator("[data-testid=load-ghost-legend]").inner_text())
        tx = P.locator("[data-testid=compare-label]").inner_text() + " " + " ".join(P.locator(f"[data-testid={t}]").inner_text() for t in ("delta-pass", "delta-tid"))
        check("1 Arrows are neutral: no green/red colour on the deltas", all(P.evaluate("(t) => getComputedStyle(document.querySelector(`[data-testid=${t}]`)).color", t) == P.evaluate("() => getComputedStyle(document.querySelector('[data-testid=compare-label]')).color") for t in ("delta-pass", "delta-tid", "delta-load")))
        P.screenshot(path=str(SHOTS / "vecka_pagaende.png"), full_page=True)

        # previous (finished) week: compared with the whole week before it
        P.locator("[data-testid=week-prev]").click(); P.wait_for_timeout(900)
        check("2 Finished week: label says Jämfört med vecka N", lab(P) == f"Jämfört med vecka {pm2.isocalendar()[1]}.", lab(P))
        ok, why = tiles_ok(P, in_range(pm, pm + dt.timedelta(6)), in_range(pm2, pm2 + dt.timedelta(6))); check("2 Finished week: whole week vs whole week", ok, why)
        check("2 Chart ticks follow the week before (2 days)", P.locator("[data-testid=load-ghost-tick]").count() == 2, str(P.locator("[data-testid=load-ghost-tick]").count()))
        P.screenshot(path=str(SHOTS / "vecka_avslutad.png"), full_page=True)
        # week with nothing before it
        P.locator("[data-testid=week-prev]").click(); P.wait_for_timeout(900)
        pm3 = pm2 - dt.timedelta(days=7)
        none_expected = not [e for e in in_range(pm3, pm3 + dt.timedelta(6)) if e["user"] == "anna"]
        check("3 Week with nothing before it: 'Ingen jämförelse' and every delta is a dash (or, if data exists, the numbers match)",
              (("Ingen jämförelse" in lab(P)) and all(ui(P, t) == "none" for t in ("delta-pass", "delta-tid", "delta-load"))) if none_expected else tiles_ok(P, in_range(pm2, pm2 + dt.timedelta(6)), in_range(pm3, pm3 + dt.timedelta(6)))[0], lab(P))
        check("3 ...no chart ticks and no legend when nothing before", (not none_expected) or (P.locator("[data-testid=load-ghost-tick]").count() == 0 and P.locator("[data-testid=load-ghost-legend]").count() == 0))
        # empty week (no passes): normal empty message, no crash
        P.locator("[data-testid=week-prev]").click() if P.locator("[data-testid=week-prev]").is_enabled() else None
        P.wait_for_timeout(500)
        check("3 No script errors while stepping", not P.errors, str(P.errors[:2]))

        # month
        set_scope(P, "Månad")
        d = TODAY.day
        name = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"][lastp.month - 1]
        check("4 Running month: label names 1–today of last month", lab(P) == f"Jämfört med {'1–' + str(d) if d > 1 else '1'} {name}.", lab(P))
        curm = [e for e in SEEDED if e["date"][:7] == first.strftime("%Y-%m")]
        prevm = [e for e in SEEDED if e["date"][:7] == lastp.strftime("%Y-%m") and int(e["date"][8:]) <= d]
        ok, why = tiles_ok(P, curm, prevm); check("4 Running month: same days of last month only (the late pass is left out)", ok, why)
        check("4 No ghost ticks in the month view", P.locator("[data-testid=load-ghost-tick]").count() == 0)
        P.locator("[data-testid=month-prev]").click(); P.wait_for_timeout(900)
        lm2 = lastp.replace(day=1) - dt.timedelta(days=1)
        nm2 = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"][lm2.month - 1]
        m2_has = [e for e in SEEDED if e["date"][:7] == lm2.strftime("%Y-%m") and e["user"] == "anna"]
        check("5 Finished month: label names the whole previous month (or says no comparison)", (f"Jämfört med {nm2} {lm2.year}." == lab(P)) if m2_has else (lab(P) == f"Ingen jämförelse: inga pass i {nm2} {lm2.year}."), lab(P))
        P.screenshot(path=str(SHOTS / "manad_avslutad.png"), full_page=True)
        # all months: no comparison
        set_scope(P, "Alla månader")
        check("6 Alla månader: no comparison label and no deltas", lab(P) == "" and P.locator("[data-testid=delta-pass]").count() == 0)
        check("6 No script errors", not P.errors, str(P.errors[:2]))
        ctx.close()
        # a user with passes only in the running week: previous has none
        ctx, P = open_app(browser, port, "niva", "light", "light"); tab(P, "Statistik"); P.wait_for_timeout(700); set_scope(P, "Vecka")
        check("7 Niva: previous week empty gives dashes, no percent text", "Ingen jämförelse" in lab(P) and ui(P, "delta-pass") == "none", lab(P))
        ctx.close()
        # dark mode
        ctx, P = open_app(browser, port, "anna", "dark", "dark"); tab(P, "Statistik"); P.wait_for_timeout(700); set_scope(P, "Vecka")
        P.screenshot(path=str(SHOTS / "vecka_morkt.png"), full_page=True)
        audit(P, "stats compare dark", True)
        check("8 No script errors (dark)", not P.errors, str(P.errors[:2]))
        ctx.close()
        # ---- 9. "Denna månad/vecka" centred; colours right from the first paint (cached user list) ----
        ctx, P = open_app(browser, port, "anna", "light", "light"); tab(P, "Statistik"); P.wait_for_timeout(800)
        chip_css = lambda Q: Q.evaluate("() => { const c = document.querySelector('[data-testid=person-chip]'); const d = c.querySelector('span'); return getComputedStyle(c).borderColor + '|' + (d ? getComputedStyle(d).backgroundColor : ''); }")
        loaded_css = chip_css(P)
        set_scope(P, "Månad"); P.locator("[data-testid=month-prev]").click(); P.wait_for_timeout(700)
        def centred(testid):
            b = P.locator(f"[data-testid={testid}]").bounding_box(); w = P.viewport_size["width"]
            return abs((b["x"] + b["width"] / 2) - w / 2) <= 6, f"{b['x'] + b['width'] / 2:.0f} vs {w / 2:.0f}"
        ok, why = centred("month-now"); check("9 'Denna månad' is centred under the month picker", ok, why)
        set_scope(P, "Vecka"); P.locator("[data-testid=week-prev]").click(); P.wait_for_timeout(700)
        ok, why = centred("week-now"); check("9 'Denna vecka' is centred too", ok, why)
        tab(P, "Historik"); P.wait_for_timeout(500)
        P.locator("[data-testid=hist-month-prev]").click() if P.locator("[data-testid=hist-month-prev]").count() else None
        P.wait_for_timeout(500)
        if P.locator("[data-testid=hist-month-now]").count(): ok, why = centred("hist-month-now"); check("9 Historik: 'Denna månad' is centred", ok, why)
        check("9 The user list is cached on the device", P.evaluate("() => (JSON.parse(localStorage.getItem('nivadagbok-users-cache') || '[]')).some(u => u.id === 'anna')"))
        # reload with the user list unreachable: the person's own colours must still be there
        P2 = ctx.new_page(); P2.errors = []; P2.on("pageerror", lambda e: P2.errors.append(str(e)))
        P2.route(re.compile(r"meta(:|%3A)users"), lambda r: r.abort())
        P2.goto(f"{PAGE}#db=http://localhost:{port}&code={CODE}"); P2.wait_for_selector("[data-testid=person-chip]"); P2.wait_for_timeout(700)
        check("9 Reload before the user list arrives: colours already Anna's (not the green default)", chip_css(P2) == loaded_css, f"{chip_css(P2)} vs {loaded_css}")
        check("9 ...and the right person is selected", "Anna" in P2.locator("[data-testid=person-chip]").inner_text())
        check("9 No script errors", not P.errors and not P2.errors, str((P.errors + P2.errors)[:2]))
        ctx.close()
        # a broken cache is ignored
        ctx = browser.new_context(viewport={"width": 390, "height": 844}); Q = ctx.new_page(); Q.errors = []; Q.on("pageerror", lambda e: Q.errors.append(str(e)))
        Q.add_init_script("try { localStorage.setItem('nivadagbok-users-cache', '{oops'); localStorage.setItem('nivadagbok-me', 'anna'); } catch (e) {}")
        Q.goto(f"{PAGE}#db=http://localhost:{port}&code={CODE}"); Q.wait_for_selector("[data-testid=person-chip]"); Q.wait_for_timeout(800)
        check("9 A broken cache is ignored: app starts normally", "Anna" in Q.locator("[data-testid=person-chip]").inner_text() and not Q.errors, str(Q.errors[:2]))
        ctx.close()
    finally:
        m.terminate(); browser.close()
bad = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(bad)}/{len(results)} passed"); sys.exit(1 if bad else 0)
