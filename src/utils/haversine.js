/**
 * Haversine Geospatial Calculation Utilities
 * Calculates precise great-circle distance between two points on a sphere.
 */

const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculates distance between two GPS coordinates in meters.
 * @param {number} lat1 Latitude of point 1
 * @param {number} lon1 Longitude of point 1
 * @param {number} lat2 Latitude of point 2
 * @param {number} lon2 Longitude of point 2
 * @returns {number} Distance in meters
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return Infinity;
  }

  const toRad = (value) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const radLat1 = toRad(lat1);
  const radLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(radLat1) * Math.cos(radLat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Filters a vendor list for items within a specific radius (default: 500 meters),
 * attaches the computed distance, and sorts by proximity.
 * 
 * @param {Array} vendors Array of vendor objects containing { lat, lng }
 * @param {number} userLat User latitude
 * @param {number} userLng User longitude
 * @param {number} radiusMeters Max radius in meters (default 500)
 * @returns {Array} Filtered and sorted vendors with distance_meters property
 */
export function filterVendorsWithinRadius(vendors = [], userLat, userLng, radiusMeters = 500) {
  if (!Array.isArray(vendors) || userLat == null || userLng == null) {
    return [];
  }

  return vendors
    .map((vendor) => {
      const distance = calculateHaversineDistance(
        Number(userLat),
        Number(userLng),
        Number(vendor.lat),
        Number(vendor.lng)
      );
      return {
        ...vendor,
        distance_meters: Math.round(distance),
      };
    })
    .filter((vendor) => vendor.distance_meters <= radiusMeters)
    .sort((a, b) => a.distance_meters - b.distance_meters);
}

/**
 * Human-readable distance formatter.
 * @param {number} meters 
 * @returns {string} e.g. "85m" or "1.2km"
 */
export function formatDistance(meters) {
  if (meters == null || isNaN(meters)) return 'Nearby';
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}
