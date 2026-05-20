from fastapi import APIRouter, HTTPException
from database import get_db_connection

router = APIRouter(prefix="/api/statistik", tags=["Statistik"])

@router.get("/")
def get_statistik_lahan():
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT tn.nama_tanaman, COUNT(l.id_lahan) as jumlah_persil, SUM(l.luas_lahan) as total_luas
            FROM lahan l
            JOIN tanaman tn ON l.id_tanaman = tn.id_tanaman
            GROUP BY tn.nama_tanaman ORDER BY total_luas DESC;
        """)
        return cur.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()