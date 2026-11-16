# Promotion kit — Sidebar Arcade

Aset promosi siap pakai. Semua sudah pakai **screenshot asli extension** (bukan mock karangan), dan tipografinya digambar ulang supaya tajam serta bebas salah eja.

## Isi

### Logo & ikon (`../brand/`, `../icons/`)
- `logo-mark.png` — logo utama 1024×1024, latar transparan, sudut membulat.
- `logo-mark-glow.png` — versi neon glow 512×512 untuk latar gelap.
- `wordmark.png` — teks "SIDEBAR / ARCADE" transparan.
- `logo-lockup.png` — lockup logo + tagline.
- `box-front.png` — muka software box versi flat 704×992.
- `icons/icon16.png`, `icon32.png` — pixel-art digambar ulang agar tetap terbaca di toolbar; `icon48/128/512` dari logo utama.

### Poster & banner (`./`)
| File | Ukuran | Pakai untuk |
|------|--------|-------------|
| `poster-hero.png` | 1792×1024 | header repo, banner artikel, thumbnail video |
| `poster-vertical.png` | 1080×1620 | story, poster cetak, pin |
| `social-square.png` | 1080×1080 | Instagram / feed |
| `social-wide-1280x640.png` | 1280×640 | X / LinkedIn |
| `og-1200x630.png` | 1200×630 | Open Graph / Twitter card |
| `store-marquee-1400x560.png` | 1400×560 | Chrome Web Store marquee |
| `store-small-440x280.png` | 440×280 | Chrome Web Store small tile |
| `software-box.png` | 1400×1560 | render box 3D (muka + punggung + tutup) |

### Video (1 file)
- `sidebar-arcade-promo.mp4` — 1920×1080, 30 fps, 8 detik, H.264 + AAC (ada musik/ambience).
  Latar aurora & grid bergerak, gameplay pesawat di jendela kanan hidup, sementara logo dan tipografi di-composite terpisah supaya tetap tajam sepanjang video.
- `video-poster.jpg` — frame poster untuk thumbnail/player.

## Palet

| Peran | Hex |
|-------|-----|
| Background | `#070a12` |
| Surface | `#0c1220` |
| Cyan (dominan) | `#4ee1ff` |
| Violet | `#a78bfa` |
| Pink | `#ff6bd6` |
| Lime | `#a3e635` |
| Amber | `#fbbf24` |
| Red | `#fb7185` |
| Ink | `#e7ecf7` |
| Dim | `#8b96b3` |

## Copy siap tempel

**Pendek (ID)**
> 115 game mini di side panel Chrome. Pesawat, dingdong, puzzle — offline, tanpa iklan. Main sambil nunggu agent kerja. 🕹️

**Pendek (EN)**
> 115 instant games inside Chrome's side panel. Shooters, slots, puzzles — fully offline, no ads. Open source (MIT).

**Tagline**: `Nunggu agent kerja? Main dulu.`

**Hashtag**: `#ChromeExtension #OpenSource #Arcade #IndieDev #115Games`

**Link**: https://github.com/aisac-id/sidebar-arcade

## Bangun ulang aset

Butuh Python 3 + Pillow + numpy (dan `ffmpeg` untuk merakit video):

```bash
python3 tools/build_assets.py         # logo, ikon, box, poster, banner
python3 tools/build_video_frames.py   # frame dasar + overlay teks video
```

`build_assets.py` membaca art dari image generator dan screenshot asli extension, lalu menggambar ulang tipografi, ikon vektor, pill, grid kategori, dan box 3D (transform perspektif) secara deterministik.

## Lisensi

Aset promosi ini ikut lisensi [MIT](../LICENSE) repo — bebas dipakai, diubah, dan dibagikan.