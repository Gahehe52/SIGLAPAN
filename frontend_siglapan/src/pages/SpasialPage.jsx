import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import api from '../api/axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Radar, Route, ArrowRight, Settings, Navigation } from 'lucide-react';

// Komponen otomatis untuk memfokuskan kamera peta ke rute jalan hasil analisis
function FitRouteBounds({ dataRute }) {
  const map = useMap();

  useEffect(() => {
    if (dataRute && dataRute.features && dataRute.features.length > 0) {
      try {
        const layer = L.geoJSON(dataRute);
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40] });
        }
      } catch (error) {
        console.error("Gagal menyesuaikan fokus kamera rute:", error);
      }
    }
  }, [dataRute, map]);

  return null;
}

export default function SpasialPage() {
  const [daftarLahan, setDaftarLahan] = useState([]);
  const [dataLahanGeoJSON, setDataLahanGeoJSON] = useState(null); // Menyimpan format GeoJSON utuh untuk peta
  
  const [lahanAwal, setLahanAwal] = useState('');
  const [lahanTujuan, setLahanTujuan] = useState('');
  const [radiusBuffer, setRadiusBuffer] = useState(500);
  
  const [dataRute, setDataRute] = useState(null);
  const [loadingLahan, setLoadingLahan] = useState(true);
  const [loadingAnalisis, setLoadingAnalisis] = useState(false);
  const [pesanStatus, setPesanStatus] = useState('Silakan pilih lahan asal dan tujuan untuk memulai analisis spasial koridor rute.');

  // Memuat daftar lahan untuk pilihan dropdown dan untuk ditampilkan di peta
  useEffect(() => {
    const fetchDaftarLahan = async () => {
      try {
        const res = await api.get('/lahan?limit=500');
        if (res.data && res.data.features) {
          setDaftarLahan(res.data.features); // Digunakan untuk mengisi dropdown
          setDataLahanGeoJSON(res.data); // Digunakan untuk menggambar poligon di peta
        }
      } catch (error) {
        console.error("Gagal mengambil daftar lahan", error);
        setPesanStatus("Gagal terhubung ke server database cloud untuk memuat daftar lahan.");
      } finally {
        setLoadingLahan(false);
      }
    };
    fetchDaftarLahan();
  }, []);

  // Mengeksekusi analisis spasial ST_Buffer & ST_Intersects ke backend Neon Cloud
  const handleAnalisisRute = async (e) => {
    e.preventDefault();
    if (!lahanAwal || !lahanTujuan) {
      alert("Mohon pilih lahan awal dan lahan tujuan terlebih dahulu.");
      return;
    }
    if (lahanAwal === lahanTujuan) {
      alert("Lahan awal dan lahan tujuan tidak boleh sama.");
      return;
    }

    setLoadingAnalisis(true);
    setDataRute(null);
    setPesanStatus("Sedang menghitung fungsi centroid, garis hubungan, buffer ruang, dan interseksi jalan raya...");

    try {
      const res = await api.get(`/spasial/rute-antar-lahan`, {
        params: {
          id_lahan_awal: lahanAwal,
          id_lahan_tujuan: lahanTujuan,
          radius_buffer: radiusBuffer
        }
      });

      if (res.data && res.data.features && res.data.features.length > 0) {
        setDataRute(res.data);
        setPesanStatus(`Analisis Spasial Sukses! Menemukan ${res.data.features.length} ruas segmen jalan raya di dalam koridor rute.`);
      } else {
        setDataRute(null);
        setPesanStatus("Analisis selesai, tetapi tidak ditemukan ruas jalan raya utama di dalam radius koridor buffer yang ditentukan.");
      }
    } catch (error) {
      console.error("Gagal mengeksekusi analisis rute spasial", error);
      setPesanStatus("Terjadi kesalahan internal server saat memproses fungsi topologi spasial.");
    } finally {
      setLoadingAnalisis(false);
    }
  };

  // Gaya visual rute jaringan jalan terracotta kontras tinggi
  const gayaRuteJalan = (feature) => {
    const tipe = feature.properties?.tipe_jalan || 'Jalan Lokal';
    const utama = ['motorway', 'trunk', 'primary', 'secondary'].includes(tipe);
    return {
      color: '#D35400', // Terracotta
      weight: utama ? 5 : 3,
      opacity: 0.9,
      dashArray: utama ? null : '5, 5' // Jalan penghubung kecil dibuat putus-putus
    };
  };

  // Gaya visual poligon lahan
  const gayaPoligon = () => ({
    fillColor: '#628141',
    weight: 2,
    opacity: 1,
    color: '#40513B',
    fillOpacity: 0.5
  });

  const onEachRuteJalan = (feature, layer) => {
    if (feature.properties) {
      layer.bindTooltip(`
        <div class="p-1 font-sans text-xs">
          <p class="font-bold text-[#40513B]">${feature.properties.nama_jalan || 'Jalan Tanpa Nama'}</p>
          <p class="text-[10px] text-gray-500 capitalize bg-gray-100 px-1 py-0.5 rounded mt-0.5 inline-block">${feature.properties.tipe_jalan || 'Jalan Lokal'}</p>
        </div>
      `, { sticky: true });
    }
  };

  const onEachLahan = (feature, layer) => {
    if (feature.properties) {
      layer.bindTooltip(`
        <div class="p-2 font-sans">
          <h3 class="font-bold text-[#40513B] border-b border-gray-200 pb-1 mb-1 text-sm">${feature.properties.nama_lahan || 'Lahan Pertanian'}</h3>
          <table class="w-full text-xs gap-x-2">
            <tr><td class="text-gray-500 py-0.5">Pemilik:</td><td class="font-semibold text-right pl-2">${feature.properties.nama_pemilik || '-'}</td></tr>
            <tr><td class="text-gray-500 py-0.5">Tanaman:</td><td class="font-semibold text-right pl-2">${feature.properties.nama_tanaman || '-'}</td></tr>
            <tr><td class="text-gray-500 py-0.5">Luas Lahan:</td><td class="font-bold text-[#628141] text-right pl-2">${feature.properties.luas_lahan ? parseFloat(feature.properties.luas_lahan).toLocaleString('id-ID') : 0} m²</td></tr>
          </table>
        </div>
      `, { sticky: true, direction: 'auto', opacity: 0.95 });

      layer.on({
        mouseover: (e) => {
          const targetLayer = e.target;
          targetLayer.setStyle({
            fillOpacity: 0.8,
            weight: 3,
            color: '#2C3E50'
          });
        },
        mouseout: (e) => {
          const targetLayer = e.target;
          targetLayer.setStyle(gayaPoligon());
        }
      });
    }
  };

  return (
    <div className="flex h-full gap-4 overflow-hidden">
      
      {/* Panel Form Pengaturan Kiri */}
      <div className="w-96 bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between flex-shrink-0 overflow-y-auto">
        <div>
          <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-3">
            <Radar className="text-[#628141]" size={24} />
            <h2 className="text-lg font-bold text-[#40513B]">Analisis Jaringan Rute</h2>
          </div>

          {loadingLahan ? (
            <div className="text-sm text-gray-500 animate-pulse py-4 text-center font-medium">
              Sinkronisasi data lahan perkebunan...
            </div>
          ) : (
            <form onSubmit={handleAnalisisRute} className="space-y-5">
              {/* Dropdown Lahan Asal */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Lahan Keberangkatan (Asal)</label>
                <select
                  value={lahanAwal}
                  onChange={(e) => setLahanAwal(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#628141] bg-gray-50 font-medium text-gray-800"
                >
                  <option value="">-- Pilih Lahan Awal --</option>
                  {daftarLahan.map((f) => (
                    <option key={`asal-${f.properties.id_lahan}`} value={f.properties.id_lahan}>
                      {f.properties.nama_lahan} [{f.properties.nama_pemilik}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Indikator Arah Aliran Spasial */}
              <div className="flex justify-center my-1 text-gray-400">
                <ArrowRight size={20} className="rotate-90 md:rotate-0" />
              </div>

              {/* Dropdown Lahan Tujuan */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Lahan Destinasi (Tujuan)</label>
                <select
                  value={lahanTujuan}
                  onChange={(e) => setLahanTujuan(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#628141] bg-gray-50 font-medium text-gray-800"
                >
                  <option value="">-- Pilih Lahan Tujuan --</option>
                  {daftarLahan.map((f) => (
                    <option key={`tujuan-${f.properties.id_lahan}`} value={f.properties.id_lahan}>
                      {f.properties.nama_lahan} [{f.properties.nama_pemilik}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Input Radius Buffer Koridor Jalan */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-100">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1">
                  <Settings size={14} className="text-gray-400" />
                  Radius Koridor Analisis (Meter)
                </label>
                <input
                  type="number"
                  min="100"
                  max="5000"
                  value={radiusBuffer}
                  onChange={(e) => setRadiusBuffer(parseInt(e.target.value) || 100)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#628141] bg-gray-50 font-mono text-gray-800"
                />
                <span className="text-[11px] text-gray-400 leading-normal">
                  Menentukan jangkauan lebar ruang pencarian jalan raya utama di sekitar garis lurus antar-lahan.
                </span>
              </div>

              {/* Tombol Trigger Eksekusi */}
              <button
                type="submit"
                disabled={loadingAnalisis}
                className="w-full bg-[#40513B] text-white py-3 rounded-lg font-semibold hover:bg-[#628141] transition-all disabled:bg-gray-400 shadow-sm flex items-center justify-center gap-2 mt-4"
              >
                <Route size={18} />
                {loadingAnalisis ? 'Memproses Analisis Spasial...' : 'Hitung Jaringan Rute'}
              </button>
            </form>
          )}
        </div>

        {/* Kotak Log Status di bagian bawah panel */}
        <div className="mt-6 p-3.5 bg-[#F8FAF5] border border-gray-200 rounded-lg">
          <h4 className="text-xs font-bold text-[#40513B] uppercase tracking-wider mb-1 flex items-center gap-1">
            <Navigation size={12} /> Log Operasi Spasial
          </h4>
          <p className="text-xs text-gray-600 leading-relaxed font-medium">
            {pesanStatus}
          </p>
        </div>
      </div>

      {/* Frame Kontainer Utama Peta Spasial di Sisi Kanan */}
      <div className="flex-1 min-h-0 bg-gray-100 rounded-xl relative shadow-md overflow-hidden border border-gray-300">
        {loadingAnalisis && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-[1000]">
            <div className="text-center flex flex-col items-center gap-2">
              <div className="w-10 h-10 border-4 border-[#628141] border-t-transparent rounded-full animate-spin"></div>
              <span className="font-bold text-[#40513B] text-sm animate-pulse tracking-wide">Mengeksekusi Algoritma ST_Buffer PostGIS...</span>
            </div>
          </div>
        )}

        <MapContainer
          center={[-6.1866, 106.5321]}
          zoom={11}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />

          {/* Render Layer Poligon Lahan (Ditambahkan kembali) */}
          {dataLahanGeoJSON && dataLahanGeoJSON.features && (
            <GeoJSON 
              key={`lahan-spasial-${dataLahanGeoJSON.features.length}`}
              data={dataLahanGeoJSON} 
              style={gayaPoligon} 
              onEachFeature={onEachLahan} 
            />
          )}

          {/* Menampilkan Garis Jaringan Jalan Hasil Interseksi Buffer */}
          {dataRute && dataRute.features && (
            <GeoJSON
              key={`rute-${dataRute.features.length}-${radiusBuffer}`}
              data={dataRute}
              style={gayaRuteJalan}
              onEachFeature={onEachRuteJalan}
            />
          )}

          {/* Pemicu otomatis pemindahan fokus kamera ke jalur rute baru */}
          <FitRouteBounds dataRute={dataRute} />
        </MapContainer>
      </div>

    </div>
  );
}