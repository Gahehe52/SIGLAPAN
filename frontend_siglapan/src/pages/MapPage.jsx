import React, { useState, useEffect } from 'react';
import MapGIS from '../components/MapGIS';
import api from '../api/axios';
import { Search, Filter } from 'lucide-react';

export default function MapPage() {
  const [dataLahan, setDataLahan] = useState(null);
  const [dataJalan, setDataJalan] = useState(null);
  const [filterPemilik, setFilterPemilik] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPeta = async () => {
    setLoading(true);
    try {
      const urlLahan = filterPemilik 
        ? `/lahan?limit=500&pemilik=${filterPemilik}` 
        : `/lahan?limit=500`;
      const resLahan = await api.get(urlLahan);
      setDataLahan(resLahan.data);

      // Memanggil data rute jalan raya yang sudah ditransformasi dari database Neon Cloud
      const resJalan = await api.get('/jalan');
      setDataJalan(resJalan.data);
    } catch (error) {
      print("Gagal memuat data spasial dari server database cloud:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeta();
  }, []);

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      
      {/* Panel Pencarian */}
      <div className="flex-shrink-0 bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex gap-4 items-center">
        <Filter className="text-gray-400" />
        <input 
          type="text" 
          placeholder="Cari berdasarkan nama pemilik..." 
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-[#628141]"
          value={filterPemilik}
          onChange={(e) => setFilterPemilik(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchPeta()}
        />
        <button 
          onClick={fetchPeta}
          className="bg-[#40513B] text-white px-6 py-2 rounded-lg hover:bg-[#628141] transition flex items-center gap-2"
        >
          <Search size={18} /> Terapkan Filter
        </button>
      </div>

      {/* Wadah Utama Peta */}
      <div className="flex-1 min-h-0 bg-gray-100 rounded-xl relative shadow-md overflow-hidden border border-gray-300">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-[1000]">
            <span className="font-bold text-[#40513B] animate-pulse">Sinkronisasi Peta dan Jaringan Jalan Satelit...</span>
          </div>
        )}
        <MapGIS dataLahan={dataLahan} dataJalan={dataJalan} />
      </div>

    </div>
  );
}