/**
 * Generate deterministic coordinates from an ID to avoid hydration mismatches.
 * Uses a hash of the ID to generate consistent coordinates that will be the same
 * on both server and client renders.
 * 
 * @param id - The ID to generate coordinates from (e.g., ride ID)
 * @returns Object with lat and lng coordinates in a small range around Atlanta area
 */
export function getDeterministicCoords(id: string): { lat: number; lng: number } {
  // Use a simple hash of the ID to generate consistent coordinates
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Generate values in a small range around Atlanta area
  const latOffset = (Math.abs(hash) % 30) / 100; // 0 to 0.3
  const lngOffset = ((Math.abs(hash >> 16)) % 30) / 100; // 0 to 0.3
  return {
    lat: 33.8 + latOffset,
    lng: -84.6 + lngOffset,
  };
}

