from fastapi import APIRouter, HTTPException
from database import get_db_connection

router = APIRouter(prefix="/api/jalan", tags=["Jalan"])

@router.get("/")
def get_jalan_geojson():
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # PENTING: ST_Transform(j.geom, 4326) mengonversi UTM meter ke derajat GPS agar Leaflet tidak crash zoom out
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
            FROM jalan j;
        """
        cur.execute(query)
        result = cur.fetchone()
        return result['geojson']
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()