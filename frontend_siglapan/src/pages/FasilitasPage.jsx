import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Trash2, Edit } from 'lucide-react';

export default function FasilitasPage() {
  const [fasilitas, setFasilitas] = useState([]);
  const [form, setForm] = useState(null);

  const fetchFasilitas = async () => {
    try {
      const res = await api.get('/fasilitas');
      const formattedData = res.data.features ? res.data.features.map(f => ({
        ...f.properties,
        x_coord: f.geometry.coordinates[0],
        y_coord: f.geometry.coordinates[1]
      })) : [];
      setFasilitas(formattedData);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchFasilitas(); }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Hapus fasilitas ini?')) {
      await api.delete(`/fasilitas/${id}`);
      fetchFasilitas();
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, x_coord: parseFloat(form.x_coord), y_coord: parseFloat(form.y_coord) };
      if (form.id_fasilitas) {
        await api.put(`/fasilitas/${form.id_fasilitas}`, payload);
      } else {
        await api.post('/fasilitas', payload);
      }
      setForm(null);
      fetchFasilitas();
    } catch (error) {
      alert("Terjadi kesalahan.");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-[#40513B]">Manajemen Fasilitas</h3>
        <button 
          onClick={() => setForm({ id_user: 1, nama_fasilitas: '', jenis_fasilitas: '', x_coord: '', y_coord: '' })}
          className="bg-[#40513B] text-white px-4 py-2 rounded-lg hover:bg-[#628141] flex items-center gap-2"
        >
          <Plus size={18} /> Tambah Fasilitas
        </button>
      </div>

      {form && (
        <form onSubmit={handleSave} className="bg-[#F8FAF5] p-6 rounded-lg mb-6 border border-[#628141]/30 grid grid-cols-2 gap-4">
          <input type="text" placeholder="Nama Fasilitas" className="border p-2 rounded col-span-2" value={form.nama_fasilitas} onChange={e => setForm({...form, nama_fasilitas: e.target.value})} required />
          <input type="text" placeholder="Jenis Fasilitas (Gudang/Irigasi/dll)" className="border p-2 rounded col-span-2" value={form.jenis_fasilitas} onChange={e => setForm({...form, jenis_fasilitas: e.target.value})} required />
          <input type="number" step="any" placeholder="Koordinat X (Easting)" className="border p-2 rounded" value={form.x_coord} onChange={e => setForm({...form, x_coord: e.target.value})} required />
          <input type="number" step="any" placeholder="Koordinat Y (Northing)" className="border p-2 rounded" value={form.y_coord} onChange={e => setForm({...form, y_coord: e.target.value})} required />
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
              <th className="p-3">Nama Fasilitas</th>
              <th className="p-3">Jenis</th>
              <th className="p-3 text-center rounded-tr-lg">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {fasilitas.map((item) => (
              <tr key={item.id_fasilitas} className="border-b hover:bg-gray-50">
                <td className="p-3">{item.id_fasilitas}</td>
                <td className="p-3">{item.nama_fasilitas}</td>
                <td className="p-3">{item.jenis_fasilitas}</td>
                <td className="p-3 flex justify-center gap-3">
                  <button onClick={() => setForm({...item, id_user: 1})} className="text-[#EAB308] hover:text-[#40513B]"><Edit size={18}/></button>
                  <button onClick={() => handleDelete(item.id_fasilitas)} className="text-red-500 hover:text-red-700"><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}