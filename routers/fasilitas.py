from fastapi import APIRouter, HTTPException
from database import get_db_connection
from schemas import FasilitasBase

router = APIRouter(prefix="/api/fasilitas", tags=["Fasilitas"])

@router.get("/")
def get_fasilitas_geojson():
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
                            'jenis_fasilitas', f.jenis_fasilitas
                        )
                    )
                ), '[]'::json)
            ) AS geojson
            FROM fasilitas f;
        """
        cur.execute(query)
        result = cur.fetchone()
        return result['geojson']
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.post("/")
def tambah_fasilitas(data: FasilitasBase):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        query = """
            INSERT INTO fasilitas (id_user, nama_fasilitas, jenis_fasilitas, geom)
            VALUES (%s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 32748)) RETURNING id_fasilitas;
        """
        cur.execute(query, (data.id_user, data.nama_fasilitas, data.jenis_fasilitas, data.x_coord, data.y_coord))
        conn.commit()
        return {"status": "success"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.put("/{id_fasilitas}")
def update_fasilitas(id_fasilitas: int, data: FasilitasBase):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        query = """
            UPDATE fasilitas 
            SET nama_fasilitas=%s, jenis_fasilitas=%s, geom=ST_SetSRID(ST_MakePoint(%s, %s), 32748)
            WHERE id_fasilitas=%s RETURNING id_fasilitas;
        """
        cur.execute(query, (data.nama_fasilitas, data.jenis_fasilitas, data.x_coord, data.y_coord, id_fasilitas))
        updated = cur.fetchone()
        conn.commit()
        if not updated:
            raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan")
        return {"status": "success"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.delete("/{id_fasilitas}")
def hapus_fasilitas(id_fasilitas: int):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM fasilitas WHERE id_fasilitas = %s RETURNING id_fasilitas;", (id_fasilitas,))
        deleted = cur.fetchone()
        conn.commit()
        if not deleted:
            raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan")
        return {"status": "success"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        conn.close()