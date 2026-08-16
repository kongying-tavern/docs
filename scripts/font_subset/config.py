from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[2]

_UNICODE_SET_PART = re.compile(r"^U\+([0-9A-Fa-f]+)(?:-([0-9A-Fa-f]+))?$")


def parse_unicode_set(text: str) -> frozenset[int]:
    """Parse VitePress-style range lists like "U+0000-00FF, U+0131"."""
    codepoints: set[int] = set()
    for part in text.split(","):
        part = part.strip()
        match = _UNICODE_SET_PART.match(part)
        if not match:
            raise ValueError(f"Invalid Unicode set entry: {part!r}")
        start = int(match.group(1), 16)
        end = int(match.group(2), 16) if match.group(2) else start
        if start > end or end > 0x10FFFF:
            raise ValueError(f"Invalid Unicode range: {part!r}")
        codepoints.update(range(start, end + 1))
    return frozenset(codepoints)


@dataclass(frozen=True)
class FontSpec:
    family: str
    css_family: str
    file_stem: str
    source_file: str
    script_tiers: tuple[str, ...]
    standard_tiers: tuple[str, ...]


@dataclass(frozen=True)
class CssConfig:
    public_font_path: str
    font_style: str
    font_weight: int
    font_display: str
    local_fallback: str


@dataclass(frozen=True)
class ChunkingConfig:
    site_characters_per_chunk: int
    standard_characters_per_chunk: int


@dataclass(frozen=True)
class SiteCharacterConfig:
    minimum_codepoint: int
    excluded_ranges: tuple[tuple[int, int], ...]
    extra_ranges: tuple[tuple[int, int], ...]
    extra_codepoints: frozenset[int]


@dataclass(frozen=True)
class CharacterData:
    levels: dict[str, tuple[int, ...]]
    priority_buckets: tuple[frozenset[int], ...]


@dataclass(frozen=True)
class FontSubsetConfig:
    fonts_dir: Path
    site_css_file: Path
    standard_css_file: Path
    source_dir: Path
    output_extension: str
    output_format: str
    file_hash_length: int
    chunking: ChunkingConfig
    css: CssConfig
    site_characters: SiteCharacterConfig
    fonts: tuple[FontSpec, ...]
    characters: CharacterData
    scripts: dict[str, frozenset[int]]

    def source_path(self, spec: FontSpec) -> Path:
        path = (self.source_dir / spec.source_file).resolve()
        if not path.is_relative_to(self.source_dir):
            raise ValueError(
                f"Source font escapes its configured directory: {spec.source_file}"
            )
        return path


def _project_path(value: str) -> Path:
    path = (PROJECT_ROOT / value).resolve()
    if path == PROJECT_ROOT or not path.is_relative_to(PROJECT_ROOT):
        raise ValueError(f"Configured path must stay below the project root: {value}")
    return path


def _ranges(values: list[list[int]]) -> tuple[tuple[int, int], ...]:
    ranges = tuple((start, end) for start, end in values)
    if any(start < 0 or end > 0x10FFFF or start > end for start, end in ranges):
        raise ValueError("siteCharacters contains an invalid Unicode range")
    return ranges


def _read_characters(value: dict[str, Any]) -> CharacterData:
    expected_sizes = value["expectedLevelSizes"]
    raw_levels = value["levels"]
    level_names = ("l1", "l2", "l3")

    levels: dict[str, tuple[int, ...]] = {}
    level_sets: dict[str, set[int]] = {}
    for name in level_names:
        ordered = tuple(ord(character) for character in raw_levels[name])
        codepoints = set(ordered)
        if len(ordered) != len(codepoints):
            raise ValueError(f"characters.levels.{name} contains duplicate characters")
        if len(codepoints) != expected_sizes[name]:
            raise ValueError(
                f"{name.upper()} must contain {expected_sizes[name]} characters; "
                f"found {len(codepoints)}"
            )
        levels[name] = ordered
        level_sets[name] = codepoints

    for index, left in enumerate(level_names):
        for right in level_names[index + 1 :]:
            overlap = level_sets[left] & level_sets[right]
            if overlap:
                raise ValueError(
                    f"{left.upper()} and {right.upper()} overlap by "
                    f"{len(overlap)} characters"
                )

    standard = set().union(*level_sets.values())
    seen: set[int] = set()
    buckets: list[frozenset[int]] = []
    for index, text in enumerate(value["priorityBuckets"], 1):
        bucket = {ord(character) for character in text}
        if not text or len(text) != len(bucket):
            raise ValueError(
                f"Google slicing bucket {index} is empty or contains duplicates"
            )
        if not bucket <= standard:
            raise ValueError(
                f"Google slicing bucket {index} contains non-standard characters"
            )
        overlap = seen & bucket
        if overlap:
            raise ValueError(
                f"Google slicing buckets overlap by {len(overlap)} characters"
            )
        seen.update(bucket)
        buckets.append(frozenset(bucket))
    if not buckets:
        raise ValueError("Google slicing buckets must not be empty")
    return CharacterData(levels, tuple(buckets))


def _read_scripts(value: list[dict[str, str]]) -> dict[str, frozenset[int]]:
    """Deduplicate overlapping sets: earlier sets win, matching CSS face order."""
    scripts: dict[str, frozenset[int]] = {}
    claimed: set[int] = set()
    for entry in value:
        name = entry["name"]
        if name in scripts:
            raise ValueError(f"Duplicate script set: {name}")
        raw = parse_unicode_set(entry["ranges"])
        unique = raw - claimed
        if not unique:
            raise ValueError(f"Script set {name} is fully covered by earlier sets")
        claimed.update(raw)
        scripts[name] = frozenset(unique)
    return scripts


def load_manifest(path: Path) -> FontSubsetConfig:
    document = json.loads(path.read_text(encoding="utf-8"))
    if document.get("version") != 2:
        raise ValueError("Font build manifest version must be 2")

    paths = document["paths"]
    chunking = document["chunking"]
    css = document["css"]
    site_characters = document["siteCharacters"]
    scripts = _read_scripts(document["scripts"])
    fonts = tuple(
        FontSpec(
            family=value["family"],
            css_family=value["cssFamily"],
            file_stem=value["fileStem"],
            source_file=value["sourceFile"],
            script_tiers=tuple(value["scriptTiers"]),
            standard_tiers=tuple(value["standardTiers"]),
        )
        for value in document["fonts"]
    )
    for spec in fonts:
        unknown = set(spec.script_tiers) - scripts.keys()
        if unknown:
            raise ValueError(
                f"{spec.family} references unknown script sets: "
                f"{', '.join(sorted(unknown))}"
            )

    config = FontSubsetConfig(
        fonts_dir=_project_path(paths["fontsDir"]),
        site_css_file=_project_path(paths["siteCssFile"]),
        standard_css_file=_project_path(paths["standardCssFile"]),
        source_dir=_project_path(paths["sourceDir"]),
        output_extension=document["output"]["extension"],
        output_format=document["output"]["format"],
        file_hash_length=document["fileHashLength"],
        chunking=ChunkingConfig(
            site_characters_per_chunk=chunking["siteCharactersPerChunk"],
            standard_characters_per_chunk=chunking["standardCharactersPerChunk"],
        ),
        css=CssConfig(
            public_font_path=css["publicFontPath"].rstrip("/"),
            font_style=css["fontStyle"],
            font_weight=css["fontWeight"],
            font_display=css["fontDisplay"],
            local_fallback=css["localFallback"],
        ),
        site_characters=SiteCharacterConfig(
            minimum_codepoint=site_characters["minimumCodepoint"],
            excluded_ranges=_ranges(site_characters["excludedRanges"]),
            extra_ranges=_ranges(site_characters["extraRanges"]),
            extra_codepoints=frozenset(site_characters["extraCodepoints"]),
        ),
        fonts=fonts,
        characters=_read_characters(document["characters"]),
        scripts=scripts,
    )
    if config.fonts_dir == config.source_dir:
        raise ValueError("Font output and source directories must be different")
    return config
