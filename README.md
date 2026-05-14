# SIPERDIN — Sistem Informasi Perjalanan Dinas BBPK Jakarta

Aplikasi web SPA (Single Page Application) untuk manajemen klaim perjalanan dinas pegawai BBPK Jakarta.
Dideploy di **Vercel** dengan backend **Google Apps Script + Google Sheets + Google Drive**.

---

## 🗂️ Changelog

### v1.0.1 — Patch (14 Mei 2026)
**Penambahan Fitur Menu Pegawai:**
- ✅ Tombol **"Lihat Contoh Dokumen SPD"** di samping ceklist SPD (link ke Google Sheets contoh)
- ✅ Ceklist baru **Boarding Pass** (opsional) + upload file
- ✅ Ceklist baru **Laporan Perjalanan Dinas** (opsional) + upload file + tombol **"Lihat Contoh Laporan PD"** (link ke Google Docs contoh)

**Sinkronisasi Database (Google Sheets):**
- ✅ Kolom baru: `linkBoardingPass` — menyimpan link Google Drive file boarding pass
- ✅ Kolom baru: `linkLaporanPD` — menyimpan link Google Drive file laporan perjalanan dinas
- ✅ `Kode.gs` diperbarui untuk memetakan kedua file baru ke payload dan spreadsheet

**Tampilan:**
- ✅ Badge versi **v1.0.1** di navbar dan footer
- ✅ Link Boarding Pass & Laporan PD tampil di kolom Dokumen Masuk tabel Admin (warna ungu)
- ✅ Fungsi cetak/download laporan diperluas dengan link dokumen baru

---

### v1.0.0 — Rilis Awal
- Form pengajuan klaim perjalanan dinas (Surat Tugas, SPD, Kwitansi Hotel, Kwitansi Transportasi)
- Panel Admin dengan login, update status, nominal klaim, dan pencarian nama
- Tracking status alur keuangan (PJ Keuangan → Selesai)
- Upload dokumen ke Google Drive, data tersimpan di Google Sheets
- Fitur cetak laporan PDF per pegawai

---

## 📁 Struktur File
| File | Keterangan |
|---|---|
| `Index.html` | Aplikasi utama (frontend + logika JS) |
| `Kode.gs` | Google Apps Script backend (insert, update, getAll, search) |
| `README.md` | Dokumentasi & changelog |
| `Petunjuk_penggunaan.md` | Panduan penggunaan untuk pegawai & admin |

---

## ⚙️ Cara Deploy Ulang Apps Script
1. Buka Google Sheets database → **Extensions → Apps Script**
2. Paste kode terbaru dari `Kode.gs`
3. Klik **Deploy → Manage Deployments → Edit → New version → Deploy**
4. Salin URL deployment baru dan update di `Index.html` pada variabel `GOOGLE_SCRIPT_URL`
