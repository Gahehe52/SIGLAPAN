import React from 'react';
import { User, LogIn, LogOut } from 'lucide-react';

export default function Topbar({ title, isAuthenticated, onLoginClick, onLogoutClick }) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10">
      <h2 className="text-xl font-bold text-[#40513B] tracking-wide">{title}</h2>
      
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-3 text-sm font-medium text-gray-600 bg-[#F8FAF5] px-4 py-2 rounded-full border border-gray-100">
          <div className="bg-[#628141] p-1.5 rounded-full text-white">
            <User size={14} />
          </div>
          {isAuthenticated ? 'Administrator Mode' : 'Guest Mode'}
        </div>

        {isAuthenticated ? (
          <button 
            onClick={onLogoutClick}
            className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 px-4 py-2 rounded-lg font-bold transition-colors border border-red-100"
          >
            <LogOut size={18} /> Logout
          </button>
        ) : (
          <button 
            onClick={onLoginClick}
            className="flex items-center gap-2 bg-[#628141] text-white hover:bg-[#40513B] px-4 py-2 rounded-lg font-bold transition-colors shadow-sm"
          >
            <LogIn size={18} /> Login Akses
          </button>
        )}
      </div>
    </header>
  );
}