from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from database import get_db_connection
from schemas import LahanBase

router = APIRouter(prefix="/api/lahan", tags=["Lahan"])

@router.get("/")
def get_lahan_geojson(
    jenis_tanaman: Optional[int] = Query(None),
    pemilik: Optional[str] = Query(None),
    limit: int = Query(200)
):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        query = """
            SELECT json_build_object(
                'type', 'FeatureCollection',
                'features', COALESCE(json_agg(
                    json_build_object(
                        'type', 'Feature',
                        'geometry', ST_AsGeoJSON(ST_Simplify(t.geom, 2))::json,
                        'properties', json_build_object(
                            'id_lahan', t.id_lahan,
                            'nama_pemilik', t.nama_pemilik,
                            'nama_lahan', t.nama_lahan,
                            'luas_lahan', t.luas_lahan,
                            'keterangan', t.keterangan,
                            'nama_tanaman', t.nama_tanaman
                        )
                    )
                ), '[]'::json)
            ) AS geojson
            FROM (
                SELECT l.id_lahan, l.nama_pemilik, l.nama_lahan, l.luas_lahan, l.keterangan,
                       tn.nama_tanaman, l.geom
                FROM lahan l
                JOIN tanaman tn ON l.id_tanaman = tn.id_tanaman
                WHERE 1=1
        """
        params = []
        if jenis_tanaman:
            query += " AND l.id_tanaman = %s"
            params.append(jenis_tanaman)
        if pemilik:
            query += " AND l.nama_pemilik ILIKE %s"
            params.append(f"%{pemilik}%")
            
        query += " LIMIT %s) AS t;"
        params.append(limit)
        
        cur.execute(query, tuple(params))
        result = cur.fetchone()
        return result['geojson']
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.post("/")
def tambah_lahan(data: LahanBase):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        query = """
            INSERT INTO lahan (id_tanaman, id_user, nama_pemilik, nama_lahan, keterangan, geom)
            VALUES (%s, %s, %s, %s, %s, ST_SetSRID(ST_Multi(ST_GeomFromText(%s)), 32748))
            RETURNING id_lahan;
        """
        cur.execute(query, (data.id_tanaman, data.id_user, data.nama_pemilik, data.nama_lahan, data.keterangan, data.geom_wkt))
        conn.commit()
        return {"status": "success"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.put("/{id_lahan}")
def update_lahan(id_lahan: int, data: LahanBase):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        query = """
            UPDATE lahan 
            SET id_tanaman=%s, nama_pemilik=%s, nama_lahan=%s, keterangan=%s, geom=ST_SetSRID(ST_Multi(ST_GeomFromText(%s)), 32748)
            WHERE id_lahan=%s RETURNING id_lahan;
        """
        cur.execute(query, (data.id_tanaman, data.nama_pemilik, data.nama_lahan, data.keterangan, data.geom_wkt, id_lahan))
        updated = cur.fetchone()
        conn.commit()
        if not updated:
            raise HTTPException(status_code=404, detail="Lahan tidak ditemukan")
        return {"status": "success"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.delete("/{id_lahan}")
def hapus_lahan(id_lahan: int):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM lahan WHERE id_lahan = %s RETURNING id_lahan;", (id_lahan,))
        deleted = cur.fetchone()
        conn.commit()
        if not deleted:
            raise HTTPException(status_code=404, detail="Lahan tidak ditemukan")
        return {"status": "success"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        conn.close()