import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Navigation, Compass, Layers, MapPin } from 'lucide-react';
import { formatDistance } from '../utils/haversine';

/**
 * Creates custom warm HTML/SVG DivIcons to eliminate Leaflet 404 asset bugs.
 * Styled with Claude warm terracotta, clay, and amber tones.
 */
function createCustomPin(color, label, isUser = false) {
  const size = isUser ? 36 : 30;
  const innerHtml = isUser
    ? `<div class="relative flex items-center justify-center w-9 h-9">
         <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-50"></span>
         <div style="background: linear-gradient(135deg, #EA580C, #D97706);" class="w-7 h-7 rounded-full border-2 border-[#FAF7F2] shadow-[0_0_15px_rgba(234,88,12,0.6)] flex items-center justify-center text-white">
           <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>
         </div>
       </div>`
    : `<div class="relative flex flex-col items-center group">
         <div style="background-color: ${color};" class="w-8 h-8 rounded-full border-2 border-[#FAF7F2] shadow-[0_4px_16px_rgba(0,0,0,0.5)] flex items-center justify-center text-[#FAF7F2] transform group-hover:scale-110 transition-transform">
           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="currentColor"/></svg>
         </div>
         <div style="border-top-color: ${color};" class="w-0 h-0 border-x-4 border-x-transparent border-t-[5px]"></div>
       </div>`;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: innerHtml,
    iconSize: [size, size + (isUser ? 0 : 5)],
    iconAnchor: [size / 2, isUser ? size / 2 : size + 5],
    popupAnchor: [0, isUser ? -size / 2 : -(size + 7)],
  });
}

// Warm Terracotta & Clay Palette for Categories
const getCategoryColor = (category) => {
  switch (category?.toLowerCase()) {
    case 'food':
      return '#F59E0B'; // Warm amber
    case 'craft':
      return '#EA580C'; // Warm terracotta
    case 'heritage':
      return '#C2410C'; // Deep clay / ochre
    default:
      return '#D97706'; // Rich amber
  }
};

export default function MapContext({
  userLocation,
  vendors = [],
  highlightedVendorIds = [],
  selectedVendor,
  onSelectVendor,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const polylinesLayerRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = userLocation?.lat || 30.1337;
      const initialLng = userLocation?.lng || 77.3000;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 17,
        zoomControl: false,
        attributionControl: false,
      });

      // Public OpenStreetMap tiles with custom warm dark filter (Zero API Key watermarks)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
        className: 'map-tiles-filter',
      }).addTo(map);

      // Add zoom control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Layer groups
      const polylinesLayer = L.layerGroup().addTo(map);
      const markersLayer = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = markersLayer;
      polylinesLayerRef.current = polylinesLayer;
    }

    return () => {
      // Map cleanup if needed
    };
  }, []);

  // Update Markers & Polylines whenever user location or vendors change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const polylinesLayer = polylinesLayerRef.current;

    if (!map || !markersLayer || !polylinesLayer) return;

    markersLayer.clearLayers();
    polylinesLayer.clearLayers();

    const bounds = L.latLngBounds([]);

    // 1. Plot User Marker
    if (userLocation?.lat && userLocation?.lng) {
      const userLatLng = [userLocation.lat, userLocation.lng];
      const userMarker = L.marker(userLatLng, {
        icon: createCustomPin('#EA580C', 'You', true),
        zIndexOffset: 1000,
      });

      userMarker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; color: #FAF7F2; padding: 2px;">
          <div style="font-weight: 700; color: #FB923C; margin-bottom: 2px;">Current Explorer Coordinates</div>
          <div style="font-size: 11px; color: #A8A29E; font-family: monospace;">[${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}]</div>
        </div>
      `);

      markersLayer.addLayer(userMarker);
      bounds.extend(userLatLng);
    }

    // 2. Plot Vendor Markers
    vendors.forEach((vendor) => {
      if (!vendor.lat || !vendor.lng) return;

      const vendorLatLng = [vendor.lat, vendor.lng];
      const isHighlighted = highlightedVendorIds.includes(vendor.id);
      const isSelected = selectedVendor?.id === vendor.id;

      const pinColor = isSelected
        ? '#F97316'
        : isHighlighted
        ? '#EA580C'
        : getCategoryColor(vendor.category);

      const marker = L.marker(vendorLatLng, {
        icon: createCustomPin(pinColor, vendor.name, false),
      });

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; min-width: 190px; max-width: 250px; padding: 2px; color: #FAF7F2;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
            <span style="font-weight: 700; color: #FAF7F2; font-size: 13px;">${vendor.name}</span>
            <span style="font-size: 10px; padding: 2px 7px; border-radius: 9999px; background: rgba(234, 88, 12, 0.15); color: #FDBA74; border: 1px solid rgba(234, 88, 12, 0.3); font-weight: 600;">${vendor.category}</span>
          </div>
          <p style="font-size: 11px; color: #A8A29E; margin: 4px 0 8px 0; line-height: 1.4;">${vendor.description}</p>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 6px; font-size: 11px;">
            <span style="color: #FB923C; font-weight: 600; display: flex; align-items: center;">&#10003; Verified Stall</span>
            <span style="color: #D6D3D1; font-family: monospace;">${formatDistance(vendor.distance_meters)}</span>
          </div>
        </div>
      `);

      marker.on('click', () => {
        onSelectVendor?.(vendor);
      });

      markersLayer.addLayer(marker);
      bounds.extend(vendorLatLng);

      // 3. Connect Recommended Vendors to User with a warm terracotta dashed route
      if (isHighlighted && userLocation?.lat && userLocation?.lng) {
        const polyline = L.polyline(
          [
            [userLocation.lat, userLocation.lng],
            vendorLatLng,
          ],
          {
            color: '#EA580C',
            weight: 3.5,
            opacity: 0.85,
            dashArray: '5, 8',
          }
        );
        polylinesLayer.addLayer(polyline);
      }
    });

    // Auto-fit bounds if we have points
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 18 });
    }
  }, [userLocation, vendors, highlightedVendorIds]);

  // Handle selected vendor focusing
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && selectedVendor?.lat && selectedVendor?.lng) {
      map.flyTo([selectedVendor.lat, selectedVendor.lng], 18, {
        duration: 1.2,
      });
    }
  }, [selectedVendor]);

  return (
    <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] relative bg-[#121110] group">
      {/* Top Map Context Pill (Warm Glass) */}
      <div className="absolute top-3 left-3 z-[400] flex items-center space-x-2 bg-[#171615]/90 backdrop-blur-xl border border-white/[0.08] px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#FAF7F2] shadow-lg">
        <Navigation className="w-3.5 h-3.5 text-amber-400" />
        <span>Hyper-Local Radius: 500m</span>
      </div>

      {/* Map Legend (Warm Glass) */}
      <div className="absolute top-3 right-3 z-[400] hidden sm:flex items-center space-x-3 bg-[#171615]/90 backdrop-blur-xl border border-white/[0.08] px-3 py-1.5 rounded-xl text-[11px] text-[#A8A29E] shadow-lg">
        <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-amber-400 mr-1.5"></span> You</span>
        <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-orange-500 mr-1.5"></span> Recommended</span>
        <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5"></span> Food</span>
        <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-700 mr-1.5"></span> Craft/Heritage</span>
      </div>

      {/* Leaflet Mount Node */}
      <div ref={mapContainerRef} className="w-full h-full z-[1]" />
    </div>
  );
}
