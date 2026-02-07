import random
import colorsys


def generate_vibrant_color() -> str:
    max_attempts = 50

    for _ in range(max_attempts):
        hue = random.random()
        saturation = random.uniform(0.8, 1.0)
        lightness = random.uniform(0.45, 0.65)

        r, g, b = colorsys.hls_to_rgb(hue, lightness, saturation)
        r_int, g_int, b_int = int(r * 255), int(g * 255), int(b * 255)

        def get_luminance(r: int, g: int, b: int) -> float:
            r_norm = r / 255.0
            g_norm = g / 255.0
            b_norm = b / 255.0

            r_linear = r_norm / 12.92 if r_norm <= 0.03928 else ((r_norm + 0.055) / 1.055) ** 2.4
            g_linear = g_norm / 12.92 if g_norm <= 0.03928 else ((g_norm + 0.055) / 1.055) ** 2.4
            b_linear = b_norm / 12.92 if b_norm <= 0.03928 else ((b_norm + 0.055) / 1.055) ** 2.4

            return 0.2126 * r_linear + 0.7152 * g_linear + 0.0722 * b_linear

        luminance = get_luminance(r_int, g_int, b_int)

        if luminance < 0.15:
            continue

        if luminance > 0.75:
            continue

        max_channel = max(r_int, g_int, b_int)
        min_channel = min(r_int, g_int, b_int)
        channel_diff = max_channel - min_channel

        if channel_diff < 60:
            continue

        return "#{:02x}{:02x}{:02x}".format(r_int, g_int, b_int)

    return "#FF6B6B"
