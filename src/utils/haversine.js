/**
 * Haversine Geospatial Calculation Utilities
 * Calculates precise great-circle distance between two points on a sphere.
 * Provides proof-of-presence validation and walking time estimation.
 */

const EARTH_RADIUS_METERS = 6371000;
const AVERAGE_WALKING_SPEED_METERS_PER_MINUTE = 80; // ~4.8 km/h

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

  const dLat = toRad(Number(lat2) - Number(lat1));
  const dLon = toRad(Number(lon2) - Number(lon1));

  const radLat1 = toRad(Number(lat1));
  const radLat2 = toRad(Number(lat2));

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(radLat1) * Math.cos(radLat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Filters a vendor list for items within a specific radius (default: 500 meters),
 * attaches computed distance and walking time, and sorts by proximity.
 * 
 * @param {Array} vendors Array of vendor objects containing { lat, lng }
 * @param {number} userLat User latitude
 * @param {number} userLng User longitude
 * @param {number} radiusMeters Max radius in meters (default 500)
 * @returns {Array} Filtered and sorted vendors with distance_meters & walking_minutes
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
      const roundedMeters = Math.round(distance);
      return {
        ...vendor,
        distance_meters: roundedMeters,
        walking_minutes: Math.max(1, Math.round(roundedMeters / AVERAGE_WALKING_SPEED_METERS_PER_MINUTE)),
      };
    })
    .filter((vendor) => vendor.distance_meters <= radiusMeters)
    .sort((a, b) => a.distance_meters - b.distance_meters);
}

/**
 * Proof-of-Presence Verification:
 * Validates whether the user's live coordinates fall strictly within the 50m physical radius.
 * Used for anti-fraud review submission and live stall verification.
 * 
 * @param {number} userLat 
 * @param {number} userLng 
 * @param {number} vendorLat 
 * @param {number} vendorLng 
 * @param {number} thresholdMeters Default 50m
 * @returns {boolean}
 */
export function isWithinProofOfPresence(userLat, userLng, vendorLat, vendorLng, thresholdMeters = 50) {
  if (userLat == null || userLng == null || vendorLat == null || vendorLng == null) {
    return false;
  }
  const distance = calculateHaversineDistance(userLat, userLng, vendorLat, vendorLng);
  return distance <= thresholdMeters;
}

/**
 * Formats distance into human-readable walking metrics.
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

/**
 * Calculates human walking time formatted string.
 * @param {number} meters 
 * @returns {string} e.g. "~1 min walk" or "~5 mins walk"
 */
export function formatWalkingTime(meters) {
  if (meters == null || isNaN(meters)) return '~1 min walk';
  const mins = Math.max(1, Math.round(meters / AVERAGE_WALKING_SPEED_METERS_PER_MINUTE));
  return mins === 1 ? '~1 min walk' : `~${mins} mins walk`;
}
