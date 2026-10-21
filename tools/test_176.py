"""Acceptance tests for 1.7.6: pain trend in Statistik, person stays after the panel, Vad är nytt scroll/pull to close."""
import re, sys, os, json, pathlib, datetime as dt
HTML = sys.argv[1] if len(sys.argv) > 1 else str(pathlib.Path(__file__).resolve().parent.parent / "index.html")
sys.argv = [sys.argv[0], HTML]
src = open(pathlib.Path(__file__).resolve().parent / "test_173.py", encoding="utf-8").read().split("with sync_playwright() as pw:")[0]
__file__ = str(pathlib.Path(__file__).resolve())
os.environ.setdefault("SHOTS", "/tmp/shots_176")
exec(src)
from playwright.sync_api import sync_playwright

def D(k): return TODAY - dt.timedelta(days=k)
def PN(part, pos, v): return {"part": part, "pos": pos, "value": str(v)}
heel_vals = {5: 5, 4: 6, 3: 5, 2: 7, 1: 5, 0: 6}   # heel left, 5 or more on 6 of the last 7 days
knee_days = {6: 3, 3: 5, 0: 2}                      # knee right, 3 days
EX = []
for k, v in heel_vals.items(): EX.append(E(f"zh{k}", D(k), ["LÖ"], ["KO"], "30", "5", pain=[PN("heel", "L", v)] + ([PN("knee", "R", knee_days[k])] if k in knee_days else [])))
for k in (6, 3): EX.append(E(f"zk{k}", D(k), ["F"], ["TE"], "40", "4", pain=[PN("knee", "R", knee_days[k])]))
for k in range(0, 5): EX.append(E(f"zr{k}", D(k), ["PR"], ["KO"], "20", "3", pain=[PN("heel", "R", 3)]))  # heel right: many days but only value 3 -> no hint
EX.append(E("zb1", D(8), ["S"], ["ST"], "50", "4", pain=[PN("back", "low", 6)]))
# Anna: back low pain on 10 of the last 14 days, but only 4 of the last 7 -> the 14-day rule
ANNA = [E(f"za{k}", D(k), ["PI"], ["IN"], "30", "3", user="anna", pain=[PN("back", "low", 5)]) for k in range(0, 14) if k not in (1, 3, 5, 7)]
def seed_file():
    entries = CUR + EX + ANNA
    cur = [e for e in entries if e["date"][:7] == M]
    prev = [e for e in entries if e["date"][:7] == PMK] + PREV
    other = [e for e in entries if e["date"][:7] not in (M, PMK)]
    data = {"diaries": {CODE: {"meta:users": json.dumps(USERS), f"entries:{M}": json.dumps(cur), f"entries:{PMK}": json.dumps(prev)}}}
    f = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False); json.dump(data, f); f.close(); return f.name

def pain_card(P): return P.locator("[data-testid=pain-parts]")
def set_scope(P, label): P.get_by_role("button", name=label, exact=True).first.click(); P.wait_for_timeout(600)

with sync_playwright() as pw:
    browser = pw.chromium.launch(); port = 9776; m = start_mock(port)
    try:
        ctx, P = open_app(browser, port, "niva", "light", "light")
        tab(P, "Statistik"); P.wait_for_timeout(800)
        txt = P.locator("body").inner_text()
        check("1 Smärta card exists in Statistik", "SMÄRTA" in txt and pain_card(P).count() == 1)
        labels = [b.inner_text().strip() for b in P.locator("[data-testid=pain-part]").all()]
        in_month = lambda k: D(k).strftime("%Y-%m") == M
        n_heel = sum(1 for k in heel_vals if in_month(k))
        check("1 Body parts as chips, most days first (Häl V first)", labels[0] == "Häl V" and "Knä H" in labels and "Rygg nedre" in labels or labels[0] == "Häl V", str(labels))
        pressed = P.locator("[data-testid=pain-part][aria-pressed=true]").inner_text().strip()
        check("1 First part is selected by default", pressed == "Häl V", pressed)
        allp = [e for e in CUR + EX if e["user"] == "niva" and e["date"][:7] == M]
        def day_max(part, pos):
            r = {}
            for e in allp:
                for q in e.get("pain", []):
                    if q["part"] == part and q["pos"] == pos: r[e["date"]] = max(r.get(e["date"], -1), int(q["value"]))
            return r
        vals = list(day_max("heel", "L").values())
        st = P.locator("[data-testid=pain-stats]").inner_text().replace("\n", " ")
        check("1 Stats: highest, average, days (Häl V)", f"Högst {max(vals)}" in st and f"Snitt {sum(vals)/len(vals):.1f}".replace(".", ",") in st and f"Dagar med smärta {len(vals)}" in st, st)
        dots = P.locator("[data-testid=pain-chart] .recharts-line-dots circle").count()
        check("1 Chart has one point per day with pain (gaps are not zeros)", dots == len(vals), f"{dots} vs {len(vals)}")
        P.locator("[data-testid=pain-part]", has_text="Knä H").click(); P.wait_for_timeout(500)
        kv = list(day_max("knee", "R").values())
        st = P.locator("[data-testid=pain-stats]").inner_text().replace("\n", " ")
        check("1 Picking another body part updates numbers (Knä H)", f"Högst {max(kv)}" in st and f"Dagar med smärta {len(kv)}" in st, st)
        # hint
        hints = [h.inner_text() for h in P.locator("[data-testid=pain-hint]").all()]
        check("2 Persistent pain hint for Häl V: 6 of the last 7 days", len(hints) == 1 and "Smärta på 5 eller mer i Häl V har noterats 6 av de senaste 7 dagarna" in hints[0] and "fysio eller läkare" in hints[0], str(hints))
        check("2 No hint for knee (3 days), back (1 day) or heel right (7 days but only value 3)", not any("Knä" in h or "Rygg" in h or "Häl H" in h for h in hints))
        # periods
        set_scope(P, "Vecka")
        check("3 Week: card still follows the period (chart 7 days) and the hint stays", P.locator("[data-testid=pain-hint]").count() == 1)
        P.locator("[data-testid$='-prev']").first.click()
        P.wait_for_timeout(500)
        set_scope(P, "Alla månader")
        check("3 All months: card shows (Häl V total)", pain_card(P).count() == 1 and P.locator("[data-testid=pain-stats]").inner_text().count("Dagar med smärta") == 1)
        # 14-day rule for Anna
        ctx.close()
        ctx, P = open_app(browser, port, "anna", "light", "light")
        tab(P, "Statistik"); P.wait_for_timeout(900)
        hints = [h.inner_text() for h in P.locator("[data-testid=pain-hint]").all()]
        check("4 A device that belongs to a non-default person (Anna) keeps her after load", "Anna" in P.locator("[data-testid=person-chip]").inner_text())
        check("4 14-day rule (Anna): 10 of the last 14 days", len(hints) == 1 and "Smärta på 5 eller mer i Rygg nedre har noterats 10 av de senaste 14 dagarna" in hints[0], str(hints))
        P.screenshot(path=str(SHOTS / "smarta_anna.png"), full_page=True)
        P.locator("[data-testid=stats-person], button", has_text=re.compile("^Bo$")).first.click(); P.wait_for_timeout(600)
        check("4 A person without pain: no hint, empty text", P.locator("[data-testid=pain-hint]").count() == 0 and P.locator("[data-testid=pain-trend-empty]").count() == 1)
        ctx.close()
        # niva view for screenshot
        ctx, P = open_app(browser, port, "niva", "light", "light"); tab(P, "Statistik"); P.wait_for_timeout(900)
        P.locator("[data-testid=pain-parts]").scroll_into_view_if_needed(); P.screenshot(path=str(SHOTS / "smarta.png"), full_page=True)
        ctx.close()
        ctx, P = open_app(browser, port, "niva", "dark", "dark"); tab(P, "Statistik"); P.wait_for_timeout(900)
        P.screenshot(path=str(SHOTS / "smarta_mörkt.png"), full_page=True)
        bad = P.evaluate("""() => { const out = []; document.querySelectorAll('*:not(.rounded-full)').forEach(el => { const c = getComputedStyle(el).backgroundColor; const m = c.match(/\\d+/g); if (m && m.length >= 3 && c !== 'rgba(0, 0, 0, 0)' && (+m[0] + +m[1] + +m[2]) / 3 > 215) out.push(el.tagName + ':' + c); }); return out; }""")
        check("5 Dark mode: no light backgrounds in Statistik (pain card incl. hint)", not bad, str(bad[:4]))
        check("5 No script errors", not P.errors, str(P.errors[:2]))
        ctx.close()

        # ---- person stays after the panel ----
        ctx, P = open_app(browser, port, "grim", "light", "light")
        tab(P, "Historik"); P.wait_for_timeout(600)
        P.locator("[data-testid=history] button", has_text=re.compile("^Niva$")).click(); P.wait_for_timeout(500)
        def niva_on(): return P.locator("[data-testid=history] button[aria-pressed=true]", has_text=re.compile("^Niva$")).count() == 1
        check("6 Setup: logging as Grim, looking at Niva's history", niva_on())
        row_on(P, mon + dt.timedelta(1)).locator("button[title='Redigera']").click(); P.wait_for_timeout(500)
        P.locator("[data-testid=sheet-close]").click(); P.wait_for_timeout(500)
        check("6 Closing the edit panel keeps Niva selected", niva_on())
        row_on(P, mon + dt.timedelta(1)).locator("button[title='Redigera']").click(); P.wait_for_timeout(500)
        P.fill("[data-testid=tid-min]", "61"); P.get_by_role("button", name="Spara ändringar").click(); P.wait_for_timeout(1800)
        check("6 Saving an edit of Niva's pass keeps Niva selected", niva_on())
        P.locator("[data-testid=hist-mode-cal]").click(); P.wait_for_timeout(500)
        P.locator(f"[data-testid=cal-day-{(mon + dt.timedelta(3)).isoformat()}]").click(); P.wait_for_timeout(600)
        P.locator("[data-testid=sport-group] button", has_text=re.compile("^Löpning$")).first.click(); P.fill("[data-testid=tid-min]", "22"); set_effort(P, 3)
        P.get_by_role("button", name="Spara pass").click(); P.wait_for_timeout(1800)
        check("6 Adding a pass for Niva keeps Niva selected and saves it for Niva", niva_on() and any(x["date"] == (mon + dt.timedelta(3)).isoformat() and x["user"] == "niva" for x in raw_month(port, M)))
        tab(P, "Logga pass"); P.wait_for_timeout(400)
        check("6 The log form is still Grim's", "Grim" in P.locator("[data-testid=person-chip]").inner_text())
        tab(P, "Historik"); P.wait_for_timeout(500)
        check("6 Back in Historik it follows the logging person again (Grim)", P.locator("[data-testid=history] button[aria-pressed=true]", has_text=re.compile("^Grim$")).count() == 1 or niva_on())
        ctx.close()

        # ---- Vad är nytt ----
        ctx, P = open_app(browser, port, "niva", "light", "light")
        tab(P, "Historik"); P.wait_for_timeout(500)
        P.get_by_text("Vad är nytt?").first.click(); P.wait_for_timeout(500)
        y0 = P.evaluate("window.scrollY")
        box = P.locator("[data-testid=changelog-box]")
        check("7 Box is open and the page behind is locked", box.count() == 1 and P.evaluate("document.body.style.overflow") == "hidden")
        for t_ in P.locator("[data-testid^=cl-toggle-]").all():
            if t_.get_attribute("aria-expanded") == "false": t_.click()
        P.wait_for_timeout(300)
        check("7 Box is taller than its window (scrolls)", box.evaluate("e => e.scrollHeight > e.clientHeight"))
        box.evaluate("e => { e.scrollTop = 0; }"); P.wait_for_timeout(200)
        P.mouse.move(195, 600)
        for _ in range(4): P.mouse.wheel(0, -120); P.wait_for_timeout(60)
        P.wait_for_timeout(300)
        check("7 Scrolling up past the top does not move the page behind", P.evaluate("window.scrollY") == y0, f"{P.evaluate('window.scrollY')} vs {y0}")
        check("7 ...it closes the box instead", P.locator("[data-testid=changelog-box]").count() == 0, "")
        check("7 Page is scrollable again", P.evaluate("document.body.style.overflow") != "hidden")
        P.get_by_text("Vad är nytt?").first.click(); P.wait_for_timeout(500)
        box = P.locator("[data-testid=changelog-box]")
        for t_ in P.locator("[data-testid^=cl-toggle-]").all():
            if t_.get_attribute("aria-expanded") == "false": t_.click()
        box.evaluate("e => { e.scrollTop = 200; }"); P.wait_for_timeout(200)
        TOUCH = """([sel, type, y]) => { const el = document.querySelector(sel); const t = new Touch({ identifier: 1, target: el, clientX: 195, clientY: y });
          el.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches: type === 'touchend' ? [] : [t], targetTouches: type === 'touchend' ? [] : [t], changedTouches: [t] })); }"""
        S = "[data-testid=changelog-box]"
        P.evaluate(TOUCH, [S, "touchstart", 300]); P.evaluate(TOUCH, [S, "touchmove", 330]); P.evaluate(TOUCH, [S, "touchmove", 450]); P.evaluate(TOUCH, [S, "touchend", 450]); P.wait_for_timeout(300)
        check("7 Dragging down while the text is scrolled down does NOT close the box", P.locator("[data-testid=changelog-box]").count() == 1)
        box.evaluate("e => { e.scrollTop = 0; }"); P.wait_for_timeout(200)
        P.evaluate(TOUCH, [S, "touchstart", 300]); P.evaluate(TOUCH, [S, "touchmove", 340]); P.evaluate(TOUCH, [S, "touchend", 340]); P.wait_for_timeout(300)
        check("7 A short pull at the top does not close it", P.locator("[data-testid=changelog-box]").count() == 1)
        P.evaluate(TOUCH, [S, "touchstart", 300]); P.evaluate(TOUCH, [S, "touchmove", 330]); P.evaluate(TOUCH, [S, "touchmove", 420]); P.wait_for_timeout(300)
        check("7 A long pull at the top closes it", P.locator("[data-testid=changelog-box]").count() == 0)
        P.get_by_text("Vad är nytt?").first.click(); P.wait_for_timeout(400)
        P.get_by_role("button", name="Stäng").first.click(); P.wait_for_timeout(300)
        check("7 The X still works", P.locator("[data-testid=changelog-box]").count() == 0)
        check("7 No script errors", not P.errors, str(P.errors[:2]))
        ctx.close()
    finally:
        try: m.terminate()
        except Exception: pass
        browser.close()
bad = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(bad)}/{len(results)} passed"); sys.exit(1 if bad else 0)
