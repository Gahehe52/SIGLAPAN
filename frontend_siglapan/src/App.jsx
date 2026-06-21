import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import DashboardPage from './pages/DashboardPage';
import MapPage from './pages/MapPage';
import LahanPage from './pages/LahanPage';
import TanamanPage from './pages/TanamanPage';
import SpasialPage from './pages/SpasialPage';
import JalanPage from './pages/FasilitasPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardPage />;
      case 'peta': return <MapPage />;
      case 'spasial': return <SpasialPage />;
      case 'lahan': return <LahanPage isAuthenticated={isAuthenticated} />;
      case 'tanaman': return <TanamanPage isAuthenticated={isAuthenticated} />;
      case 'jalan': return <JalanPage />;
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
      case 'jalan': return 'Manajemen Jaringan Jalan';
      default: return 'SIGLAPAN';
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAF5] relative">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Topbar 
          title={getTitle()} 
          isAuthenticated={isAuthenticated} 
          onLoginClick={() => setShowLoginModal(true)} 
          onLogoutClick={() => setIsAuthenticated(false)} 
        />
        <div className="flex-1 p-6 overflow-auto relative">
          {renderContent()}
        </div>
        <footer className="bg-white border-t border-gray-200 p-4 text-center text-sm text-gray-500 z-10">
          <p className="font-medium">&copy; 2026 Sistem Informasi Lahan Pertanian Kota Tangerang</p>
          <p className="text-xs mt-1">Kelompok Proyek WebGIS - Teknik Informatika ITERA</p>
        </footer>
      </main>

      {/* Overlay Modal Login */}
      {showLoginModal && (
        <LoginPage 
          onLogin={() => { setIsAuthenticated(true); setShowLoginModal(false); }} 
          onClose={() => setShowLoginModal(false)} 
        />
      )}
    </div>
  );
}