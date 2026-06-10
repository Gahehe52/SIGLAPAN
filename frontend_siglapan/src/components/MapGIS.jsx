import React, { useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Komponen internal untuk mendeteksi koordinat objek secara dinamis dan memfokuskan kamera peta
function FitBounds({ dataLahan }) {
  const map = useMap();

  useEffect(() => {
    if (dataLahan && dataLahan.features && dataLahan.features.length > 0) {
      try {
        const layer = L.geoJSON(dataLahan);
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [20, 20] });
        }
      } catch (error) {
        console.error("Gagal menyesuaikan fokus cakupan peta:", error);
      }
    }
  }, [dataLahan, map]);

  return null;
}

export default function MapGIS({ dataLahan, dataJalan }) {
  // Desain poligon lahan pertanian
  const gayaPoligon = () => ({
    fillColor: '#628141',
    weight: 2,
    opacity: 1,
    color: '#40513B',
    fillOpacity: 0.5
  });

  // Desain garis jaringan jalan satelit
  const gayaJalan = (feature) => {
    const tipe = feature.properties?.tipe_jalan || 'Jalan Lokal';
    // Jalan besar/utama dibuat sedikit lebih tebal dibandingkan jalan lingkungan
    const tebal = (tipe === 'motorway' || tipe === 'trunk' || tipe === 'primary' || tipe === 'secondary') ? 3 : 1.5;
    return {
      color: '#B2533E', // Menggunakan warna terracotta kontras agar terlihat jelas di atas lahan hijau
      weight: tebal,
      opacity: 0.8
    };
  };

  const onEachLahan = (feature, layer) => {
    if (feature.properties) {
      layer.bindPopup(`
        <div class="p-2 min-w-[200px]">
          <h3 class="font-bold text-[#40513B] border-b border-gray-200 pb-2 mb-2 text-lg">${feature.properties.nama_lahan || 'Tanpa Nama Lahan'}</h3>
          <table class="w-full text-sm">
            <tr><td class="py-1 text-gray-500">Pemilik</td><td class="font-semibold text-right">${feature.properties.nama_pemilik || '-'}</td></tr>
            <tr><td class="py-1 text-gray-500">Tanaman</td><td class="font-semibold text-right">${feature.properties.nama_tanaman || '-'}</td></tr>
            <tr><td class="py-1 text-gray-500">Luas</td><td class="font-semibold text-right text-[#628141]">${feature.properties.luas_lahan ? parseFloat(feature.properties.luas_lahan).toLocaleString('id-ID') : 0} m&sup2;</td></tr>
          </table>
        </div>
      `);
    }
  };

  const onEachJalan = (feature, layer) => {
    if (feature.properties) {
      layer.bindPopup(`
        <div class="p-1 min-w-[150px]">
          <h4 class="font-bold text-[#40513B] text-base">${feature.properties.nama_jalan || 'Jalan Tanpa Nama'}</h4>
          <p class="text-xs text-gray-600 font-medium bg-gray-100 inline-block px-2 py-1 rounded mt-1">
            ${feature.properties.tipe_jalan || 'Jalan Lokal'}
          </p>
        </div>
      `);
    }
  };

  return (
    <div className="absolute inset-0 z-0">
      <MapContainer 
        center={[-6.2088, 106.8456]} 
        zoom={11} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          attribution='&copy; OpenStreetMap contributors'
        />
        
        {/* Render Poligon Lahan Pertanian */}
        {dataLahan && dataLahan.features && (
          <GeoJSON 
            key={`lahan-${dataLahan.features.length}`}
            data={dataLahan} 
            style={gayaPoligon} 
            onEachFeature={onEachLahan} 
          />
        )}

        {/* Render Jalur Garis Jalan Nyata dari Satelit */}
        {dataJalan && dataJalan.features && (
          <GeoJSON 
            key={`jalan-${dataJalan.features.length}`}
            data={dataJalan}
            style={gayaJalan}
            onEachFeature={onEachJalan}
          />
        )}

        {/* Pemicu penyesuaian kamera otomatis */}
        <FitBounds dataLahan={dataLahan} />
      </MapContainer>
    </div>
  );
}