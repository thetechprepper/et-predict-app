// utils/distance.js

export const haversineDistance = (coord1, coord2, unit = 'km') => {
  const toRad = (deg) => deg * (Math.PI / 180);

  const [lat1, lon1] = coord1;
  const [lat2, lon2] = coord2;

  const R = unit === 'mi' ? 3958.8 : 6371; // Radius in miles or km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};
