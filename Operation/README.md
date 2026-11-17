# Operation — Sidebar Arcade

Knowledge base komersial & operasional untuk **Sidebar Arcade** — ekstensi Chrome Manifest V3 berisi 115 game mini yang berjalan di Chrome Side Panel, sepenuhnya offline, tanpa akun, tanpa iklan, dan tanpa backend. Dokumen-dokumen di bawah diterbitkan oleh **PT. Sainskerta Solusi Nusantara** (software house & AI partner, sejak 2013; Gedung Graha Mampang Lt. 3, Jakarta Selatan) sebagai basis kerja Divisi Produk & Komersial untuk lini ini, dan disusun dari kondisi repository `aisac-id/sidebar-arcade` versi 2.1.0.

> **Catatan penting.** Seluruh harga, target konversi, ambang keberhasilan, nilai RTO/RPO, dan proyeksi dalam dokumen di sini berstatus **usulan — perlu validasi manajemen** sebelum dipakai dalam penawaran ke klien atau kontrak. Setiap klaim fitur merujuk pada berkas nyata di repository (`README.md`, `manifest.json`, `src/registry.js`, `src/app.js`, `src/lib/`, `src/games/`, `src/packs/`, `promo/`, `tools/`), dan kompetitor yang dibandingkan adalah produk nyata dengan URL sumber.

## 01-Business-Strategy

| Dokumen | Isi |
|---|---|
| [01-Business-Model-Canvas](01-Business-Strategy/01-Business-Model-Canvas.docx) | Sembilan blok model bisnis open-core & risiko lisensi MIT |
| [02-ICP-dan-Segmentasi-Pasar](01-Business-Strategy/02-ICP-dan-Segmentasi-Pasar.docx) | Segmen Korporat Wellness & Prosumer Fokus |
| [03-Analisis-Kompetitor](01-Business-Strategy/03-Analisis-Kompetitor.docx) | Ekstensi game sidebar, portal browser, alat jeda kerja |
| [04-Analisis-SWOT](01-Business-Strategy/04-Analisis-SWOT.docx) | Kekuatan teknis, kelemahan distribusi, risiko IP |

## 02-Sales

| Dokumen | Isi |
|---|---|
| [05-Proposal-Penjualan-B2B-Korporat-Wellness](02-Sales/05-Proposal-Penjualan-B2B-Korporat-Wellness.docx) | Program jeda kerja untuk organisasi |
| [05-Proposal-Penjualan-B2C-Prosumer-Fokus](02-Sales/05-Proposal-Penjualan-B2C-Prosumer-Fokus.docx) | Lisensi paket untuk pekerja digital |
| [06-Statement-of-Work](02-Sales/06-Statement-of-Work.docx) | Lingkup, deliverable, jadwal, termin pembayaran |
| [07-Pricing-dan-Packaging](02-Sales/07-Pricing-dan-Packaging.docx) | Paket B2C, B2B, pendidikan, OEM & kebijakan diskon |
| [08-Sales-Playbook-dan-Battlecard](02-Sales/08-Sales-Playbook-dan-Battlecard.docx) | Jalur jual, talk track, penanganan keberatan |
| [09-Product-Datasheet](02-Sales/09-Product-Datasheet.docx) | Spesifikasi, katalog, izin, dan batas produk |

## 03-Pre-Sales

| Dokumen | Isi |
|---|---|
| [10-Discovery-Questionnaire](03-Pre-Sales/10-Discovery-Questionnaire.docx) | Prakualifikasi browser, kebijakan, konten, pengadaan |
| [11-Demo-Script-dan-PoC-Plan](03-Pre-Sales/11-Demo-Script-dan-PoC-Plan.docx) | Skrip demo 20 menit & kriteria sukses PoC |
| [12-Technical-Proposal](03-Pre-Sales/12-Technical-Proposal.docx) | Arsitektur rujukan, varian, uji penerimaan |
| [13-ROI-dan-Business-Case](03-Pre-Sales/13-ROI-dan-Business-Case.docx) | Biaya, penghindaran risiko, batasan klaim |

## 04-IT-Communication

| Dokumen | Isi |
|---|---|
| [14-Arsitektur-Solusi](04-IT-Communication/14-Arsitektur-Solusi.docx) | Perspektif proses, runtime, data, distribusi |
| [15-Arsitektur-Keamanan-dan-Threat-Model](04-IT-Communication/15-Arsitektur-Keamanan-dan-Threat-Model.docx) | Sepuluh ancaman nyata & kontrol rantai pasok |
| [16-Privasi-Data-dan-Kepatuhan](04-IT-Communication/16-Privasi-Data-dan-Kepatuhan.docx) | Posisi UU PDP, formulir toko, kategori Luck |

## 05-Resilience-Operations

| Dokumen | Isi |
|---|---|
| [17-Business-Continuity-Plan](05-Resilience-Operations/17-Business-Continuity-Plan.docx) | Kontinuitas rilis, kanal toko, dukungan |
| [18-Disaster-Recovery-Plan](05-Resilience-Operations/18-Disaster-Recovery-Plan.docx) | Pemulihan repo, build, akun developer, aset |
| [19-SOP-Insiden-dan-Breach-Response](05-Resilience-Operations/19-SOP-Insiden-dan-Breach-Response.docx) | Deteksi s.d. notifikasi & retrospective |
| [20-SLA-dan-Model-Dukungan](05-Resilience-Operations/20-SLA-dan-Model-Dukungan.docx) | Jenjang layanan, target tiket, pengecualian |

## Cara Memakai Folder Ini

1. Mulai dari `01-Business-Strategy` untuk menetapkan segmen dan posisi sebelum menyusun penawaran.
2. Ambil dokumen `05` sesuai segmen peluang, lalu lengkapi `10-Discovery-Questionnaire` sebelum demo.
3. Gunakan `15` dan `16` sebagai jawaban awal tinjauan keamanan klien; keduanya dapat diverifikasi dari `manifest.json`.
4. Rujuk `17`–`20` saat menyusun kontrak dukungan; jangan menjanjikan angka yang belum divalidasi manajemen.

Tiga hal yang harus dinyatakan jujur kepada klien maupun internal: produk ini tidak memiliki backend sehingga tidak ada klaim analitik, sinkronisasi, atau leaderboard; lisensi MIT membuat sumber dapat di-clone siapa pun sehingga nilai jual ada pada build resmi, kurasi, dan dukungan; serta sebagian judul memakai nama yang identik dengan merek pihak ketiga sehingga normalisasi katalog diperlukan sebelum komersialisasi publik.

---

© 2026 PT. Sainskerta Solusi Nusantara · hello@sainskerta.id · sainskerta.net
