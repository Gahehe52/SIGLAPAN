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

@router.get("/rute-antar-lahan", summary="pgRouting: Multi-Node Scanner True Routing")
def cari_rute_antar_lahan_geojson(
    id_lahan_awal: int = Query(...), 
    id_lahan_tujuan: int = Query(...)
):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # STRATEGI MULTI-SCANNER:
        # Mengambil array 10 titik jalan terdekat dari asal dan tujuan.
        # pgRouting akan memproses seluruh kombinasi sekaligus dan kita mengambil rute termurah yang terhubung!
        query = """
            WITH start_point AS (
                SELECT ST_Centroid(geom) as geom FROM lahan WHERE id_lahan = %s LIMIT 1
            ),
            end_point AS (
                SELECT ST_Centroid(geom) as geom FROM lahan WHERE id_lahan = %s LIMIT 1
            ),
            start_nodes AS (
                SELECT id, the_geom FROM jalan_vertices_pgr
                ORDER BY the_geom <-> (SELECT geom FROM start_point) LIMIT 10
            ),
            end_nodes AS (
                SELECT id, the_geom FROM jalan_vertices_pgr
                ORDER BY the_geom <-> (SELECT geom FROM end_point) LIMIT 10
            ),
            route_all AS (
                SELECT r.start_vid, r.end_vid, r.seq, r.node, r.edge, r.cost, j.nama_jalan, j.tipe_jalan, j.geom
                FROM pgr_dijkstra(
                    'SELECT id_jalan::int AS id, source::int, target::int, cost::float FROM jalan WHERE source IS NOT NULL AND target IS NOT NULL AND cost > 0',
                    (SELECT array_agg(id) FROM start_nodes),
                    (SELECT array_agg(id) FROM end_nodes),
                    false
                ) AS r
                JOIN jalan j ON r.edge = j.id_jalan
            ),
            best_pair AS (
                SELECT start_vid, end_vid, sum(cost) as total_cost
                FROM route_all
                GROUP BY start_vid, end_vid
                ORDER BY total_cost ASC
                LIMIT 1
            ),
            route AS (
                SELECT ra.seq, ra.node, ra.edge, ra.cost, ra.nama_jalan, ra.tipe_jalan, ra.geom
                FROM route_all ra
                JOIN best_pair bp ON ra.start_vid = bp.start_vid AND ra.end_vid = bp.end_vid
            ),
            konektor_awal AS (
                SELECT 
                    0 as seq, 0 as node, -1 as edge, 
                    ST_Distance((SELECT geom FROM start_point), (SELECT the_geom FROM start_nodes WHERE id = (SELECT start_vid FROM best_pair))) as cost, 
                    'Jalan Akses Lahan Asal' as nama_jalan, 'akses' as tipe_jalan, 
                    ST_MakeLine((SELECT geom FROM start_point), (SELECT the_geom FROM start_nodes WHERE id = (SELECT start_vid FROM best_pair))) as geom
            ),
            konektor_akhir AS (
                SELECT 
                    999999 as seq, 0 as node, -2 as edge, 
                    ST_Distance((SELECT the_geom FROM end_nodes WHERE id = (SELECT end_vid FROM best_pair)), (SELECT geom FROM end_point)) as cost, 
                    'Jalan Akses Lahan Tujuan' as nama_jalan, 'akses' as tipe_jalan, 
                    ST_MakeLine((SELECT the_geom FROM end_nodes WHERE id = (SELECT end_vid FROM best_pair)), (SELECT geom FROM end_point)) as geom
            ),
            final_route AS (
                SELECT * FROM konektor_awal
                UNION ALL
                SELECT * FROM route
                UNION ALL
                SELECT * FROM konektor_akhir
            )
            SELECT json_build_object(
                'type', 'FeatureCollection',
                'features', COALESCE(json_agg(
                    json_build_object(
                        'type', 'Feature',
                        'geometry', ST_AsGeoJSON(ST_Transform(final_route.geom, 4326))::json,
                        'properties', json_build_object(
                            'id_jalan', final_route.edge,
                            'nama_jalan', final_route.nama_jalan,
                            'tipe_jalan', final_route.tipe_jalan,
                            'urutan', final_route.seq,
                            'jarak_meter', final_route.cost
                        )
                    ) ORDER BY final_route.seq
                ), '[]'::json)
            ) AS geojson
            FROM final_route;
        """
        cur.execute(query, (id_lahan_awal, id_lahan_tujuan))
        result = cur.fetchone()
        
        if not result or not result['geojson'] or not result['geojson']['features']:
            return {"type": "FeatureCollection", "features": []}
            
        return result['geojson']
    except Exception as e:
        print(f"\n[ERROR PGROUTING]: {e}\n")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()