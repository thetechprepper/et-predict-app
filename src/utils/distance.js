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

export const maidenhead = ([lat, lon]) => {
  const UPPER_A = 65; // ASCII 'A'
  const LOWER_A = 97; // ASCII 'a'

  const adjLat = lat + 90;
  const adjLon = lon + 180;

  // Field (first two letters)
  const fieldLon = Math.floor(adjLon / 20);
  const fieldLat = Math.floor(adjLat / 10);

  // Square (digits)
  const squareLon = Math.floor((adjLon % 20) / 2);
  const squareLat = Math.floor(adjLat % 10);

  // Subsquare (letters a-x)
  const subsquareLon = Math.floor(((adjLon % 2) * 12));
  const subsquareLat = Math.floor(((adjLat % 1) * 24));

  const grid =
    String.fromCharCode(UPPER_A + fieldLon) +
    String.fromCharCode(UPPER_A + fieldLat) +
    squareLon +
    squareLat +
    String.fromCharCode(LOWER_A + subsquareLon) +
    String.fromCharCode(LOWER_A + subsquareLat);

  return grid;
};
