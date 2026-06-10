from fastapi import APIRouter, HTTPException, Query
from database import get_db_connection

router = APIRouter(prefix="/api/spasial", tags=["Query Spasial"])

@router.get("/cek-lokasi", summary="ST_Intersects: Lahan di koordinat tertentu")
def cek_lokasi_lahan_geojson(x: float = Query(...), y: float = Query(...)):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # PERBAIKAN: Menambahkan ST_Transform pada l.geom agar koordinat yang dikembalikan berupa GPS 4326 (Bukan UTM)
        query = """
            SELECT json_build_object(
                'type', 'FeatureCollection',
                'features', COALESCE(json_agg(
                    json_build_object(
                        'type', 'Feature',
                        'geometry', ST_AsGeoJSON(ST_Transform(l.geom, 4326))::json,
                        'properties', json_build_object(
                            'id_lahan', l.id_lahan,
                            'nama_pemilik', l.nama_pemilik,
                            'nama_lahan', l.nama_lahan,
                            'nama_tanaman', tn.nama_tanaman
                        )
                    )
                ), '[]'::json)
            ) AS geojson
            FROM lahan l
            JOIN tanaman tn ON l.id_tanaman = tn.id_tanaman
            WHERE ST_Intersects(l.geom, ST_Transform(ST_SetSRID(ST_MakePoint(%s, %s), 4326), 32748));
        """
        cur.execute(query, (x, y))
        result = cur.fetchone()
        return result['geojson']
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.get("/rute-antar-lahan", summary="ST_Buffer & ST_Intersects: Jaringan jalan penghubung dua lahan")
def cari_rute_antar_lahan_geojson(
    id_lahan_awal: int = Query(...), 
    id_lahan_tujuan: int = Query(...), 
    radius_buffer: float = Query(500.0)
):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Analisis Spasial:
        # 1. Mencari Centroid masing-masing lahan
        # 2. Membuat garis (ST_MakeLine) penghubung kedua centroid
        # 3. Membuat area koridor (ST_Buffer) sepanjang garis dalam satuan meter (UTM 32748)
        # 4. Mengambil semua segmen jalan yang masuk dalam koridor tersebut dan ditransformasikan ke GPS 4326
        query = """
            SELECT json_build_object(
                'type', 'FeatureCollection',
                'features', COALESCE(json_agg(
                    json_build_object(
                        'type', 'Feature',
                        'geometry', ST_AsGeoJSON(ST_Transform(j.geom, 4326))::json,
                        'properties', json_build_object(
                            'id_jalan', j.id_jalan,
                            'nama_jalan', j.nama_jalan,
                            'tipe_jalan', j.tipe_jalan
                        )
                    )
                ), '[]'::json)
            ) AS geojson
            FROM jalan j
            CROSS JOIN lahan l1
            CROSS JOIN lahan l2
            WHERE l1.id_lahan = %s AND l2.id_lahan = %s
              AND ST_Intersects(
                  j.geom, 
                  ST_Buffer(
                      ST_MakeLine(ST_Centroid(l1.geom), ST_Centroid(l2.geom)), 
                      %s
                  )
              );
        """
        cur.execute(query, (id_lahan_awal, id_lahan_tujuan, radius_buffer))
        result = cur.fetchone()
        return result['geojson']
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()