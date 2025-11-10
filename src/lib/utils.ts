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

export async function fetchLatLngForZip(zip: string): Promise<{ lat: number; lng: number } | null> {
  const trimmed = zip.trim();
  if (!/^\d{5}$/.test(trimmed)) return null;

  try {
    const response = await fetch(`https://api.zippopotam.us/us/${trimmed}`, {
      headers: { "Accept": "application/json" },
      // Allow caching responses for a day to reduce repeated lookups
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as {
      places?: Array<{ latitude?: string; longitude?: string }>;
    };

    const primaryPlace = Array.isArray(data.places) ? data.places[0] : null;
    if (!primaryPlace?.latitude || !primaryPlace.longitude) {
      return null;
    }

    const lat = Number.parseFloat(primaryPlace.latitude);
    const lng = Number.parseFloat(primaryPlace.longitude);

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }

    return null;
  } catch (error) {
    console.error("[fetchLatLngForZip]", error);
    return null;
  }
}

export const EXAMPLE_RIDE_CUTOFF_ISO = "2025-11-07T13:42:09Z";
export const EXAMPLE_RIDE_CUTOFF = new Date(EXAMPLE_RIDE_CUTOFF_ISO);

export type Recurrence = "none" | "daily" | "weekly" | "monthly" | "yearly";

export function getNextRecurringDate(
  currentDate: Date,
  recurrence: Recurrence,
  referenceDate: Date = new Date()
): Date | null {
  if (recurrence === "none") {
    return null;
  }

  const next = new Date(currentDate.getTime());
  const maxIterations = 1000;
  let iterations = 0;

  while (next <= referenceDate && iterations < maxIterations) {
    iterations += 1;
    switch (recurrence) {
      case "daily":
        next.setUTCDate(next.getUTCDate() + 1);
        break;
      case "weekly":
        next.setUTCDate(next.getUTCDate() + 7);
        break;
      case "monthly":
        next.setUTCMonth(next.getUTCMonth() + 1);
        break;
      case "yearly":
        next.setUTCFullYear(next.getUTCFullYear() + 1);
        break;
      default:
        return null;
    }
  }

  if (iterations >= maxIterations) {
    return null;
  }

  return next > referenceDate ? next : null;
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

/**
 * Format date consistently to avoid hydration mismatches
 * Uses a deterministic format that's the same on server and client
 * @param date - Date string or Date object
 * @param options - Formatting options
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date,
  options: {
    includeTime?: boolean;
    includeWeekday?: boolean;
    timeStyle?: "short" | "medium" | "long";
    hour12?: boolean;
  } = {}
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  // Use UTC to ensure consistency between server and client
  const year = dateObj.getUTCFullYear();
  const month = dateObj.getUTCMonth();
  const day = dateObj.getUTCDate();
  const hours = dateObj.getUTCHours();
  const minutes = dateObj.getUTCMinutes();
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const weekdayNames = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
  ];
  
  let formatted = "";
  
  if (options.includeWeekday) {
    formatted += `${weekdayNames[dateObj.getUTCDay()]}, `;
  }
  
  formatted += `${monthNames[month]} ${day}, ${year}`;
  
  if (options.includeTime) {
    let hour = hours;
    const ampm = options.hour12 ? (hour >= 12 ? "PM" : "AM") : null;
    
    if (options.hour12) {
      hour = hour % 12;
      if (hour === 0) hour = 12;
    }
    
    const minutesStr = minutes.toString().padStart(2, "0");
    const timeStr = options.hour12 
      ? `${hour}:${minutesStr} ${ampm}`
      : `${hour.toString().padStart(2, "0")}:${minutesStr}`;
    
    formatted += ` at ${timeStr}`;
  }
  
  return formatted;
}

/**
 * Format date for display in lists (shorter format)
 * @param date - Date string or Date object
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
export function formatDateShort(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const year = dateObj.getUTCFullYear();
  const month = dateObj.getUTCMonth();
  const day = dateObj.getUTCDate();
  
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  
  return `${monthNames[month]} ${day}, ${year}`;
}

/**
 * Format time for display
 * @param date - Date string or Date object
 * @param hour12 - Whether to use 12-hour format
 * @returns Formatted time string
 */
export function formatTime(date: string | Date, hour12: boolean = true): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  let hour = dateObj.getUTCHours();
  const minutes = dateObj.getUTCMinutes();
  
  if (hour12) {
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  }
  
  return `${hour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

