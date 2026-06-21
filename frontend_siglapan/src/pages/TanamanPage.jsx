import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Edit, Trash, Leaf, X } from 'lucide-react';

export default function TanamanPage({ isAuthenticated }) {
  const [tanaman, setTanaman] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({ nama_tanaman: '', deskripsi: '' });

  const fetchData = async () => {
    try {
      const res = await api.get('/tanaman');
      setTanaman(res.data);
    } catch (error) { console.error("Gagal", error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setFormData({ nama_tanaman: '', deskripsi: '' });
    setIsEditing(false); setEditId(null); setShowForm(false);
  };

  const handleEditClick = (item) => {
    setFormData({ nama_tanaman: item.nama_tanaman, deskripsi: item.deskripsi || '' });
    setEditId(item.id_tanaman); setIsEditing(true); setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin hapus tanaman ini? Lahan yang terikat akan tertolak hapus (Restrict).")) return;
    try { await api.delete(`/tanaman/${id}`); fetchData(); } catch (e) { alert("Gagal. Tanaman ini mungkin masih dipakai di data lahan."); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) await api.put(`/tanaman/${editId}`, formData);
      else await api.post('/tanaman/', formData);
      fetchData(); resetForm();
    } catch (error) { alert("Gagal menyimpan data tanaman."); }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#40513B] flex items-center gap-2"><Leaf className="text-[#628141]"/> Kategori Tanaman</h2>
        {isAuthenticated && (
          <button onClick={() => setShowForm(true)} className="bg-[#40513B] hover:bg-[#628141] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
            <Plus size={18} /> Tambah Tanaman
          </button>
        )}
      </div>

      {!isAuthenticated && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-100 font-medium">
          Akses Guest: Fitur modifikasi data tanaman dikunci.
        </div>
      )}

      {showForm && (
        <div className="mb-6 p-5 bg-[#F8FAF5] rounded-xl border border-[#628141]/30 relative">
          <button onClick={resetForm} className="absolute top-4 right-4 text-gray-400 hover:text-red-500"><X size={20} /></button>
          <h3 className="font-bold text-[#40513B] mb-4">{isEditing ? 'Edit Tanaman' : 'Tambah Tanaman Baru'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Nama Tanaman</label>
              <input type="text" value={formData.nama_tanaman} onChange={e => setFormData({...formData, nama_tanaman: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#628141]" required />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Deskripsi/Keterangan Singkat</label>
              <textarea value={formData.deskripsi} onChange={e => setFormData({...formData, deskripsi: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#628141]" rows="2" />
            </div>
            <button type="submit" className="bg-[#40513B] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#628141]">Simpan Tanaman</button>
          </form>
        </div>
      )}

      <div className="overflow-auto flex-1 border border-gray-200 rounded-lg">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#F8FAF5] sticky top-0">
            <tr className="text-[#40513B] border-b border-gray-200">
              <th className="py-3 px-4 font-semibold w-16">ID</th>
              <th className="py-3 px-4 font-semibold">Nama Tanaman</th>
              <th className="py-3 px-4 font-semibold">Deskripsi Botani</th>
              {isAuthenticated && <th className="py-3 px-4 font-semibold text-center w-28">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="4" className="py-6 text-center text-gray-500 animate-pulse">Memuat data...</td></tr> : 
              tanaman.map((item) => (
                <tr key={item.id_tanaman} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-xs font-mono text-gray-500">#{item.id_tanaman}</td>
                  <td className="py-3 px-4 font-bold text-gray-800">{item.nama_tanaman}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{item.deskripsi || '-'}</td>
                  {isAuthenticated && (
                    <td className="py-3 px-4 flex justify-center gap-2">
                      <button onClick={() => handleEditClick(item)} className="p-1.5 bg-blue-50 text-blue-600 rounded"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(item.id_tanaman)} className="p-1.5 bg-red-50 text-red-600 rounded"><Trash size={16} /></button>
                    </td>
                  )}
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}