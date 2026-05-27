import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Trash2, Edit } from 'lucide-react';

export default function LahanPage() {
  const [lahan, setLahan] = useState([]);
  const [form, setForm] = useState(null);

  const fetchLahan = async () => {
    try {
      const res = await api.get('/lahan?limit=50');
      // Ekstrak data dari format GeoJSON
      const formattedData = res.data.features ? res.data.features.map(f => f.properties) : [];
      setLahan(formattedData);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchLahan(); }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Hapus data lahan ini?')) {
      await api.delete(`/lahan/${id}`);
      fetchLahan();
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (form.id_lahan) {
        await api.put(`/lahan/${form.id_lahan}`, form);
      } else {
        await api.post('/lahan', form);
      }
      setForm(null);
      fetchLahan();
    } catch (error) {
      alert("Terjadi kesalahan. Pastikan format WKT valid.");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-[#40513B]">Manajemen Data Lahan</h3>
        <button 
          onClick={() => setForm({ id_tanaman: 1, id_user: 1, nama_pemilik: '', nama_lahan: '', keterangan: '', geom_wkt: 'MULTIPOLYGON (((...)))' })}
          className="bg-[#40513B] text-white px-4 py-2 rounded-lg hover:bg-[#628141] flex items-center gap-2"
        >
          <Plus size={18} /> Tambah Lahan
        </button>
      </div>

      {form && (
        <form onSubmit={handleSave} className="bg-[#F8FAF5] p-6 rounded-lg mb-6 border border-[#628141]/30 grid grid-cols-2 gap-4">
          <input type="text" placeholder="Nama Pemilik" className="border p-2 rounded" value={form.nama_pemilik} onChange={e => setForm({...form, nama_pemilik: e.target.value})} required />
          <input type="text" placeholder="Nama Lahan" className="border p-2 rounded" value={form.nama_lahan} onChange={e => setForm({...form, nama_lahan: e.target.value})} required />
          <input type="text" placeholder="Keterangan" className="border p-2 rounded col-span-2" value={form.keterangan} onChange={e => setForm({...form, keterangan: e.target.value})} required />
          <textarea placeholder="Format WKT Geometry (MULTIPOLYGON)" className="border p-2 rounded col-span-2 font-mono text-xs" rows="3" value={form.geom_wkt} onChange={e => setForm({...form, geom_wkt: e.target.value})} required />
          <div className="col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" onClick={() => setForm(null)} className="px-4 py-2 border rounded text-gray-600">Batal</button>
            <button type="submit" className="bg-[#40513B] text-white px-4 py-2 rounded">Simpan Data</button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#40513B] text-white">
              <th className="p-3 rounded-tl-lg">ID</th>
              <th className="p-3">Pemilik</th>
              <th className="p-3">Nama Lahan</th>
              <th className="p-3">Tanaman</th>
              <th className="p-3 text-center rounded-tr-lg">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {lahan.map((item) => (
              <tr key={item.id_lahan} className="border-b hover:bg-gray-50">
                <td className="p-3">{item.id_lahan}</td>
                <td className="p-3">{item.nama_pemilik}</td>
                <td className="p-3">{item.nama_lahan}</td>
                <td className="p-3">{item.nama_tanaman}</td>
                <td className="p-3 flex justify-center gap-3">
                  <button onClick={() => setForm({...item, id_user: 1, id_tanaman: 1, geom_wkt: 'MULTIPOLYGON (((...)))'})} className="text-[#EAB308] hover:text-[#40513B]"><Edit size={18}/></button>
                  <button onClick={() => handleDelete(item.id_lahan)} className="text-red-500 hover:text-red-700"><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}