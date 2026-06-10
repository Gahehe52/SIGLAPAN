import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/axios';
import { Search, MapPin, Radar, Info, X, Check } from 'lucide-react';

// Fix leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Icon merah untuk titik klik
const iconMerah = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

// Icon biru untuk fasilitas hasil pencarian
const iconBiru = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

// Komponen untuk menangkap klik peta (mode cek lokasi)
function KlikPeta({ aktif, onKlik }) {
  useMapEvents({
    click(e) {
      if (aktif) onKlik(e.latlng);
    }
  });
  return null;
}

export default function SpasialPage() {
  const [modeCek, setModeCek] = useState(false);
  const [titikKlik, setTitikKlik] = useState(null);
  const [hasilCekLokasi, setHasilCekLokasi] = useState(null);
  const [loadingCek, setLoadingCek] = useState(false);

  const [daftarLahan, setDaftarLahan] = useState([]);
  const [lahanDipilih, setLahanDipilih] = useState('');
  const [radius, setRadius] = useState(500);
  const [fasilitasTerdekat, setFasilitasTerdekat] = useState([]);
  const [pusatBuffer, setPusatBuffer] = useState(null);
  const [loadingFasilitas, setLoadingFasilitas] = useState(false);

  const [dataLahan, setDataLahan] = useState(null);
  const [error, setError] = useState('');

  // Ambil daftar lahan untuk dropdown
  useEffect(() => {
    const fetchLahan = async () => {
      try {
        const res = await api.get('/lahan?limit=100');
        const list = res.data.features?.map(f => f.properties) || [];
        setDaftarLahan(list);
      } catch { }
    };
    // Ambil layer lahan untuk background peta
    const fetchLayer = async () => {
      try {
        const res = await api.get('/lahan?limit=500');
        setDataLahan(res.data);
      } catch { }
    };
    fetchLahan();
    fetchLayer();
  }, []);

  // Handler klik peta → cek lokasi
  const handleKlikPeta = async (latlng) => {
    setTitikKlik(latlng);
    setHasilCekLokasi(null);
    setLoadingCek(true);
    setError('');
    try {
      // Kirim lon (x) dan lat (y) dalam WGS84
      const res = await api.get('/spasial/cek-lokasi', {
        params: { x: latlng.lng, y: latlng.lat }
      });
      setHasilCekLokasi(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setHasilCekLokasi({ found: false });
      } else {
        setError('Gagal menghubungi server. Pastikan backend berjalan.');
      }
    } finally {
      setLoadingCek(false);
    }
  };

  // Handler cari fasilitas terdekat
  const handleCariFasilitas = async () => {
    if (!lahanDipilih) {
      setError('Pilih lahan terlebih dahulu.');
      return;
    }
    setError('');
    setLoadingFasilitas(true);
    setFasilitasTerdekat([]);
    setPusatBuffer(null);
    try {
      const res = await api.get('/spasial/fasilitas-terdekat', {
        params: { id_lahan: lahanDipilih, radius: radius }
      });

      // Ambil koordinat centroid lahan yang dipilih dari layer
      const lahanGeo = dataLahan?.features?.find(
        f => String(f.properties.id_lahan) === String(lahanDipilih)
      );
      if (lahanGeo) {
        // Hitung centroid sederhana dari bbox
        const coords = lahanGeo.geometry.coordinates[0][0];
        const lats = coords.map(c => c[1]);
        const lngs = coords.map(c => c[0]);
        const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
        const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
        setPusatBuffer([centerLat, centerLng]);
      }

      // Format hasil
      const hasil = res.data.features || [];
      setFasilitasTerdekat(hasil);
    } catch (err) {
      setError('Gagal mencari fasilitas terdekat. Coba lagi.');
    } finally {
      setLoadingFasilitas(false);
    }
  };

  const gayaPoligon = () => ({
    fillColor: '#628141',
    weight: 1.5,
    opacity: 0.8,
    color: '#40513B',
    fillOpacity: 0.35,
  });

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">

      {/* Panel Kontrol */}
      <div className="flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-lg font-bold text-[#40513B] mb-4 flex items-center gap-2">
          <Radar size={20} /> Analisis Spasial
        </h3>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-300 text-red-600 px-3 py-2 rounded-lg text-sm mb-4">
            <X size={14} /> {error}
            <button onClick={() => setError('')} className="ml-auto"><X size={12} /></button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* ── Fitur 1: Cek Lokasi ── */}
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-red-100 p-1.5 rounded-lg">
                <MapPin size={16} className="text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-800">Cek Lokasi Lahan</p>
                <p className="text-xs text-gray-400">Klik titik di peta untuk cek lahan (ST_Intersects)</p>
              </div>
            </div>

            <button
              onClick={() => {
                setModeCek(!modeCek);
                setTitikKlik(null);
                setHasilCekLokasi(null);
                setError('');
              }}
              className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition ${modeCek
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-[#40513B] text-white hover:bg-[#628141]'
                }`}
            >
              {modeCek ? '🔴 Nonaktifkan — Klik Aktif' : '📍 Aktifkan Klik Peta'}
            </button>

            {modeCek && (
              <p className="text-xs text-center text-red-500 mt-2 animate-pulse font-medium">
                Klik di mana saja pada peta...
              </p>
            )}

            {/* Hasil cek lokasi */}
            {loadingCek && (
              <div className="mt-3 text-center text-xs text-gray-400 animate-pulse">Mengecek lokasi...</div>
            )}
            {hasilCekLokasi && !loadingCek && (
              <div className={`mt-3 p-3 rounded-lg text-sm border ${hasilCekLokasi.found === false || (!hasilCekLokasi.nama_lahan && !hasilCekLokasi.id_lahan)
                ? 'bg-gray-50 border-gray-200 text-gray-500'
                : 'bg-green-50 border-green-200'
                }`}>
                {hasilCekLokasi.found === false || (!hasilCekLokasi.nama_lahan && !hasilCekLokasi.id_lahan) ? (
                  <p className="text-center">❌ Tidak ada lahan di titik ini</p>
                ) : (
                  <div>
                    <p className="font-semibold text-green-800 mb-2 flex items-center gap-1">
                      <Check size={14} /> Lahan ditemukan!
                    </p>
                    <table className="w-full text-xs">
                      <tbody>
                        {hasilCekLokasi.nama_lahan && (
                          <tr><td className="text-gray-500 py-0.5">Nama</td><td className="font-medium">{hasilCekLokasi.nama_lahan}</td></tr>
                        )}
                        {hasilCekLokasi.nama_pemilik && (
                          <tr><td className="text-gray-500 py-0.5">Pemilik</td><td className="font-medium">{hasilCekLokasi.nama_pemilik}</td></tr>
                        )}
                        {hasilCekLokasi.nama_tanaman && (
                          <tr><td className="text-gray-500 py-0.5">Tanaman</td><td className="font-medium text-green-700">{hasilCekLokasi.nama_tanaman}</td></tr>
                        )}
                        {hasilCekLokasi.luas_lahan && (
                          <tr><td className="text-gray-500 py-0.5">Luas</td><td className="font-medium">{parseFloat(hasilCekLokasi.luas_lahan).toLocaleString('id-ID')} m²</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Fitur 2: Fasilitas Terdekat ── */}
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-blue-100 p-1.5 rounded-lg">
                <Search size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-800">Fasilitas Terdekat</p>
                <p className="text-xs text-gray-400">Cari fasilitas dalam radius dari lahan (ST_DWithin)</p>
              </div>
            </div>

            <div className="space-y-2">
              <select
                value={lahanDipilih}
                onChange={e => setLahanDipilih(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#628141]"
              >
                <option value="">— Pilih Lahan —</option>
                {daftarLahan.map(l => (
                  <option key={l.id_lahan} value={l.id_lahan}>
                    [{l.id_lahan}] {l.nama_lahan} ({l.nama_pemilik})
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 w-20 flex-shrink-0">Radius (m):</label>
                <input
                  type="number"
                  min={100}
                  max={10000}
                  step={100}
                  value={radius}
                  onChange={e => setRadius(Number(e.target.value))}
                  className="flex-1 border border-gray-300 px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:border-[#628141]"
                />
              </div>

              <button
                onClick={handleCariFasilitas}
                disabled={loadingFasilitas || !lahanDipilih}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingFasilitas ? 'Mencari...' : '🔍 Cari Fasilitas Terdekat'}
              </button>
            </div>

            {/* Hasil fasilitas terdekat */}
            {fasilitasTerdekat.length > 0 && (
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-800 mb-2">
                  ✅ Ditemukan {fasilitasTerdekat.length} fasilitas dalam radius {radius.toLocaleString()} m:
                </p>
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {fasilitasTerdekat.map((f, i) => (
                    <div key={i} className="text-xs text-blue-700 flex items-center gap-1.5">
                      <span className="text-blue-400">📍</span>
                      <span className="font-medium">{f.properties?.nama_fasilitas || f.nama_fasilitas}</span>
                      <span className="text-blue-400">·</span>
                      <span className="text-blue-500">{f.properties?.jenis_fasilitas || f.jenis_fasilitas}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!loadingFasilitas && lahanDipilih && fasilitasTerdekat.length === 0 && pusatBuffer && (
              <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3 text-center text-xs text-gray-400">
                ❌ Tidak ada fasilitas dalam radius {radius.toLocaleString()} m
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Peta */}
      <div className="bg-gray-100 rounded-xl relative shadow-md overflow-hidden border border-gray-300" style={{height: '550px'}}>
        <MapContainer
          center={[-6.3616, 106.6079]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />

          {/* Handler klik peta */}
          <KlikPeta aktif={modeCek} onKlik={handleKlikPeta} />

          {/* Layer polygon lahan */}
          {dataLahan && dataLahan.features && (
            <GeoJSON
              key={dataLahan.features.length}
              data={dataLahan}
              style={gayaPoligon}
            />
          )}

          {/* Marker titik klik */}
          {titikKlik && (
            <Marker position={titikKlik} icon={iconMerah}>
              <Popup>
                <div className="text-xs">
                  <p className="font-semibold">Titik yang dicek</p>
                  <p>Lat: {titikKlik.lat.toFixed(6)}</p>
                  <p>Lon: {titikKlik.lng.toFixed(6)}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Buffer lingkaran radius */}
          {pusatBuffer && (
            <Circle
              center={pusatBuffer}
              radius={radius}
              pathOptions={{
                color: '#2563EB',
                fillColor: '#3B82F6',
                fillOpacity: 0.1,
                weight: 2,
                dashArray: '6 4',
              }}
            />
          )}

          {/* Marker fasilitas terdekat */}
          {fasilitasTerdekat.map((f, i) => {
            const coords = f.geometry?.coordinates;
            if (!coords) return null;
            return (
              <Marker key={i} position={[coords[1], coords[0]]} icon={iconBiru}>
                <Popup>
                  <div className="text-xs min-w-[150px]">
                    <p className="font-bold text-blue-800">{f.properties?.nama_fasilitas}</p>
                    <p className="text-gray-500">{f.properties?.jenis_fasilitas}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-lg shadow-md border border-gray-200 p-3 text-xs space-y-1.5">
          <p className="font-semibold text-gray-600 mb-1">Legenda</p>
          <div className="flex items-center gap-2"><div className="w-4 h-3 rounded bg-[#628141] opacity-60 border border-[#40513B]"></div> Lahan Pertanian</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Titik Klik</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Fasilitas Terdekat</div>
          <div className="flex items-center gap-2"><div className="w-4 h-3 rounded border-2 border-blue-400 border-dashed opacity-60"></div> Buffer Radius</div>
        </div>

        {/* Info mode aktif */}
        {modeCek && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-red-500 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-lg animate-pulse">
            🖱️ Mode Cek Lokasi Aktif — Klik pada peta
          </div>
        )}
      </div>
    </div>
  );
}
