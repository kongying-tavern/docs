#!/usr/bin/env python3
"""Generate and validate deterministic unicode-ranged WOFF2 subsets."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from font_subset.config import load_manifest
from font_subset.pipeline import FontSubsetPipeline
from font_subset.unicode_ranges import read_site_codepoints


def _sha256(value: str) -> str:
    if len(value) != 64 or any(
        character not in "0123456789abcdef" for character in value
    ):
        raise argparse.ArgumentTypeError("must be a lowercase SHA-256 digest")
    return value


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--manifest",
        required=True,
        type=Path,
        help="normalized font build manifest created by scripts/buildFonts.ts",
    )
    parser.add_argument(
        "--site-chars",
        required=True,
        type=Path,
        help="UTF-8 file containing characters extracted from site sources",
    )
    parser.add_argument(
        "--standard-hash",
        required=True,
        type=_sha256,
        help="SHA-256 of standard-tier inputs, embedded in the standard CSS",
    )
    parser.add_argument(
        "--site-hash",
        required=True,
        type=_sha256,
        help="SHA-256 of site-specific inputs, embedded in the site CSS",
    )
    parser.add_argument(
        "--reuse-standard",
        action="store_true",
        help="reuse validated L1/L2/L3 WOFF2 files from the configured output",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    config = load_manifest(args.manifest)
    site_codepoints = read_site_codepoints(
        args.site_chars,
        config.site_characters,
        {font.file_stem for font in config.fonts},
    )
    FontSubsetPipeline(config).run(
        site_codepoints,
        args.standard_hash,
        args.site_hash,
        args.reuse_standard,
    )
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as error:
        print(f"[fonts:subset] error: {error}", file=sys.stderr)
        sys.exit(1)
