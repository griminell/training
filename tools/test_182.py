"""Acceptance tests for 1.8.2: 'Påminn om igår' (per person switch, reminder row, cross, 06:00 rule)."""
import re, sys, os, json, pathlib, datetime as dt
from zoneinfo import ZoneInfo
HTML = sys.argv[1] if len(sys.argv) > 1 else str(pathlib.Path(__file__).resolve().parent.parent / "index.html")
sys.argv = [sys.argv[0], HTML]
src = open(pathlib.Path(__file__).resolve().parent / "test_160.py", encoding="utf-8").read().split("with sync_playwright()")[0]
__file__ = str(pathlib.Path(__file__).resolve())
os.environ.setdefault("SHOTS", "/tmp/shots_182")
exec(src)
from playwright.sync_api import sync_playwright

TZ = ZoneInfo("Europe/Stockholm")
def D(back): return TODAY - dt.timedelta(days=back)
def E(i, d, user, kind=None, note="p"):
    e = {"id": i, "date": d.isoformat(), "user": user, "sport": ["LÖ"], "typ": ["KO"], "tid": "30", "kansla": "5", "anteckningar": note, "cr10": True}
    if kind: e.update({"kind": kind, "sport": [], "typ": [], "tid": "", "kansla": ""})
    return e
WD = ["måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag", "söndag"]
def wd(d): return WD[d.weekday()]
USERS_R = [dict(USERS[0]), dict(USERS[1], admin=True, remindYesterday=True), dict(USERS[2], remindYesterday=True), dict(USERS[3], remindYesterday=True)]  # niva: off
SEEDED = [E("n1", D(3), "niva"), E("a1", D(4), "anna"), E("g1", D(1), "grim"), E("g2", D(6), "grim"), E("b1", D(1), "bo", kind="rest", note="vila")]
def seed_file():
    by = {}
    for e in SEEDED: by.setdefault(e["date"][:7], []).append(e)
    d = {"meta:users": json.dumps(USERS_R)}
    for k, v in by.items(): d[f"entries:{k}"] = json.dumps(sorted(v, key=lambda x: x["date"]))
    f = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False); json.dump({"diaries": {CODE: d}}, f); f.close(); return f.name
def raw(port, key):
    v = json.load(urllib.request.urlopen(f"http://localhost:{port}/__raw?path=diaries/{CODE}/{key}"))
    while isinstance(v, str):
        try: v = json.loads(v)
        except Exception: break
    return v
def entries(port):
    out = []
    for mk in {D(i).strftime("%Y-%m") for i in range(0, 8)}:
        try: out += raw(port, f"entries:{mk}")
        except Exception: pass
    return out

def clock_ctx(hour, minute=0, day_shift=0, scheme="light"):
    """Browser context whose clock says: today (+day_shift) at hour:minute Stockholm time."""
    fake = dt.datetime.combine(TODAY + dt.timedelta(days=day_shift), dt.time(hour, minute), tzinfo=TZ)
    off = int(fake.timestamp() * 1000) - int(dt.datetime.now(dt.timezone.utc).timestamp() * 1000)
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme=scheme, timezone_id="Europe/Stockholm")
    ctx.add_init_script("(() => { const R = Date, off = %d; class F extends R { constructor(...a) { if (a.length === 0) super(R.now() + off); else super(...a); } static now() { return R.now() + off; } } window.Date = F; })();" % off)
    return ctx
def open_at(ctx, port, me):
    P = ctx.new_page(); P.errors = []; P.on("pageerror", lambda e: P.errors.append(str(e)))
    P.add_init_script(f"try {{ if (!sessionStorage.getItem('t182')) {{ sessionStorage.setItem('t182','1'); localStorage.setItem('nivadagbok-me', '{me}'); }} }} catch (e) {{}}")
    P.goto(f"{PAGE}#db=http://localhost:{port}&code={CODE}"); P.wait_for_selector("[data-testid=person-chip]"); P.wait_for_timeout(1100)
    return P
row = lambda P: P.locator("[data-testid=yesterday-reminder]")

with sync_playwright() as pw:
    browser = pw.chromium.launch(); port = 9788; m = start_mock(port)
    try:
        # ---- 1. who gets the row ----
        ctx = clock_ctx(12); P = open_at(ctx, port, "anna")
        want = f"Igår ({wd(D(1))}) är inte loggad. Gör det nu."
        check("1 Anna (switch on, nothing logged yesterday): row with the weekday of yesterday", row(P).count() == 1 and re.sub(r"\s+", " ", row(P).inner_text()).strip() == want, row(P).inner_text() if row(P).count() else "no row")
        link = P.locator("[data-testid=yesterday-log]"); x = P.locator("[data-testid=yesterday-dismiss]")
        lb, xb = link.bounding_box(), x.bounding_box()
        check("1 Tap targets: text row >= 44 px high, cross >= 44 x 44", lb["height"] >= 44 and xb["width"] >= 44 and xb["height"] >= 44, f"{lb['height']} {xb}")
        check("1 Cross is at the far right of the row, has an accessible name", xb["x"] + xb["width"] >= 390 - 20 and x.get_attribute("aria-label") == "Dölj påminnelsen för igår")
        form_y = P.locator("input[type=date]").bounding_box()["y"]
        check("1 The row is the first thing above the form", row(P).bounding_box()["y"] < form_y and row(P).bounding_box()["y"] < P.locator("[data-testid=same-as-last]").bounding_box()["y"])
        P.screenshot(path=str(SHOTS / "paminnelse.png"), full_page=True)
        ul = P.evaluate("() => { const s = document.querySelector('[data-testid=yesterday-log] span'); const c = getComputedStyle(s); return c.textDecorationLine + '|' + c.fontWeight; }")
        check("1 'Gör det nu' is underlined and bold", "underline" in ul and int(ul.split("|")[1]) >= 600, ul)
        bgc = P.evaluate("() => getComputedStyle(document.querySelector('[data-testid=yesterday-reminder]')).backgroundColor")
        check("1 The box is a neutral card, not the yellow warning colour", bgc != "rgb(255, 251, 234)", bgc)
        ctx.close()
        # niva: switch off -> nothing
        ctx = clock_ctx(12); P = open_at(ctx, port, "niva")
        check("2 Niva (switch off, the default): no row", row(P).count() == 0)
        ctx.close()
        # grim logged a pass yesterday, bo a rest day yesterday
        for who in ("grim", "bo"):
            ctx = clock_ctx(12); P = open_at(ctx, port, who)
            check(f"3 {who}: yesterday already logged ({'pass' if who == 'grim' else 'rest day'}) -> no row", row(P).count() == 0)
            ctx.close()
        # ---- 06:00 rule ----
        ctx = clock_ctx(3); P = open_at(ctx, port, "anna")
        check("4 At 03:00 the row is not shown yet", row(P).count() == 0)
        ctx.close()
        ctx = clock_ctx(5, 59); P = open_at(ctx, port, "anna")
        check("4 At 05:59 still not shown", row(P).count() == 0)
        ctx.close()
        ctx = clock_ctx(6, 1); P = open_at(ctx, port, "anna")
        check("4 At 06:01 it is shown", row(P).count() == 1)
        ctx.close()
        # ---- 5. tap on the text: date -> yesterday, row stays until logged; save removes it ----
        ctx = clock_ctx(12); P = open_at(ctx, port, "anna")
        P.locator("[data-testid=yesterday-log]").click(); P.wait_for_timeout(300)
        check("5 Tapping the text sets the date to yesterday", P.input_value("input[type=date]") == D(1).isoformat(), P.input_value("input[type=date]"))
        check("5 The row stays until it is logged", row(P).count() == 1)
        P.locator("[data-testid=sport-group] button[aria-pressed]").first.click(); P.fill("[data-testid=tid-min]", "40")
        P.locator("button.flex-1", has_text=re.compile("^Spara")).first.click(); P.wait_for_timeout(1800)
        saved = [e for e in entries(port) if e["user"] == "anna" and e["date"] == D(1).isoformat()]
        check("5 The pass is saved for yesterday", len(saved) == 1, str(saved))
        check("5 Row is gone after saving", row(P).count() == 0)
        ctx.close()
        # ---- 6. cross: hides for the day on this device only ----
        ctx_a = clock_ctx(12); A = open_at(ctx_a, port, "bo")   # bo has rest day yesterday: use niva-like case instead -> use grim after removing? use sick day of nobody
        ctx_a.close()
        # use Bo: delete the rest day from the database to make yesterday empty again for Bo
        ctx_a = clock_ctx(12)
        # (the DB is edited through the page of Grim-free flows: simplest is a second user with no entry yesterday -> Anna's entry now exists, so reseed)
        ctx_a.close()
    finally:
        m.terminate()

    # second mock for the cross / persistence / second device tests (fresh data: Anna has nothing yesterday)
    port = 9789; m = start_mock(port)
    try:
        ctx_a = clock_ctx(12); A = open_at(ctx_a, port, "anna")
        check("6 Fresh data: row is shown", row(A).count() == 1)
        A.locator("[data-testid=yesterday-dismiss]").click(); A.wait_for_timeout(300)
        check("6 The cross hides the row", row(A).count() == 0)
        before = entries(port)
        A.reload(); A.wait_for_selector("[data-testid=person-chip]"); A.wait_for_timeout(1100)
        check("6 It stays hidden after a reload (this device, this day)", row(A).count() == 0)
        check("6 Nothing was written to the database by the cross", json.dumps(entries(port), sort_keys=True) == json.dumps(before, sort_keys=True) and "dismiss" not in json.dumps(raw(port, "meta:users")))
        check("6 Stored on the device per person and day", json.loads(A.evaluate("localStorage.getItem('nivadagbok-skip-yesterday')")) == {"anna": D(1).isoformat()}, A.evaluate("localStorage.getItem('nivadagbok-skip-yesterday')"))
        # another device (new context) still shows it: the choice is per device
        ctx_b = clock_ctx(12); B = open_at(ctx_b, port, "anna")
        check("6 A second device still shows the row", row(B).count() == 1)
        ctx_b.close()
        # next day: the row is back
        ctx_c = clock_ctx(12, day_shift=1)
        C = ctx_c.new_page(); C.errors = []
        # carry over the device's localStorage by using the same context for the next day is not possible; emulate by setting the stored skip and reloading with a shifted clock
        C.add_init_script(f"try {{ localStorage.setItem('nivadagbok-me','anna'); localStorage.setItem('nivadagbok-skip-yesterday', JSON.stringify({{anna: '{D(1).isoformat()}'}})); }} catch (e) {{}}")
        C.goto(f"{PAGE}#db=http://localhost:{port}&code={CODE}"); C.wait_for_selector("[data-testid=person-chip]"); C.wait_for_timeout(1100)
        check("6 The next day the row is back (the skip was for the day before)", row(C).count() == 1 and wd(D(0)) in row(C).inner_text(), row(C).inner_text() if row(C).count() else "no row")
        ctx_c.close()
        # ---- 7. queued (offline) pass counts as logged ----
        ctx_d = clock_ctx(12); Dp = open_at(ctx_d, port, "anna")
        ctl(port, offline=1)
        Dp.locator("[data-testid=yesterday-log]").click(); Dp.locator("[data-testid=sport-group] button[aria-pressed]").first.click(); Dp.fill("[data-testid=tid-min]", "20")
        Dp.locator("button.flex-1", has_text=re.compile("^Spara")).first.click(); Dp.wait_for_timeout(2500)
        check("7 A pass waiting as Ej sparat for yesterday counts as logged: row gone", Dp.locator("[data-testid=pending-card]").count() == 1 and row(Dp).count() == 0)
        ctl(port, offline=0); Dp.evaluate("window.dispatchEvent(new Event('online'))"); Dp.wait_for_timeout(2500)
        check("7 After reconnecting it is saved and the row stays gone", len([e for e in entries(port) if e["user"] == "anna" and e["date"] == D(1).isoformat()]) == 1 and row(Dp).count() == 0)
        ctx_d.close()
    finally:
        m.terminate()

    # third mock: the switch in Hantera användare, person switching, dark mode
    port = 9790; m = start_mock(port)
    try:
        ctx = clock_ctx(12); P = open_at(ctx, port, "grim")
        P.locator("[data-testid=person-chip]").click(); P.wait_for_selector("[data-testid=person-menu]")
        P.locator("[data-testid=person-manage]").click(); P.wait_for_timeout(400)
        P.get_by_role("button", name="Redigera Niva").click(); P.wait_for_timeout(300)
        sw = P.locator("[data-testid=user-remind-switch]")
        check("8 Switch 'Påminn om igår' exists in Redigera, off for Niva by default", sw.count() == 1 and sw.get_attribute("aria-checked") == "false" and "Påminn om igår" in sw.inner_text())
        check("8 Helper text explains it in one line", "Visar en rad på Logga pass när gårdagen inte är loggad." in sw.inner_text())
        sw.click(); P.wait_for_timeout(200)
        P.get_by_role("button", name="Spara", exact=True).click(); P.wait_for_timeout(1300)
        us = {u["id"]: u for u in raw(port, "meta:users")}
        check("8 Saved on the person only: Niva has it, the others are as before", us["niva"].get("remindYesterday") is True and us["anna"].get("remindYesterday") is True and us["grim"].get("admin") is True and us["niva"]["name"] == "Niva" and us["niva"]["color"] == "#C2477A", str(us["niva"]))
        P.get_by_role("button", name="Stäng").first.click() if P.get_by_role("button", name="Stäng").count() else None
        P.wait_for_timeout(300)
        # grim (logged yesterday) -> no row; switch to Niva on this device -> row appears
        check("9 Grim has logged yesterday: no row", row(P).count() == 0)
        P.locator("[data-testid=person-chip]").click(); P.wait_for_selector("[data-testid=person-menu]"); P.locator("[data-testid=person-niva]").click(); P.wait_for_timeout(900)
        check("9 Switching to Niva on the same device shows her row (switch is per person)", row(P).count() == 1)
        P.locator("[data-testid=person-chip]").click(); P.wait_for_selector("[data-testid=person-menu]"); P.locator("[data-testid=person-grim]").click(); P.wait_for_timeout(700)
        check("9 ...and back on Grim it is gone again", row(P).count() == 0)
        # turn it off again: field removed
        P.locator("[data-testid=person-chip]").click(); P.wait_for_selector("[data-testid=person-menu]"); P.locator("[data-testid=person-manage]").click(); P.wait_for_timeout(400)
        P.get_by_role("button", name="Redigera Niva").click(); P.wait_for_timeout(300)
        P.locator("[data-testid=user-remind-switch]").click(); P.get_by_role("button", name="Spara", exact=True).click(); P.wait_for_timeout(1300)
        us = {u["id"]: u for u in raw(port, "meta:users")}
        check("10 Switching it off removes the field again", "remindYesterday" not in us["niva"], str(us["niva"]))
        check("10 No script errors", not P.errors, str(P.errors[:2]))
        ctx.close()
        # dark mode
        ctx = clock_ctx(12, scheme="dark"); P = open_at(ctx, port, "anna")
        P.evaluate("localStorage.setItem('nivadagbok-theme','dark')"); P.reload(); P.wait_for_selector("[data-testid=person-chip]"); P.wait_for_timeout(1100)
        check("11 Dark mode: row is shown", row(P).count() == 1)
        audit(P, "paminnelse dark", True)
        P.screenshot(path=str(SHOTS / "paminnelse_morkt.png"))
        check("11 No script errors (dark)", not P.errors, str(P.errors[:2]))
        ctx.close()
    finally:
        m.terminate(); browser.close()
bad = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(bad)}/{len(results)} passed"); sys.exit(1 if bad else 0)
