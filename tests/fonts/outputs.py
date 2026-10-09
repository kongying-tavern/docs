"""Check atomic font installation, including fresh Windows checkouts."""
import os
import re
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from scripts.font_subset.outputs import commit_outputs


class OutputTests(unittest.TestCase):
    def test_fresh_directory_and_rebuild_preserve_unmanaged_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            fonts = root / "fonts"
            config = SimpleNamespace(
                fonts_dir=fonts,
                site_css_file=fonts / "site.css",
                standard_css_file=fonts / "standard.css",
            )
            real_replace = os.replace

            def windows_replace(source, target):
                if Path(source).is_dir() and Path(target).exists():
                    raise PermissionError("Windows cannot replace an existing directory")
                real_replace(source, target)

            for index in range(2):
                staging = root / f"staging-{index}"
                (staging / "fonts").mkdir(parents=True)
                (staging / "fonts" / "generated.woff2").write_bytes(bytes([index]))
                site_css = staging / "site.css"
                standard_css = staging / "standard.css"
                site_css.write_text(f"site-{index}")
                standard_css.write_text(f"standard-{index}")
                with patch("scripts.font_subset.outputs.os.replace", windows_replace):
                    commit_outputs(config, staging, site_css, standard_css,
                                   re.compile(r"generated\.woff2|site\.css|standard\.css"))
                self.assertEqual((fonts / "generated.woff2").read_bytes(), bytes([index]))
                self.assertEqual(config.site_css_file.read_text(), f"site-{index}")
                self.assertEqual(config.standard_css_file.read_text(), f"standard-{index}")
                if index == 0:
                    (fonts / "custom.txt").write_text("keep")
            self.assertEqual((fonts / "custom.txt").read_text(), "keep")


if __name__ == "__main__":
    unittest.main()
