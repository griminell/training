"""Acceptance tests for 1.7.9: data schema version (meta:schema), write lock for newer data, backup schema."""
import re, sys, os, json, pathlib, shutil, datetime as dt
HTML = sys.argv[1] if len(sys.argv) > 1 else str(pathlib.Path(__file__).resolve().parent.parent / "index.html")
sys.argv = [sys.argv[0], HTML]
_t = open(pathlib.Path(__file__).resolve().parent / "test_178.py", encoding="utf-8").read()
src = _t[:_t.index("\nwith sync_playwright() as pw:\n")]
__file__ = str(pathlib.Path(__file__).resolve())
os.environ.setdefault("SHOTS", "/tmp/shots_179")
exec(src)

BASE_SEED = seed_file
SCH = {"v": None}   # None = no meta:schema key; else the dict to seed
def seed_file():
    MODE["m"] = "full-admin"
    f = BASE_SEED()
    if SCH["v"] is None: return f
    data = json.load(open(f)); data["diaries"][CODE]["meta:schema"] = json.dumps(SCH["v"])
    json.dump(data, open(f, "w")); return f

def schema_of(port):
    try: return raw(port, "meta:schema")
    except Exception: return None
def log_rest(P, date):
    P.get_by_role("button", name="Vilodag", exact=True).click(); P.wait_for_timeout(200)
    P.fill("input[type=date]", date)
    P.get_by_role("button", name="Spara vilodag").click(); P.wait_for_timeout(1500)

OLD_DAY = (TODAY - dt.timedelta(days=2)).isoformat()
with sync_playwright() as pw:
    browser = pw.chromium.launch()
    # ---- A: no meta:schema in the database yet (all existing data) ----
    SCH["v"] = None; port = 9783; m = start_mock(port)
    try:
        before = json.dumps(all_entries(port), sort_keys=True)
        ctx, P = open_app(browser, port, "niva", "light", "light"); P.wait_for_timeout(1200)
        s = schema_of(port)
        check("1 Missing schema key is written once: version 1, app version, timestamp", bool(s) and s.get("version") == 1 and s.get("appVersion") == "1.7.9" and isinstance(s.get("at"), str), str(s))
        check("1 Existing passes are untouched by that", json.dumps(all_entries(port), sort_keys=True) == before)
        check("1 No warning", P.locator("[data-testid=schema-warning]").count() == 0)
        at1 = s["at"]
        ctx.close()
        ctx, P = open_app(browser, port, "grim", "light", "light"); P.wait_for_timeout(1200)
        check("2 A second device does not overwrite it", schema_of(port)["at"] == at1)
        n0 = len(all_entries(port)); log_rest(P, OLD_DAY)
        check("3 Saving works as before (rest day added)", len(all_entries(port)) == n0 + 1, f"{n0} -> {len(all_entries(port))}")
        check("3 The schema key is still the same after saving", schema_of(port) == s)
        # backup file carries the schema
        open_menu_(P)
        with P.expect_download() as dl: P.locator("[data-testid=menu-backup]").click()
        bk = json.load(open(dl.value.path(), encoding="utf-8")); shutil.copy(dl.value.path(), "/tmp/backup_179.json")
        check("4 New backup has schema 1 next to format 1", bk.get("schema") == 1 and bk.get("format") == 1, str({k: bk.get(k) for k in ("schema", "format")}))
        check("4 Schema key is not part of the months in the backup", all(re.match(r"^\d{4}-\d{2}$", k) for k in bk["months"]))
        P.wait_for_timeout(500); ctx.close()
    finally:
        m.terminate()

    # ---- B: schema already stored with the same version ----
    SCH["v"] = {"version": 1, "appVersion": "1.7.8", "at": "2026-01-01T00:00:00.000Z"}; port = 9784; m = start_mock(port)
    try:
        ctx, P = open_app(browser, port, "grim", "light", "light"); P.wait_for_timeout(1200)
        check("5 Existing schema 1 is left exactly as it was", schema_of(port) == SCH["v"], str(schema_of(port)))
        check("5 No warning for the same version", P.locator("[data-testid=schema-warning]").count() == 0)
        # restore an old 1.7.8 file (no schema field) and a file from a newer app
        old = dict(bk); old.pop("schema", None); json.dump(old, open("/tmp/backup_old.json", "w"))
        new = dict(bk); new["schema"] = 99; json.dump(new, open("/tmp/backup_new.json", "w"))
        n0 = len(all_entries(port))
        P.locator("[data-testid=restore-input]").set_input_files("/tmp/backup_new.json"); P.wait_for_timeout(900)
        body = P.locator("body").inner_text()
        check("6 A backup from a newer app is refused with a clear message", "nyare version av appen" in body and P.locator("[role=dialog]").count() == 0, body[-200:].replace("\n", " "))
        check("6 ...and nothing was written", len(all_entries(port)) == n0)
        P.locator("[data-testid=restore-input]").set_input_files("/tmp/backup_old.json"); P.wait_for_timeout(900)
        check("7 An old backup without schema is accepted (counts as version 1)", P.locator("[role=dialog]").count() == 1 and "Återställ från säkerhetskopia" in P.locator("[role=dialog]").inner_text())
        P.get_by_role("button", name="Avbryt").click(); P.wait_for_timeout(300)
        check("8 No script errors", not P.errors, str(P.errors[:2]))
        ctx.close()
    finally:
        m.terminate()

    # ---- C: data written by a NEWER app (schema 99) ----
    SCH["v"] = {"version": 99, "appVersion": "9.9.9", "at": "2027-01-01T00:00:00.000Z"}; port = 9785; m = start_mock(port)
    try:
        before = json.dumps(all_entries(port), sort_keys=True); users0 = json.dumps(users_of(port), sort_keys=True)
        ctx, P = open_app(browser, port, "grim", "light", "light"); P.wait_for_timeout(1300)
        w = P.locator("[data-testid=schema-warning]")
        check("9 A warning is shown with Uppdatera sidan", w.count() == 1 and "nyare version" in w.inner_text() and "Uppdatera sidan" in w.inner_text())
        P.screenshot(path=str(SHOTS / "varning.png"))
        log_rest(P, OLD_DAY)
        check("10 Saving is blocked: no pass is written", json.dumps(all_entries(port), sort_keys=True) == before)
        check("10 The schema key is not touched (still 99)", schema_of(port)["version"] == 99)
        # user list changes are blocked too
        open_menu_(P); P.locator("[data-testid=person-manage]").click(); P.wait_for_timeout(400)
        P.get_by_role("button", name="Redigera Anna").click(); P.wait_for_timeout(300)
        P.locator("input[type=text]").first.fill("Anna Ändrad"); P.get_by_role("button", name="Spara", exact=True).click(); P.wait_for_timeout(1200)
        check("11 User list is not changed either", json.dumps(users_of(port), sort_keys=True) == users0)
        P.reload(); P.wait_for_selector("[data-testid=person-chip]"); P.wait_for_timeout(1200)
        check("12 The warning is still there after a reload (data can still be read)", P.locator("[data-testid=schema-warning]").count() == 1 and P.locator("[data-testid=view-wrap]").count() == 1)
        check("12 No script errors", not P.errors, str(P.errors[:2]))
        ctx.close()
        # dark mode
        ctx, P = open_app(browser, port, "grim", "dark", "dark"); P.wait_for_timeout(1300)
        P.screenshot(path=str(SHOTS / "varning_morkt.png"))
        bg = P.evaluate("() => getComputedStyle(document.querySelector('[data-testid=schema-warning]')).backgroundColor")
        mm_ = [int(x) for x in re.findall(r"\d+", bg)[:3]]
        check("13 Dark mode: the warning is not a light surface", sum(mm_) / 3 < 150, bg)
        ctx.close()
    finally:
        m.terminate()
    browser.close()
bad = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(bad)}/{len(results)} passed"); sys.exit(1 if bad else 0)
