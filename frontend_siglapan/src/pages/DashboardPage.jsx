import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { BarChart3 } from 'lucide-react';

export default function DashboardPage() {
  const [statistik, setStatistik] = useState([]);

  useEffect(() => {
    const fetchStatistik = async () => {
      try {
        const res = await api.get('/statistik');
        setStatistik(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchStatistik();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statistik.map((stat, index) => (
        <div key={index} className="bg-white p-6 rounded-xl shadow-md border-t-4 border-[#628141] hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">Komoditas</p>
              <h3 className="text-2xl font-bold text-[#40513B]">{stat.nama_tanaman}</h3>
            </div>
            <div className="bg-[#EAB308]/20 p-3 rounded-full">
              <BarChart3 className="text-[#EAB308]" size={24} />
            </div>
          </div>
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Persil Lahan</span>
              <span className="font-bold text-[#40513B]">{stat.jumlah_persil}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Luas Area (m&sup2;)</span>
              <span className="font-bold text-[#40513B]">{parseFloat(stat.total_luas).toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}