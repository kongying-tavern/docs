from __future__ import annotations

import re
import shutil
from collections import defaultdict
from pathlib import Path
from tempfile import TemporaryDirectory

from .config import FontSpec, FontSubsetConfig
from .font_io import content_hash, source_codepoints, subset_chunk
from .models import FontFace, face_group, split_group
from .outputs import commit_outputs, validate_outputs, write_css_files
from .unicode_ranges import (
    chunk_full_codepoints,
    chunk_site_codepoints,
    chunk_standard_codepoints,
    expand_ranges,
    to_ranges,
)


class FontSubsetPipeline:
    def __init__(self, config: FontSubsetConfig) -> None:
        self.config = config
        stems = "|".join(re.escape(spec.file_stem) for spec in config.fonts)
        legacy_stems = "|".join(
            re.escape(spec.file_stem.replace("_", "-")) for spec in config.fonts
        )
        scripts = "|".join(re.escape(name) for name in config.scripts)
        cjk_tiers = "|".join(
            sorted(
                {
                    "min",
                    *(tier for spec in config.fonts for tier in spec.standard_tiers),
                }
            )
        )
        hash_length = config.file_hash_length
        extension = re.escape(config.output_extension)
        self.generated_font_pattern = re.compile(
            rf"^(?P<stem>{stems})\."
            rf"(?P<group>cjk\.(?:{cjk_tiers})|{scripts})\."
            rf"(?P<index>\d{{2}})\."
            rf"(?P<hash>[0-9a-f]{{{hash_length}}})\.{extension}$"
        )
        self.managed_font_pattern = re.compile(
            # [._] matches both current dot-separated and legacy underscore names.
            rf"^(?:{stems})[._].*\.{extension}$"
            rf"|^(?:{legacy_stems})-.*\.{extension}$"
        )
        self.specs_by_stem = {spec.file_stem: spec for spec in config.fonts}
        self.script_ranges_union = frozenset(
            codepoint for ranges in config.scripts.values() for codepoint in ranges
        )

    def run(
        self,
        site_codepoints: dict[str, set[int]],
        standard_hash: str,
        site_hash: str,
        reuse_standard: bool,
    ) -> None:
        self._validate_sources()
        fonts_dir = self.config.fonts_dir
        fonts_dir.parent.mkdir(parents=True, exist_ok=True)

        with TemporaryDirectory(prefix=".font-subset-", dir=fonts_dir.parent) as temp:
            staging_root = Path(temp)
            staging_fonts = staging_root / "fonts"
            staging_fonts.mkdir()

            if reuse_standard:
                standard_faces = self._reuse_standard_fonts(staging_fonts)
                standard_action = "reused standard tiers"
            else:
                standard_faces = [
                    face
                    for spec in self.config.fonts
                    for face in self._build_standard_font(spec, staging_fonts)
                ]
                standard_action = "rebuilt standard tiers"
            self._validate_standard_coverage(standard_faces)

            min_faces = [
                face
                for spec in self.config.fonts
                for face in self._build_min_font(
                    spec,
                    site_codepoints[spec.file_stem],
                    staging_fonts,
                )
            ]
            faces = self._order_faces(min_faces, standard_faces)
            self._print_summary(faces, staging_fonts)
            validate_outputs(
                self.config,
                faces,
                staging_fonts,
                self.generated_font_pattern,
            )

            staged_site_css = staging_root / "fonts-subset.css"
            staged_standard_css = staging_root / "fonts-standard.css"
            write_css_files(
                self.config,
                faces,
                standard_hash,
                site_hash,
                staged_site_css,
                staged_standard_css,
            )
            commit_outputs(
                self.config,
                staging_root,
                staged_site_css,
                staged_standard_css,
                self.managed_font_pattern,
            )

        site_summary = ", ".join(
            f"{font}={len(codepoints)}" for font, codepoints in site_codepoints.items()
        )
        print(
            f"[fonts:subset] completed: {standard_action}; "
            f"site characters: {site_summary}; "
            f"published {len(faces)} unicode-range chunks"
        )

    def _validate_sources(self) -> None:
        missing = [
            spec.source_file
            for spec in self.config.fonts
            if not self.config.source_path(spec).exists()
        ]
        if missing:
            raise FileNotFoundError(f"Missing source fonts: {', '.join(missing)}")

    def _build_tier(
        self,
        spec: FontSpec,
        script: str,
        tier: str,
        chunks: list[list[int]],
        staging_fonts: Path,
    ) -> list[FontFace]:
        group = face_group(script, tier)
        faces: list[FontFace] = []
        for index, codepoints in enumerate(chunks, 1):
            provisional = staging_fonts / (
                f".{spec.file_stem}.{group}.{index:02d}."
                f"{self.config.output_extension}"
            )
            subset_chunk(self.config.source_path(spec), set(codepoints), provisional)
            output_codepoints = source_codepoints(provisional)
            missing = set(codepoints) - output_codepoints
            if missing:
                raise ValueError(
                    f"{spec.family} {group}-{index:02d} "
                    f"is missing {len(missing)} requested glyphs"
                )
            digest = content_hash(provisional, self.config.file_hash_length)
            file_name = (
                f"{spec.file_stem}.{group}.{index:02d}.{digest}."
                f"{self.config.output_extension}"
            )
            provisional.replace(staging_fonts / file_name)
            faces.append(
                FontFace(
                    spec.css_family,
                    file_name,
                    script,
                    tier,
                    to_ranges(output_codepoints),
                )
            )
        return faces

    def _build_min_font(
        self,
        spec: FontSpec,
        site_codepoints: set[int],
        staging_fonts: Path,
    ) -> list[FontFace]:
        supported = source_codepoints(self.config.source_path(spec))
        remainder = (site_codepoints & supported) - self.script_ranges_union
        chunks = chunk_site_codepoints(
            remainder,
            self.config.chunking,
            self.config.characters,
        )
        return self._build_tier(spec, "cjk", "min", chunks, staging_fonts)

    def _build_standard_font(
        self,
        spec: FontSpec,
        staging_fonts: Path,
    ) -> list[FontFace]:
        supported = source_codepoints(self.config.source_path(spec))
        faces: list[FontFace] = []
        for script in spec.script_tiers:
            wanted = sorted(self.config.scripts[script] & supported)
            if not wanted:
                raise ValueError(f"{spec.family} has no {script} glyphs")
            chunks = chunk_full_codepoints(wanted, self.config.chunking)
            faces.extend(self._build_tier(spec, script, "full", chunks, staging_fonts))
        for tier_name in spec.standard_tiers:
            ordered = self._tier_codepoints(tier_name)
            chunks = chunk_standard_codepoints(
                tier_name,
                ordered,
                supported,
                self.config.characters,
                self.config.chunking,
            )
            faces.extend(self._build_tier(spec, "cjk", tier_name, chunks, staging_fonts))
        return faces

    def _tier_codepoints(self, tier_name: str) -> tuple[int, ...]:
        levels = self.config.characters.levels
        if tier_name == "l1":
            return levels["l1"]
        if tier_name == "l2l3":
            return levels["l2"] + levels["l3"]
        raise ValueError(f"Unknown standard tier: {tier_name}")

    def _groups_for(self, spec: FontSpec, *, include_min: bool = False) -> list[str]:
        groups = [*spec.script_tiers, *(f"cjk.{tier}" for tier in spec.standard_tiers)]
        return ["cjk.min", *groups] if include_min else groups

    def _reuse_standard_fonts(self, staging_fonts: Path) -> list[FontFace]:
        fonts_dir = self.config.fonts_dir
        if not fonts_dir.exists():
            raise FileNotFoundError("No standard font directory is available for reuse")

        grouped: defaultdict[tuple[str, str], list[tuple[int, Path]]] = defaultdict(
            list
        )
        for path in fonts_dir.glob(f"*.{self.config.output_extension}"):
            if not any(
                path.name.startswith(f"{spec.file_stem}.") for spec in self.config.fonts
            ):
                continue
            match = self.generated_font_pattern.fullmatch(path.name)
            if not match:
                raise ValueError(f"Invalid generated font filename: {path.name}")
            group = match["group"]
            if group == "cjk.min":
                continue
            spec = self.specs_by_stem[match["stem"]]
            if group not in self._groups_for(spec):
                raise ValueError(f"Unsupported standard-tier font: {path.name}")
            if match["hash"] != content_hash(path, self.config.file_hash_length):
                raise ValueError(f"{path.name} content hash does not match its name")
            grouped[(spec.file_stem, group)].append((int(match["index"]), path))

        faces: list[FontFace] = []
        for spec in self.config.fonts:
            for group in self._groups_for(spec):
                entries = sorted(grouped[(spec.file_stem, group)])
                indexes = [index for index, _ in entries]
                if not entries or indexes != list(range(1, len(entries) + 1)):
                    raise ValueError(
                        f"Incomplete standard chunks for {spec.family} {group}"
                    )
                script, tier = split_group(group)
                for _, source in entries:
                    destination = staging_fonts / source.name
                    shutil.copy2(source, destination)
                    coverage = source_codepoints(destination)
                    if not coverage:
                        raise ValueError(f"Standard chunk has no cmap: {source.name}")
                    faces.append(
                        FontFace(
                            spec.css_family,
                            source.name,
                            script,
                            tier,
                            to_ranges(coverage),
                        )
                    )
        return faces

    def _validate_standard_coverage(self, faces: list[FontFace]) -> None:
        for spec in self.config.fonts:
            supported = source_codepoints(self.config.source_path(spec))
            expectations: list[tuple[str, set[int], str, str]] = [
                (
                    script,
                    set(self.config.scripts[script] & supported),
                    script,
                    "full",
                )
                for script in spec.script_tiers
            ] + [
                (
                    tier_name,
                    set(self._tier_codepoints(tier_name)) & supported,
                    "cjk",
                    tier_name,
                )
                for tier_name in spec.standard_tiers
            ]
            for label, expected, script, tier in expectations:
                actual = set().union(
                    *(
                        expand_ranges(face.ranges)
                        for face in faces
                        if face.family == spec.css_family
                        and face.script == script
                        and face.tier == tier
                    )
                )
                missing = expected - actual
                if missing:
                    raise ValueError(
                        f"{spec.family} {label} is missing "
                        f"{len(missing)} standard glyphs"
                    )

    def _order_faces(
        self,
        min_faces: list[FontFace],
        standard_faces: list[FontFace],
    ) -> list[FontFace]:
        return [
            face
            for spec in self.config.fonts
            for face in (*min_faces, *standard_faces)
            if face.family == spec.css_family
        ]

    def _print_summary(self, faces: list[FontFace], staging_fonts: Path) -> None:
        for spec in self.config.fonts:
            summaries: list[str] = []
            for group in self._groups_for(spec, include_min=True):
                tier_faces = [
                    face
                    for face in faces
                    if face.family == spec.css_family and face.group == group
                ]
                if not tier_faces:
                    summaries.append(f"{group}=0 chunks")
                    continue
                sizes = [
                    (staging_fonts / face.file_name).stat().st_size // 1024
                    for face in tier_faces
                ]
                summaries.append(
                    f"{group}={len(tier_faces)} chunks/{sum(sizes)} KiB "
                    f"({min(sizes)}-{max(sizes)} KiB each)"
                )
            print(f"[fonts:subset] {spec.family}: {', '.join(summaries)}")
