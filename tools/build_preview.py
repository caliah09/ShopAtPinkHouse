#!/usr/bin/env python3
"""Flatten the site into one self-contained HTML file.

The multi-file version under assets/ is the real site. This produces a single
file with the CSS, JS and every SVG inlined, for hosts that will only take one
file (and for emailing someone a preview that just works offline).

    python3 tools/build_preview.py           -> preview.html
    python3 tools/build_preview.py out.html
"""

import base64
import re
import sys
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent.parent


def data_uri(path: Path) -> str:
    raw = path.read_bytes()
    if path.suffix.lower() == ".svg":
        # Percent-encode the lot rather than hand-picking characters. These
        # URIs get embedded in HTML attributes, CSS url() and JS string
        # literals, so leaving any quote unencoded breaks one of the three.
        txt = re.sub(r"\s+", " ", raw.decode("utf-8")).strip()
        return "data:image/svg+xml," + quote(txt, safe="")
    mime = {
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
        ".webp": "image/webp", ".gif": "image/gif", ".avif": "image/avif",
    }.get(path.suffix.lower(), "application/octet-stream")
    return f"data:{mime};base64," + base64.b64encode(raw).decode("ascii")


def inline_assets(text: str, base_dir: Path = ROOT) -> str:
    """Rewrite every local asset path in a string to a data URI.

    Paths are matched whether they're root-relative (`assets/img/...`, as used
    from HTML and JS) or file-relative (`../img/...`, as CSS must use since a
    stylesheet resolves `url()` against its own folder, not the page's). Each
    match resolves against `base_dir` -- pass the file's own directory when
    inlining a CSS/JS file so file-relative paths land correctly.
    """
    def sub(m):
        quote, rel = m.group(1), m.group(2)
        path = (base_dir / rel).resolve()
        if not path.is_file():
            print(f"  ! missing {rel}", file=sys.stderr)
            return m.group(0)
        return f"{quote}{data_uri(path)}{quote}"

    pattern = r"(['\"])((?:\.\./|assets/)img/[^'\"]+\.(?:svg|png|jpe?g|webp|gif|avif))\1"
    return re.sub(pattern, sub, text)


def expand_path_constants(js: str) -> str:
    """Fold `IMG + 'file.svg'` into one literal so the inliner can see it.

    catalog.js builds its image paths from a shared prefix constant, which is
    good for editing and invisible to a regex that only matches whole quoted
    paths. Resolve the concatenation first.
    """
    for name, prefix in re.findall(r"var\s+(\w+)\s*=\s*'(assets/[^']*)';", js):
        js = re.sub(r"\b" + name + r"\s*\+\s*'([^']+)'",
                    lambda m: f"'{prefix}{m.group(1)}'", js)
    return js


def main():
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "preview.html"
    html = (ROOT / "index.html").read_text()

    css_path = ROOT / "assets/css/site.css"
    css = inline_assets(css_path.read_text(), base_dir=css_path.parent)
    html = html.replace(
        '<link rel="stylesheet" href="assets/css/site.css">',
        "<style>\n" + css + "\n</style>",
    )

    for src in ("assets/js/catalog.js", "assets/js/site.js"):
        js = inline_assets(expand_path_constants((ROOT / src).read_text()))
        # </script> inside a string literal would close the tag early
        js = js.replace("</script>", "<\\/script>")
        html = html.replace(f'<script src="{src}"></script>',
                            "<script>\n" + js + "\n</script>")

    html = inline_assets(html)

    # a bare directory constant may survive expansion; only files matter
    left = [m for m in re.findall(r"['\"](?:\.\./|assets/)[^'\"]+['\"]", html)
            if not m.rstrip("'\"").endswith("/")]
    if left:
        print(f"  ! {len(left)} unresolved asset reference(s): {left[:3]}",
              file=sys.stderr)

    out.write_text(html)
    print(f"wrote {out} ({out.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
