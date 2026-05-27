import React from 'react';
import { Map as MapIcon, LayoutDashboard, MapPin, Database } from 'lucide-react';

export default function Sidebar({ activePage, setActivePage }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Statistik', icon: <LayoutDashboard size={20} /> },
    { id: 'peta', label: 'Peta & Analisis', icon: <MapIcon size={20} /> },
    { id: 'lahan', label: 'Kelola Data Lahan', icon: <Database size={20} /> },
    { id: 'fasilitas', label: 'Kelola Fasilitas', icon: <MapPin size={20} /> }
  ];

  return (
    <aside className="w-64 bg-[#40513B] text-white flex flex-col shadow-2xl z-20">
      <div className="p-6 border-b border-[#628141] flex items-center gap-3">
        <div className="bg-[#EAB308] p-2 rounded-lg">
          <MapIcon className="text-[#40513B] font-bold" size={24} />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-wider">SIGLAPAN</h1>
          <p className="text-xs text-gray-300">Sistem Lahan Pertanian</p>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activePage === item.id 
                ? 'bg-[#628141] text-white shadow-md' 
                : 'text-gray-300 hover:bg-[#628141]/50 hover:text-white'
            }`}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}