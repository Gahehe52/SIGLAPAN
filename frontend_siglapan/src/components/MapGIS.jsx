import React from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Pastikan CSS dimuat langsung di sini

// Perbaikan ikon marker Leaflet yang hilang di React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function MapGIS({ dataLahan, dataFasilitas }) {
  const gayaPoligon = () => ({
    fillColor: '#628141',
    weight: 2,
    opacity: 1,
    color: '#40513B',
    fillOpacity: 0.5
  });

  const onEachLahan = (feature, layer) => {
    if (feature.properties) {
      layer.bindPopup(`
        <div class="p-2 min-w-[200px]">
          <h3 class="font-bold text-[#40513B] border-b border-gray-200 pb-2 mb-2 text-lg">${feature.properties.nama_lahan}</h3>
          <table class="w-full text-sm">
            <tr><td class="py-1 text-gray-500">Pemilik</td><td class="font-semibold text-right">${feature.properties.nama_pemilik}</td></tr>
            <tr><td class="py-1 text-gray-500">Tanaman</td><td class="font-semibold text-right">${feature.properties.nama_tanaman}</td></tr>
            <tr><td class="py-1 text-gray-500">Luas</td><td class="font-semibold text-right text-[#628141]">${parseFloat(feature.properties.luas_lahan).toLocaleString('id-ID')} m&sup2;</td></tr>
          </table>
        </div>
      `);
    }
  };

  return (
    /* Menggunakan absolute inset-0 agar peta benar-benar mengisi pojok ke pojok wadahnya */
    <div className="absolute inset-0 z-0">
      <MapContainer 
        center={[-5.3821, 105.2574]} 
        zoom={12} 
        /* INI ADALAH KUNCI PERBAIKANNYA */
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          attribution='&copy; OpenStreetMap contributors'
        />
        
        {dataLahan && dataLahan.features && (
          <GeoJSON 
            key={dataLahan.features.length} // Force re-render if data changes
            data={dataLahan} 
            style={gayaPoligon} 
            onEachFeature={onEachLahan} 
          />
        )}

        {dataFasilitas && dataFasilitas.features && dataFasilitas.features.map((fas, idx) => (
          <Marker 
            key={idx} 
            position={[fas.geometry.coordinates[1], fas.geometry.coordinates[0]]}
          >
            <Popup>
              <div className="p-1">
                <h4 className="font-bold text-[#40513B] text-base">{fas.properties.nama_fasilitas}</h4>
                <p className="text-xs text-gray-600 font-medium bg-gray-100 inline-block px-2 py-1 rounded mt-1">
                  {fas.properties.jenis_fasilitas}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}