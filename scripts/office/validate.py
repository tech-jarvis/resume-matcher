#!/usr/bin/env python3
"""Wrapper: runs Node validator (works on Vercel CI without Python deps)."""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
node_script = ROOT / "scripts" / "office" / "validate.mjs"

if len(sys.argv) < 2:
    print("Usage: python scripts/office/validate.py <file.docx>", file=sys.stderr)
    sys.exit(1)

result = subprocess.run(["node", str(node_script), sys.argv[1]], cwd=ROOT)
sys.exit(result.returncode)
