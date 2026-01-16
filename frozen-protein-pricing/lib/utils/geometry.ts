/**
 * Check if a point is inside a polygon using ray casting algorithm
 * @param point [longitude, latitude]
 * @param polygon Array of [longitude, latitude] coordinates forming a closed polygon
 */
export function isPointInPolygon(
  point: [number, number],
  polygon: [number, number][]
): boolean {
  if (polygon.length < 3) {
    return false;
  }

  // Ensure polygon is closed
  const isClosedPolygon =
    polygon[0][0] === polygon[polygon.length - 1][0] &&
    polygon[0][1] === polygon[polygon.length - 1][1];

  const vertices = isClosedPolygon ? polygon : [...polygon, polygon[0]];

  const [x, y] = point;
  let inside = false;

  // Ray casting algorithm
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const [xi, yi] = vertices[i];
    const [xj, yj] = vertices[j];

    // Check if point is exactly on a vertex - return false for boundary cases
    const epsilon = 1e-10;
    if (Math.abs(x - xi) < epsilon && Math.abs(y - yi) < epsilon) {
      return false;
    }
    if (Math.abs(x - xj) < epsilon && Math.abs(y - yj) < epsilon) {
      return false;
    }

    // Check if point is on the edge using precise boundary detection
    const intersect =
      ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Calculate the centroid of a polygon
 * @param polygon Array of [longitude, latitude] coordinates
 */
export function getPolygonCentroid(
  polygon: [number, number][]
): [number, number] {
  let sumX = 0;
  let sumY = 0;

  for (const [x, y] of polygon) {
    sumX += x;
    sumY += y;
  }

  return [sumX / polygon.length, sumY / polygon.length];
}

/**
 * Calculate distance between two points (Haversine formula)
 * @param point1 [longitude, latitude]
 * @param point2 [longitude, latitude]
 * @returns Distance in kilometers
 */
export function getDistance(
  point1: [number, number],
  point2: [number, number]
): number {
  const [lon1, lat1] = point1;
  const [lon2, lat2] = point2;

  const R = 6371; // Earth radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
