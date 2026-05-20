from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import semua router yang sudah dipisah
from routers import tanaman, lahan, fasilitas, spasial, statistik

app = FastAPI(
    title="SIGLAPAN API", 
    description="Backend WebGIS Sistem Informasi Lahan Pertanian terintegrasi dengan PostGIS.",
    version="1.0.0"
)

# Pengaturan CORS untuk frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mendaftarkan router ke aplikasi utama
app.include_router(tanaman.router)
app.include_router(lahan.router)
app.include_router(fasilitas.router)
app.include_router(spasial.router)
app.include_router(statistik.router)