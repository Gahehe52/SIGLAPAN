import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Route } from 'lucide-react';

export default function JalanPage() {
  const [jalan, setJalan] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJalan = async () => {
    try {
      // Memanggil endpoint API jalan yang baru
      const res = await api.get('/jalan');
      
      // Mengambil data dari dalam format properti GeoJSON
      if (res.data && res.data.features) {
        setJalan(res.data.features.map(f => f.properties));
      } else {
        setJalan([]);
      }
    } catch (error) {
      console.error("Gagal memuat data jalan", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJalan();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#40513B] flex items-center gap-2">
          <Route size={24} className="text-[#628141]" />
          Data Jaringan Jalan Satelit
        </h2>
      </div>

      <div className="overflow-auto flex-1 border border-gray-200 rounded-lg">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead className="bg-[#F8FAF5] sticky top-0 shadow-sm">
            <tr className="text-[#40513B]">
              <th className="py-3 px-4 font-semibold w-24">ID Jalan</th>
              <th className="py-3 px-4 font-semibold">Nama Jalan</th>
              <th className="py-3 px-4 font-semibold w-48">Kategori (Highway)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="3" className="py-8 text-center text-gray-500 font-medium animate-pulse">
                  Membaca data spasial jalan dari database...
                </td>
              </tr>
            ) : jalan.length === 0 ? (
              <tr>
                <td colSpan="3" className="py-8 text-center text-gray-500">
                  Tidak ada data jaringan jalan yang ditemukan.
                </td>
              </tr>
            ) : (
              jalan.map((item, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="py-3 px-4 text-gray-600 font-mono text-sm">#{item.id_jalan}</td>
                  <td className="py-3 px-4 font-medium text-gray-800">{item.nama_jalan || 'Jalan Tanpa Nama'}</td>
                  <td className="py-3 px-4">
                    <span className="bg-orange-100 text-[#D35400] text-xs px-3 py-1 rounded-full font-bold capitalize border border-orange-200">
                      {item.tipe_jalan}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Kotak Informasi Tambahan */}
      <div className="mt-4 p-4 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-100 flex gap-3 items-start">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <p>
          <strong>Informasi Geospasial:</strong> Data jaringan jalan ini disinkronisasi secara otomatis melalui API Satelit OpenStreetMap berdasarkan <i>Bounding Box</i> (batas koordinat wilayah) seluruh lahan Anda. Karena bentuk geometri setiap jalan adalah garis kompleks (<i>LineString</i>) yang saling terhubung, fitur penambahan atau pengubahan data secara manual dinonaktifkan pada halaman ini demi menjaga integritas topologi peta.
        </p>
      </div>
    </div>
  );
}