# 🌾 SIGLAPAN (Sistem Informasi Lahan Pertanian) - WebGIS

SIGLAPAN adalah sebuah aplikasi Sistem Informasi Geografis Berbasis Web (WebGIS) yang dirancang untuk memetakan, memanajemen, dan menganalisis secara spasial distribusi lahan pertanian di wilayah Kota Tangerang. Sistem ini mengintegrasikan pemetaan digital interaktif dengan algoritma komputasi graf jarak terpendek (*Shortest Path Routing*) menggunakan data satelit riil.

Aplikasi ini dikembangkan oleh **Kelompok Proyek WebGIS - Program Studi Teknik Informatika, Institut Teknologi Sumatera (ITERA)**.

---

## ✨ Fitur Utama

1. **🗺️ Peta Interaktif & Filter Geospasial**
   Menampilkan hamparan batas lahan pertanian dalam bentuk poligon secara dinamis menggunakan Leaflet. Dilengkapi dengan *Dynamic Tooltip* saat kursor diarahkan ke lahan (tanpa perlu klik) dan fitur pencarian kluster lahan berbasis *Auto-Zoom Fit Bounds*.
2. **🧭 True No-Fail Spatial Routing (Dijkstra Multi-Node Scanner)**
   Fitur navigasi cerdas antar-lahan pertanian yang dijamin 100% terhubung. Backend mengeksekusi algoritma *pgRouting Dijkstra* dengan memindai 10 persimpangan aktif terdekat, menghindari segmen jalan buntu, dan menarik garis akses (*driveway*) secara otomatis dari tengah lahan ke jalan aspal/tanah terdekat.
3. **✏️ Map Drawing & Auto-WKT Extraction**
   Administrator tidak perlu mengetik koordinat manual. Cukup klik batas-batas kebun di atas peta mini, dan sistem akan secara otomatis merajutnya menjadi format *Well-Known Text* (WKT) Poligon.
4. **🧮 Otomatisasi Kalkulasi Spasial**
   Luas lahan tidak diinput manual. Database secara otomatis menghitung luas area absolut dalam satuan meter persegi (m²) menggunakan fungsi spasial `ST_Area` setiap kali poligon baru digambar.
5. **🔐 Role-Based Access Control (RBAC) & Modal Login**
   Sistem membedakan akses antara *Guest Mode* (hanya bisa melihat peta dan menganalisis rute) dan *Administrator Mode* (akses penuh ke fitur Tambah, Edit, dan Hapus data melalui *overlay* login yang elegan).
6. **📊 Dashboard Statistik**
   Menyajikan ringkasan eksekutif berupa total area lahan, jumlah persil, dan distribusi komoditas tanaman di Kota Tangerang.

---

## 🛠️ Teknologi yang Digunakan

### Frontend (Client-Side)
* **ReactJS & Vite:** Kerangka kerja utama dan *build tool* berkecepatan tinggi.
* **Tailwind CSS:** *Framework* styling untuk antarmuka yang bersih dan modern.
* **React-Leaflet & Leaflet.js:** Pustaka *rendering* kanvas peta digital dan geometri GeoJSON.
* **Axios:** Klien HTTP untuk integrasi REST API.
* **Lucide React:** Sistem ikon SVG minimalis.

### Backend (Server-Side)
* **FastAPI (Python):** *Framework* backend asinkron berperforma tinggi.
* **Pydantic:** Validasi skema data dan *payload* otomatis.
* **Uvicorn:** Server ASGI untuk menjalankan aplikasi FastAPI.

### Database (Data Layer)
* **PostgreSQL:** Sistem manajemen basis data relasional.
* **PostGIS:** Ekstensi pengolah tipe data spasial (Geometry, WKT, GeoJSON).
* **pgRouting:** Ekstensi komputasi topologi jaringan dan algoritma *routing* (Dijkstra).
* *Catatan: Sistem ini dirancang kompatibel dengan database cloud seperti Neon.tech.*

---

## 🚀 Panduan Instalasi & Konfigurasi

### 1. Prasyarat Sistem
Pastikan perangkat Anda telah terinstal:
* Node.js (v16 atau lebih baru)
* Python (v3.9 atau lebih baru)
* PostgreSQL (dengan ekstensi PostGIS & pgRouting aktif)

### 2. Konfigurasi Basis Data
1. Buat database baru di PostgreSQL.
2. Buka *Query Tool* atau pgAdmin, lalu jalankan seluruh skrip SQL yang terdapat di dalam file `schema_final.sql`. Skrip ini akan membuat tabel, relasi, *trigger* perhitungan luas otomatis, serta mengaktifkan ekstensi spasial.

### 3. Instalasi Backend (FastAPI)
1. Buka terminal dan navigasikan ke folder direktori backend.
2. Buat *virtual environment* (opsional namun disarankan):
```bash
   python -m venv venv
   source venv/bin/activate  # Untuk Linux/Mac
   venv\Scripts\activate     # Untuk Windows

```

3. Instal pustaka yang dibutuhkan:

```bash
   pip install fastapi uvicorn psycopg2-binary pydantic requests

```

4. Jalankan *script* `tambah_jalan_lokal.py` untuk mengunduh puluhan ribu data jaringan jalan OpenStreetMap dan membangun topologi *routing*:

```bash
   python tambah_jalan_lokal.py

```

5. Jalankan server lokal FastAPI:

```bash
   uvicorn main:app --reload

```

*Backend akan berjalan di `http://localhost:8000`. Dokumentasi API dapat diakses di `http://localhost:8000/docs`.*

### 4. Instalasi Frontend (React)

1. Buka terminal baru dan navigasikan ke folder direktori frontend (`frontend_siglapan`).
2. Instal dependensi Node.js:

```bash
   npm install

```

3. Jalankan server pengembangan Vite:

```bash
   npm run dev

```

4. Buka tautan yang muncul di terminal (biasanya `http://localhost:5173`) pada peramban Anda.

---

## 🔒 Akses Default Administrator

Untuk menguji fungsionalitas CRUD (Tambah, Edit, Hapus) dan *Map Drawing*, silakan klik tombol **"Login Akses"** di pojok kanan atas aplikasi dengan kredensial berikut:

* **Username:** `admin`
* **Password:** `siglapan123`

---

## 🧪 Pengujian Sistem (Black-Box Testing)

Untuk memvalidasi normalisasi SRID (anti-*crash zoom-out*), waktu respons modul CRUD, dan keakuratan algoritma Dijkstra:

1. Pastikan server Backend sedang menyala.
2. Jalankan skrip pengujian bawaan di terminal backend:

```bash
   python test_pengujian_sistem.py

```

---

## 📄 Lisensi

Proyek ini dibuat untuk keperluan tugas akademik dan pengembangan ilmu pengetahuan (Open-Source Akademik). Penggunaan data satelit tunduk pada lisensi dasar *OpenStreetMap contributors*.

```
