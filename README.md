# Kopi Lereng — toko online contoh

Toko online untuk roastery kopi fiktif, dibuat sebagai contoh portofolio jasa pembuatan website. Tanpa framework dan tanpa proses build: cukup HTML, CSS, dan JavaScript biasa, sehingga bisa langsung di-hosting gratis di Vercel.

## Fitur

- Katalog 10 produk dengan filter kategori, pencarian (nama, asal, atau rasa), dan pengurutan
- Detail produk: pilihan berat, jenis gilingan, dan jumlah
- Keranjang belanja yang tersimpan di browser (tidak hilang saat halaman di-refresh)
- Checkout tanpa akun: pesanan dikirim ke WhatsApp admin dengan rincian lengkap dan nomor pesanan
- Grafik ketinggian kebun yang bisa diklik
- Ilustrasi kemasan dibuat dengan SVG (tanpa file gambar), unik per produk
- Responsif di HP, mode gelap otomatis, bisa dipakai dengan keyboard

## Struktur

```
index.html      halaman utama
styles.css      seluruh tampilan
js/products.js  data toko: produk, harga, nomor WhatsApp
js/app.js       logika katalog, keranjang, checkout
favicon.svg     ikon tab browser
vercel.json     pengaturan Vercel
```

## Mengubah isi toko

Semua data ada di `js/products.js`:

- Nomor WhatsApp: ubah `STORE.whatsapp` (format `628xxxxxxxxxx`, tanpa tanda +)
- Produk dan harga: ubah atau tambah objek di `PRODUCTS`. Warna kemasan diatur lewat `color` dan `accent`.

## Deploy ke Vercel

**Cara 1, lewat GitHub (disarankan, otomatis update setiap ada perubahan)**

1. Buat repository baru di GitHub, lalu unggah semua file di folder ini.
2. Masuk ke vercel.com dengan akun GitHub.
3. Klik **Add New → Project**, pilih repository tadi.
4. Framework Preset: biarkan **Other**. Tidak perlu build command.
5. Klik **Deploy**. Dalam sekitar satu menit situs sudah online di alamat `nama-proyek.vercel.app`.

**Cara 2, lewat terminal**

```bash
npm i -g vercel
cd kopi-lereng
vercel        # pertama kali: ikuti pertanyaannya
vercel --prod # terbitkan versi final
```

## Mencoba di komputer sendiri

Buka `index.html` langsung di browser, atau jalankan server lokal:

```bash
npx serve .
```

---

Toko ini fiktif. Nama, alamat, dan nomor WhatsApp hanyalah contoh.
