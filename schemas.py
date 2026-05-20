from pydantic import BaseModel, Field
from typing import Optional

class TanamanBase(BaseModel):
    nama_tanaman: str = Field(..., min_length=2, max_length=100)
    deskripsi: Optional[str] = None

class LahanBase(BaseModel):
    id_tanaman: int = Field(..., gt=0)
    id_user: int = Field(..., gt=0)
    nama_pemilik: str = Field(..., min_length=3, max_length=150)
    nama_lahan: str = Field(..., max_length=150)
    keterangan: str
    geom_wkt: str = Field(..., description="Format WKT MULTIPOLYGON")

class FasilitasBase(BaseModel):
    id_user: int = Field(..., gt=0)
    nama_fasilitas: str = Field(..., min_length=3, max_length=150)
    jenis_fasilitas: str = Field(..., max_length=50)
    x_coord: float = Field(..., description="Koordinat X (UTM Easting)")
    y_coord: float = Field(..., description="Koordinat Y (UTM Northing)")