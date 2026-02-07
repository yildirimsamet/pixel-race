

import os
import logging
import re
from typing import Optional

try:
    import cairosvg
except ImportError:
    cairosvg = None
    logging.warning(
        "cairosvg not installed. SVG rendering will not work. "
        "Install with: pip install cairosvg"
    )

logger = logging.getLogger(__name__)


class SVGRenderer:

    def __init__(self):
        self.template_path = os.path.join(
            os.path.dirname(__file__),
            "..",
            "assets",
            "horse_template.svg"
        )

        logger.info(f"SVGRenderer initialized (template: {self.template_path})")

    def render_horse_png(
        self,
        horse_color: str,
        output_size: int = 512
    ) -> Optional[bytes]:
        if not cairosvg:
            raise Exception(
                "cairosvg not installed. Cannot render SVG to PNG. "
                "Install with: pip install cairosvg"
            )

        try:
            logger.info(f"Rendering horse SVG with color {horse_color}, size {output_size}px")

            if not os.path.exists(self.template_path):
                raise Exception(f"SVG template not found at {self.template_path}")

            with open(self.template_path, 'r', encoding='utf-8') as f:
                svg_content = f.read()

            customized_svg = self._customize_svg_color(svg_content, horse_color)

            wrapped_svg = self._wrap_svg_with_white_background(
                customized_svg,
                output_size
            )

            png_bytes = cairosvg.svg2png(
                bytestring=wrapped_svg.encode('utf-8'),
                output_width=output_size,
                output_height=output_size
            )

            logger.info(f"SVG rendered successfully: {len(png_bytes)} bytes")
            return png_bytes

        except Exception as e:
            logger.error(f"Failed to render SVG: {e}")
            raise Exception(f"SVG rendering failed: {e}")

    def _customize_svg_color(self, svg_content: str, horse_color: str) -> str:
        customized = svg_content.replace(
            'fill="#040304"',
            f'fill="{horse_color}"'
        )

        logger.debug(f"SVG color customized: #040304 → {horse_color}")
        return customized

    def _wrap_svg_with_white_background(
        self,
        svg_content: str,
        size: int
    ) -> str:
        wrapped_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">
  <!-- White background -->
  <rect width="{size}" height="{size}" fill="#FFFFFF"/>

  <!-- Original horse SVG (centered and scaled) -->
  <g transform="translate({(size - 408) / 2}, {(size - 269) / 2})">
    {self._extract_svg_paths(svg_content)}
  </g>
</svg>'''

        logger.debug(f"SVG wrapped with white {size}x{size} background")
        return wrapped_svg

    def _extract_svg_paths(self, svg_content: str) -> str:
        import re
        paths = re.findall(r'<path[^>]*>.*?</path>|<path[^>]*/>', svg_content, re.DOTALL)
        return '\n    '.join(paths)

    def get_fallback_robohash_url(self, horse_id: str) -> str:
        return f"https://robohash.org/{horse_id}.png?set=set4&size=512x512&bgset=bg1"
