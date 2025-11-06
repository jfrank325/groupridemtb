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

/**
 * Format distance in miles with appropriate unit
 * Note: Values are already in miles (despite field name suggesting km)
 * @param miles - Distance in miles (or null/undefined)
 * @returns Formatted string (e.g., "0.5 miles" or "1.2 miles" or "N/A")
 */
export function formatDistance(miles: number | null | undefined): string {
  if (!miles) return "N/A";
  return miles < 1 
    ? `${(miles * 5280).toFixed(0)} feet` 
    : `${miles.toFixed(1)} miles`;
}

/**
 * Format elevation in feet with appropriate unit
 * Note: Values are already in feet (despite field name suggesting meters)
 * @param feet - Elevation in feet (or null/undefined)
 * @returns Formatted string (e.g., "150 feet" or "N/A")
 */
export function formatElevation(feet: number | null | undefined): string {
  if (!feet) return "N/A";
  return `${feet.toFixed(0)} feet`;
}

/**
 * Format distance in miles (for display with separate unit label)
 * Note: Values are already in miles (despite field name suggesting km)
 * @param miles - Distance in miles (or null/undefined)
 * @returns Formatted number string (e.g., "0.5" or "1.2")
 */
export function formatDistanceValue(miles: number | null | undefined): string {
  if (!miles) return "0";
  return miles.toFixed(1);
}

/**
 * Format elevation in feet (for display with separate unit label)
 * Note: Values are already in feet (despite field name suggesting meters)
 * @param feet - Elevation in feet (or null/undefined)
 * @returns Formatted number string (e.g., "150" or "500")
 */
export function formatElevationValue(feet: number | null | undefined): string {
  if (!feet) return "0";
  return feet.toFixed(0);
}

