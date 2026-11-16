#!/usr/bin/env python3
"""Frame dasar (tanpa teks) + overlay teks tajam untuk video promo."""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import build_assets as b

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")
os.makedirs(OUT, exist_ok=True)
W, H = 1920, 1080

# ---- base: latar aurora + jendela game asli di kanan, kiri dibiarkan kosong
base = b.aurora_bg(W, H, seed=21)
lay, d = b.layer(base)
for i in range(int(W * 0.55)):
    a = int(140 * (1 - i / (W * 0.55)) ** 1.3)
    d.line([(i, 0), (i, H)], fill=(5, 8, 16, a))
b.commit(base, lay)
ui = b.framed_shot(b.shot("promo-big.png"), 900, 18)
base.alpha_composite(ui, (960, (H - ui.height) // 2))
base.convert("RGB").save(os.path.join(OUT, "video-base.png"))

# ---- overlay: semua tipografi & logo (statis, tidak ikut digerakkan model)
ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
# scrim kiri supaya tipografi tetap kontras walau aurora bergerak terang
sl = Image.new("RGBA", (W, H), (0, 0, 0, 0))
sd = ImageDraw.Draw(sl)
for i in range(1000):
    a = int(165 * (1 - i / 1000) ** 1.2)
    sd.line([(i, 0), (i, H)], fill=(4, 6, 14, a))
for j in range(160):
    a = int(150 * (j / 160) ** 1.2)
    sd.line([(0, H - 160 + j), (W, H - 160 + j)], fill=(4, 6, 14, a))
ov.alpha_composite(sl)
mark = Image.open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "brand", "logo-mark.png")).convert("RGBA").resize((300, 300), Image.LANCZOS)
ov.alpha_composite(b.glow(mark, b.CYAN, 40, 0.8), (110, 130))
d = ImageDraw.Draw(ov)
b.text(d, (114, 486), "SIDEBAR", b.font(b.F_BOLD, 132), b.INK)
b.text(d, (114, 626), "ARCADE", b.font(b.F_BOLD, 132), b.CYAN)
b.text(d, (118, 792), "115 game di side panel Chrome", b.font(b.F_REG, 40), b.INK)
x = 118
for label, col in (("PESAWAT", b.PINK), ("DINGDONG", b.AMBER), ("OFFLINE", b.LIME)):
    x += b.pill(ov, x, 862, label, col, b.font(b.F_MONO, 26), h=52) + 14
lay, d = b.layer(ov)
d.line([(110, 980), (1810, 980)], fill=b.CYAN + (90,), width=2)
b.commit(ov, lay)
d = ImageDraw.Draw(ov)
b.text(d, (110, 1006), "CHROME EXTENSION · OPEN SOURCE (MIT)", b.font(b.F_MONO, 26), b.DIM, spacing=2)
b.text(d, (1810, 1006), "github.com/aisac-id/sidebar-arcade", b.font(b.F_MONO, 26), b.CYAN, anchor="ra")
ov.save(os.path.join(OUT, "video-overlay.png"))
print("video frames done")