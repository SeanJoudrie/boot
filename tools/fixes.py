"""Voice-to-text correction layer.

Rules live in source/fixes.txt and are applied to produce the "Cleaned"
reading mode. The raw journal is never modified.
"""
import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "source", "fixes.txt")
SEP = "|||"


def load_rules():
    rules = []
    with open(SRC, encoding="utf-8") as fh:
        for lineno, line in enumerate(fh, 1):
            line = line.strip()
            if not line or line.startswith("#") or SEP not in line:
                continue
            pat, rep = line.split(SEP, 1)
            pat, rep = pat.strip(), rep.strip()
            try:
                rules.append((lineno, re.compile(pat), rep, pat))
            except re.error as exc:
                raise SystemExit("fixes.txt line %d: bad regex %r (%s)"
                                 % (lineno, pat, exc))
    return rules


def apply(text, rules, log=None):
    """Return corrected text. Appends (rule, before, after) tuples to log."""
    out = text
    for lineno, rx, rep, pat in rules:
        if not rx.search(out):
            continue
        if log is not None:
            for m in rx.finditer(out):
                a = max(0, m.start() - 42)
                log.append({
                    "rule": pat,
                    "to": rep,
                    "line": lineno,
                    "hit": m.group(0),
                    "context": out[a:m.end() + 42].replace("\n", " "),
                })
        out = rx.sub(rep, out)
    return out
