/**
 * Distance en mètres entre deux points GPS (formule de Haversine).
 */
const distanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const toRad = (value) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Boîte englobante (lat/lon min-max) pour un rayon donné en km, utilisée
 * pour pré-filtrer côté SQL avant le calcul de distance exact.
 */
const boundingBox = (latitude, longitude, radiusKm) => {
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180));

  return {
    minLat: latitude - latDelta,
    maxLat: latitude + latDelta,
    minLon: longitude - lonDelta,
    maxLon: longitude + lonDelta,
  };
};

module.exports = { distanceMeters, boundingBox };
