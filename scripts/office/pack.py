#!/usr/bin/env python3
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
cmd = ["node", str(ROOT / "scripts" / "office" / "pack.mjs"), *sys.argv[1:]]
sys.exit(subprocess.run(cmd, cwd=ROOT).returncode)
