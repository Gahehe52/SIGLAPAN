import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Database, Plus, Edit, Trash, Map as MapIcon, X } from 'lucide-react';
import { MapContainer, TileLayer, Polygon, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Komponen penangkap klik peta untuk menggambar
function MapDrawing({ points, setPoints }) {
  useMapEvents({
    click(e) {
      setPoints((prev) => [...prev, [e.latlng.lat, e.latlng.lng]]);
    }
  });
  return points.length > 0 ? <Polygon positions={points} pathOptions={{ color: '#D35400', weight: 3, fillColor: '#D35400', fillOpacity: 0.4 }} /> : null;
}

export default function LahanPage({ isAuthenticated }) {
  const [lahanFeatures, setLahanFeatures] = useState([]);
  const [tanamanList, setTanamanList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showMapDrawer, setShowMapDrawer] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState([]);

  const [formData, setFormData] = useState({
    id_tanaman: '',
    nama_pemilik: '',
    nama_lahan: '',
    keterangan: '',
    geom_wkt: ''
  });

  const fetchData = async () => {
    try {
      const resLahan = await api.get('/lahan?limit=500');
      if (resLahan.data && resLahan.data.features) setLahanFeatures(resLahan.data.features);
      
      const resTanaman = await api.get('/tanaman');
      setTanamanList(resTanaman.data);
    } catch (error) {
      console.error("Gagal memuat data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setFormData({ id_tanaman: '', nama_pemilik: '', nama_lahan: '', keterangan: '', geom_wkt: '' });
    setIsEditing(false);
    setEditId(null);
    setShowForm(false);
    setDrawnPoints([]);
    setShowMapDrawer(false);
  };

  // Konversi GeoJSON balikan server ke format WKT agar bisa diedit ulang
  const convertGeoJSONToWKT = (geometry) => {
    if (!geometry) return '';
    try {
      let coords = [];
      if (geometry.type === 'Polygon') coords = geometry.coordinates[0];
      else if (geometry.type === 'MultiPolygon') coords = geometry.coordinates[0][0];
      if (coords.length > 0) {
        return `POLYGON((${coords.map(p => `${p[0]} ${p[1]}`).join(', ')}))`;
      }
    } catch (e) { return ''; }
    return '';
  };

  const handleEditClick = (feature) => {
    const props = feature.properties;
    // Mencari id_tanaman berdasarkan nama_tanaman yang dikembalikan API
    const tanamanTerpilih = tanamanList.find(t => t.nama_tanaman === props.nama_tanaman);
    
    setFormData({
      id_tanaman: tanamanTerpilih ? tanamanTerpilih.id_tanaman : '',
      nama_pemilik: props.nama_pemilik || '',
      nama_lahan: props.nama_lahan || '',
      keterangan: props.keterangan || '',
      geom_wkt: convertGeoJSONToWKT(feature.geometry)
    });
    setEditId(props.id_lahan);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus lahan ini?")) return;
    try {
      await api.delete(`/lahan/${id}`);
      fetchData();
    } catch (error) { alert("Gagal menghapus lahan!"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, id_user: 1 }; // Default user admin
      if (isEditing) await api.put(`/lahan/${editId}`, payload);
      else await api.post('/lahan/', payload);
      fetchData();
      resetForm();
    } catch (error) { alert("Gagal menyimpan data. Pastikan format geometri (WKT) valid."); }
  };

  const handleFinishDraw = () => {
    if (drawnPoints.length < 3) return alert("Gambarlah minimal 3 titik batas untuk membentuk poligon kebun.");
    // Tutup poligon (titik awal = titik akhir)
    const wktPoints = [...drawnPoints, drawnPoints[0]].map(p => `${p[1]} ${p[0]}`).join(', ');
    setFormData({ ...formData, geom_wkt: `POLYGON((${wktPoints}))` });
    setShowMapDrawer(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#40513B] flex items-center gap-2"><Database className="text-[#628141]"/> Data Lahan Pertanian</h2>
        {isAuthenticated && (
          <button onClick={() => setShowForm(true)} className="bg-[#40513B] hover:bg-[#628141] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition">
            <Plus size={18} /> Tambah Lahan
          </button>
        )}
      </div>

      {!isAuthenticated && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-100 font-medium">
          Anda berada dalam Guest Mode. Fitur manipulasi data (Tambah, Edit, Hapus) dikunci. Silakan klik "Login Akses" di pojok kanan atas untuk membuka fitur ini.
        </div>
      )}

      {/* Form Overlay */}
      {showForm && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-[#F8FAF5] p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold text-[#40513B] text-lg">{isEditing ? 'Edit Data Lahan' : 'Tambah Lahan Baru'}</h3>
              <button onClick={resetForm} className="text-gray-500 hover:text-red-500"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase">Nama Pemilik</label>
                  <input type="text" value={formData.nama_pemilik} onChange={e => setFormData({...formData, nama_pemilik: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#628141] bg-gray-50" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase">Nama Lahan</label>
                  <input type="text" value={formData.nama_lahan} onChange={e => setFormData({...formData, nama_lahan: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#628141] bg-gray-50" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase">Komoditas Tanaman (Relasi)</label>
                <select value={formData.id_tanaman} onChange={e => setFormData({...formData, id_tanaman: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#628141] bg-gray-50 font-medium" required>
                  <option value="">-- Pilih Jenis Tanaman --</option>
                  {tanamanList.map(t => (
                    <option key={t.id_tanaman} value={t.id_tanaman}>{t.nama_tanaman}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase">Koordinat Geometri (WKT)</label>
                {!showMapDrawer ? (
                  <div>
                    <textarea value={formData.geom_wkt} onChange={e => setFormData({...formData, geom_wkt: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#628141] bg-gray-50 text-xs font-mono" rows="3" placeholder="POLYGON((106.5 -6.1, ...))" required />
                    <button type="button" onClick={() => { setShowMapDrawer(true); setDrawnPoints([]); }} className="mt-2 w-full border-2 border-dashed border-[#628141] text-[#40513B] py-2 rounded font-bold hover:bg-[#F8FAF5] transition flex justify-center items-center gap-2">
                      <MapIcon size={18} /> Gambar Langsung di Peta
                    </button>
                  </div>
                ) : (
                  <div className="border border-gray-300 rounded overflow-hidden relative">
                    <div className="h-64">
                      <MapContainer center={[-6.1866, 106.5321]} zoom={12} style={{height: '100%', width: '100%'}}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <MapDrawing points={drawnPoints} setPoints={setDrawnPoints} />
                      </MapContainer>
                    </div>
                    <div className="bg-white p-2 border-t flex justify-between items-center">
                      <span className="text-xs text-gray-500 font-medium">{drawnPoints.length} Titik digambar. Klik pada peta untuk menambah titik.</span>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setDrawnPoints([])} className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm font-bold">Ulang</button>
                        <button type="button" onClick={handleFinishDraw} className="bg-[#628141] text-white px-3 py-1 rounded text-sm font-bold">Selesai & Ekstrak WKT</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase">Keterangan / Deskripsi</label>
                <textarea value={formData.keterangan} onChange={e => setFormData({...formData, keterangan: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#628141] bg-gray-50" rows="2" />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={resetForm} className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Batal</button>
                <button type="submit" className="px-5 py-2 bg-[#40513B] text-white font-bold rounded-lg hover:bg-[#628141]">Simpan Data Lahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabel Data */}
      <div className="overflow-auto flex-1 border border-gray-200 rounded-lg">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-[#F8FAF5] sticky top-0 z-0">
            <tr className="text-[#40513B] border-b border-gray-200">
              <th className="py-3 px-4 font-semibold">ID</th>
              <th className="py-3 px-4 font-semibold">Pemilik</th>
              <th className="py-3 px-4 font-semibold">Nama Kebun</th>
              <th className="py-3 px-4 font-semibold">Tanaman</th>
              <th className="py-3 px-4 font-semibold">Luas Area</th>
              {isAuthenticated && <th className="py-3 px-4 font-semibold text-center w-28">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={isAuthenticated ? 6 : 5} className="py-8 text-center text-gray-500 animate-pulse">Memuat data lahan spasial...</td></tr>
            ) : lahanFeatures.length === 0 ? (
              <tr><td colSpan={isAuthenticated ? 6 : 5} className="py-8 text-center text-gray-500">Tidak ada data lahan.</td></tr>
            ) : (
              lahanFeatures.map((feature, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">#{feature.properties.id_lahan}</td>
                  <td className="py-3 px-4 font-bold text-gray-800">{feature.properties.nama_pemilik}</td>
                  <td className="py-3 px-4 text-sm">{feature.properties.nama_lahan || '-'}</td>
                  <td className="py-3 px-4 text-sm font-medium text-[#628141]">{feature.properties.nama_tanaman || '-'}</td>
                  <td className="py-3 px-4 text-sm">{parseFloat(feature.properties.luas_lahan).toLocaleString('id-ID')} m²</td>
                  {isAuthenticated && (
                    <td className="py-3 px-4 flex justify-center gap-2">
                      <button onClick={() => handleEditClick(feature)} className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(feature.properties.id_lahan)} className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"><Trash size={16} /></button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}