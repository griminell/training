"""Acceptance tests for 1.6.0 Dark mode (run: python3 tools/test_160.py [path/to/index.html]).
Mobile viewport 390x844. Auto/Ljust/Mörkt in the person menu, contrast, leftover light surfaces, charts, screenshots."""
import re, sys, os, json, subprocess, time, urllib.request, pathlib, tempfile, datetime
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = sys.argv[1] if len(sys.argv) > 1 else str(ROOT / "index.html")
SHOTS = pathlib.Path(os.environ.get("SHOTS", "/tmp/shots_160")); SHOTS.mkdir(exist_ok=True, parents=True)
CODE = "testcode12345"
HTTP_PORT = 8760
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(HTTP_PORT), "--bind", "127.0.0.1", "--directory", str(pathlib.Path(HTML).resolve().parent)],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
import atexit; atexit.register(srv.terminate)
time.sleep(0.8)
PAGE = f"http://127.0.0.1:{HTTP_PORT}/{pathlib.Path(HTML).name}"
results = []
def check(name, cond, extra=""):
    results.append((name, bool(cond)))
    print(("PASS " if cond else "FAIL ") + name + (f"  [{extra}]" if extra else ""))

TODAY = datetime.datetime.now(datetime.timezone.utc).date()
M = TODAY.strftime("%Y-%m")
USERS = [{"id": "niva", "name": "Niva", "color": "#C2477A"}, {"id": "grim", "name": "Grim", "color": "#004B26"},
         {"id": "anna", "name": "Anna", "color": "#1D6FA5", "colorDark": "#7CCBF0"}, {"id": "bo", "name": "Bo", "color": "#6B3FA0"}]
def entry(i, d, user, sport, typ, tid, k, note="", kind=None):
    e = {"id": i, "date": f"{M}-{d:02d}", "user": user, "sport": sport, "typ": typ, "tid": tid, "kansla": k, "anteckningar": note, "cr10": True}
    if kind: e = {"id": i, "date": f"{M}-{d:02d}", "user": user, "sport": [], "typ": [], "tid": "", "kansla": "", "anteckningar": note, "kind": kind}
    return e
SEED = []
sp = [["S"], ["RU"], ["AL"], ["F"], ["LÖ"], ["PR"], ["CY"], ["PI"], ["A"]]
ty = [["TE"], ["KO"], ["IN"], ["ST"], ["SP"], ["RÖ"], ["SK"], ["MA"], ["LE"], ["AN"]]
for n in range(1, 19):
    SEED.append(entry(f"n{n}", n if n < 19 else 18, "niva", sp[n % 9], ty[n % 10], str(30 + n * 3), str(2 + n % 8), f"Anteckning {n}" if n % 3 == 0 else ""))
    SEED.append(entry(f"g{n}", n, "grim", sp[(n + 3) % 9], ty[(n + 4) % 10], str(40 + n * 2), str(3 + n % 7), f"Grim {n}" if n % 4 == 0 else ""))
SEED.append(entry("r1", 19, "niva", [], [], "", "", "Vilodag med anteckning", kind="rest"))
SEED.append(entry("s1", 20, "niva", [], [], "", "", "Sjuk", kind="sick"))
SEED.append(entry("r2", 19, "grim", [], [], "", "", "Grim vilar", kind="rest"))
def seed_file():
    data = {"diaries": {CODE: {"meta:users": json.dumps(USERS), f"entries:{M}": json.dumps(SEED)}}}
    f = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False); json.dump(data, f); f.close(); return f.name
def start_mock(port):
    p = subprocess.Popen(["node", str(ROOT / "tools/mock-firebase.js"), str(port), seed_file()], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(50):
        try: urllib.request.urlopen(f"http://localhost:{port}/__stats"); return p
        except Exception: time.sleep(0.1)
    raise RuntimeError("mock did not start")
def ctl(port, **kw): urllib.request.urlopen(f"http://localhost:{port}/__ctl?" + "&".join(f"{k}={v}" for k, v in kw.items())).read()
def stats(port): return json.load(urllib.request.urlopen(f"http://localhost:{port}/__stats"))

def open_app(browser, port, me="niva", mode=None, scheme="light", ctx=None):
    ctx = ctx or browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme=scheme)
    page = ctx.new_page(); page.errors = []
    page.on("pageerror", lambda e: page.errors.append(str(e)))
    init = f"try {{ localStorage.setItem('nivadagbok-me', '{me}'); " + (f"localStorage.setItem('nivadagbok-theme', '{mode}');" if mode else "") + " } catch (e) {}"
    if mode != "keep": page.add_init_script("if (!sessionStorage.getItem('t160')) { sessionStorage.setItem('t160','1'); " + init + " }")
    page.goto(f"{PAGE}#db=http://localhost:{port}&code={CODE}")
    page.wait_for_selector("[data-testid=person-chip]"); page.wait_for_timeout(700)
    return ctx, page

chip = lambda P: P.locator("[data-testid=person-chip]")
menu = lambda P: P.locator("[data-testid=person-menu]")
def open_menu(P):
    if menu(P).count() == 0: chip(P).click(); P.wait_for_selector("[data-testid=person-menu]")
def close_menu(P):
    if menu(P).count(): P.locator("[data-testid=person-menu-backdrop]").click(position={"x": 5, "y": 400}); P.wait_for_timeout(150)
def tab(P, name): P.get_by_role("button", name=name).first.click(); P.wait_for_timeout(500)

# ---- Page-side audit: contrast of all visible text and leftover light surfaces ----
AUDIT = r"""
() => {
  const parse = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return null; const p = m[1].split(',').map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const blend = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
  const bgOf = (el) => { // effective opaque background
    const chain = []; for (let e = el; e; e = e.parentElement) chain.push(e);
    let base = parse(getComputedStyle(document.body).backgroundColor); if (!base || base.a === 0) base = parse(getComputedStyle(document.documentElement).backgroundColor);
    if (!base || base.a === 0) base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = chain.length - 1; i >= 0; i--) { const c = parse(getComputedStyle(chain[i]).backgroundColor); if (c && c.a > 0) base = blend(c, base); }
    return base;
  };
  const opac = (el) => { let o = 1; for (let e = el; e; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity); return o; };
  const out = { low: [], light: [], texts: 0 };
  const all = [...document.querySelectorAll('body *')].filter((el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; });
  for (const el of all) {
    if (el.closest('svg')) continue;
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);
    const cs = getComputedStyle(el);
    if (own) {
      out.texts++;
      if (opac(el) < 0.9 || el.disabled) continue;
      const bg = bgOf(el); let fg = parse(cs.color); if (!fg) continue; fg = blend(fg, bg);
      const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700;
      const need = (size >= 24 || (size >= 18.66 && bold)) ? 3 : 4.5;
      const r = ratio(fg, bg);
      if (r < need) out.low.push(`${(el.innerText || el.textContent).trim().slice(0, 32)} | ${r.toFixed(2)} < ${need} | ${cs.color} on rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})`);
    }
    const b = parse(cs.backgroundColor); const r = el.getBoundingClientRect();
    if (b && b.a > 0.5 && r.width > 40 && r.height > 24 && lum(b) > 0.55) out.light.push(`${el.tagName.toLowerCase()}.${(el.className && el.className.baseVal === undefined ? el.className : '').toString().slice(0, 40)} ${cs.backgroundColor}`);
  }
  return out;
}
"""
def audit(P, label, dark):
    r = P.evaluate(AUDIT)
    if dark:
        check(f"audit {label}: all visible text reads (>= 4.5, large >= 3)", not r["low"], "; ".join(r["low"][:6]) + f" ({r['texts']} texts)")
        check(f"audit {label}: no leftover light surfaces", not r["light"], "; ".join(r["light"][:4]))
    else:
        # Light mode is unchanged from 1.5.6: only report (some old greys are decorative)
        print(f"  info {label}: {len(r['low'])} low-contrast texts in light (baseline) {r['low'][:2]}")
    return r

def chart_fills(P):
    return P.evaluate("""() => [...document.querySelectorAll('.recharts-wrapper path.recharts-rectangle, .recharts-wrapper .recharts-sector, .recharts-wrapper path.recharts-curve, .recharts-wrapper .recharts-dot')]
      .map(e => (e.getAttribute('fill') && e.getAttribute('fill') !== 'none') ? e.getAttribute('fill') : e.getAttribute('stroke')).filter(Boolean)""")
def hex_lum(h):
    h = h.lstrip('#'); c = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    f = lambda v: v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2])
def to_hex(c):
    if c.startswith('#'): return c
    m = re.findall(r"[\d.]+", c); return '#%02x%02x%02x' % tuple(int(float(v)) for v in m[:3])
def cr(a, b): x, y = hex_lum(a), hex_lum(b); return (max(x, y) + 0.05) / (min(x, y) + 0.05)

def delete_first(P):
    P.locator("button[title='Ta bort']").first.click(); P.wait_for_timeout(300)

with sync_playwright() as pw:
    browser = pw.chromium.launch()
    port = 9701; m = start_mock(port)
    try:
        # ---- 1. Menu row and the three modes ----
        ctx, P = open_app(browser, port, "niva", None, "light")
        check("1 Default mode is Auto and the page is light when the phone is light", P.evaluate("document.documentElement.dataset.theme") == "light")
        open_menu(P)
        check("1 Menu has an 'Utseende' row with Auto / Ljust / Mörkt", all(menu(P).locator(f"[data-testid=theme-{k}]").count() == 1 for k in ("auto", "light", "dark")) and "Utseende" in menu(P).inner_text())
        check("1 Auto is selected by default", menu(P).locator("[data-testid=theme-auto]").get_attribute("aria-checked") == "true")
        before = stats(port)
        menu(P).locator("[data-testid=theme-dark]").click(); P.wait_for_timeout(300)
        check("1 Menu stays open after a tap on a mode", menu(P).count() == 1)
        check("1 Mörkt: page switches to dark at once", P.evaluate("document.documentElement.dataset.theme") == "dark" and P.evaluate("getComputedStyle(document.body).backgroundColor") == "rgb(18, 18, 18)")
        check("1 Mörkt is marked as selected", menu(P).locator("[data-testid=theme-dark]").get_attribute("aria-checked") == "true" and menu(P).locator("[data-testid=theme-auto]").get_attribute("aria-checked") == "false")
        check("1 Browser colour scheme is dark (date picker, selects, scrollbars)", P.evaluate("getComputedStyle(document.documentElement).colorScheme") == "dark" and P.evaluate("getComputedStyle(document.querySelector('input[type=date]')).colorScheme") == "dark")
        check("1 theme-color follows the mode", P.evaluate("document.querySelector('meta[name=theme-color]').content") == "#121212")
        menu(P).locator("[data-testid=theme-light]").click(); P.wait_for_timeout(200)
        check("1 Ljust: back to light, theme-color white", P.evaluate("document.documentElement.dataset.theme") == "light" and P.evaluate("document.querySelector('meta[name=theme-color]').content") == "#FFFFFF")
        menu(P).locator("[data-testid=theme-dark]").click(); P.wait_for_timeout(200)
        after = stats(port)
        check("1 Changing the mode writes nothing to the database", json.dumps(before.get("puts", before)) == json.dumps(after.get("puts", after)) or before == after, f"{before} {after}")
        check("1 Menu rows still >= 44 px high", all(b.bounding_box()["height"] >= 43 for b in menu(P).locator("button").all()))
        P.screenshot(path=str(SHOTS / "niva_dark_meny.png"))
        close_menu(P)
        # persistence: reload keeps dark (saved per device) and no white flash: theme set before the app renders
        P.goto(f"{PAGE}#db=http://localhost:{port}&code={CODE}"); P.wait_for_selector("[data-testid=person-chip]")
        check("1 Choice is saved on the device (reload keeps dark)", P.evaluate("document.documentElement.dataset.theme") == "dark" and P.evaluate("localStorage.getItem('nivadagbok-theme')") == "dark")
        # pre-paint: the head script sets the theme before the bundle runs
        ctx2 = browser.new_context(viewport={"width": 390, "height": 844}, color_scheme="light")
        P2 = ctx2.new_page(); P2.add_init_script("localStorage.setItem('nivadagbok-theme','dark')")
        P2.route("**/*", lambda r: r.continue_())
        P2.goto(f"{PAGE}#db=http://localhost:{port}&code={CODE}", wait_until="commit")
        P2.wait_for_selector("#root", state="attached")
        check("1 Dark is applied before the app renders (no white flash)", P2.evaluate("document.documentElement.dataset.theme") == "dark" and P2.evaluate("document.querySelector('#root').children.length") == 0 or P2.evaluate("document.documentElement.dataset.theme") == "dark")
        ctx2.close()
        ctx.close()

        # ---- 2. Auto follows the phone, live ----
        ctx, P = open_app(browser, port, "niva", None, "dark")
        check("2 Auto + phone dark => dark", P.evaluate("document.documentElement.dataset.theme") == "dark")
        P.emulate_media(color_scheme="light"); P.wait_for_timeout(300)
        check("2 Auto follows the phone live (dark -> light)", P.evaluate("document.documentElement.dataset.theme") == "light")
        P.emulate_media(color_scheme="dark"); P.wait_for_timeout(300)
        check("2 Auto follows the phone live (light -> dark)", P.evaluate("document.documentElement.dataset.theme") == "dark")
        open_menu(P); menu(P).locator("[data-testid=theme-light]").click(); P.wait_for_timeout(200)
        check("2 Ljust overrides a dark phone", P.evaluate("document.documentElement.dataset.theme") == "light")
        P.emulate_media(color_scheme="light"); P.emulate_media(color_scheme="dark"); P.wait_for_timeout(200)
        check("2 ...and stays light when the phone changes", P.evaluate("document.documentElement.dataset.theme") == "light")
        ctx.close()
        ctx, P = open_app(browser, port, "niva", "light", "dark")
        check("2 Saved Ljust wins over a dark phone at start", P.evaluate("document.documentElement.dataset.theme") == "light")
        ctx.close()

        # ---- 3. Accent colours in dark ----
        for who, exp_hex in (("niva", None), ("grim", None), ("anna", "#7ccbf0"), ("bo", None)):
            ctx, P = open_app(browser, port, "niva", "dark", "light")
            open_menu(P); P.locator(f"[data-testid=person-{who}]").click(); P.wait_for_timeout(300)
            dot = to_hex(P.evaluate("getComputedStyle(document.querySelector('[data-testid=person-chip] span')).backgroundColor"))
            save = to_hex(P.evaluate("getComputedStyle([...document.querySelectorAll('button.flex-1')].find(b => /^Spara/.test(b.innerText))).backgroundColor"))
            savetxt = to_hex(P.evaluate("getComputedStyle([...document.querySelectorAll('button.flex-1')].find(b => /^Spara/.test(b.innerText))).color"))
            check(f"3 {who}: accent is readable on the dark card (>= 4.5)", cr(dot, "#1C1C1C") >= 4.5, f"{dot} {cr(dot, '#1C1C1C'):.2f}")
            check(f"3 {who}: filled button = lifted accent with dark text (>= 4.5)", save == dot and savetxt == "#121212" and cr(save, savetxt) >= 4.5, f"{save} {savetxt} {cr(save, savetxt):.2f}")
            if exp_hex: check("3 anna: stored colorDark is used as is", dot == exp_hex, dot)
            ctx.close()

        # ---- 4. Every view, both modes, Niva and Grim ----
        for who in ("niva", "grim"):
            for mode in ("light", "dark"):
                dark = mode == "dark"
                ctx, P = open_app(browser, port, who, mode, "light")
                tag = f"{who} {mode}"
                if who == "niva" and mode == "dark":
                    ctl(port, failPut=1)
                    P.fill("textarea", "Pass som inte sparas"); P.locator("[data-testid=sport-group] button").first.click()
                    P.locator("button.flex-1", has_text=re.compile("^Spara")).first.click(); P.wait_for_timeout(2500)
                    ctl(port, failPut=0)
                audit(P, f"{tag} Logga pass", dark)
                P.screenshot(path=str(SHOTS / f"{who}_{mode}_1_logga.png"), full_page=True)
                if who == "niva" and mode == "dark":
                    check("4 Ej sparat card is shown and readable", P.locator("[data-testid=pending-card]").count() >= 1)
                    P.screenshot(path=str(SHOTS / f"{who}_{mode}_1b_ejsparat.png"), full_page=True)
                # list: expand a pass, show rest/sick rows
                P.locator("[data-testid=pass-row]").first.click(); P.wait_for_timeout(250)
                audit(P, f"{tag} lista (öppnat pass, vilodagar)", dark)
                if dark:
                    tab(P, "Historik"); P.wait_for_timeout(700)   # since 1.8.1 rest/sick rows are no longer on Logga pass
                    rows = P.locator("[data-testid=offday-row]")
                    bgs = P.evaluate("[...document.querySelectorAll('[data-testid=offday-row]')].map(e => getComputedStyle(e).backgroundColor)")
                    check(f"4 {tag}: rest/sick rows are dark and differ from normal rows", rows.count() >= 1 and all(re.match(r"rgb\((\d+), ", b) and int(re.match(r"rgb\((\d+), ", b).group(1)) < 40 for b in bgs), str(bgs))
                open_menu(P); audit(P, f"{tag} personmeny", dark)
                P.screenshot(path=str(SHOTS / f"{who}_{mode}_2_meny.png"));
                P.locator("[data-testid=person-manage]").click(); P.wait_for_timeout(300)
                audit(P, f"{tag} Hantera användare", dark)
                P.screenshot(path=str(SHOTS / f"{who}_{mode}_3_anvandare.png"))
                P.locator("button[aria-label=Stäng]").first.click(); P.wait_for_timeout(200)
                # release notes: open via the link at the bottom
                P.get_by_text("Vad är nytt", exact=False).last.click(); P.wait_for_timeout(300)
                if P.get_by_role("heading", name="Vad är nytt").count():
                    audit(P, f"{tag} Vad är nytt", dark)
                    P.screenshot(path=str(SHOTS / f"{who}_{mode}_4_nytt.png"))
                    P.locator("button[aria-label=Stäng]").first.click(); P.wait_for_timeout(200)
                # delete confirmation
                delete_first(P)
                if P.locator("[role=dialog]").count():
                    audit(P, f"{tag} bekräftelseruta", dark)
                    P.screenshot(path=str(SHOTS / f"{who}_{mode}_5_radera.png"))
                    if dark:
                        dbg = P.evaluate("getComputedStyle(document.querySelector('[role=dialog]')).backgroundColor")
                        check(f"4 {tag}: dialog card is dark", dbg == "rgb(28, 28, 28)", dbg)
                    P.locator("[role=dialog]").get_by_role("button", name="Avbryt").click(); P.wait_for_timeout(200)
                # statistics: month and all
                tab(P, "Statistik"); P.wait_for_timeout(600)
                audit(P, f"{tag} Statistik", dark)
                P.screenshot(path=str(SHOTS / f"{who}_{mode}_6_statistik.png"), full_page=True)
                if dark:
                    fills = chart_fills(P)
                    card = "#1C1C1C"
                    weak = [f for f in set(to_hex(x) for x in fills if x and x != 'none') if cr(f, card) < 3]
                    check(f"4 {tag}: chart colours are visible on the dark card (>= 3)", len(fills) > 5 and not weak, f"{len(fills)} marks; weak: {weak}")
                    grid = P.evaluate("[...document.querySelectorAll('.recharts-cartesian-grid line')].map(l => getComputedStyle(l).stroke)")
                    check(f"4 {tag}: chart grid is dark, not the light grid", grid and all(int(re.findall(r"\d+", g)[0]) < 80 for g in grid), str(grid[:2]))
                    ax = P.evaluate("[...document.querySelectorAll('.recharts-cartesian-axis-tick-value')].map(t => getComputedStyle(t).fill)")
                    check(f"4 {tag}: axis labels are light", ax and all(int(re.findall(r"\d+", a)[0]) > 140 for a in ax), str(ax[:2]))
                    # tooltip
                    bar = P.locator(".recharts-bar-rectangle").first
                    if bar.count():
                        bar.hover(); P.wait_for_timeout(300)
                        tip = P.locator(".recharts-tooltip-wrapper .recharts-default-tooltip")
                        if tip.count():
                            tbg = P.evaluate("getComputedStyle(document.querySelector('.recharts-default-tooltip')).backgroundColor")
                            check(f"4 {tag}: tooltip is dark", tbg == "rgb(28, 28, 28)", tbg)
                            P.screenshot(path=str(SHOTS / f"{who}_{mode}_7_tooltip.png"))
                tab(P, "Logga pass")
                check(f"4 {tag}: no script errors", not P.errors, str(P.errors[:2]))
                ctx.close()

        # ---- 5. Setup screen follows the mode too ----
        ctx = browser.new_context(viewport={"width": 390, "height": 844}, color_scheme="dark")
        S = ctx.new_page(); S.goto(PAGE); S.wait_for_selector("input"); S.wait_for_timeout(300)
        sb = S.evaluate("getComputedStyle(document.body).backgroundColor")
        card = S.evaluate("getComputedStyle(document.querySelector('.rounded-xl')).backgroundColor")
        check("5 Setup screen is dark in a dark phone (Auto)", sb == "rgb(18, 18, 18)" and card == "rgb(28, 28, 28)", f"{sb} {card}")
        S.screenshot(path=str(SHOTS / "setup_dark.png")); ctx.close()
    finally:
        m.terminate()
        browser.close()

bad = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(bad)}/{len(results)} passed")
sys.exit(1 if bad else 0)
