import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Navigation, Compass, Layers, MapPin, Maximize2, Crosshair } from 'lucide-react';
import { formatDistance, formatWalkingTime } from '../utils/haversine';
import { getVendorFreshnessStatus } from '../utils/supabaseClient';

/**
 * Custom warm HTML/SVG DivIcons.
 */
function createCustomPin(color, label, isUser = false, isFresh = true) {
  const size = isUser ? 36 : 30;
  const innerHtml = isUser
    ? `<div class="relative flex items-center justify-center w-9 h-9">
         <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-60"></span>
         <div style="background: linear-gradient(135deg, #EA580C, #D97706);" class="w-7 h-7 rounded-full border-2 border-[#FAF7F2] shadow-[0_0_15px_rgba(234,88,12,0.6)] flex items-center justify-center text-white">
           <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>
         </div>
       </div>`
    : `<div class="relative flex flex-col items-center group">
         ${isFresh ? '<span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-[#171615] z-10"></span>' : ''}
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

const getCategoryColor = (category) => {
  switch (category?.toLowerCase()) {
    case 'food':
      return '#F59E0B';
    case 'craft':
      return '#EA580C';
    case 'heritage':
      return '#C2410C';
    default:
      return '#D97706';
  }
};

export default function MapContext({
  userLocation,
  vendors = [],
  highlightedVendorIds = [],
  selectedVendor,
  onSelectVendor,
  onOpenVendorDetail,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const polylinesLayerRef = useRef(null);
  const markersByIdRef = useRef({});

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

      // Standard OSM tiles with dark filter
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
  }, []);

  // Update Markers & Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const polylinesLayer = polylinesLayerRef.current;

    if (!map || !markersLayer || !polylinesLayer) return;

    markersLayer.clearLayers();
    polylinesLayer.clearLayers();
    markersByIdRef.current = {};

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
          <div style="font-weight: 700; color: #FB923C; margin-bottom: 2px;">Your Explorer Position</div>
          <div style="font-size: 11px; color: #A8A29E; font-family: monospace;">[${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}]</div>
        </div>
      `);

      markersLayer.addLayer(userMarker);
      bounds.extend(userLatLng);
    }

    // 2. Plot Vendor Pins
    vendors.forEach((vendor) => {
      if (!vendor.lat || !vendor.lng) return;

      const vendorLatLng = [vendor.lat, vendor.lng];
      const isHighlighted = highlightedVendorIds.includes(vendor.id);
      const isSelected = selectedVendor?.id === vendor.id;
      const freshness = getVendorFreshnessStatus(vendor.last_seen_at);

      const pinColor = isSelected
        ? '#F97316'
        : isHighlighted
        ? '#EA580C'
        : getCategoryColor(vendor.category);

      const marker = L.marker(vendorLatLng, {
        icon: createCustomPin(pinColor, vendor.name, false, freshness.isFresh),
      });

      // Interactive popup with action to open full shop details
      const popupContent = `
        <div style="font-family: inherit; font-size: 12px; min-width: 210px; max-width: 270px; padding: 4px; color: #FAF7F2;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
            <span style="font-weight: 700; color: #FAF7F2; font-size: 13px;">${vendor.name}</span>
            <span style="font-size: 9px; padding: 2px 7px; border-radius: 9999px; background: rgba(234, 88, 12, 0.15); color: #FDBA74; border: 1px solid rgba(234, 88, 12, 0.3); font-weight: 600;">${vendor.category}</span>
          </div>
          <p style="font-size: 11px; color: #A8A29E; margin: 4px 0 8px 0; line-height: 1.4;">${vendor.description}</p>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 6px; font-size: 11px;">
            <span style="color: #FB923C; font-weight: 600;">${freshness.label}</span>
            <span style="color: #D6D3D1; font-family: monospace;">${formatDistance(vendor.distance_meters)} • ${formatWalkingTime(vendor.distance_meters)}</span>
          </div>
          <button id="view-stall-${vendor.id}" style="width: 100%; margin-top: 8px; padding: 6px; border-radius: 8px; background: linear-gradient(to right, #ea580c, #d97706); color: white; font-weight: 600; font-size: 11px; border: none; cursor: pointer;">
            View Shop Menu &amp; Details &rarr;
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-stall-${vendor.id}`);
        if (btn) {
          btn.onclick = () => {
            onOpenVendorDetail?.(vendor);
          };
        }
      });

      marker.on('click', () => {
        onSelectVendor?.(vendor);
      });

      markersByIdRef.current[vendor.id] = marker;
      markersLayer.addLayer(marker);
      bounds.extend(vendorLatLng);

      // Connect walking route line
      if ((isHighlighted || isSelected) && userLocation?.lat && userLocation?.lng) {
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

    if (bounds.isValid() && !selectedVendor) {
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 18 });
    }
  }, [userLocation, vendors, highlightedVendorIds]);

  // Center selected vendor and trigger popup
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && selectedVendor?.lat && selectedVendor?.lng) {
      map.flyTo([selectedVendor.lat, selectedVendor.lng], 18, {
        duration: 1.0,
      });

      const marker = markersByIdRef.current[selectedVendor.id];
      if (marker && !marker.isPopupOpen()) {
        setTimeout(() => {
          marker.openPopup();
        }, 300);
      }
    }
  }, [selectedVendor]);

  // UX Actions: Center on User
  const handleCenterOnUser = () => {
    const map = mapInstanceRef.current;
    if (map && userLocation?.lat && userLocation?.lng) {
      map.flyTo([userLocation.lat, userLocation.lng], 18, { duration: 0.8 });
    }
  };

  // UX Actions: Fit all stalls in view
  const handleFitAllStalls = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const bounds = L.latLngBounds([]);
    if (userLocation?.lat) bounds.extend([userLocation.lat, userLocation.lng]);
    vendors.forEach((v) => {
      if (v.lat && v.lng) bounds.extend([v.lat, v.lng]);
    });
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 18 });
    }
  };

  return (
    <div
      id="map-viewport"
      className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] relative bg-[#121110] group"
    >
      {/* Top Map Context Pill */}
      <div className="absolute top-3 left-3 z-[400] flex items-center space-x-2 bg-[#171615]/90 backdrop-blur-xl border border-white/[0.08] px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#FAF7F2] shadow-lg">
        <Navigation className="w-3.5 h-3.5 text-amber-400" />
        <span>Artisan Registry: 500m Radius</span>
      </div>

      {/* Floating UX Controls: Re-center & Fit Bounds */}
      <div className="absolute top-3 right-3 z-[400] flex items-center space-x-1.5 bg-[#171615]/90 backdrop-blur-xl border border-white/[0.08] p-1 rounded-xl shadow-lg">
        <button
          onClick={handleCenterOnUser}
          className="p-1.5 rounded-lg text-[#FAF7F2] hover:bg-orange-600 hover:text-white transition-colors"
          title="Center on my location"
        >
          <Crosshair className="w-4 h-4" />
        </button>
        <button
          onClick={handleFitAllStalls}
          className="p-1.5 rounded-lg text-[#FAF7F2] hover:bg-orange-600 hover:text-white transition-colors"
          title="View all stalls"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Leaflet Mount Node */}
      <div ref={mapContainerRef} className="w-full h-full z-[1]" />
    </div>
  );
}
