import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Trash2, Edit, Sprout, X, Check } from 'lucide-react';

export default function TanamanPage() {
  const [tanaman, setTanaman] = useState([]);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchTanaman = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tanaman');
      setTanaman(res.data);
    } catch (err) {
      setError('Gagal memuat data tanaman.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTanaman(); }, []);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus data tanaman ini?')) return;
    try {
      await api.delete(`/tanaman/${id}`);
      showSuccess('Data tanaman berhasil dihapus.');
      fetchTanaman();
    } catch {
      setError('Gagal menghapus data.');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (form.id_tanaman) {
        await api.put(`/tanaman/${form.id_tanaman}`, {
          nama_tanaman: form.nama_tanaman,
          deskripsi: form.deskripsi || '',
        });
        showSuccess('Data tanaman berhasil diupdate.');
      } else {
        await api.post('/tanaman', {
          nama_tanaman: form.nama_tanaman,
          deskripsi: form.deskripsi || '',
        });
        showSuccess('Data tanaman berhasil ditambahkan.');
      }
      setForm(null);
      fetchTanaman();
    } catch {
      setError('Gagal menyimpan data. Pastikan nama tanaman minimal 2 karakter.');
    }
  };

  const warnaTanaman = [
    'bg-green-100 text-green-800',
    'bg-yellow-100 text-yellow-800',
    'bg-orange-100 text-orange-800',
    'bg-teal-100 text-teal-800',
    'bg-lime-100 text-lime-800',
    'bg-emerald-100 text-emerald-800',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-[#40513B] p-2 rounded-lg">
              <Sprout className="text-white" size={22} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#40513B]">Manajemen Jenis Tanaman</h3>
              <p className="text-sm text-gray-500">Kelola master data jenis tanaman pertanian</p>
            </div>
          </div>
          <button
            onClick={() => setForm({ nama_tanaman: '', deskripsi: '' })}
            className="bg-[#40513B] text-white px-4 py-2 rounded-lg hover:bg-[#628141] transition flex items-center gap-2 text-sm font-medium"
          >
            <Plus size={16} /> Tambah Tanaman
          </button>
        </div>
      </div>

      {/* Notifikasi */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-lg text-sm font-medium">
          <Check size={16} /> {successMsg}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
          <X size={16} /> {error}
        </div>
      )}

      {/* Form Tambah/Edit */}
      {form && (
        <div className="bg-white rounded-xl shadow-sm border border-[#628141]/40 p-6">
          <h4 className="font-bold text-[#40513B] mb-4 text-base">
            {form.id_tanaman ? '✏️ Edit Data Tanaman' : '➕ Tambah Tanaman Baru'}
          </h4>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Tanaman <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="contoh: Padi, Jagung, Kopi..."
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:border-[#628141] text-sm"
                value={form.nama_tanaman}
                onChange={e => setForm({ ...form, nama_tanaman: e.target.value })}
                required
                minLength={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
              <input
                type="text"
                placeholder="Deskripsi singkat tanaman (opsional)"
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:border-[#628141] text-sm"
                value={form.deskripsi || ''}
                onChange={e => setForm({ ...form, deskripsi: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setForm(null); setError(''); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-sm"
              >
                Batal
              </button>
              <button
                type="submit"
                className="bg-[#40513B] text-white px-5 py-2 rounded-lg hover:bg-[#628141] text-sm font-medium transition"
              >
                Simpan Data
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabel Data */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 animate-pulse">Memuat data tanaman...</div>
        ) : tanaman.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Sprout size={40} className="mx-auto mb-3 opacity-30" />
            <p>Belum ada data tanaman.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#40513B] text-white text-sm">
                <th className="p-3 pl-5">ID</th>
                <th className="p-3">Nama Tanaman</th>
                <th className="p-3">Deskripsi</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tanaman.map((item, idx) => (
                <tr key={item.id_tanaman} className="border-b border-gray-100 hover:bg-[#F8FAF5] transition">
                  <td className="p-3 pl-5 text-gray-500 text-sm">{item.id_tanaman}</td>
                  <td className="p-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${warnaTanaman[idx % warnaTanaman.length]}`}>
                      🌿 {item.nama_tanaman}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-500">{item.deskripsi || <span className="italic text-gray-300">—</span>}</td>
                  <td className="p-3">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => setForm({ ...item })}
                        title="Edit"
                        className="text-[#EAB308] hover:text-[#40513B] transition"
                      >
                        <Edit size={17} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id_tanaman)}
                        title="Hapus"
                        className="text-red-400 hover:text-red-600 transition"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Footer count */}
        {!loading && tanaman.length > 0 && (
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
            Total {tanaman.length} jenis tanaman terdaftar
          </div>
        )}
      </div>
    </div>
  );
}
