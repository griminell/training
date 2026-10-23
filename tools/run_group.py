#!/usr/bin/env python3
"""Runs a group of acceptance tests one after another (they share ports, so never in parallel).
A failing test is run once more; a test that only passes the second time is reported as FLAKY
but does not fail the group. Usage: python3 tools/run_group.py 150 151 152
Exit code 1 when any test still fails after the retry."""
import subprocess, sys, pathlib, re, time

TOOLS = pathlib.Path(__file__).resolve().parent

def run_one(num):
    t0 = time.time()
    p = subprocess.run([sys.executable, str(TOOLS / f"test_{num}.py")], capture_output=True, text=True, timeout=900)
    out = p.stdout + p.stderr
    fails = [l for l in out.splitlines() if l.startswith("FAIL") or "Traceback" in l or "Error:" in l]
    m = re.search(r"(\d+)/(\d+) passed", out)
    ok = p.returncode == 0 and m is not None and m.group(1) == m.group(2)
    return ok, (m.group(0) if m else "no result"), fails, out, round(time.time() - t0)

summary, failed = [], []
for num in sys.argv[1:]:
    ok, res, fails, out, secs = run_one(num)
    status = "PASS"
    if not ok:
        print(f"::group::test_{num} first attempt failed"); print(out[-6000:]); print("::endgroup::")
        ok, res, fails, out, secs2 = run_one(num)
        secs += secs2
        status = "FLAKY" if ok else "FAIL"
    summary.append(f"{status:5} test_{num}  {res}  ({secs}s)")
    print(summary[-1], flush=True)
    if not ok:
        failed.append(num); print(out[-6000:])
print("\n" + "\n".join(summary))
sys.exit(1 if failed else 0)
