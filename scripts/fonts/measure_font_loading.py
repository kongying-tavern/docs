"""Measure per-page WOFF2 download cost implied by unicode-range lazy loading.

Parses the generated fonts-subset.css / fonts-standard.css, scans locale
content, and reports which chunks each page would fetch. Stdlib-only; run
`pnpm build:fonts` first so src/public/fonts is populated.
"""

from __future__ import annotations

import re
import statistics
import sys
from collections import defaultdict
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
CSS_FILES = [
    ".vitepress/theme/styles/fonts-subset.css",
    ".vitepress/theme/styles/fonts-standard.css",
]
FONTS_DIR = "src/public/fonts"
LOCALES = ["en", "ja", "zh"]
SCAN_EXTENSIONS = {".md"}

FONT_FACE_RE = re.compile(r"@font-face\s*\{(.*?)\}", re.S)
FAMILY_RE = re.compile(r"font-family: '([^']+)'")
URL_RE = re.compile(r"url\('/fonts/([^']+)'\)")
RANGE_RE = re.compile(r"unicode-range: ([^;]+);")


def parse_range_list(text: str) -> set[int]:
    codepoints: set[int] = set()
    for part in text.split(","):
        part = part.strip()
        if "-" in part[2:]:
            start, end = part[2:].split("-", 1)
            codepoints.update(range(int(start, 16), int(end, 16) + 1))
        else:
            codepoints.add(int(part[2:], 16))
    return codepoints


def parse_faces() -> list[tuple[str, str, set[int]]]:
    faces: list[tuple[str, str, set[int]]] = []
    for css_file in CSS_FILES:
        text = (PROJECT_ROOT / css_file).read_text(encoding="utf-8")
        for block in FONT_FACE_RE.findall(text):
            faces.append(
                (
                    FAMILY_RE.search(block).group(1),  # type: ignore[union-attr]
                    URL_RE.search(block).group(1),  # type: ignore[union-attr]
                    parse_range_list(RANGE_RE.search(block).group(1)),  # type: ignore[union-attr]
                )
            )
    return faces


def page_codepoints(path: Path) -> set[int]:
    return {ord(character) for character in path.read_text(encoding="utf-8")}


def group_of(file_name: str) -> str:
    # sarasa_gothic_sc.cjk.l1.01.<hash>.woff2 -> sarasa_gothic_sc.cjk.l1
    return ".".join(file_name.split(".")[:-3])


def main() -> None:
    faces = parse_faces()
    sizes: dict[str, int] = {}
    for _, file_name, _ in faces:
        path = PROJECT_ROOT / FONTS_DIR / file_name
        if not path.exists():
            sys.exit(f"Missing {path}; run `pnpm build:fonts` first")
        sizes[file_name] = path.stat().st_size

    print("## Chunk inventory\n")
    print("| group | chunks | KiB | min-max KiB |")
    print("| --- | --- | --- | --- |")
    grouped: defaultdict[str, list[str]] = defaultdict(list)
    for _, file_name, _ in faces:
        grouped[group_of(file_name)].append(file_name)
    for group, files in sorted(grouped.items()):
        chunk_sizes = [sizes[file] // 1024 for file in files]
        print(
            f"| {group} | {len(files)} | {sum(chunk_sizes)} | "
            f"{min(chunk_sizes)}-{max(chunk_sizes)} |"
        )

    print("\n## Per-page averages (markdown pages)\n")
    print("| locale | pages | avg files/page | avg KiB/page | pages fetching cjk.* |")
    print("| --- | --- | --- | --- | --- |")
    for locale in LOCALES:
        pages = sorted((PROJECT_ROOT / "src" / locale).rglob("*.md"))
        per_page_files: list[int] = []
        per_page_bytes: list[int] = []
        cjk_pages = 0
        for page in pages:
            codepoints = page_codepoints(page)
            hits = [
                file_name
                for _, file_name, ranges in faces
                if ranges & codepoints
            ]
            per_page_files.append(len(hits))
            per_page_bytes.append(sum(sizes[file] for file in hits))
            if any(".cjk." in file for file in hits):
                cjk_pages += 1
        print(
            f"| {locale} | {len(pages)} | {statistics.mean(per_page_files):.1f} "
            f"| {statistics.mean(per_page_bytes) / 1024:.0f} "
            f"| {cjk_pages}/{len(pages)} |"
        )

    print("\n## Homepage breakdown\n")
    for locale in LOCALES:
        page = PROJECT_ROOT / "src" / locale / "index.md"
        codepoints = page_codepoints(page)
        hits = sorted(
            file_name
            for _, file_name, ranges in faces
            if ranges & codepoints
        )
        total = sum(sizes[file] for file in hits) // 1024
        groups: defaultdict[str, int] = defaultdict(int)
        for file in hits:
            groups[".".join(file.split(".")[1:-3])] += 1
        detail = ", ".join(f"{group}x{count}" for group, count in sorted(groups.items()))
        print(f"- {locale}/: {len(hits)} files, {total} KiB — {detail}")


if __name__ == "__main__":
    main()
