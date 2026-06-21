import React, { useState } from 'react';
import { Map as MapIcon, Lock, User, AlertCircle, ArrowRight, X } from 'lucide-react';

export default function LoginPage({ onLogin, onClose }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      if (username === 'admin' && password === 'siglapan123') {
        onLogin();
      } else {
        setError('Username atau password tidak valid. Silakan coba lagi.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden relative">
        
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-20 bg-black/20 hover:bg-black/40 text-white rounded-full p-1 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="bg-[#40513B] p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 flex items-center justify-center">
            <MapIcon size={150} />
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-[#EAB308] p-3 rounded-xl mb-4 shadow-lg">
              <MapIcon className="text-[#40513B]" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-widest">SIGLAPAN</h1>
            <p className="text-[#F8FAF5] text-sm mt-2 font-medium opacity-90">Sistem Informasi Lahan Pertanian</p>
          </div>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Masuk ke Dasbor</h2>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-3">
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-600 block">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#628141] bg-gray-50 text-gray-900"
                  placeholder="Masukkan username"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-600 block">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#628141] bg-gray-50 text-gray-900"
                  placeholder="Masukkan password"
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-[#628141] hover:bg-[#40513B] text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 mt-2 shadow-md">
              {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><span>Masuk Sistem</span> <ArrowRight size={18} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}