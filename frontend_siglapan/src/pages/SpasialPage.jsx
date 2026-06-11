import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import api from '../api/axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Radar, Route, ArrowRight, Navigation } from 'lucide-react';

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
  const [dataLahanGeoJSON, setDataLahanGeoJSON] = useState(null);
  
  const [lahanAwal, setLahanAwal] = useState('');
  const [lahanTujuan, setLahanTujuan] = useState('');
  
  const [dataRute, setDataRute] = useState(null);
  const [loadingLahan, setLoadingLahan] = useState(true);
  const [loadingAnalisis, setLoadingAnalisis] = useState(false);
  const [pesanStatus, setPesanStatus] = useState('Silakan pilih lahan asal dan tujuan untuk mencari rute terpendek.');

  useEffect(() => {
    const fetchDaftarLahan = async () => {
      try {
        const res = await api.get('/lahan?limit=500');
        if (res.data && res.data.features) {
          setDaftarLahan(res.data.features);
          setDataLahanGeoJSON(res.data); 
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
    setPesanStatus("Menganalisis topologi jaringan jalan dengan Algoritma Dijkstra...");

    try {
      const res = await api.get(`/spasial/rute-antar-lahan`, {
        params: {
          id_lahan_awal: lahanAwal,
          id_lahan_tujuan: lahanTujuan
        }
      });

      if (res.data && res.data.features && res.data.features.length > 0) {
        setDataRute(res.data);
        setPesanStatus(`Rute Terpendek Ditemukan! Menggunakan ${res.data.features.length} segmen jalan yang terhubung secara berurutan.`);
      } else {
        setDataRute(null);
        setPesanStatus("Analisis selesai. Tidak ditemukan jalur jalan darat yang saling terhubung antara kedua lahan tersebut.");
      }
    } catch (error) {
      console.error("Gagal mengeksekusi analisis rute spasial", error);
      setPesanStatus("Terjadi kesalahan internal server saat memproses algoritma graf pgRouting.");
    } finally {
      setLoadingAnalisis(false);
    }
  };

  // Gaya visual rute jaringan jalan terracotta menyala
  const gayaRuteJalan = () => {
    return {
      color: '#D35400',
      weight: 5,
      opacity: 1
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
          <p class="text-[10px] text-gray-500 capitalize bg-gray-100 px-1 py-0.5 rounded mt-0.5 inline-block">Segmen ke-${feature.properties.urutan}</p>
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
          </table>
        </div>
      `, { sticky: true, direction: 'auto', opacity: 0.95 });
    }
  };

  return (
    <div className="flex h-full gap-4 overflow-hidden">
      
      {/* Panel Form Pengaturan Kiri */}
      <div className="w-96 bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between flex-shrink-0 overflow-y-auto">
        <div>
          <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-3">
            <Radar className="text-[#628141]" size={24} />
            <h2 className="text-lg font-bold text-[#40513B]">Navigasi Rute Lahan</h2>
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

              {/* Tombol Trigger Eksekusi */}
              <button
                type="submit"
                disabled={loadingAnalisis}
                className="w-full bg-[#40513B] text-white py-3 rounded-lg font-semibold hover:bg-[#628141] transition-all disabled:bg-gray-400 shadow-sm flex items-center justify-center gap-2 mt-4"
              >
                <Route size={18} />
                {loadingAnalisis ? 'Menghitung Rute Dijkstra...' : 'Cari Rute Terpendek'}
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
              <span className="font-bold text-[#40513B] text-sm animate-pulse tracking-wide">Mengeksekusi Algoritma pgRouting...</span>
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

          {/* Render Layer Poligon Lahan */}
          {dataLahanGeoJSON && dataLahanGeoJSON.features && (
            <GeoJSON 
              key={`lahan-spasial-${dataLahanGeoJSON.features.length}`}
              data={dataLahanGeoJSON} 
              style={gayaPoligon} 
              onEachFeature={onEachLahan} 
            />
          )}

          {/* Menampilkan Garis Rute Tunggal Dijkstra */}
          {dataRute && dataRute.features && (
            <GeoJSON
              key={`rute-${dataRute.features.length}-${lahanAwal}-${lahanTujuan}`}
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