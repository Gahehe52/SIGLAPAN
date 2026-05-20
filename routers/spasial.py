from fastapi import APIRouter, HTTPException, Query
from database import get_db_connection

router = APIRouter(prefix="/api/spasial", tags=["Query Spasial"])

@router.get("/cek-lokasi", summary="ST_Intersects: Lahan di koordinat tertentu")
def cek_lokasi_lahan_geojson(x: float = Query(...), y: float = Query(...)):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        query = """
            SELECT json_build_object(
                'type', 'FeatureCollection',
                'features', COALESCE(json_agg(
                    json_build_object(
                        'type', 'Feature',
                        'geometry', ST_AsGeoJSON(l.geom)::json,
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
            WHERE ST_Intersects(l.geom, ST_SetSRID(ST_MakePoint(%s, %s), 32748));
        """
        cur.execute(query, (x, y))
        result = cur.fetchone()
        return result['geojson']
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.get("/fasilitas-terdekat", summary="ST_DWithin: Fasilitas terdekat dari Lahan")
def cari_fasilitas_terdekat_geojson(id_lahan: int = Query(...), radius: float = Query(500.0)):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        query = """
            SELECT json_build_object(
                'type', 'FeatureCollection',
                'features', COALESCE(json_agg(
                    json_build_object(
                        'type', 'Feature',
                        'geometry', ST_AsGeoJSON(f.geom)::json,
                        'properties', json_build_object(
                            'id_fasilitas', f.id_fasilitas,
                            'nama_fasilitas', f.nama_fasilitas,
                            'jenis_fasilitas', f.jenis_fasilitas,
                            'jarak_meter', ST_Distance(f.geom, l.geom)
                        )
                    )
                ), '[]'::json)
            ) AS geojson
            FROM fasilitas f
            CROSS JOIN lahan l
            WHERE l.id_lahan = %s AND ST_DWithin(f.geom, l.geom, %s);
        """
        cur.execute(query, (id_lahan, radius))
        result = cur.fetchone()
        return result['geojson']
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()