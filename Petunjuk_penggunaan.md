# Panduan Rilis SIPERDIN BBPK JKT (GitHub & Vercel)

Dikarenakan aplikasi Anda telah dilepaskan dari Google Apps Script, Vercel mensyaratkan kode Anda harus tersimpan di **GitHub** agar mereka bisa melakukan perilisan (Deployment) dan pemberian Link URL Anda.

Berikut adalah panduan **TANPA INSTALASI TERMINAL**, Anda hanya perlu menggunakan Browser / Chrome.

## Langkah 1: Setup Akun dan Repositori di GitHub
1. Buka situs [GitHub.com](https://github.com/) dan buat akun menggunakan email Anda secara gratis.
2. Setelah berhasil masuk/Login, perhatikan ujung kanan atas layar. Klik logo **"+"** lalu pilih **"New repository"**.
3. Di halaman pembuatan:
   - **Repository Name**: Ketik `siperdin-app`
   - **Public/Private**: Biarkan berada pada **Public**.
   - Centang opsi **"Add a README file"** *(Wajib diceklis agar bisa langsung upload via web)*.
   - Klik tombol hijau **Create repository** di paling bawah.

## Langkah 2: Mengunggah `index.html` Anda
1. Anda sekarang akan berada di halaman repositori Anda (github.com/NamaAnda/siperdin-app).
2. Temukan dan klik tombol berukuran sedang yang bertuliskan **"Add file"**, lalu pilih **"Upload files"**.
3. Buka folder `SIPERDIN` Anda di Mac (`Documents > LOLOS LATSAR > SIPERDIN`).
   - *Catatan: Pastikan Anda telah menghapus `Kode.gs` jika masih membekas/terbaca dan memastikan file utamanya bernama `index.html` (tulisan kecil di awal).*
4. Tinggal **Seret (Drag)** file `index.html` tersebut ke dalam kotak abu-abu di layar GitHub Anda, tunggu hingga *loading* persen warna hiaju / biru terisi penuh.
5. Geser layar komputer Anda ke bawah, temukan kotak berjudul **"Commit changes"**, lalu klik tombol hijau **"Commit changes"**. Selamat! Kode Anda sudah sah tersimpan di server GitHub!

## Langkah 3: Menghubungkan GitHub dengan Vercel
1. Buka situs [Vercel.com](https://vercel.com/) dan pastikan Anda login dengan memilih opsi logonya **"Continue with GitHub"**. Vercel akan secara otomatis mengenali akun Anda.
2. Masuk ke halaman Dashboard Vercel Anda, lalu pilih tulisan **"Add New"** > pilih opsi **"Project"**.
3. Di layar berikutnya, Vercel akan otomatis membaca repositori di GitHub Anda. Cari nama `siperdin-app` yang baru kita buat, lalu klik tombol **"Import"** di sebelahnya.
4. Di halaman Configure Project:
   - Namanya biarkan sesuai, centang apapun dibiarkan saja.
   - Langsung klik tombol warna putih/tegas bertuliskaan **"Deploy"**.
5. Tunggu prosesnya berjalan (muncul cuplikan animasi bangunan). Setelah kurang dari 1 Menit, Vercel akan berucap **"Congratulations!"** dan langsung mempresentasikan alamat Link Web App Anda yang sudah siap Anda bagikan seumur hidup.

---
### Penting Mengenai Firebase Database:
- Ingat untuk memastikan bahwa sebelum Anda menyeret *file* menuju GitHub (di Langkah 2), bahwa file `index.html` tersebut **SUDAH ANDA ISI** di baris atasnya dengan `apiKey` Konfigurasi Firebase Project Anda. 
- Jika Anda terlupa, Anda cukup mengikuti Langkah 2 dan 3 lagi dengan upload file `index.html` versi terbaru, dan Vercel akan langsung berubah *realtime* detik itu juga.
