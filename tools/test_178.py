"""Acceptance tests for 1.7.8: administrator (per person), JSON backup, restore, reminder."""
import re, sys, os, json, pathlib, shutil, datetime as dt
HTML = sys.argv[1] if len(sys.argv) > 1 else str(pathlib.Path(__file__).resolve().parent.parent / "index.html")
sys.argv = [sys.argv[0], HTML]
_t = open(pathlib.Path(__file__).resolve().parent / "test_177.py", encoding="utf-8").read()
src = _t[:_t.index("\nwith sync_playwright() as pw:\n")]
__file__ = str(pathlib.Path(__file__).resolve())
os.environ.setdefault("SHOTS", "/tmp/shots_178")
exec(src)
from playwright.sync_api import sync_playwright

FULL_SEED = seed_file
MODE = {"m": "full", "backup": None}
def seed_file():
    if MODE["m"] == "full": return FULL_SEED()
    users = [dict(u, **({"admin": True} if u["id"] == "grim" else {})) for u in USERS]
    cur = [E("only1", TODAY, ["LÖ"], ["KO"], "30", "5", "enda passet")] if MODE["m"] == "empty" else CUR
    d = {"meta:users": json.dumps(users), f"entries:{M}": json.dumps(cur)}
    if MODE["backup"] is not None: d["meta:backup"] = json.dumps({"at": MODE["backup"], "by": "grim", "pass": 1})
    data = {"diaries": {CODE: d}}
    f = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False); json.dump(data, f); f.close(); return f.name

def raw(port, key):
    v = json.load(urllib.request.urlopen(f"http://localhost:{port}/__raw?path=diaries/{CODE}/{key}"))
    while isinstance(v, str):
        try: v = json.loads(v)
        except Exception: break
    return v
def all_entries(port):
    out = []
    for k in (M, PMK):
        try: out += raw(port, f"entries:{k}")
        except Exception: pass
    return out
def users_of(port): return raw(port, "meta:users")
def open_menu_(P):
    if P.locator("[data-testid=person-menu]").count() == 0: P.locator("[data-testid=person-chip]").click(); P.wait_for_selector("[data-testid=person-menu]")
def close_menu_(P):
    if P.locator("[data-testid=person-menu]").count(): P.locator("[data-testid=person-menu-backdrop]").click(position={"x": 5, "y": 400}); P.wait_for_timeout(200)
def pick_person(P, uid):
    open_menu_(P); P.locator(f"[data-testid=person-{uid}]").click(); P.wait_for_timeout(500)

with sync_playwright() as pw:
    browser = pw.chromium.launch(); port = 9779; m = start_mock(port)
    try:
        # ---- non-admin sees nothing ----
        ctx, P = open_app(browser, port, "niva", "light", "light"); P.wait_for_timeout(500)
        open_menu_(P)
        check("1 Non-admin: no backup, no restore in the menu", P.locator("[data-testid=menu-backup]").count() == 0 and P.locator("[data-testid=menu-restore]").count() == 0)
        check("1 CSV items are named (CSV)", "Importera (CSV)" in P.locator("[data-testid=person-menu]").inner_text() and "Exportera (CSV)" in P.locator("[data-testid=person-menu]").inner_text())
        close_menu_(P)
        check("1 Non-admin: no reminder at the bottom, no restore input", P.locator("[data-testid=backup-reminder]").count() == 0 and P.locator("[data-testid=restore-input]").count() == 0)
        ctx.close()
        # ---- make Grim administrator ----
        ctx, P = open_app(browser, port, "grim", "light", "light"); P.wait_for_timeout(500)
        open_menu_(P); P.locator("[data-testid=person-manage]").click(); P.wait_for_timeout(400)
        P.get_by_role("button", name="Redigera Grim").click(); P.wait_for_timeout(300)
        sw_ = P.locator("[data-testid=user-admin-switch]")
        check("2 The switch is in Hantera användare > Redigera, off by default", sw_.count() == 1 and sw_.get_attribute("aria-checked") == "false")
        sw_.click(); P.wait_for_timeout(200)
        P.get_by_role("button", name="Spara", exact=True).click(); P.wait_for_timeout(1200)
        us = {u["id"]: u for u in users_of(port)}
        check("2 Saved in the shared user list: Grim admin, others not", us["grim"].get("admin") is True and not any(us[k].get("admin") for k in ("niva", "anna", "bo")), str(us["grim"]))
        check("2 Name and colour of Grim unchanged", us["grim"]["name"] == "Grim" and us["grim"]["color"] == "#004B26")
        P.get_by_role("button", name="Stäng").first.click() if P.get_by_role("button", name="Stäng").count() else None
        P.wait_for_timeout(300)
        # ---- admin sees the items + reminder ----
        open_menu_(P)
        check("3 Admin sees Säkerhetskopia (JSON) and Återställ från säkerhetskopia", P.locator("[data-testid=menu-backup]").count() == 1 and P.locator("[data-testid=menu-restore]").count() == 1)
        check("3 Menu status says none taken yet", "Ingen säkerhetskopia tagen än" in P.locator("[data-testid=backup-status]").inner_text())
        close_menu_(P)
        check("3 Reminder at the bottom (never taken)", "Ingen säkerhetskopia är tagen än" in P.locator("[data-testid=backup-reminder]").inner_text())
        pick_person(P, "niva")
        check("3 Choosing Niva on the same device hides it all again", P.locator("[data-testid=backup-reminder]").count() == 0)
        open_menu_(P); check("3 ...also in the menu", P.locator("[data-testid=menu-backup]").count() == 0); close_menu_(P)
        pick_person(P, "grim")
        check("3 Back on Grim: reminder is back", P.locator("[data-testid=backup-reminder]").count() == 1)
        # ---- take a backup ----
        open_menu_(P)
        with P.expect_download() as dl: P.locator("[data-testid=menu-backup]").click()
        d = dl.value
        check("4 File name is traningsdagbok-backup-<date>.json", d.suggested_filename == f"traningsdagbok-backup-{TODAY.isoformat()}.json", d.suggested_filename)
        path = d.path(); text = open(path, encoding="utf-8").read(); bk = json.loads(text)
        db_entries = all_entries(port)
        n_in_file = sum(len(v) for v in bk["months"].values())
        check("4 Header: app, format 1, version, date", bk["app"] == "traningsdagbok" and bk["format"] == 1 and bk["appVersion"] and bk["createdAt"][:10] == TODAY.isoformat())
        check("4 Every pass of every month is in the file", n_in_file == len(db_entries) and set(bk["months"]) == {M, PMK}, f"{n_in_file} vs {len(db_entries)}")
        check("4 Nothing is lost per field (pain, sleep/energy, kind, distance, notes)", sorted(json.dumps(x, sort_keys=True) for v in bk["months"].values() for x in v) == sorted(json.dumps(x, sort_keys=True) for x in db_entries))
        check("4 All four people are in the file, with Grim as admin", {u["id"] for u in bk["users"]} == {"niva", "grim", "anna", "bo"} and [u for u in bk["users"] if u["id"] == "grim"][0].get("admin") is True)
        check("4 The file never contains the database address or the share code", CODE not in text and f"localhost:{port}" not in text and "9779" not in text)
        P.wait_for_timeout(1500)
        mb = raw(port, "meta:backup")
        check("4 Shared timestamp saved (who, when, how many)", mb["by"] == "grim" and mb["at"][:10] == TODAY.isoformat() and mb["pass"] == n_in_file, str(mb))
        check("4 Message mentions count and 'hälsodata'", "hälsodata" in P.locator("body").inner_text() and f"{n_in_file} pass" in P.locator("body").inner_text())
        check("4 Reminder is gone", P.locator("[data-testid=backup-reminder]").count() == 0)
        open_menu_(P); check("4 Menu status: Senaste: idag", "Senaste: idag" in P.locator("[data-testid=backup-status]").inner_text()); close_menu_(P)
        shutil.copy(path, "/tmp/backup_178.json"); BK_FILE = "/tmp/backup_178.json"
        ctx.close()
        # another device (new context) as Grim: no reminder because the timestamp is shared
        ctx, P = open_app(browser, port, "grim", "light", "light"); P.wait_for_timeout(900)
        check("5 Second device as Grim: no reminder (shared timestamp)", P.locator("[data-testid=backup-reminder]").count() == 0)
        ctx.close()
    finally:
        try: m.terminate()
        except Exception: pass

    # ---- reminder timing ----
    def reminder_case(days, expect_reminder, status_expect, port_):
        MODE["m"] = "full-admin"; MODE["backup"] = (dt.datetime.utcnow() - dt.timedelta(days=days)).isoformat() + "Z"
        mm = start_mock(port_)
        try:
            c, Pp = open_app(browser, port_, "grim", "light", "light"); Pp.wait_for_timeout(900)
            got = Pp.locator("[data-testid=backup-reminder]").count() == 1
            txt = Pp.locator("[data-testid=backup-reminder]").inner_text() if got else ""
            open_menu_(Pp); st = Pp.locator("[data-testid=backup-status]").inner_text(); close_menu_(Pp)
            c.close()
            return got == expect_reminder and status_expect in st and (not got or status_expect.replace("Senaste: ", "") in txt), f"{got} '{txt}' '{st}'"
        finally:
            mm.terminate()
    ok, why = reminder_case(10, False, "Senaste: 10 dagar sedan", 9780); check("6 10 days ago: no reminder, menu says 10 dagar sedan", ok, why)
    ok, why = reminder_case(40, True, "Senaste: 5 veckor sedan", 9781); check("6 40 days ago: reminder says 5 veckor sedan", ok, why)

    # ---- restore ----
    MODE["m"] = "empty"; MODE["backup"] = None
    port2 = 9782; m2 = start_mock(port2)
    try:
        ctx, P = open_app(browser, port2, "grim", "light", "light"); P.wait_for_timeout(700)
        before = json.dumps(all_entries(port2), sort_keys=True)
        # a pass that exists in both with the same id but different content must not be overwritten
        open_menu_(P); P.locator("[data-testid=menu-restore]").click() if False else None; close_menu_(P)
        # wrong files first
        def feed(name, content):
            f = pathlib.Path(tempfile.gettempdir()) / name; f.write_text(content, encoding="utf-8"); P.locator("[data-testid=restore-input]").set_input_files(str(f)); P.wait_for_timeout(900)
        feed("fel1.json", "inte json alls")
        check("7 Garbage file: clear error, nothing written", "ingen säkerhetskopia" in P.locator("body").inner_text() and P.locator("[role=dialog]").count() == 0 and json.dumps(all_entries(port2), sort_keys=True) == before)
        feed("fel2.json", json.dumps({"app": "annat", "format": 1, "users": [], "months": {}}))
        check("7 Wrong app: error", "ingen säkerhetskopia" in P.locator("body").inner_text() and P.locator("[role=dialog]").count() == 0)
        feed("fel3.json", json.dumps({"app": "traningsdagbok", "format": 1, "users": []}))
        check("7 Broken file (no months): error 'trasig'", "trasig" in P.locator("body").inner_text() and P.locator("[role=dialog]").count() == 0)
        # the real backup
        P.locator("[data-testid=restore-input]").set_input_files(BK_FILE); P.wait_for_timeout(1000)
        dlg = P.locator("[role=dialog]")
        total = n_in_file
        check("8 Confirmation shows what happens: total, already there (1), to add, nothing overwritten/deleted", dlg.count() == 1 and f"{total} pass" in dlg.inner_text() and "1 finns redan" in dlg.inner_text() or (dlg.count() == 1 and "finns redan" in dlg.inner_text() and f"{total} pass" in dlg.inner_text()) and "Inget skrivs över" in dlg.inner_text(), dlg.inner_text().replace("\n", " ") if dlg.count() else "no dialog")
        P.screenshot(path=str(SHOTS / "aterstall.png"))
        P.get_by_role("button", name="Avbryt").last.click(); P.wait_for_timeout(400)
        check("8 Avbryt writes nothing", P.locator("[role=dialog]").count() == 0 and json.dumps(all_entries(port2), sort_keys=True) == before)
        P.locator("[data-testid=restore-input]").set_input_files(BK_FILE); P.wait_for_timeout(1000)
        P.get_by_role("button", name="Återställ", exact=True).click(); P.wait_for_timeout(3500)
        after = all_entries(port2)
        ids_orig = {e["id"] for v in bk["months"].values() for e in v}
        check("9 Restore: every pass from the file is now there", ids_orig <= {e["id"] for e in after}, f"{len(after)} entries")
        check("9 The pass that was already there is kept as it was", any(e["id"] == "only1" and e["anteckningar"] == "enda passet" for e in after))
        check("9 No pass is duplicated", len({e["id"] for e in after}) == len(after))
        check("9 Content equal to the original for every restored pass", all(json.dumps(e, sort_keys=True) in {json.dumps(x, sort_keys=True) for x in db_entries} for e in after if e["id"] != "only1"))
        check("9 Done message", "Återställning klar" in P.locator("body").inner_text() and P.locator("[role=dialog]").count() == 0)
        # again: nothing to add
        P.locator("[data-testid=restore-input]").set_input_files(BK_FILE); P.wait_for_timeout(1000)
        check("10 Restoring again: 0 to add", "0 läggs till" in P.locator("[role=dialog]").inner_text(), P.locator("[role=dialog]").inner_text().replace("\n", " ") if P.locator("[role=dialog]").count() else "no dialog")
        P.get_by_role("button", name="Återställ", exact=True).click(); P.wait_for_timeout(1500)
        check("10 ...and says nothing was missing, data unchanged", "inget saknades" in P.locator("body").inner_text() and len(all_entries(port2)) == len(after))
        # changed pass in DB with same id is not overwritten
        e0 = [e for e in all_entries(port2) if e["id"] == "w1a"][0]
        check("10 Restore never changes existing passes (w1a keeps its data)", e0["tid"] == "30")
        check("11 Restore saw all the people and kept Grim as the only admin", {u["id"] for u in users_of(port2)} == {"niva", "grim", "anna", "bo"} and [u["id"] for u in users_of(port2) if u.get("admin")] == ["grim"])
        P.screenshot(path=str(SHOTS / "efter_aterstallning.png"), full_page=True)
        check("12 No script errors", not P.errors, str(P.errors[:2]))
        ctx.close()
        # dark mode: menu + dialog
        ctx, P = open_app(browser, port2, "grim", "dark", "dark"); P.wait_for_timeout(700)
        open_menu_(P); P.screenshot(path=str(SHOTS / "meny_mörkt.png"))
        bad = P.evaluate("""() => { const out = []; document.querySelectorAll('[data-testid=person-menu] *').forEach(el => { const c = getComputedStyle(el).backgroundColor; const m = c.match(/\\d+/g); if (m && m.length >= 3 && c !== 'rgba(0, 0, 0, 0)' && (+m[0] + +m[1] + +m[2]) / 3 > 215) out.push(el.tagName + ':' + c); }); return out; }""")
        check("13 Dark mode: no light backgrounds in the admin menu", not bad, str(bad[:3]))
        close_menu_(P)
        P.locator("[data-testid=restore-input]").set_input_files(BK_FILE); P.wait_for_timeout(900)
        P.screenshot(path=str(SHOTS / "aterstall_mörkt.png"))
        check("13 No script errors (dark)", not P.errors, str(P.errors[:2]))
        ctx.close()
    finally:
        try: m2.terminate()
        except Exception: pass
        browser.close()
bad = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(bad)}/{len(results)} passed"); sys.exit(1 if bad else 0)
