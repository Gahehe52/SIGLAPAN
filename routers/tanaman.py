from fastapi import APIRouter, HTTPException
from database import get_db_connection
from schemas import TanamanBase

router = APIRouter(prefix="/api/tanaman", tags=["Tanaman"])

@router.get("/")
def get_semua_tanaman():
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id_tanaman, nama_tanaman, deskripsi FROM tanaman ORDER BY id_tanaman ASC;")
        return cur.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.post("/")
def tambah_tanaman(data: TanamanBase):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO tanaman (nama_tanaman, deskripsi) VALUES (%s, %s) RETURNING id_tanaman;",
            (data.nama_tanaman, data.deskripsi)
        )
        new_id = cur.fetchone()
        conn.commit()
        return {"status": "success", "id_tanaman": new_id['id_tanaman']}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.put("/{id_tanaman}")
def update_tanaman(id_tanaman: int, data: TanamanBase):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "UPDATE tanaman SET nama_tanaman = %s, deskripsi = %s WHERE id_tanaman = %s RETURNING id_tanaman;",
            (data.nama_tanaman, data.deskripsi, id_tanaman)
        )
        updated = cur.fetchone()
        conn.commit()
        if not updated:
            raise HTTPException(status_code=404, detail="Tanaman tidak ditemukan")
        return {"status": "success"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.delete("/{id_tanaman}")
def hapus_tanaman(id_tanaman: int):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM tanaman WHERE id_tanaman = %s RETURNING id_tanaman;", (id_tanaman,))
        deleted = cur.fetchone()
        conn.commit()
        if not deleted:
            raise HTTPException(status_code=404, detail="Tanaman tidak ditemukan")
        return {"status": "success"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Data masih digunakan di tabel lahan")
    finally:
        cur.close()
        conn.close()