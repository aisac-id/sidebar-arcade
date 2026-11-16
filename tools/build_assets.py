#!/usr/bin/env python3
"""Bangun aset brand + promotion kit Sidebar Arcade dari art generator & screenshot asli."""
import math
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GEN = os.path.join(ROOT, "tools", "src-art")
SHOTS = os.path.join(ROOT, "tools", "shots")
BRAND = os.path.join(ROOT, "brand")
PROMO = os.path.join(ROOT, "promo")
os.makedirs(BRAND, exist_ok=True)
os.makedirs(PROMO, exist_ok=True)

CYAN = (78, 225, 255)
VIOLET = (167, 139, 250)
PINK = (255, 107, 214)
LIME = (163, 230, 53)
AMBER = (251, 191, 36)
RED = (251, 113, 133)
INK = (231, 236, 247)
DIM = (139, 150, 179)
BG = (7, 10, 18)
PANEL = (12, 18, 32)

F_BOLD = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
F_REG = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
F_MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"


def font(path, size):
    return ImageFont.truetype(path, int(size))


def fit_font(path, s, maxw, start, spacing=0):
    size = start
    probe = ImageDraw.Draw(Image.new("RGB", (8, 8)))
    while size > 8:
        f = font(path, size)
        w = probe.textlength(s, font=f) + spacing * max(0, len(s) - 1)
        if w <= maxw:
            return f
        size -= 2
    return font(path, 8)


def rounded_mask(size, radius):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius=radius, fill=255)
    return m


def round_img(img, radius):
    img = img.convert("RGBA")
    img.putalpha(rounded_mask(img.size, radius))
    return img


def glow(img, color, radius=26, strength=0.85):
    a = img.split()[3].point(lambda v: int(v * strength))
    layer = Image.new("RGBA", img.size, color + (0,))
    layer.putalpha(a)
    layer = layer.filter(ImageFilter.GaussianBlur(radius))
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out.alpha_composite(layer)
    out.alpha_composite(img)
    return out


def layer(img):
    """Layer transparan terpisah: rounded_rectangle PIL tidak.blend alpha, jadi selalu composite."""
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    return lay, ImageDraw.Draw(lay)


def commit(img, lay):
    img.alpha_composite(lay)


def find_coeffs(dst, src):
    matrix = []
    for (x, y), (X, Y) in zip(dst, src):
        matrix.append([x, y, 1, 0, 0, 0, -X * x, -X * y])
        matrix.append([0, 0, 0, x, y, 1, -Y * x, -Y * y])
    A = np.array(matrix, dtype=float)
    B = np.array(src, dtype=float).reshape(8)
    return np.linalg.solve(A, B).tolist()


def paste_quad(base, img, quad):
    w, h = img.size
    src = [(0, 0), (w, 0), (w, h), (0, h)]
    coeffs = find_coeffs(quad, src)
    warped = img.transform(base.size, Image.PERSPECTIVE, coeffs, Image.BICUBIC)
    base.alpha_composite(warped)
    return warped


def aurora_bg(w, h, seed=7):
    rng = np.random.default_rng(seed)
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    base = np.zeros((h, w, 3), np.float32)
    base[..., 0] = 7
    base[..., 1] = 10
    base[..., 2] = 18
    blobs = [
        (0.18, 0.16, 0.55, CYAN, 0.30),
        (0.86, 0.10, 0.50, VIOLET, 0.34),
        (0.62, 0.98, 0.55, PINK, 0.22),
        (0.30, 0.75, 0.45, (34, 90, 200), 0.24),
    ]
    for cx, cy, r, col, amp in blobs:
        d = np.sqrt(((x - cx * w) / (r * w)) ** 2 + ((y - cy * h) / (r * w)) ** 2)
        f = np.clip(1 - d, 0, 1) ** 2 * amp
        for i in range(3):
            base[..., i] += f * col[i]
    img = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8), "RGB").convert("RGBA")
    lay, d = layer(img)
    horizon = int(h * 0.74)
    for i in range(-14, 15):
        x0 = w / 2 + i * (w / 12)
        d.line([(w / 2 + i * 12, horizon), (x0 * 1.9 - w * 0.45, h)], fill=CYAN + (26,), width=1)
    for k in range(1, 12):
        yy = horizon + (h - horizon) * (k / 12) ** 1.8
        d.line([(0, yy), (w, yy)], fill=CYAN + (18,), width=1)
    commit(img, lay)
    scan = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    sd = ImageDraw.Draw(scan)
    for yy in range(0, h, 4):
        sd.line([(0, yy), (w, yy)], fill=(0, 0, 0, 26))
    img.alpha_composite(scan)
    lay, pd = layer(img)
    for _ in range(int(w * h / 26000)):
        px, py = rng.integers(0, w), rng.integers(0, h)
        s = int(rng.integers(2, 6))
        col = [CYAN, VIOLET, PINK, AMBER, LIME][int(rng.integers(0, 5))]
        pd.rectangle([px, py, px + s, py + s], fill=col + (int(rng.integers(40, 130)),))
    commit(img, lay)
    return img


def text(d, xy, s, f, fill=INK, anchor="la", spacing=0):
    if spacing == 0:
        d.text(xy, s, font=f, fill=fill, anchor=anchor)
        return d.textlength(s, font=f)
    total = sum(d.textlength(ch, font=f) + spacing for ch in s) - spacing
    x, y = xy
    if anchor.startswith("m"):
        x -= total / 2
    elif anchor.startswith("r"):
        x -= total
    for ch in s:
        d.text((x, y), ch, font=f, fill=fill)
        x += d.textlength(ch, font=f) + spacing
    return total


def pill(img, x, y, label, color, f, pad=16, h=38):
    d0 = ImageDraw.Draw(img)
    w = d0.textlength(label, font=f) + pad * 2
    lay = Image.new("RGBA", (int(w) + 4, h + 4), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    d.rounded_rectangle([0, 0, w, h], radius=h / 2, fill=color + (34,), outline=color + (210,), width=2)
    d.text((w / 2, h / 2 + 1), label, font=f, fill=color + (255,), anchor="mm")
    img.alpha_composite(lay, (int(x), int(y)))
    return w


def icon(img, kind, x, y, s, col):
    """Ikon vektor kecil (tanpa emoji, supaya tidak jadi tofu)."""
    lay = Image.new("RGBA", (s + 4, s + 4), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    c = col + (255,)
    u = s / 24.0
    P = lambda pts: [(2 + px * u, 2 + py * u) for px, py in pts]
    if kind == "bolt":
        d.polygon(P([(14, 1), (5, 13), (11, 13), (9, 23), (19, 10), (12, 10)]), fill=c)
    elif kind == "slot":
        d.rounded_rectangle(P([(2, 4), (22, 20)]), radius=3 * u, outline=c, width=max(1, int(2 * u)))
        for cx in (7, 12, 17):
            d.ellipse(P([(cx - 2, 10), (cx + 2, 14)]), fill=c)
    elif kind == "plane":
        d.polygon(P([(12, 1), (15, 10), (23, 15), (23, 18), (14, 15), (13, 20), (17, 23), (7, 23), (11, 20), (10, 15), (1, 18), (1, 15), (9, 10)]), fill=c)
    elif kind == "expand":
        w = max(1, int(2.4 * u))
        for (ax, ay, bx, by, cx2, cy2) in [(2, 8, 2, 2, 8, 2), (16, 2, 22, 2, 22, 8), (22, 16, 22, 22, 16, 22), (8, 22, 2, 22, 2, 16)]:
            d.line(P([(ax, ay), (bx, by), (cx2, cy2)]), fill=c, width=w)
    elif kind == "offline":
        d.ellipse(P([(2, 2), (22, 22)]), outline=c, width=max(1, int(2.2 * u)))
        d.line(P([(6, 18), (18, 6)]), fill=c, width=max(1, int(2.2 * u)))
    elif kind == "code":
        w = max(1, int(2.2 * u))
        d.line(P([(9, 4), (3, 12), (9, 20)]), fill=c, width=w)
        d.line(P([(15, 4), (21, 12), (15, 20)]), fill=c, width=w)
    elif kind == "star":
        pts = []
        for i in range(10):
            r = 11 if i % 2 == 0 else 4.6
            a = -math.pi / 2 + i * math.pi / 5
            pts.append((12 + r * math.cos(a), 12 + r * math.sin(a)))
        d.polygon(P(pts), fill=c)
    img.alpha_composite(lay, (int(x), int(y)))


def shot(name):
    return Image.open(os.path.join(SHOTS, name)).convert("RGBA")


def framed_shot(img, width, radius=18, border=CYAN, glowy=True):
    ratio = width / img.width
    im = img.resize((int(width), int(img.height * ratio)), Image.LANCZOS)
    im = round_img(im, radius)
    canvas = Image.new("RGBA", (im.width + 8, im.height + 8), (0, 0, 0, 0))
    dd = ImageDraw.Draw(canvas)
    dd.rounded_rectangle([0, 0, canvas.width - 1, canvas.height - 1], radius=radius + 4,
                         outline=border + (170,), width=2, fill=(10, 16, 30, 255))
    canvas.alpha_composite(im, (4, 4))
    return glow(canvas, border, 26, 0.55) if glowy else canvas


def scrim(img, top, bottom, maxa=225, power=1.3):
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    span = bottom - top
    for i in range(span):
        a = int(maxa * (i / span) ** power)
        d.line([(0, top + i), (img.width, top + i)], fill=(5, 8, 16, a))
    for yy in range(bottom, img.height):
        d.line([(0, yy), (img.width, yy)], fill=(5, 8, 16, maxa))
    img.alpha_composite(lay)


# ---------------------------------------------------------------- logo / icons
INVADER = [
    "00100000100",
    "00010001000",
    "00111111100",
    "01101110110",
    "11111111111",
    "10111111101",
    "10100000101",
    "00011011000",
]


def pixel_icon(size):
    """Ikon 16/32 px digambar ulang sebagai pixel-art tajam (bukan hasil downscale)."""
    S = size * 16
    yy, xx = np.mgrid[0:S, 0:S].astype(np.float32) / S
    t = yy * 0.75 + xx * 0.25
    a = np.zeros((S, S, 3), np.float32)
    a[..., 0] = 14 + 70 * t
    a[..., 1] = 18 + 24 * t
    a[..., 2] = 44 + 120 * t
    img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGB").convert("RGBA")
    cols, rows = len(INVADER[0]), len(INVADER)
    cell = S // (cols + 3)
    ox = (S - cols * cell) // 2
    oy = (S - rows * cell) // 2
    lay = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    for r, row in enumerate(INVADER):
        for c, ch in enumerate(row):
            if ch == "1":
                d.rectangle([ox + c * cell, oy + r * cell, ox + (c + 1) * cell - 1, oy + (r + 1) * cell - 1], fill=PINK + (255,))
    img.alpha_composite(lay.filter(ImageFilter.GaussianBlur(cell * 0.5)))
    lay2 = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d2 = ImageDraw.Draw(lay2)
    for r, row in enumerate(INVADER):
        for c, ch in enumerate(row):
            if ch == "1":
                d2.rectangle([ox + c * cell, oy + r * cell, ox + (c + 1) * cell - 1, oy + (r + 1) * cell - 1], fill=(120, 245, 255, 255))
    img.alpha_composite(lay2)
    img.putalpha(rounded_mask((S, S), int(S * 0.22)))
    return img.resize((size, size), Image.LANCZOS)


def build_logo():
    src = Image.open(os.path.join(GEN, "logo-icon.png")).convert("RGBA")
    a = np.array(src)
    white = (a[..., 0] > 232) & (a[..., 1] > 232) & (a[..., 2] > 232)
    a[..., 3] = np.where(white, 0, a[..., 3])
    src = Image.fromarray(a)
    src = src.crop(src.split()[3].getbbox())
    side = max(src.size)
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.alpha_composite(src, ((side - src.width) // 2, (side - src.height) // 2))
    master = sq.resize((1024, 1024), Image.LANCZOS)
    master.putalpha(rounded_mask((1024, 1024), 226))
    master.save(os.path.join(BRAND, "logo-mark.png"))
    for size in (512, 128, 48):
        master.resize((size, size), Image.LANCZOS).save(os.path.join(ROOT, "icons", f"icon{size}.png"))
    # ikon kecil: pixel-art tajam supaya tetap terbaca di toolbar
    for size in (32, 16):
        pixel_icon(size).save(os.path.join(ROOT, "icons", f"icon{size}.png"))
    glow(master.resize((512, 512), Image.LANCZOS), CYAN, 30, 0.7).save(os.path.join(BRAND, "logo-mark-glow.png"))
    Image.open(os.path.join(GEN, "logo-wordmark.png")).convert("RGB").save(os.path.join(BRAND, "logo-lockup.png"))
    # wordmark transparan (dipakai di banner & box)
    wm = Image.new("RGBA", (1200, 460), (0, 0, 0, 0))
    d = ImageDraw.Draw(wm)
    text(d, (0, 0), "SIDEBAR", font(F_BOLD, 190), INK, spacing=4)
    text(d, (0, 210), "ARCADE", font(F_BOLD, 190), CYAN, spacing=4)
    wm = wm.crop(wm.split()[3].getbbox())
    wm.save(os.path.join(BRAND, "wordmark.png"))
    return master


# ---------------------------------------------------------------- software box
def box_front(w=880, h=1240):
    img = aurora_bg(w, h, seed=5)
    lay, d = layer(img)
    d.rounded_rectangle([26, 26, w - 27, h - 27], radius=34, outline=CYAN + (70,), width=2)
    commit(img, lay)
    mark = Image.open(os.path.join(BRAND, "logo-mark.png")).convert("RGBA").resize((190, 190), Image.LANCZOS)
    img.alpha_composite(glow(mark, CYAN, 26, 0.75), (64, 66))
    d = ImageDraw.Draw(img)
    text(d, (286, 74), "SIDEBAR", fit_font(F_BOLD, "SIDEBAR", w - 286 - 64, 104), INK)
    text(d, (286, 176), "ARCADE", fit_font(F_BOLD, "ARCADE", w - 286 - 64, 104), CYAN)
    text(d, (288, 296), "115 GAME · CHROME SIDE PANEL", font(F_MONO, 22), DIM, spacing=1.2)
    lay, d = layer(img)
    d.line([(64, 356), (w - 64, 356)], fill=CYAN + (80,), width=2)
    commit(img, lay)

    feats = [
        ("plane", "16 game pesawat & helikopter", PINK),
        ("slot", "Dingdong: slot, roulette, plinko", AMBER),
        ("bolt", "Nitro, dash, combo, boss murka", CYAN),
        ("expand", "Mode layar besar + fullscreen", VIOLET),
        ("offline", "100% offline, tanpa iklan", LIME),
    ]
    for i, (kind, label, col) in enumerate(feats):
        y = 396 + i * 62
        lay, d = layer(img)
        d.rounded_rectangle([64, y, 470, y + 50], radius=14, fill=(12, 20, 36, 210), outline=col + (70,), width=1)
        commit(img, lay)
        icon(img, kind, 80, y + 13, 24, col)
        d = ImageDraw.Draw(img)
        text(d, (118, y + 25), label, fit_font(F_REG, label, 336, 21), INK, anchor="lm")

    d = ImageDraw.Draw(img)
    text(d, (64, 736), "KATEGORI", font(F_MONO, 20), DIM, spacing=3)
    cats = [("ARCADE", 18, CYAN), ("SHOOTER", 12, PINK), ("RACING", 10, AMBER),
            ("PUZZLE", 21, VIOLET), ("BOARD", 16, RED), ("LUCK", 11, AMBER),
            ("REFLEX", 13, CYAN), ("WORD", 4, LIME), ("SKILL", 10, LIME)]
    for i, (name, count, col) in enumerate(cats):
        r, c = divmod(i, 3)
        x = 64 + c * 138
        y = 776 + r * 76
        lay, dd = layer(img)
        dd.rounded_rectangle([x, y, x + 126, y + 64], radius=12, fill=(14, 22, 40, 220), outline=col + (95,), width=2)
        commit(img, lay)
        dd = ImageDraw.Draw(img)
        text(dd, (x + 12, y + 10), name, font(F_MONO, 14), DIM, spacing=0.6)
        text(dd, (x + 12, y + 28), str(count), font(F_BOLD, 30), col)

    panel = framed_shot(shot("promo-panel.png"), 286, 16, CYAN)
    img.alpha_composite(panel, (w - 64 - panel.width, 392))

    lay, d = layer(img)
    d.line([(64, h - 122), (w - 64, h - 122)], fill=CYAN + (70,), width=2)
    commit(img, lay)
    x = 64
    for label, col in (("MV3", CYAN), ("OFFLINE", LIME), ("MIT", AMBER)):
        x += pill(img, x, h - 100, label, col, font(F_MONO, 18), h=36) + 10
    d = ImageDraw.Draw(img)
    text(d, (w - 64, h - 82), "github.com/aisac-id/sidebar-arcade", font(F_MONO, 17), DIM, anchor="rm")
    return img


def box_spine(w=210, h=1240):
    a = np.zeros((h, w, 3), np.float32)
    yy = np.linspace(0, 1, h)[:, None]
    a[..., 0] = 10 + 18 * yy
    a[..., 1] = 14 + 10 * yy
    a[..., 2] = 30 + 40 * yy
    img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGB").convert("RGBA")
    lay, d = layer(img)
    d.line([(w - 3, 0), (w - 3, h)], fill=CYAN + (90,), width=3)
    commit(img, lay)
    mark = Image.open(os.path.join(BRAND, "logo-mark.png")).convert("RGBA").resize((120, 120), Image.LANCZOS)
    img.alpha_composite(glow(mark, CYAN, 18, 0.6), ((w - 120) // 2, 70))
    wm = Image.new("RGBA", (1400, 200), (0, 0, 0, 0))
    text(ImageDraw.Draw(wm), (0, 0), "SIDEBAR ARCADE", font(F_BOLD, 150), INK, spacing=6)
    wm = wm.crop(wm.split()[3].getbbox())
    sc = min(120 / wm.height, 680 / wm.width)
    wm = wm.resize((int(wm.width * sc), int(wm.height * sc)), Image.LANCZOS).rotate(-90, expand=True)
    img.alpha_composite(wm, ((w - wm.width) // 2, 270))
    d = ImageDraw.Draw(img)
    t = Image.new("RGBA", (300, 40), (0, 0, 0, 0))
    text(ImageDraw.Draw(t), (0, 0), "115 GAME · MV3", font(F_MONO, 24), CYAN, spacing=2)
    t = t.crop(t.split()[3].getbbox()).rotate(-90, expand=True)
    img.alpha_composite(t, ((w - t.width) // 2, h - 260))
    return img


def box_top(w=880, h=210):
    img = Image.new("RGBA", (w, h), (18, 24, 44, 255))
    lay, d = layer(img)
    for i in range(h):
        d.line([(0, i), (w, i)], fill=(60, 90, 160, int(40 * (1 - i / h))))
    commit(img, lay)
    lay, d = layer(img)
    d.line([(0, h - 4), (w, h - 4)], fill=CYAN + (70,), width=4)
    commit(img, lay)
    return img


def build_box():
    W, H = 1400, 1560
    # studio backdrop
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt(((x - W * 0.52) / (W * 0.75)) ** 2 + ((y - H * 0.38) / (H * 0.7)) ** 2)
    f = np.clip(1 - d, 0, 1) ** 2
    arr = np.zeros((H, W, 3), np.float32)
    arr[..., 0] = 6 + f * 26
    arr[..., 1] = 8 + f * 34
    arr[..., 2] = 14 + f * 62
    canvas = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB").convert("RGBA")

    fl, tl = (430, 210), (250, 150)
    fr, tr = (1250, 150), (1070, 90)
    bl, bbl = (430, 1400), (250, 1340)
    br = (1250, 1340)
    front_quad = [fl, fr, br, bl]
    spine_quad = [tl, fl, bl, bbl]
    top_quad = [tl, fl, fr, tr]

    # bayangan lantai
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse([210, 1310, 1300, 1470], fill=(0, 0, 0, 200))
    canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(46)))

    front = box_front()
    spine = box_spine()
    top = box_top()
    spine = ImageEnhance.Brightness(spine).enhance(0.62)
    top = ImageEnhance.Brightness(top).enhance(1.25)
    # gradient cahaya di muka box
    lg = np.linspace(1.10, 0.86, front.width)[None, :, None]
    fa = np.array(front).astype(np.float32)
    fa[..., :3] *= lg
    front = Image.fromarray(np.clip(fa, 0, 255).astype(np.uint8), "RGBA")

    fw = paste_quad(canvas, front, front_quad)
    paste_quad(canvas, spine, spine_quad)
    paste_quad(canvas, top, top_quad)

    # refleksi lantai
    refl = fw.transpose(Image.FLIP_TOP_BOTTOM)
    ra = np.array(refl).astype(np.float32)
    ys = np.arange(H)
    bbox = fw.split()[3].getbbox()
    fade = np.clip(1 - (ys - bbox[3]) / 240.0, 0, 1) * 0.22
    fade[ys < bbox[3]] = 0
    ra[..., 3] *= fade[:, None]
    canvas.alpha_composite(Image.fromarray(np.clip(ra, 0, 255).astype(np.uint8), "RGBA").filter(ImageFilter.GaussianBlur(3)))

    lay, dd = layer(canvas)
    dd.line([tl, fl, bl], fill=CYAN + (110,), width=2)
    dd.line([fl, fr], fill=(190, 220, 255, 90), width=2)
    dd.line([tl, tr], fill=(190, 220, 255, 70), width=2)
    commit(canvas, lay)

    canvas.convert("RGB").save(os.path.join(PROMO, "software-box.png"), quality=95)
    front.convert("RGB").resize((704, 992), Image.LANCZOS).save(os.path.join(BRAND, "box-front.png"))


# ---------------------------------------------------------------- hero poster
def build_hero():
    hero = Image.open(os.path.join(GEN, "poster-hero-art.png")).convert("RGBA")
    ui = shot("promo-big.png")
    quad = [(795, 148), (1592, 158), (1594, 728), (793, 738)]
    paste_quad(hero, round_img(ui, 6), quad)
    hero.convert("RGB").save(os.path.join(PROMO, "poster-hero.png"), quality=95)
    return hero


# ---------------------------------------------------------------- social square
def build_social():
    art = Image.open(os.path.join(GEN, "social-square-art.png")).convert("RGBA").resize((1080, 1080), Image.LANCZOS)
    scrim(art, 600, 900, maxa=238, power=1.1)
    d = ImageDraw.Draw(art)
    text(d, (72, 664), "SIDEBAR", font(F_BOLD, 96), INK)
    text(d, (72, 762), "ARCADE", font(F_BOLD, 96), CYAN)
    text(d, (76, 884), "115 GAME · OFFLINE · CHROME SIDE PANEL", font(F_MONO, 23), DIM, spacing=1.2)
    x = 76
    for label, col in (("PESAWAT", PINK), ("DINGDONG", AMBER), ("PUZZLE", LIME)):
        x += pill(art, x, 934, label, col, font(F_MONO, 19), h=38) + 12
    text(d, (1008, 646), "115", font(F_BOLD, 168), CYAN, anchor="ra")
    text(d, (1008, 826), "GAME", font(F_MONO, 34), INK, anchor="ra", spacing=8)
    text(d, (1008, 946), "github.com/aisac-id/sidebar-arcade", font(F_MONO, 18), DIM, anchor="ra")
    art.convert("RGB").save(os.path.join(PROMO, "social-square.png"), quality=95)


# ---------------------------------------------------------------- vertical poster
CATS = [
    ("ARCADE", 18, CYAN), ("SHOOTER", 12, PINK), ("RACING", 10, AMBER),
    ("PUZZLE", 21, VIOLET), ("WORD", 4, LIME), ("BOARD", 16, RED),
    ("LUCK", 11, AMBER), ("REFLEX", 13, CYAN), ("SKILL", 10, LIME),
]


def build_poster():
    art = Image.open(os.path.join(GEN, "poster-vertical-art.png")).convert("RGBA").resize((1080, 1620), Image.LANCZOS)
    scrim(art, 500, 760, maxa=242, power=1.0)
    d = ImageDraw.Draw(art)
    text(d, (540, 648), "SIDEBAR ARCADE", fit_font(F_BOLD, "SIDEBAR ARCADE", 940, 90), INK, anchor="ma")
    text(d, (540, 756), "115 GAME DI SIDE PANEL CHROME", font(F_MONO, 27), CYAN, anchor="ma", spacing=2)
    text(d, (540, 806), "Nunggu agent kerja? Main dulu. Tanpa iklan, tanpa internet.", font(F_REG, 25), DIM, anchor="ma")

    gx, gy, cw, ch, gap = 72, 872, 296, 112, 24
    for i, (name, count, col) in enumerate(CATS):
        r, c = divmod(i, 3)
        x = gx + c * (cw + gap)
        y = gy + r * (ch + gap)
        lay, dd = layer(art)
        dd.rounded_rectangle([x, y, x + cw, y + ch], radius=18, fill=(14, 22, 40, 240), outline=col + (120,), width=2)
        dd.ellipse([x + 22, y + 26, x + 34, y + 38], fill=col + (255,))
        commit(art, lay)
        dd = ImageDraw.Draw(art)
        text(dd, (x + 46, y + 22), name, font(F_MONO, 22), INK, spacing=1.5)
        wnum = text(dd, (x + 22, y + 54), str(count), font(F_BOLD, 44), col)
        text(dd, (x + 32 + wnum, y + 74), "game", font(F_REG, 20), DIM)

    fy = 1288
    feats = [
        ("bolt", "Nitro, dash, combo & boss fase murka", CYAN),
        ("slot", "Dingdong: slot, roulette, plinko, bingo", AMBER),
        ("plane", "16 game pesawat & helikopter", PINK),
        ("expand", "Mode layar besar + fullscreen (F)", VIOLET),
    ]
    for i, (kind, label, col) in enumerate(feats):
        y = fy + i * 52
        lay, dd = layer(art)
        dd.rounded_rectangle([72, y, 1008, y + 44], radius=12, fill=(12, 18, 32, 225), outline=col + (60,), width=1)
        commit(art, lay)
        icon(art, kind, 92, y + 10, 24, col)
        dd = ImageDraw.Draw(art)
        text(dd, (134, y + 23), label, font(F_REG, 24), INK, anchor="lm")

    lay, dd = layer(art)
    dd.line([(72, 1522), (1008, 1522)], fill=CYAN + (90,), width=2)
    commit(art, lay)
    dd = ImageDraw.Draw(art)
    text(dd, (72, 1548), "OPEN SOURCE · MIT", font(F_MONO, 22), LIME, spacing=2)
    text(dd, (1008, 1548), "github.com/aisac-id/sidebar-arcade", font(F_MONO, 22), DIM, anchor="ra")
    art.convert("RGB").save(os.path.join(PROMO, "poster-vertical.png"), quality=95)


# ---------------------------------------------------------------- store banners
def banner(w, h, compact=False):
    img = aurora_bg(w, h, seed=11)
    pad = int(w * 0.045)
    if compact:
        ms = int(h * 0.30)
        mark = Image.open(os.path.join(BRAND, "logo-mark.png")).convert("RGBA").resize((ms, ms), Image.LANCZOS)
        img.alpha_composite(glow(mark, CYAN, 14, 0.6), (pad, int(h * 0.08)))
        d = ImageDraw.Draw(img)
        ty = int(h * 0.08) + ms + 12
        ts = int(h * 0.17)
        text(d, (pad, ty), "SIDEBAR", fit_font(F_BOLD, "SIDEBAR", w * 0.60, ts), INK)
        text(d, (pad, ty + ts), "ARCADE", fit_font(F_BOLD, "ARCADE", w * 0.60, ts), CYAN)
        text(d, (pad, h - int(h * 0.14)), "115 game · offline", font(F_MONO, int(h * 0.072)), DIM)
        p = shot("promo-panel.png")
        ui = framed_shot(p, int(h * 0.84 * p.width / p.height), 10)
        img.alpha_composite(ui, (w - ui.width - pad, int(h * 0.5) - ui.height // 2))
        return img.convert("RGB")

    left = int(w * 0.055)
    colw = int(w * 0.44)
    ms = int(h * 0.24)
    mark = Image.open(os.path.join(BRAND, "logo-mark.png")).convert("RGBA").resize((ms, ms), Image.LANCZOS)
    img.alpha_composite(glow(mark, CYAN, 22, 0.6), (left, int(h * 0.13)))
    tx = left + ms + 24
    tw = colw - (tx - left)
    d = ImageDraw.Draw(img)
    text(d, (tx, int(h * 0.14)), "SIDEBAR", fit_font(F_BOLD, "SIDEBAR", tw, int(h * 0.15)), INK)
    text(d, (tx, int(h * 0.14) + int(h * 0.155)), "ARCADE", fit_font(F_BOLD, "ARCADE", tw, int(h * 0.15)), CYAN)
    text(d, (left, int(h * 0.46)), "115 game mini di side panel Chrome", fit_font(F_REG, "115 game mini di side panel Chrome", colw, int(h * 0.062)), DIM)
    x = left
    for label, col in (("PESAWAT", PINK), ("DINGDONG", AMBER), ("PUZZLE", LIME)):
        x += pill(img, x, int(h * 0.565), label, col, font(F_MONO, int(h * 0.038)), h=int(h * 0.078)) + 10
    d = ImageDraw.Draw(img)
    text(d, (left, int(h * 0.70)), "Offline · tanpa iklan · open source (MIT)", fit_font(F_MONO, "Offline · tanpa iklan · open source (MIT)", colw, int(h * 0.042)), DIM)
    text(d, (left, int(h * 0.80)), "github.com/aisac-id/sidebar-arcade", fit_font(F_MONO, "github.com/aisac-id/sidebar-arcade", colw, int(h * 0.048)), CYAN)
    ui = framed_shot(shot("promo-big.png"), int(w * 0.42), 16)
    img.alpha_composite(ui, (w - ui.width - left, int(h * 0.5) - ui.height // 2))
    return img.convert("RGB")


def build_banners():
    banner(440, 280, compact=True).save(os.path.join(PROMO, "store-small-440x280.png"))
    banner(1400, 560).save(os.path.join(PROMO, "store-marquee-1400x560.png"))
    banner(1200, 630).save(os.path.join(PROMO, "og-1200x630.png"))
    banner(1280, 640).save(os.path.join(PROMO, "social-wide-1280x640.png"))


def main():
    build_logo()
    build_box()
    build_hero()
    build_social()
    build_poster()
    build_banners()
    print("assets done")


if __name__ == "__main__":
    main()