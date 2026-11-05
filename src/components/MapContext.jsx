import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Compass, Layers } from 'lucide-react';
import { formatDistance } from '../utils/haversine';

/**
 * Creates custom HTML/SVG DivIcons to completely eliminate Leaflet marker asset 404 bugs in Vite bundlers.
 */
function createCustomPin(color, label, isUser = false) {
  const size = isUser ? 36 : 30;
  const innerHtml = isUser
    ? `<div class="relative flex items-center justify-center w-9 h-9">
         <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60"></span>
         <div class="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-cyan-400 border-2 border-white shadow-lg flex items-center justify-center text-white">
           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>
         </div>
       </div>`
    : `<div class="relative flex flex-col items-center">
         <div style="background-color: ${color};" class="w-8 h-8 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white transform hover:scale-110 transition-transform">
           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="currentColor"/></svg>
         </div>
         <div style="border-top-color: ${color};" class="w-0 h-0 border-x-4 border-x-transparent border-t-6"></div>
       </div>`;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: innerHtml,
    iconSize: [size, size + (isUser ? 0 : 6)],
    iconAnchor: [size / 2, isUser ? size / 2 : size + 6],
    popupAnchor: [0, isUser ? -size / 2 : -(size + 8)],
  });
}

const getCategoryColor = (category) => {
  switch (category?.toLowerCase()) {
    case 'food':
      return '#f59e0b'; // amber
    case 'craft':
      return '#06b6d4'; // cyan
    case 'heritage':
      return '#a855f7'; // purple
    default:
      return '#22c55e'; // green
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

      // Add CartoDB Dark Matter / Voyager stylish tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
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
      // Keep map alive or clean on unmount
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
        icon: createCustomPin('#06b6d4', 'You', true),
        zIndexOffset: 1000,
      });

      userMarker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; color: #0f172a; padding: 2px;">
          <div style="font-weight: 700; color: #0284c7;">You are here</div>
          <div style="font-size: 10px; color: #64748b; font-family: monospace;">[${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}]</div>
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
        ? '#ef4444'
        : isHighlighted
        ? '#22c55e'
        : getCategoryColor(vendor.category);

      const marker = L.marker(vendorLatLng, {
        icon: createCustomPin(pinColor, vendor.name, false),
      });

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; min-width: 180px; max-width: 240px; padding: 4px; color: #0f172a;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
            <span style="font-weight: 700; color: #0f172a;">${vendor.name}</span>
            <span style="font-size: 9px; padding: 2px 6px; border-radius: 9999px; background: #e2e8f0; font-weight: 600;">${vendor.category}</span>
          </div>
          <p style="font-size: 11px; color: #475569; margin: 4px 0 6px 0; line-height: 1.3;">${vendor.description}</p>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 4px; font-size: 10px;">
            <span style="color: #16a34a; font-weight: 600;">&#10003; Verified Stall</span>
            <span style="color: #64748b; font-family: monospace;">${formatDistance(vendor.distance_meters)}</span>
          </div>
        </div>
      `);

      marker.on('click', () => {
        onSelectVendor?.(vendor);
      });

      markersLayer.addLayer(marker);
      bounds.extend(vendorLatLng);

      // 3. Connect Recommended Vendors to User with a dotted walking route polyline
      if (isHighlighted && userLocation?.lat && userLocation?.lng) {
        const polyline = L.polyline(
          [
            [userLocation.lat, userLocation.lng],
            vendorLatLng,
          ],
          {
            color: '#22c55e',
            weight: 3,
            opacity: 0.75,
            dashArray: '5, 8',
          }
        );
        polylinesLayer.addLayer(polyline);
      }
    });

    // Auto-fit bounds if we have points
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
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
    <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-white/10 shadow-glass relative bg-dark-900 group">
      {/* Top Map Context Badge */}
      <div className="absolute top-3 left-3 z-[400] flex items-center space-x-2 bg-dark-900/85 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 shadow">
        <Navigation className="w-3.5 h-3.5 text-brand-400" />
        <span>Hyper-Local Radial Radius: 500m</span>
      </div>

      {/* Map Legend */}
      <div className="absolute top-3 right-3 z-[400] hidden sm:flex items-center space-x-2 bg-dark-900/85 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl text-[10px] text-slate-300 shadow">
        <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-cyan-400 mr-1"></span> You</span>
        <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-brand-500 mr-1"></span> Recommended</span>
        <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-amber-400 mr-1"></span> Food</span>
        <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-purple-400 mr-1"></span> Craft/Heritage</span>
      </div>

      {/* Leaflet Mount Node */}
      <div ref={mapContainerRef} className="w-full h-full z-[1]" />
    </div>
  );
}
