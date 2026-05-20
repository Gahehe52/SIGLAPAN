-- 1. Aktifkan Ekstensi PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Master Data Tanaman
CREATE TABLE tanaman (
    id_tanaman BIGSERIAL PRIMARY KEY,
    nama_tanaman VARCHAR(100) NOT NULL UNIQUE,
    deskripsi TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Master Data User/Admin
CREATE TABLE users (
    id_user BIGSERIAL PRIMARY KEY,
    nama_lengkap VARCHAR(150) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Lahan Pertanian (Geometri MultiPolygon)
CREATE TABLE lahan (
    id_lahan BIGSERIAL PRIMARY KEY,
    id_tanaman BIGINT NOT NULL,
    id_user BIGINT,
    nama_pemilik VARCHAR(150) NOT NULL,
    nama_lahan VARCHAR(150),
    luas_lahan NUMERIC(12,2),
    geom geometry(MultiPolygon, 32748) NOT NULL,
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_lahan_tanaman
        FOREIGN KEY (id_tanaman) REFERENCES tanaman(id_tanaman)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_lahan_user
        FOREIGN KEY (id_user) REFERENCES users(id_user)
        ON UPDATE CASCADE ON DELETE SET NULL
);

-- 5. Tabel Fasilitas (Geometri Point)
CREATE TABLE fasilitas (
    id_fasilitas BIGSERIAL PRIMARY KEY,
    id_user BIGINT,
    nama_fasilitas VARCHAR(150) NOT NULL,
    jenis_fasilitas VARCHAR(50) NOT NULL,
    geom geometry(Point, 32748) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_fasilitas_user
        FOREIGN KEY (id_user) REFERENCES users(id_user)
        ON UPDATE CASCADE ON DELETE SET NULL
);

-- 6. Spatial Index (GiST) & Index Pencarian untuk Performa
CREATE INDEX idx_lahan_geom ON lahan USING GIST (geom);
CREATE INDEX idx_lahan_id_tanaman ON lahan (id_tanaman);
CREATE INDEX idx_lahan_nama_pemilik ON lahan (nama_pemilik);
CREATE INDEX idx_fasilitas_geom ON fasilitas USING GIST (geom);

-- 7. Fungsi & Trigger untuk Perhitungan Luas Lahan Otomatis (ST_Area)
CREATE OR REPLACE FUNCTION hitung_luas_lahan()
RETURNS TRIGGER AS $$
BEGIN
    NEW.luas_lahan := ST_Area(NEW.geom);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_hitung_luas
BEFORE INSERT OR UPDATE OF geom ON lahan
FOR EACH ROW
EXECUTE FUNCTION hitung_luas_lahan();

-- 8. Sample Data Fasilitas (Memenuhi syarat 20 record untuk ST_DWithin)
INSERT INTO fasilitas (id_user, nama_fasilitas, jenis_fasilitas, geom) VALUES
(1, 'Gudang Pupuk Tani A', 'Gudang', ST_SetSRID(ST_MakePoint(677900, 9296500), 32748)),
(1, 'Gudang Hasil Panen', 'Gudang', ST_SetSRID(ST_MakePoint(677920, 9296510), 32748)),
(1, 'Saluran Irigasi Induk', 'Irigasi', ST_SetSRID(ST_MakePoint(677850, 9296550), 32748)),
(1, 'Posko Kelompok Tani 1', 'Posko', ST_SetSRID(ST_MakePoint(677800, 9296560), 32748)),
(1, 'Klinik Pertanian', 'Kesehatan', ST_SetSRID(ST_MakePoint(677810, 9296570), 32748)),
(1, 'Pusat Traktor Bersama', 'Alat', ST_SetSRID(ST_MakePoint(677880, 9296550), 32748)),
(1, 'Sumur Bor Pertanian 1', 'Irigasi', ST_SetSRID(ST_MakePoint(677900, 9296540), 32748)),
(1, 'Sumur Bor Pertanian 2', 'Irigasi', ST_SetSRID(ST_MakePoint(677910, 9296530), 32748)),
(1, 'Pos Jaga Keamanan 1', 'Keamanan', ST_SetSRID(ST_MakePoint(677930, 9296520), 32748)),
(1, 'Pos Jaga Keamanan 2', 'Keamanan', ST_SetSRID(ST_MakePoint(677940, 9296510), 32748)),
(1, 'Gudang Alat Tani', 'Gudang', ST_SetSRID(ST_MakePoint(677950, 9296500), 32748)),
(1, 'Pompa Air Utama', 'Irigasi', ST_SetSRID(ST_MakePoint(677960, 9296490), 32748)),
(1, 'Pusat Timbangan', 'Fasilitas', ST_SetSRID(ST_MakePoint(677970, 9296480), 32748)),
(1, 'Tempat Pembuangan Sisa', 'Pengolahan', ST_SetSRID(ST_MakePoint(677980, 9296470), 32748)),
(1, 'Koperasi Unit Desa', 'Koperasi', ST_SetSRID(ST_MakePoint(677990, 9296460), 32748)),
(1, 'Stasiun Cuaca Mini', 'Sensor', ST_SetSRID(ST_MakePoint(678000, 9296450), 32748)),
(1, 'Tempat Istirahat Tani', 'Posko', ST_SetSRID(ST_MakePoint(678010, 9296440), 32748)),
(1, 'Penampungan Air Hujan', 'Irigasi', ST_SetSRID(ST_MakePoint(678020, 9296430), 32748)),
(1, 'Pabrik Penggilingan', 'Pengolahan', ST_SetSRID(ST_MakePoint(678030, 9296420), 32748)),
(1, 'Pasar Lelang Komoditas', 'Pasar', ST_SetSRID(ST_MakePoint(678040, 9296410), 32748));