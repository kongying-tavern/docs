from __future__ import annotations

from dataclasses import dataclass

from .unicode_ranges import CodepointRange


@dataclass(frozen=True)
class FontFace:
    family: str
    file_name: str
    tier: str
    ranges: tuple[CodepointRange, ...]
