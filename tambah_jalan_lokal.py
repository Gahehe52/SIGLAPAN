import psycopg2
import requests
from database import get_db_connection

def tambah_jalan_lokal():
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        print("1. Melacak koordinat lahan dan membuat kluster pencarian spasial...")
        # Ambil koordinat centroid lahan
        cur.execute("SELECT ST_Y(ST_Transform(ST_Centroid(geom), 4326)) as lat, ST_X(ST_Transform(ST_Centroid(geom), 4326)) as lon FROM lahan;")
        titik_lahan = cur.fetchall()

        if not titik_lahan:
            print("Tidak ada data lahan.")
            return

        # ALGORITMA KLASTERING: Membulatkan koordinat ke 2 angka desimal (Grid ~1.1 km persegi)
        # Ribuan titik yang berdekatan akan disatukan menjadi 1 titik pusat grid
        grid_koordinat = set()
        for pt in titik_lahan:
            lat_grid = round(pt['lat'], 2)
            lon_grid = round(pt['lon'], 2)
            grid_koordinat.add((lat_grid, lon_grid))

        print(f"   -> Dari {len(titik_lahan)} hamparan lahan, berhasil disederhanakan menjadi hanya {len(grid_koordinat)} kluster zona!")
        print("2. Mengunduh data jalan desa/tanah dari server satelit (Mohon tunggu sekitar 15-30 detik)...")

        overpass_url = "https://overpass-api.de/api/interpreter"
        
        # Kita gunakan radius pencarian 1500 meter di setiap titik pusat zona
        query_parts = []
        for lat, lon in grid_koordinat:
            # Mengambil jalan kecil, jalan desa, jalan setapak, dan rute traktor
            query_parts.append(f'way["highway"~"unclassified|residential|service|track|path|tertiary"](around:1500,{lat},{lon});')
        
        gabungan_query = "\n".join(query_parts)
        
        overpass_query = f"""
        [out:json][timeout:300];
        (
        {gabungan_query}
        );
        out geom;
        """

        headers = {
            'User-Agent': 'SIGLAPAN-ITERA-Project/1.0',
            'Accept': 'application/json'
        }
        
        # Menambah waktu tunggu timeout agar tidak putus di tengah jalan
        response = requests.post(overpass_url, data={'data': overpass_query}, headers=headers, timeout=300)

        if response.status_code != 200:
            print(f"Gagal mengakses API Satelit (HTTP {response.status_code})")
            print(response.text[:500])
            return

        try:
            osm_data = response.json()
        except ValueError:
            print("Gagal mengurai respons dari server:")
            print(response.text[:500])
            return

        elements = osm_data.get('elements', [])
        
        if not elements:
            print("Server Overpass tidak mengembalikan data jalan. Coba jalankan ulang skrip ini.")
            return
            
        berhasil = 0
        seen_ways = set()
        
        for el in elements:
            way_id = el.get('id')
            if way_id in seen_ways:
                continue
            seen_ways.add(way_id)
            
            if el['type'] == 'way' and 'geometry' in el:
                pts = []
                for pt in el['geometry']:
                    pts.append(f"{pt['lon']} {pt['lat']}")

                if len(pts) >= 2:
                    wkt = f"LINESTRING({', '.join(pts)})"
                    tags = el.get('tags', {})
                    nama = tags.get('name', 'Jalan Lokal/Tanah')
                    tipe = tags.get('highway', 'Jalan Lokal')

                    query = """
                        INSERT INTO jalan (nama_jalan, tipe_jalan, geom)
                        VALUES (%s, %s, ST_Transform(ST_SetSRID(ST_GeomFromText(%s), 4326), 32748))
                    """
                    cur.execute(query, (nama, tipe, wkt))
                    berhasil += 1

        conn.commit()
        print(f"   -> SUKSES! {berhasil} ruas jalan lokal/kecil berhasil disuntikkan ke database.")

        print("\n3. Menyambungkan jalan lokal dengan jalan raya utama (Rebuild pgRouting Topology)...")
        # 1. Hapus topologi lama yang cacat
        cur.execute("DROP TABLE IF EXISTS jalan_vertices_pgr CASCADE;")
        
        # 2. Pastikan kolom graf tersedia
        cur.execute("ALTER TABLE jalan ADD COLUMN IF NOT EXISTS source integer;")
        cur.execute("ALTER TABLE jalan ADD COLUMN IF NOT EXISTS target integer;")
        cur.execute("ALTER TABLE jalan ADD COLUMN IF NOT EXISTS cost double precision;")
        
        # 3. Hitung ulang bobot jarak (meter) dari seluruh jalan yang baru
        cur.execute("UPDATE jalan SET cost = ST_Length(geom);")
        
        # 4. Bangun ulang persimpangan dengan toleransi akurasi 5 meter
        cur.execute("SELECT pgr_createTopology('jalan', 5.0, 'geom', 'id_jalan', clean := true);")
        
        conn.commit()
        print("   -> Algoritma Graf Dijkstra berhasil direkonstruksi dengan sempurna!")

    except Exception as e:
        conn.rollback()
        print("Terjadi Kesalahan internal:", e)
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    tambah_jalan_lokal()