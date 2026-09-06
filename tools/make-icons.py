#!/usr/bin/env python3
"""Genererar appikonerna i icons/ från en enda ritfunktion.

Kör:  python3 tools/make-icons.py
Behöver Pillow:  pip install pillow
"""
import math
import os

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "icons")

BG = (15, 23, 42, 255)        # slate-900, samma som appen
CREAM = (241, 245, 249, 255)
BLACK = (17, 24, 39, 255)
RED = (220, 38, 38, 255)
GREEN = (22, 163, 74, 255)
WIRE = (30, 41, 59, 255)

SS = 4  # supersampling


def draw_board(size, board_ratio, radius_ratio=0.22, bg=BG):
    """Ritar en dartbräda centrerad på en rundad platta."""
    s = size * SS
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # bakgrundsplatta
    r = int(s * radius_ratio)
    d.rounded_rectangle([0, 0, s - 1, s - 1], radius=r, fill=bg)

    cx = cy = s / 2
    R = s * board_ratio / 2

    def wedges(radius, colors, offset=-99):
        for i in range(20):
            a0 = offset + i * 18
            d.pieslice(
                [cx - radius, cy - radius, cx + radius, cy + radius],
                a0, a0 + 18, fill=colors[i % 2],
            )

    wedges(R, (RED, GREEN))              # dubbelring
    wedges(R * 0.93, (CREAM, BLACK))     # yttre fält
    wedges(R * 0.63, (RED, GREEN))       # trippelring
    wedges(R * 0.56, (CREAM, BLACK))     # inre fält

    # bull
    d.ellipse([cx - R * 0.17, cy - R * 0.17, cx + R * 0.17, cy + R * 0.17], fill=GREEN)
    d.ellipse([cx - R * 0.08, cy - R * 0.08, cx + R * 0.08, cy + R * 0.08], fill=RED)

    # tunn ytterkant så brädan lyfter från bakgrunden
    d.ellipse([cx - R, cy - R, cx + R, cy + R], outline=WIRE, width=max(2, int(s * 0.008)))

    return img.resize((size, size), Image.LANCZOS)


def svg_favicon(path):
    """Enkel SVG-variant för webbläsarfliken."""
    parts = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Dartkoll">',
        '<rect width="64" height="64" rx="14" fill="#0f172a"/>',
    ]

    def wedge_paths(radius, colors, ):
        out = []
        for i in range(20):
            a0 = math.radians(-99 + i * 18)
            a1 = math.radians(-99 + (i + 1) * 18)
            x0, y0 = 32 + radius * math.cos(a0), 32 + radius * math.sin(a0)
            x1, y1 = 32 + radius * math.cos(a1), 32 + radius * math.sin(a1)
            out.append(
                '<path d="M32 32 L%.2f %.2f A%.2f %.2f 0 0 1 %.2f %.2f Z" fill="%s"/>'
                % (x0, y0, radius, radius, x1, y1, colors[i % 2])
            )
        return out

    R = 27.0
    parts += wedge_paths(R, ("#dc2626", "#16a34a"))
    parts += wedge_paths(R * 0.93, ("#f1f5f9", "#111827"))
    parts += wedge_paths(R * 0.63, ("#dc2626", "#16a34a"))
    parts += wedge_paths(R * 0.56, ("#f1f5f9", "#111827"))
    parts.append('<circle cx="32" cy="32" r="%.2f" fill="#16a34a"/>' % (R * 0.17))
    parts.append('<circle cx="32" cy="32" r="%.2f" fill="#dc2626"/>' % (R * 0.08))
    parts.append("</svg>")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("\n".join(parts) + "\n")


def main():
    os.makedirs(OUT, exist_ok=True)

    # vanliga ikoner: brädan fyller nästan hela ytan
    for size in (192, 512):
        draw_board(size, 0.86).save(os.path.join(OUT, "icon-%d.png" % size))

    # maskable: brädan innanför den säkra zonen (Android kan klippa kanterna)
    draw_board(512, 0.60, radius_ratio=0.5).save(os.path.join(OUT, "icon-maskable-512.png"))

    # iOS lägger på egen rundning - platt bakgrund, ingen egen radie
    draw_board(180, 0.84, radius_ratio=0.0).save(os.path.join(OUT, "apple-touch-icon.png"))

    svg_favicon(os.path.join(OUT, "favicon.svg"))
    print("Klart:", ", ".join(sorted(os.listdir(OUT))))


if __name__ == "__main__":
    main()
