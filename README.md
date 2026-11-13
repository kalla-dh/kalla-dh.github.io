# Digital Haus – REVISI sesuai base website asli

## PENTING

- **index.html = base HTML asli** dari `kalla-dh.github.io-main.zip`. Semua markup, CSS, font, warna, animasi, gambar, layout dan komponen HOME berasal langsung dari file asli. Satu-satunya kode tambahan adalah jembatan navigasi ke halaman toko, tepat sebelum penutup `</body>`; tidak menyentuh tampilan homepage.
- **shop.html = halaman non-home yang dirapikan.** Isinya katalog, detail produk, About, FAQs, Contact, How to Buy, informasi dan kebijakan, dengan warna dan tipografi mengikuti base.
- **Katalog** = 30 pilihan produk, maksimal 10 per halaman, pagination dan pencarian/filter/sort.
- Link hash lama `#/import-3`, `#/import-10`, dst. diteruskan ke halaman baru sesuai produk dan tier yang diidentifikasi melalui kode Payhip pada base HTML.
- Tombol Home dari halaman toko **kembali ke index.html original**, bukan homepage buatan ulang.
- Data harga, benefit, Payhip, gambar produk: `shop-data.js` (data lokal). `showPrice` bisa disetel true/false per tier, **belum ada admin panel Supabase**.
- File `brand-identity.css` sengaja hanya diload pada `shop.html`, tidak pada homepage.

## Penggunaan

Unggah **seluruh isi folder** ke root repo GitHub Pages (jangan upload ZIP sebagai file tunggal). Sebaiknya backup repo dulu. `CNAME` dipertahankan.

Preview lokal: `python -m http.server 8000` di folder ini, lalu buka `http://localhost:8000/`.

## Catatan dan pemeriksaan

- Tidak ada deploy ke `digitalhaus.online` otomatis.
- Bagian *Choose Your Experience* pada homepage sengaja dibiarkan **100% original** untuk mencegah perubahan di luar batas instruksi terakhir. Jika ingin dibereskan lagi, lakukan perubahan khusus section tersebut setelah review.
- Harga belum sinkron otomatis dengan Payhip dan admin belum dibangun; angka di data lokal adalah harga uji coba.
- Script Meta Pixel yang ada di HTML base original tetap terbawa tanpa perubahan, termasuk cara pemuatannya. Tinjau consent tracking sebelum go-live untuk pengunjung UK.
- Halaman non-home adalah **rebuild frontend** dan beberapa teks informasinya perlu dicocokkan ulang dengan salinan HTML base sebelum publikasi karena versi rebuild terdahulu telah menulis ulang sejumlah deskripsi. Ini bukan konfirmasi kesetiaan konten 100%.
