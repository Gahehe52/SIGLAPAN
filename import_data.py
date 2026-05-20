import json
import psycopg2
from database import get_db_connection

def jalankan_migrasi():
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        print("Menyiapkan data master...")
        cur.execute("INSERT INTO users (nama_lengkap, username, email, password, role) VALUES ('Administrator', 'admin', 'admin@siglapan.com', '123', 'admin') ON CONFLICT DO NOTHING;")
        cur.execute("INSERT INTO tanaman (nama_tanaman, deskripsi) VALUES ('Kopi', 'Komoditas Kopi Robusta') ON CONFLICT DO NOTHING;")
        cur.execute("INSERT INTO tanaman (nama_tanaman, deskripsi) VALUES ('Kakao', 'Komoditas Kakao') ON CONFLICT DO NOTHING;")
        conn.commit()

        # Membaca file geojson Anda
        with open('pertanian.geojson', 'r') as f:
            data = json.load(f)

        fitur_lahan = data.get('features', [])
        print(f"Ditemukan {len(fitur_lahan)} data. Memulai injeksi WKT ke database...")

        berhasil = 0
        dilewati = 0

        for feature in fitur_lahan:
            geom_raw = feature.get('geometry')
            
            # Filter 1: Pastikan geometry ada dan berbentuk Teks (String)
            if not geom_raw or not isinstance(geom_raw, str):
                dilewati += 1
                continue
                
            # Filter 2: Pastikan teksnya benar-benar format WKT yang valid (Diawali POLYGON/MULTIPOLYGON)
            # Ini akan menendang teks sampah seperti "DATA TIDAK ADA" dll.
            geom_upper = geom_raw.strip().upper()
            if not (geom_upper.startswith('POLYGON') or geom_upper.startswith('MULTIPOLYGON')):
                dilewati += 1
                continue

            props = feature.get('properties', {})
            
            id_tanaman = 1
            id_user = 1
            nama_pemilik = "Kelompok Tani " + str(props.get('id', 'Lokal'))
            nama_lahan = "Lahan " + str(props.get('id', ''))
            keterangan = props.get('tutuplhn', 'Perkebunan')

            # Menggunakan ST_GeomFromText karena formatnya adalah WKT
            query = """
                INSERT INTO lahan (id_tanaman, id_user, nama_pemilik, nama_lahan, keterangan, geom)
                VALUES (%s, %s, %s, %s, %s, ST_SetSRID(ST_Multi(ST_GeomFromText(%s)), 32748))
            """
            cur.execute(query, (id_tanaman, id_user, nama_pemilik, nama_lahan, keterangan, geom_raw))
            berhasil += 1

        conn.commit()
        print(f"\nMANTAP! Proses selesai. {berhasil} data berhasil masuk, {dilewati} data teks sampah/cacat dilewati.")

    except Exception as e:
        conn.rollback()
        print("Terjadi Kesalahan:", e)
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    jalankan_migrasi()