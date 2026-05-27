import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import DashboardPage from './pages/DashboardPage';
import MapPage from './pages/MapPage';
import LahanPage from './pages/LahanPage';
import FasilitasPage from './pages/FasilitasPage';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardPage />;
      case 'peta': return <MapPage />;
      case 'lahan': return <LahanPage />;
      case 'fasilitas': return <FasilitasPage />;
      default: return <DashboardPage />;
    }
  };

  const getTitle = () => {
    switch (activePage) {
      case 'dashboard': return 'Dashboard Statistik';
      case 'peta': return 'Peta & Filter Geospasial';
      case 'lahan': return 'Manajemen Data Lahan';
      case 'fasilitas': return 'Manajemen Data Fasilitas';
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