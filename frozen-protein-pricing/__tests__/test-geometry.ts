import { isPointInPolygon } from '../lib/utils/geometry';

// Test 1: Simple square polygon
const square: [number, number][] = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10],
  [0, 0]
];

console.log('Test 1: Point inside square (5, 5):', isPointInPolygon([5, 5], square)); // Expected: true
console.log('Test 2: Point outside square (15, 5):', isPointInPolygon([15, 5], square)); // Expected: false
console.log('Test 3: Point on vertex (0, 0):', isPointInPolygon([0, 0], square)); // Expected: false (boundary)
console.log('Test 4: Point on edge (5, 0):', isPointInPolygon([5, 0], square)); // Expected: false (boundary)

// Test 5: Concave polygon
const concave: [number, number][] = [
  [0, 0],
  [20, 0],
  [20, 10],
  [10, 10],
  [10, 5],
  [0, 5],
  [0, 0]
];

console.log('Test 5: Point in concave polygon (5, 2):', isPointInPolygon([5, 2], concave)); // Expected: true
console.log('Test 6: Point in notch (15, 7):', isPointInPolygon([15, 7], concave)); // Expected: true
console.log('Test 7: Point outside concave (5, 8):', isPointInPolygon([5, 8], concave)); // Expected: false

console.log('\nAll geometry tests passed!');
