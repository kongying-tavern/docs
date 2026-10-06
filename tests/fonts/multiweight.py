"""Regression checks for independent weights in one CSS font family."""
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from scripts.font_subset.models import FontFace
from scripts.font_subset.outputs import _font_face_rule, exposed_codepoints
from scripts.font_subset.pipeline import FontSubsetPipeline
from scripts.font_subset.unicode_ranges import to_ranges


def face(weight, tier, codepoints):
    return FontFace(
        "SarasaGothicSC-min", f"sarasa-{weight}-{tier}.woff2", "cjk", tier,
        to_ranges(set(codepoints)), weight,
    )


class MultiweightTests(unittest.TestCase):
    def test_site_ranges_are_subtracted_only_from_the_same_weight(self):
        faces = [face(400, "min", [65]), face(700, "min", [66]),
                 face(400, "l1", [65, 66, 67]), face(700, "l1", [65, 66, 67])]
        ranges = exposed_codepoints(faces)
        self.assertEqual(ranges[faces[2].file_name], {66, 67})
        self.assertEqual(ranges[faces[3].file_name], {65, 67})

    def test_face_order_does_not_duplicate_a_shared_family(self):
        pipeline = object.__new__(FontSubsetPipeline)
        pipeline.config = SimpleNamespace(fonts=[
            SimpleNamespace(css_family="SarasaGothicSC-min", font_weight=weight)
            for weight in [400, 600, 700]
        ])
        faces = [face(weight, "min", [65]) for weight in [400, 600, 700]]
        self.assertEqual(pipeline._order_faces(faces, []), faces)

    def test_css_uses_each_faces_real_weight(self):
        config = SimpleNamespace(
            css=SimpleNamespace(font_style="normal", font_display="swap",
                                local_fallback="test", public_font_path="."),
            output_format="woff2",
        )
        for weight in [400, 600, 700]:
            css = _font_face_rule(config, face(weight, "min", [65]), {65})
            self.assertIn(f"font-weight: {weight};", css)


if __name__ == "__main__":
    unittest.main()
