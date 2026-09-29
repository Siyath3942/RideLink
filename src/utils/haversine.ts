/**
  * Calculates the great-circle distance between two points on the Earth's surface
  * using the Haversine formula.
  * @param lat1 Latitude of point 1 (degrees)
  * @param lon1 Longitude of point 1 (degrees)
  * @param lat2 Latitude of point 2 (degrees)
  * @param lon2 Longitude of point 2 (degrees)
  * @returns Distance in kilometers
  */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const EARTH_RADIUS_KM = 6371; // Earth radius in kilometers

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
