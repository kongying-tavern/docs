from __future__ import annotations

import json
from collections.abc import Iterable, Set
from pathlib import Path

from .config import CharacterData, ChunkingConfig, SiteCharacterConfig

CodepointRange = tuple[int, int]


def text_codepoints(text: str) -> set[int]:
    return {ord(character) for character in text}


def expand_ranges(ranges: tuple[CodepointRange, ...]) -> set[int]:
    return {codepoint for start, end in ranges for codepoint in range(start, end + 1)}


def to_ranges(codepoints: Iterable[int]) -> tuple[CodepointRange, ...]:
    ranges: list[list[int]] = []
    for codepoint in sorted(codepoints):
        if ranges and codepoint == ranges[-1][1] + 1:
            ranges[-1][1] = codepoint
        else:
            ranges.append([codepoint, codepoint])
    return tuple((start, end) for start, end in ranges)


def ranges_to_css(ranges: tuple[CodepointRange, ...]) -> str:
    return ", ".join(
        f"U+{start:X}" if start == end else f"U+{start:X}-{end:X}"
        for start, end in ranges
    )


def read_site_codepoints(
    path: Path,
    config: SiteCharacterConfig,
    font_stems: set[str],
) -> dict[str, set[int]]:
    document = json.loads(path.read_text(encoding="utf-8"))
    if document.get("version") != 1 or not isinstance(document.get("fonts"), dict):
        raise ValueError("Invalid site character file")
    if set(document["fonts"]) != font_stems:
        raise ValueError("Site character file does not match the font configuration")

    extras = set(config.extra_codepoints)
    extras.update(expand_ranges(config.extra_ranges))
    result: dict[str, set[int]] = {}
    for font_stem, text in document["fonts"].items():
        if not isinstance(text, str):
            raise ValueError(f"Site characters for {font_stem} must be a string")
        codepoints = text_codepoints(text) | extras
        result[font_stem] = {
            codepoint
            for codepoint in codepoints
            if codepoint >= config.minimum_codepoint
            and not any(
                start <= codepoint <= end for start, end in config.excluded_ranges
            )
        }
    return result


def _rebalance_tail(chunks: list[list[int]], target_size: int) -> None:
    if len(chunks) > 1 and len(chunks[-1]) < target_size // 2:
        tail = chunks[-2] + chunks[-1]
        midpoint = (len(tail) + 1) // 2
        chunks[-2:] = [tail[:midpoint], tail[midpoint:]]


def _balanced_chunks(ordered: list[int], target_size: int) -> list[list[int]]:
    chunks = [
        ordered[index : index + target_size]
        for index in range(0, len(ordered), target_size)
    ]
    _rebalance_tail(chunks, target_size)
    return chunks


def chunk_site_codepoints(
    codepoints: set[int],
    config: ChunkingConfig,
    character_data: CharacterData,
) -> list[list[int]]:
    """Order site characters by frequency so text with only common characters
    fetches the earliest chunks: Google's slicing omits the ultra-common base
    set from its buckets, then buckets run highest-to-lowest priority."""
    bucket_union = set().union(*character_data.priority_buckets)
    l1 = set(character_data.levels["l1"])
    remaining = set(codepoints)
    base = sorted((remaining & l1) - bucket_union)
    ordered: list[int] = list(base)
    remaining -= set(base)
    for bucket in character_data.priority_buckets:
        hit = sorted(bucket & remaining)
        if hit:
            ordered.extend(hit)
            remaining -= bucket
    ordered.extend(sorted(remaining))
    return _balanced_chunks(ordered, config.site_characters_per_chunk)


def chunk_full_codepoints(
    codepoints: Iterable[int],
    config: ChunkingConfig,
) -> list[list[int]]:
    """Chunk full-coverage script tiers that ignore Google slicing buckets."""
    return _balanced_chunks(sorted(codepoints), config.standard_characters_per_chunk)


def chunk_standard_codepoints(
    tier_name: str,
    ordered_codepoints: tuple[int, ...],
    supported: Set[int],
    character_data: CharacterData,
    config: ChunkingConfig,
) -> list[list[int]]:
    ordered = [codepoint for codepoint in ordered_codepoints if codepoint in supported]
    wanted = set(ordered)
    covered: set[int] = set()
    units: list[list[int]] = []

    for bucket in character_data.priority_buckets:
        intersection = sorted(bucket & wanted)
        if intersection:
            units.append(intersection)
            covered.update(intersection)

    fallback = [codepoint for codepoint in ordered if codepoint not in covered]
    if tier_name == "l1":
        # Google's proto omits a small shared base set of common Han characters.
        if fallback:
            units.insert(0, fallback)
        fallback = []

    target_size = config.standard_characters_per_chunk
    chunks: list[list[int]] = []
    current: list[int] = []
    for unit in units:
        if len(unit) > target_size:
            raise ValueError(
                f"Google slicing bucket exceeds the chunk target: {len(unit)} characters"
            )
        if current and len(current) + len(unit) > target_size:
            chunks.append(current)
            current = []
        current.extend(unit)

    for codepoint in fallback:
        if len(current) >= target_size:
            chunks.append(current)
            current = []
        current.append(codepoint)
    if current:
        chunks.append(current)

    _rebalance_tail(chunks, target_size)

    flattened = [codepoint for chunk in chunks for codepoint in chunk]
    if len(flattened) != len(set(flattened)) or set(flattened) != wanted:
        raise ValueError(f"Incomplete Google slicing mapping for {tier_name}")
    return chunks
