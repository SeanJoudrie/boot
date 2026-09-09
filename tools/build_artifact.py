#!/usr/bin/env python3
"""Flatten the site into one self-contained file for publishing as an Artifact.

Artifacts are wrapped in <!doctype html><head>..</head><body> at publish time,
so the output carries no doctype/html/head/body of its own -- just <title>,
the font <link>s, <style>, the markup, and one <script> with everything inlined.

Run:  python3 tools/build_artifact.py   ->  dist/basic.html
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "dist", "basic.html")

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
         'family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;500;600&'
         'family=Newsreader:opsz,wght@6..72,400;6..72,600&display=swap">')


def read(*parts):
    with open(os.path.join(ROOT, *parts), encoding="utf-8") as fh:
        return fh.read()


def safe(js):
    """Keep an inline <script> from being closed early by its own contents."""
    return js.replace("</", "<\\/")


def main():
    html = read("index.html")

    m = re.search(r"<body[^>]*>(.*)</body>", html, re.S)
    if not m:
        sys.exit("could not find <body> in index.html")
    body = m.group(1)

    # the external <script src> tags become one inlined bundle
    body = re.sub(r'\s*<script src="[^"]+"></script>', "", body).strip()

    bundle = "\n".join([
        safe(read("data", "entries.js")),
        safe(read("data", "questions.js")),
        safe(read("data", "passages.js")),
        safe(read("data", "art.js")),
        safe(read("assets", "app.js")),
    ])

    out = "\n".join([
        "<title>Basic — a boot camp journal</title>",
        FONTS,
        "<style>",
        read("assets", "style.css").rstrip(),
        "</style>",
        "",
        body,
        "",
        "<script>",
        bundle,
        "</script>",
        "",
    ])

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(out)

    kb = len(out.encode("utf-8")) / 1024
    print("wrote %s  (%.0f KB)" % (OUT, kb))
    import re as _re
    for bad in ("<!doctype", "<html", "<head", "<body"):
        # word boundary, so <header> and .sheet-head don't trip the check
        if _re.search(_re.escape(bad) + r"[\s>]", out, _re.I):
            print("  WARNING: output contains a bare %s tag" % bad)
    if kb > 16000:
        sys.exit("over the 16MB artifact limit")


if __name__ == "__main__":
    main()
