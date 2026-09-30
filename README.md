# RGOADTERM

RGOADTERM adalah aplikasi terminal untuk Windows yang menyediakan antarmuka desktop dengan pilihan PowerShell dan Command Prompt (CMD).

## Unduh dan instal

1. Buka halaman repositori RGOADTERM di GitHub.
2. Pilih **Releases**.
3. Buka rilis terbaru, lalu cari bagian **Assets**.
4. Unduh file installer bernama seperti `RGOADTERM-1.0.0-Setup.exe`. Nomor versi pada nama file dapat berubah pada rilis berikutnya.
5. Setelah unduhan selesai, buka file `.exe` dan ikuti petunjuk instalasi. Anda dapat memilih lokasi pemasangan. Installer juga dapat membuat pintasan Desktop dan Start Menu.
6. Jalankan **RGOADTERM** dari pintasan atau menu Start.

File `.exe` pada Releases adalah **installer**, bukan versi portable. Jangan mengunduh file installer dari sumber selain halaman Releases resmi proyek. Jika bagian **Releases** belum memiliki rilis atau bagian **Assets** belum berisi installer, berarti file unduhan belum dipublikasikan.

Untuk menghapus aplikasi, buka **Settings > Apps > Installed apps** di Windows, pilih **RGOADTERM**, lalu pilih **Uninstall**.

## Fitur

- Menjalankan PowerShell atau Windows Command Prompt (CMD).
- Membuka beberapa tab terminal.
- Terminal berbasis xterm.js.
- Antarmuka jendela khusus dengan kontrol minimize, maximize, dan close.
- Pintasan aplikasi Desktop dan Start Menu saat instalasi.

## Persyaratan

- Windows 10 atau Windows 11.
- Node.js 20 atau versi lebih baru hanya diperlukan jika Anda ingin menjalankan atau membangun aplikasi dari source code.

Pengguna installer Release tidak perlu memasang Node.js secara terpisah.

## Menjalankan dari source code

Pastikan Node.js sudah terpasang, lalu jalankan perintah berikut dari folder proyek:

```cmd
npm install
npm start
```

## Membuat installer Windows

Dari folder proyek, jalankan:

```cmd
npm install
npm run build
```

Installer akan dibuat di folder `dist` dengan nama seperti `RGOADTERM-1.0.0-Setup.exe`. Folder `dist` sengaja tidak disertakan dalam source repository. Untuk membagikan installer, unggah file `.exe` hasil build sebagai **asset** pada GitHub Release, bukan sebagai commit source biasa.

## Lisensi

Proyek ini menggunakan lisensi MIT. Lihat berkas `package.json` untuk informasi metadata lisensi.