#!/usr/bin/env python3
"""Bygger index.html av källkoden i src/. / Builds index.html from src/.
Kör: npm install && python3 build.py"""
import subprocess, base64, pathlib
root = pathlib.Path(__file__).parent
bin_ = root / "node_modules" / ".bin"
def run(*a): subprocess.run([str(x) for x in a], cwd=root, check=True)

run(bin_/"tailwindcss", "-c", "tailwind.config.js", "-i", "src/styles.css", "-o", "build/app.css", "--minify")
run(bin_/"esbuild", "src/main.jsx", "--bundle", "--minify", "--format=iife",
    "--loader:.jsx=jsx", "--define:process.env.NODE_ENV=\"production\"", "--outfile=build/app.js")

css = (root/"build/app.css").read_text()
js = (root/"build/app.js").read_text().replace("</script", "<\\/script")
ic = base64.b64encode((root/"icon.png").read_bytes()).decode()
html = f'''<!doctype html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Träningsdagbok</title><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Träningsdagbok"><meta name="apple-mobile-web-app-status-bar-style" content="default"><meta name="color-scheme" content="light dark"><meta name="theme-color" content="#ffffff"><script>(function(){{try{{var m=localStorage.getItem("nivadagbok-theme");var d=m==="dark"||(m!=="light"&&window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.dataset.theme=d?"dark":"light";r.style.colorScheme=d?"dark":"light";if(d){{var t=document.querySelector('meta[name=theme-color]');if(t)t.setAttribute("content","#121212");}}}}catch(e){{}}}})();</script><link rel="apple-touch-icon" sizes="512x512" href="data:image/png;base64,{ic}"><link rel="icon" href="data:image/png;base64,{ic}"><meta name="robots" content="noindex"><style>{css}</style></head><body><div id="root"></div><script>{js}</script></body></html>'''
(root/"index.html").write_text(html)
print("index.html:", len(html), "bytes")
