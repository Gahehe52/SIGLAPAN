import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import DashboardPage from './pages/DashboardPage';
import MapPage from './pages/MapPage';
import LahanPage from './pages/LahanPage';
import TanamanPage from './pages/TanamanPage';
import SpasialPage from './pages/SpasialPage';
// Pastikan Anda mengubah nama komponen halaman manajemen dari FasilitasPage menjadi JalanPage jika file manajemen datanya disesuaikan
import JalanPage from './pages/FasilitasPage'; 

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardPage />;
      case 'peta': return <MapPage />;
      case 'spasial': return <SpasialPage />;
      case 'lahan': return <LahanPage />;
      case 'tanaman': return <TanamanPage />;
      case 'jalan': return <JalanPage />; // Menghubungkan ke halaman kelola jalan rute
      default: return <DashboardPage />;
    }
  };

  const getTitle = () => {
    switch (activePage) {
      case 'dashboard': return 'Dashboard Statistik';
      case 'peta': return 'Peta & Filter Geospasial';
      case 'spasial': return 'Analisis Spasial';
      case 'lahan': return 'Manajemen Data Lahan';
      case 'tanaman': return 'Manajemen Jenis Tanaman';
      case 'jalan': return 'Manajemen Jaringan Jalan'; // Memperbarui judul halaman utama kelola jalan rute
      default: return 'SIGLAPAN';
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAF5]">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Topbar title={getTitle()} />
        <div className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </div>
        <footer className="bg-white border-t border-gray-200 p-4 text-center text-sm text-gray-500 z-10">
          <p className="font-medium">&copy; 2026 Sistem Informasi Lahan Pertanian</p>
          <p className="text-xs mt-1">Muhammad Ghama Al Fajri (123140182) - Teknik Informatika ITERA</p>
        </footer>
      </main>
    </div>
  );
}