import React, { useState, useEffect } from 'react';
import MapGIS from '../components/MapGIS';
import api from '../api/axios';
import { Search, Filter, Leaf } from 'lucide-react';

export default function MapPage() {
  const [dataLahan, setDataLahan] = useState(null);
  const [daftarTanaman, setDaftarTanaman] = useState([]);
  
  // State untuk filter
  const [filterPemilik, setFilterPemilik] = useState('');
  const [filterTanaman, setFilterTanaman] = useState('');
  const [loading, setLoading] = useState(true);

  // Memuat daftar tanaman untuk dropdown filter
  const fetchDaftarTanaman = async () => {
    try {
      const res = await api.get('/tanaman');
      setDaftarTanaman(res.data);
    } catch (error) {
      console.error("Gagal memuat daftar tanaman:", error);
    }
  };

  const fetchPeta = async () => {
    setLoading(true);
    try {
      // Menyusun parameter query berdasarkan filter aktif
      const params = new URLSearchParams();
      params.append('limit', '500');
      if (filterPemilik) params.append('pemilik', filterPemilik);
      if (filterTanaman) params.append('jenis_tanaman', filterTanaman);

      const urlLahan = `/lahan?${params.toString()}`;
      const resLahan = await api.get(urlLahan);
      setDataLahan(resLahan.data);
    } catch (error) {
      console.error("Gagal memuat data spasial dari server database cloud:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDaftarTanaman();
    fetchPeta();
  }, []);

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      
      {/* Panel Pencarian dan Filter Spasial */}
      <div className="flex-shrink-0 bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap md:flex-nowrap gap-4 items-center">
        
        {/* Input Filter Pemilik */}
        <div className="flex-1 flex items-center gap-3 border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 focus-within:border-[#628141] focus-within:bg-white transition-colors">
          <Filter className="text-gray-400 flex-shrink-0" size={18} />
          <input 
            type="text" 
            placeholder="Cari berdasarkan nama pemilik lahan..." 
            className="flex-1 bg-transparent focus:outline-none text-sm font-medium text-gray-800 placeholder-gray-400"
            value={filterPemilik}
            onChange={(e) => setFilterPemilik(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchPeta()}
          />
        </div>

        {/* Dropdown Filter Jenis Tanaman */}
        <div className="flex-1 md:max-w-[300px] flex items-center gap-3 border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 focus-within:border-[#628141] focus-within:bg-white transition-colors">
          <Leaf className="text-gray-400 flex-shrink-0" size={18} />
          <select
            value={filterTanaman}
            onChange={(e) => setFilterTanaman(e.target.value)}
            className="flex-1 bg-transparent focus:outline-none text-sm font-medium text-gray-800 cursor-pointer"
          >
            <option value="">Semua Jenis Tanaman</option>
            {daftarTanaman.map((t) => (
              <option key={t.id_tanaman} value={t.id_tanaman}>
                {t.nama_tanaman}
              </option>
            ))}
          </select>
        </div>

        {/* Tombol Terapkan */}
        <button 
          onClick={fetchPeta}
          className="bg-[#40513B] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#628141] transition shadow-sm flex items-center gap-2"
        >
          <Search size={18} /> Terapkan Filter
        </button>
      </div>

      {/* Wadah Utama Frame Peta */}
      <div className="flex-1 min-h-0 bg-gray-100 rounded-xl relative shadow-md overflow-hidden border border-gray-300">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-[1000] backdrop-blur-sm">
            <span className="font-bold text-[#40513B] animate-pulse drop-shadow-md">Sinkronisasi Geometri Lahan...</span>
          </div>
        )}
        <MapGIS dataLahan={dataLahan} />
      </div>

    </div>
  );
}