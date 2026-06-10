import psycopg2
import requests
from database import get_db_connection

def tarik_data_nyata():
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # 1. KLASIFIKASI TANAMAN BERDASARKAN REALITA SPASIAL (LUAS LAHAN)
        print("1. Menganalisis kondisi tanaman berdasarkan klasifikasi spasial luas lahan...")
        
        tanaman_rules = [
            ('Kopi', 'Perkebunan Rakyat (Luas < 0.5 Hektar)'),
            ('Karet', 'Perkebunan Menengah (Luas 0.5 - 2 Hektar)'),
            ('Kelapa Sawit', 'Perkebunan Besar/Estate (Luas > 2 Hektar)')
        ]
        
        t_ids = {}
        for t_nama, t_desc in tanaman_rules:
            cur.execute("""
                INSERT INTO tanaman (nama_tanaman, deskripsi)
                VALUES (%s, %s)
                ON CONFLICT (nama_tanaman) DO UPDATE SET deskripsi=EXCLUDED.deskripsi
                RETURNING id_tanaman;
            """, (t_nama, t_desc))
            res = cur.fetchone()
            if res:
                t_ids[t_nama] = res['id_tanaman']
            else:
                cur.execute("SELECT id_tanaman FROM tanaman WHERE nama_tanaman = %s;", (t_nama,))
                t_ids[t_nama] = cur.fetchone()['id_tanaman']

        cur.execute(f"""
            UPDATE lahan
            SET id_tanaman =
                CASE
                    WHEN luas_lahan > 20000 THEN {t_ids['Kelapa Sawit']}
                    WHEN luas_lahan > 5000 THEN {t_ids['Karet']}
                    ELSE {t_ids['Kopi']}
                END;
        """)
        conn.commit()
        print("   -> Selesai! Tanaman telah diklasifikasikan secara logis tanpa unsur acak.")

        # 2. MENDAPATKAN BOUNDING BOX (BATAS KOORDINAT LAHAN)
        print("\n2. Melacak lokasi koordinat nyata seluruh poligon lahan Anda...")
        cur.execute("SELECT ST_Extent(ST_Transform(geom, 4326)) as bbox FROM lahan;")
        row = cur.fetchone()

        if not row or not row['bbox']:
            print("Error: Tidak ada data lahan untuk mencari koordinat.")
            return

        bbox_str = row['bbox'].replace('BOX(', '').replace(')', '')
        min_pt, max_pt = bbox_str.split(',')
        lon_min, lat_min = min_pt.strip().split(' ')
        lon_max, lat_max = max_pt.strip().split(' ')

        print(f"   -> Lokasi terdeteksi di Peta: Lat({lat_min} s/d {lat_max}), Lon({lon_min} s/d {lon_max})")

        # 3. MENGUNDUH JALAN SUNGGUHAN DARI OPENSTREETMAP API
        print("\n3. Mengunduh data jalan sungguhan dari satelit peta di koordinat tersebut...")
        # Menggunakan HTTPS untuk koneksi yang diizinkan
        overpass_url = "https://overpass-api.de/api/interpreter"
        
        overpass_query = f"""
        [out:json][timeout:180];
        way["highway"~"motorway|trunk|primary|secondary|tertiary|unclassified|residential|service"]({lat_min},{lon_min},{lat_max},{lon_max});
        out geom;
        """

        # Menambahkan Headers untuk menghindari pemblokiran (Error 406 Not Acceptable)
        headers = {
            'User-Agent': 'SIGLAPAN-ITERA-Project/1.0 (Student Project)',
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
        }

        response = requests.post(overpass_url, data={'data': overpass_query}, headers=headers)
        
        if response.status_code != 200:
            print(f"Gagal mengakses API Satelit (HTTP {response.status_code}).")
            print("Pesan server:")
            print(response.text[:500])
            return

        try:
            osm_data = response.json()
        except ValueError:
            print("Gagal mengurai respons menjadi JSON.")
            return

        elements = osm_data.get('elements', [])
        if not elements:
            print("Tidak ada data jalan raya utama dari satelit di area koordinat tersebut.")
            return

        # Rekonstruksi struktur tabel jalan
        cur.execute("DROP TABLE IF EXISTS jalan CASCADE;")
        cur.execute("""
            CREATE TABLE jalan (
                id_jalan BIGSERIAL PRIMARY KEY,
                nama_jalan VARCHAR(150),
                tipe_jalan VARCHAR(50),
                geom geometry(LineString, 32748) NOT NULL
            );
        """)
        cur.execute("CREATE INDEX idx_jalan_geom ON jalan USING GIST (geom);")

        berhasil = 0
        for el in elements:
            if el['type'] == 'way' and 'geometry' in el:
                pts = []
                for pt in el['geometry']:
                    pts.append(f"{pt['lon']} {pt['lat']}")

                if len(pts) >= 2:
                    wkt = f"LINESTRING({', '.join(pts)})"
                    tags = el.get('tags', {})
                    nama = tags.get('name', 'Jalan Tanpa Nama')
                    tipe = tags.get('highway', 'Jalan Lokal')

                    query = """
                        INSERT INTO jalan (nama_jalan, tipe_jalan, geom)
                        VALUES (%s, %s, ST_Transform(ST_SetSRID(ST_GeomFromText(%s), 4326), 32748))
                    """
                    cur.execute(query, (nama, tipe, wkt))
                    berhasil += 1

        conn.commit()
        print(f"   -> SUKSES! {berhasil} ruas jalan raya asli dari satelit berhasil dimasukkan ke database Anda.")

    except Exception as e:
        conn.rollback()
        print("Terjadi Kesalahan internal:", e)
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    tarik_data_nyata()