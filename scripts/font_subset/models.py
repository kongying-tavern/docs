from __future__ import annotations

from dataclasses import dataclass

from .unicode_ranges import CodepointRange


def face_group(script: str, tier: str) -> str:
    """Filename group segment, e.g. "latin" or "cjk.l1"."""
    return f"cjk.{tier}" if script == "cjk" else script


def split_group(group: str) -> tuple[str, str]:
    """Inverse of face_group: "cjk.l1" -> ("cjk", "l1"), "latin" -> ("latin", "full")."""
    if group.startswith("cjk."):
        return "cjk", group[4:]
    return group, "full"


@dataclass(frozen=True)
class FontFace:
    family: str
    file_name: str
    script: str
    tier: str
    ranges: tuple[CodepointRange, ...]

    @property
    def group(self) -> str:
        return face_group(self.script, self.tier)
