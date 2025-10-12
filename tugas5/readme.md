# Dokumentasi Proyek CRUD Mahasiswa (Local Storage)

Proyek ini adalah aplikasi _Single Page Application_ (SPA) sederhana yang berfungsi untuk mengelola data mahasiswa (CRUD: _Create, Read, Update, Delete_). Data disimpan di **Local Storage** _browser_, bukan database server.

## 1\. Struktur File Proyek

```
/tugas-project-UTS_D121231087
|-- index.html          # halaman login
|-- dashboard.html      # halaman utama CRUD
|-- dashboard.js        # logika dari hamalan dashboard
|-- styles/
|   |-- Login.css       # style untuk halaman login
|   |-- dashboard.css   # style untuk halaman CRUD
|-- icons/
    |-- mata-terbuka.svg
    |-- mata-tertutup.svg
```

## 2\. Cara Menjalankan Proyek

1.  **Buka Folder:** Buka folder proyek.
2.  **Gunakan Live Server (Disarankan):** Jika menggunakan _Visual Studio Code_, instal ekstensi **Live Server**. Klik kanan pada file `index.html` dan pilih **Open with Live Server**.
3.  **Buka Langsung:** Alternatifnya, kita dapatlangsung mengklik dua kali (double-click) pada file `index.html`. (_Catatan: Untuk beberapa fitur seperti Impor/Ekspor File, Live Server lebih disarankan karena masalah CORS browser._)
4.  **tambahan:** untuk melakukan percobaan saya sudah menambahkan data dummy berupa file csv data mahasiswa di root project dan foto di folder `contoh_gambar`

### Kredensial Login (Default)

Untuk masuk ke `dashboard.html`, gunakan data _dummy_ yang telah diatur di `index.html`:

| Kunci          | Nilai           |
| :------------- | :-------------- |
| **Email**      | `tes@gmail.com` |
| **Kata Sandi** | `123456`        |

**Catatan:** setelah login maka data login akan disimmpan di local storage, maka jika user mencoba mengakses halaman dashboard sebelum melalukan login, maka secara otomatis akan diarahkan ke halaman login.

## 3\. Fitur Utama Aplikasi

| Fitur                  | Deskripsi                                                                                                        |
| :--------------------- | :--------------------------------------------------------------------------------------------------------------- |
| **CRUD Lengkap**       | Mampu menambah (_Simpan_), mengedit (_Update_), melihat, dan menghapus data mahasiswa.                           |
| **Validasi Data**      | Mencegah duplikasi NIM dan membatasi input IPK (0.00 - 4.00) dan ukuran foto (maks 5MB).                         |
| **Filter Multi-Kolom** | Filtering data secara _real-time_ berdasarkan Jurusan, Angkatan, dan _Search Keyword_.                           |
| **Pagination & Limit** | Membagi tampilan data menjadi halaman-halaman (default 10 baris per halaman).                                    |
| **Statistik Ringkas**  | Menampilkan Total Data, Rata-rata IPK, dan Rincian Jumlah per Jurusan di bawah form.                             |
| **Impor & Ekspor**     | Ekspor ke **CSV** dan **JSON**, serta Impor data dari file **CSV/Excel** (_xlsx_).                               |
| **Adaptasi Tombol**    | Tombol _Simpan_ berubah menjadi _Update_ secara otomatis saat mode edit diaktifkan.                              |
| **Print-Ready**        | Fungsi **Print Data** membersihkan _form_, _filter_, dan _tombol aksi_ agar hanya tabel data inti yang tercetak. |

## 4\. Dependensi Pihak Ketiga (Third-Party Libraries)

Proyek ini menggunakan satu _library_ eksternal yang dimuat melalui CDN.

| Library                        | Fungsi                    | Kegunaan dalam Proyek                                                                                      |
| :----------------------------- | :------------------------ | :--------------------------------------------------------------------------------------------------------- |
| **SheetJS (xlsx.full.min.js)** | Membaca data spreadsheet. | Digunakan untuk mengurai (parse) data dari file **CSV** dan **Excel (.xlsx)** saat fitur Impor dijalankan. |

**Catatan:** Pastikan _browser_ Anda memiliki akses internet saat pertama kali memuat proyek untuk mengunduh pustaka **SheetJS** ini.
