from __future__ import annotations

import hashlib
from functools import cache
from pathlib import Path

from fontTools.subset import Options, Subsetter, load_font, save_font
from fontTools.ttLib import TTFont


@cache
def source_codepoints(path: Path) -> frozenset[int]:
    """Read a font cmap once per process; font inputs are immutable during a run."""
    with TTFont(path, lazy=True) as font:
        cmap = font.getBestCmap()
        return frozenset(cmap) if cmap else frozenset()


def subset_chunk(source: Path, codepoints: set[int], output: Path) -> None:
    options = Options()
    options.flavor = "woff2"
    options.hinting = False
    options.name_IDs = ["*"]
    options.harfbuzz_repacker = False

    subsetter = Subsetter(options=options)
    subsetter.populate(unicodes=codepoints)
    font = load_font(str(source), options)
    try:
        subsetter.subset(font)
        save_font(font, str(output), options)
    finally:
        font.close()


def content_hash(path: Path, length: int) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:length]
