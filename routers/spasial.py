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

@router.get("/rute-antar-lahan", summary="pgRouting: Shortest Path Dijkstra antar lahan")
def cari_rute_antar_lahan_geojson(
    id_lahan_awal: int = Query(...), 
    id_lahan_tujuan: int = Query(...)
):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Perbaikan Ekstrem: Hanya memproses jalan yang valid (IS NOT NULL) dan cost positif
        query = """
            WITH start_node AS (
                SELECT id FROM jalan_vertices_pgr
                ORDER BY the_geom <-> (SELECT ST_Centroid(geom) FROM lahan WHERE id_lahan = %s LIMIT 1)
                LIMIT 1
            ),
            end_node AS (
                SELECT id FROM jalan_vertices_pgr
                ORDER BY the_geom <-> (SELECT ST_Centroid(geom) FROM lahan WHERE id_lahan = %s LIMIT 1)
                LIMIT 1
            ),
            route AS (
                SELECT r.seq, r.node, r.edge, r.cost, j.nama_jalan, j.tipe_jalan, j.geom
                FROM pgr_dijkstra(
                    'SELECT id_jalan AS id, source::int, target::int, cost::float FROM jalan WHERE source IS NOT NULL AND target IS NOT NULL AND cost > 0',
                    (SELECT id FROM start_node),
                    (SELECT id FROM end_node),
                    false
                ) AS r
                JOIN jalan j ON r.edge = j.id_jalan
            )
            SELECT json_build_object(
                'type', 'FeatureCollection',
                'features', COALESCE(json_agg(
                    json_build_object(
                        'type', 'Feature',
                        'geometry', ST_AsGeoJSON(ST_Transform(route.geom, 4326))::json,
                        'properties', json_build_object(
                            'id_jalan', route.edge,
                            'nama_jalan', route.nama_jalan,
                            'tipe_jalan', route.tipe_jalan,
                            'urutan', route.seq
                        )
                    )
                ), '[]'::json)
            ) AS geojson
            FROM route;
        """
        cur.execute(query, (id_lahan_awal, id_lahan_tujuan))
        result = cur.fetchone()
        
        # Validasi jika graf terputus (Dijkstra tidak menemukan jalan)
        if not result or not result['geojson'] or not result['geojson']['features']:
            return {"type": "FeatureCollection", "features": []}
            
        return result['geojson']
    except Exception as e:
        # Mencetak error asli ke terminal VS Code agar kita tahu apa masalah sebenarnya jika masih gagal
        print(f"\n[ERROR PGROUTING]: {e}\n")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()