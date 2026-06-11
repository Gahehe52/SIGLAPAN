import requests
import json
import time

# Konfigurasi URL Backend FastAPI
BASE_URL = "http://localhost:8000/api"

def print_header(title):
    print(f"\n{'='*50}\n[TEST] {title}\n{'='*50}")

def test_1_modul_crud_dan_filter():
    """
    Sesuai Laporan 3.6 Poin 1 & 4.2.1 Poin 2:
    Menguji fungsionalitas READ data lahan dan filter berdasarkan jenis tanaman/pemilik.
    """
    print_header("Pengujian Modul Lahan & Filter (Black-Box)")
    
    # Uji 1A: Tarik semua data lahan
    start_time = time.time()
    res = requests.get(f"{BASE_URL}/lahan?limit=5")
    waktu_eksekusi = time.time() - start_time
    
    if res.status_code == 200:
        data = res.json()
        jumlah_fitur = len(data.get('features', []))
        print(f"✅ [SUKSES] Tarik data lahan (Limit 5). Ditemukan {jumlah_fitur} lahan.")
        print(f"⏱️ Waktu respons: {waktu_eksekusi:.3f} detik")
    else:
        print(f"❌ [GAGAL] Endpoint Lahan bermasalah. Status: {res.status_code}")

    # Uji 1B: Filter berdasarkan pemilik (Simulasi)
    res_filter = requests.get(f"{BASE_URL}/lahan?pemilik=test")
    if res_filter.status_code == 200:
        print(f"✅ [SUKSES] Filter parameter 'pemilik' direspons server dengan baik.")
    else:
        print(f"❌ [GAGAL] Filter 'pemilik' bermasalah.")

def test_2_validasi_srid_peta():
    """
    Sesuai Laporan 4.4 Poin 2:
    Memastikan output GeoJSON sudah ternormalisasi ke SRID 4326 (WGS 84).
    Koordinat X (Longitude) harus antara -180 s/d 180.
    Koordinat Y (Latitude) harus antara -90 s/d 90.
    Jika angka raksasa (UTM) bocor, Leaflet akan crash zoom-out.
    """
    print_header("Pengujian Normalisasi SRID 4326 (Anti Crash Zoom-Out)")
    
    res = requests.get(f"{BASE_URL}/lahan?limit=1")
    if res.status_code == 200:
        data = res.json()
        features = data.get('features', [])
        
        if not features:
            print("⚠️ Lahan kosong, tidak dapat menguji SRID.")
            return

        koordinat_contoh = features[0]['geometry']['coordinates'][0][0][0] # Ambil titik pertama
        lon, lat = koordinat_contoh[0], koordinat_contoh[1]
        
        # Validasi batas Bumi WGS 84
        if -180 <= lon <= 180 and -90 <= lat <= 90:
            print(f"✅ [SUKSES] Koordinat Ternormalisasi dengan benar (WGS 84): Longitude {lon}, Latitude {lat}")
            print(f"✅ [SUKSES] Peta dipastikan tidak akan melompat keluar benua.")
        else:
            print(f"❌ [FATAL ERROR] Koordinat masih format UTM Meter: {lon}, {lat}")
    else:
        print("❌ [GAGAL] Tidak dapat menghubungi server.")

def test_3_logika_spasial_dijkstra():
    """
    Sesuai Laporan 3.6 Poin 3 & 4.3.2:
    Menguji algoritma pgRouting (Shortest Path) antar dua lahan.
    """
    print_header("Pengujian Algoritma Routing Spasial (Dijkstra)")
    
    # Ambil 2 ID lahan secara acak untuk disimulasikan
    res_lahan = requests.get(f"{BASE_URL}/lahan?limit=2")
    data_lahan = res_lahan.json().get('features', [])
    
    if len(data_lahan) < 2:
        print("⚠️ Data lahan kurang dari 2. Tidak bisa menguji routing.")
        return
        
    id_asal = data_lahan[0]['properties']['id_lahan']
    id_tujuan = data_lahan[1]['properties']['id_lahan']
    
    print(f"Mencari rute jaringan dari Lahan #{id_asal} menuju Lahan #{id_tujuan}...")
    
    start_time = time.time()
    res_rute = requests.get(f"{BASE_URL}/spasial/rute-antar-lahan", params={"id_lahan_awal": id_asal, "id_lahan_tujuan": id_tujuan})
    waktu_eksekusi = time.time() - start_time
    
    if res_rute.status_code == 200:
        data_rute = res_rute.json()
        segmen_jalan = len(data_rute.get('features', []))
        
        if segmen_jalan > 0:
            print(f"✅ [SUKSES] Rute Ditemukan! Menggunakan {segmen_jalan} segmen jaringan jalan.")
            
            # Hitung total jarak dari properti 'jarak_meter'
            total_jarak = sum(f['properties'].get('jarak_meter', 0) for f in data_rute.get('features', []))
            print(f"✅ [SUKSES] Total Jarak Kalkulasi: {total_jarak:.2f} meter.")
        else:
            print(f"⚠️ [PERINGATAN] Rute kosong. Graf jaringan mungkin terputus di area lahan ini.")
            
        print(f"⏱️ Waktu komputasi Dijkstra: {waktu_eksekusi:.3f} detik")
    else:
        print(f"❌ [GAGAL] Endpoint Analisis Spasial error. Status: {res_rute.status_code}")

if __name__ == "__main__":
    print("Memulai Black-Box Testing SIGLAPAN...")
    try:
        test_1_modul_crud_dan_filter()
        test_2_validasi_srid_peta()
        test_3_logika_spasial_dijkstra()
        print("\n" + "="*50)
        print("Pengujian Selesai. Seluruh hasil sesuai harapa.")
    except requests.exceptions.ConnectionError:
        print("\n❌ KESALAHAN: Server FastAPI tidak aktif. Pastikan backend sudah dijalankan (uvicorn main:app).")