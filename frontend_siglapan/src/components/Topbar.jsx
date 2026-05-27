import React from 'react';
import { Settings } from 'lucide-react';

export default function Topbar({ title }) {
  return (
    <header className="bg-white p-6 shadow-sm border-b border-gray-200 flex justify-between items-center z-10">
      <h2 className="text-2xl font-bold text-[#40513B]">{title}</h2>
      <div className="flex items-center gap-4">
        <div className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
          Server: <span className="text-[#628141] font-bold">Online</span>
        </div>
        <button className="text-gray-400 hover:text-[#40513B] transition-colors">
          <Settings size={24} />
        </button>
      </div>
    </header>
  );
}