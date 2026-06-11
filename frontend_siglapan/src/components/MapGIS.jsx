import React, { useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Komponen otomatis untuk memfokuskan kamera ke area lahan begitu data selesai diunduh
function FitBounds({ dataLahan }) {
  const map = useMap();

  useEffect(() => {
    if (dataLahan && dataLahan.features && dataLahan.features.length > 0) {
      try {
        const layer = L.geoJSON(dataLahan);
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [30, 30] });
        }
      } catch (error) {
        console.error("Gagal memposisikan cakupan peta otomatis:", error);
      }
    }
  }, [dataLahan, map]);

  return null;
}

export default function MapGIS({ dataLahan }) {
  // Desain dasar poligon lahan pertanian sesuai palet hijau kustom
  const gayaPoligon = () => ({
    fillColor: '#628141',
    weight: 2,
    opacity: 1,
    color: '#40513B',
    fillOpacity: 0.5
  });

  const onEachLahan = (feature, layer) => {
    if (feature.properties) {
      // Menggunakan bindTooltip agar informasi langsung muncul saat mouse menyentuh area poligon
      layer.bindTooltip(`
        <div class="p-2 font-sans">
          <h3 class="font-bold text-[#40513B] border-b border-gray-200 pb-1 mb-1 text-sm">${feature.properties.nama_lahan || 'Lahan Pertanian'}</h3>
          <table class="w-full text-xs gap-x-2">
            <tr><td class="text-gray-500 py-0.5">Pemilik:</td><td class="font-semibold text-right pl-2">${feature.properties.nama_pemilik || '-'}</td></tr>
            <tr><td class="text-gray-500 py-0.5">Tanaman:</td><td class="font-semibold text-right pl-2">${feature.properties.nama_tanaman || '-'}</td></tr>
            <tr><td class="text-gray-500 py-0.5">Luas Lahan:</td><td class="font-bold text-[#628141] text-right pl-2">${feature.properties.luas_lahan ? parseFloat(feature.properties.luas_lahan).toLocaleString('id-ID') : 0} m²</td></tr>
          </table>
        </div>
      `, { sticky: true, direction: 'auto', opacity: 0.95 });

      // Efek interaktif: Poligon menyala lebih terang saat dilewati kursor mouse
      layer.on({
        mouseover: (e) => {
          const targetLayer = e.target;
          targetLayer.setStyle({
            fillOpacity: 0.8,
            weight: 3,
            color: '#2C3E50'
          });
        },
        mouseout: (e) => {
          const targetLayer = e.target;
          targetLayer.setStyle(gayaPoligon());
        }
      });
    }
  };

  return (
    <div className="absolute inset-0 z-0">
      <MapContainer 
        center={[-6.1866, 106.5321]}
        zoom={11} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          attribution='&copy; OpenStreetMap contributors'
        />
        
        {/* Render Layer Poligon Lahan Saja */}
        {dataLahan && dataLahan.features && (
          <GeoJSON 
            key={`lahan-${dataLahan.features.length}`}
            data={dataLahan} 
            style={gayaPoligon} 
            onEachFeature={onEachLahan} 
          />
        )}

        {/* Eksekusi penyesuaian posisi kamera otomatis */}
        <FitBounds dataLahan={dataLahan} />
      </MapContainer>
    </div>
  );
}