import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import api from '../api/axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Radar, Route, ArrowRight, Navigation } from 'lucide-react';

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
        console.error("Gagal menyesuaikan fokus kamera:", error);
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
  const [pesanStatus, setPesanStatus] = useState('Silakan pilih lahan asal dan tujuan untuk mencari rute darat nyata.');

  useEffect(() => {
    const fetchDaftarLahan = async () => {
      try {
        const res = await api.get('/lahan?limit=500');
        if (res.data && res.data.features) {
          setDaftarLahan(res.data.features);
          setDataLahanGeoJSON(res.data); 
        }
      } catch (error) {
        console.error("Gagal mengambil data lahan", error);
        setPesanStatus("Gagal terhubung ke database.");
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
    setPesanStatus("Menganalisis jaringan rute Dijkstra melalui jalan desa dan jalan aspal...");

    try {
      const res = await api.get(`/spasial/rute-antar-lahan`, {
        params: { id_lahan_awal: lahanAwal, id_lahan_tujuan: lahanTujuan }
      });

      if (res.data && res.data.features && res.data.features.length > 2) {
        setDataRute(res.data);
        const jmlSegmen = res.data.features.length - 2;
        setPesanStatus(`SUKSES! Rute Darat Ditemukan. Menelusuri ${jmlSegmen} segmen jalan lokal dan jalan aspal secara presisi.`);
      } else {
        setDataRute(null);
        // Pesan sudah diperbaiki agar sesuai dengan logika seluruh jaringan (bukan cuma jalan utama)
        setPesanStatus("Analisis selesai. Jaringan jalan antar kedua lahan ini benar-benar terisolir total (terhalang sungai lebar atau jurang tanpa jembatan di peta satelit).");
      }
    } catch (error) {
      console.error("Gagal mengeksekusi routing", error);
      setPesanStatus("Terjadi kesalahan komputasi algoritma Dijkstra pada server.");
    } finally {
      setLoadingAnalisis(false);
    }
  };

  const gayaRuteJalan = (feature) => {
    const tipe = feature.properties?.tipe_jalan;
    if (tipe === 'akses') {
      return {
        color: '#F39C12', // Oranye putus-putus untuk akses dari lahan ke jalan tanah
        weight: 3,
        opacity: 0.9,
        dashArray: '6, 6'
      };
    }
    return {
      color: '#D35400', // Terracotta solid untuk jaringan jalan satelit (baik desa maupun aspal)
      weight: 5,
      opacity: 1
    };
  };

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
          <p class="font-bold text-[#40513B]">${feature.properties.nama_jalan || 'Jalan Lokal / Setapak'}</p>
          <p class="text-[10px] text-gray-500 capitalize bg-gray-100 px-1 py-0.5 rounded mt-0.5 inline-block">
            ${feature.properties.tipe_jalan === 'akses' ? 'Jalur Akses Kebun' : `Kategori: ${feature.properties.tipe_jalan}`}
          </p>
        </div>
      `, { sticky: true });
    }
  };

  const onEachLahan = (feature, layer) => {
    if (feature.properties) {
      layer.bindTooltip(`
        <div class="p-2 font-sans">
          <h3 class="font-bold text-[#40513B] border-b border-gray-200 pb-1 mb-1 text-sm">${feature.properties.nama_lahan || 'Lahan Pertanian'}</h3>
        </div>
      `, { sticky: true });
    }
  };

  return (
    <div className="flex h-full gap-4 overflow-hidden">
      <div className="w-96 bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between flex-shrink-0 overflow-y-auto">
        <div>
          <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-3">
            <Radar className="text-[#628141]" size={24} />
            <h2 className="text-lg font-bold text-[#40513B]">Navigasi Rute Lahan</h2>
          </div>

          {loadingLahan ? (
            <div className="text-sm text-gray-500 animate-pulse py-4 text-center font-medium">Sinkronisasi data lahan...</div>
          ) : (
            <form onSubmit={handleAnalisisRute} className="space-y-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Lahan Keberangkatan</label>
                <select value={lahanAwal} onChange={(e) => setLahanAwal(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50">
                  <option value="">-- Pilih Lahan Awal --</option>
                  {daftarLahan.map((f) => <option key={`asal-${f.properties.id_lahan}`} value={f.properties.id_lahan}>{f.properties.nama_lahan}</option>)}
                </select>
              </div>
              <div className="flex justify-center my-1 text-gray-400"><ArrowRight size={20} /></div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Lahan Destinasi</label>
                <select value={lahanTujuan} onChange={(e) => setLahanTujuan(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50">
                  <option value="">-- Pilih Lahan Tujuan --</option>
                  {daftarLahan.map((f) => <option key={`tujuan-${f.properties.id_lahan}`} value={f.properties.id_lahan}>{f.properties.nama_lahan}</option>)}
                </select>
              </div>
              <button type="submit" disabled={loadingAnalisis} className="w-full bg-[#40513B] text-white py-3 rounded-lg font-semibold hover:bg-[#628141] transition-all flex items-center justify-center gap-2 mt-4">
                <Route size={18} /> {loadingAnalisis ? 'Mencari Rute...' : 'Cari Rute Terpendek'}
              </button>
            </form>
          )}
        </div>
        <div className="mt-6 p-3.5 bg-[#F8FAF5] border border-gray-200 rounded-lg">
          <h4 className="text-xs font-bold text-[#40513B] uppercase tracking-wider mb-1 flex items-center gap-1"><Navigation size={12} /> Log Operasi</h4>
          <p className="text-xs text-gray-600 leading-relaxed font-medium">{pesanStatus}</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-gray-100 rounded-xl relative shadow-md overflow-hidden border border-gray-300">
        <MapContainer center={[-6.1866, 106.5321]} zoom={11} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OSM' />
          {dataLahanGeoJSON && dataLahanGeoJSON.features && <GeoJSON key={`lahan`} data={dataLahanGeoJSON} style={gayaPoligon} onEachFeature={onEachLahan} />}
          {dataRute && dataRute.features && <GeoJSON key={`rute-${dataRute.features.length}`} data={dataRute} style={gayaRuteJalan} onEachFeature={onEachRuteJalan} />}
          <FitRouteBounds dataRute={dataRute} />
        </MapContainer>
      </div>
    </div>
  );
}