// Utility functions for Civic Mind project
export * from "./validation";
export * from "./formatting";
export * from "./constants";

export function validateAndThrow(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Validation failed: ${message}`);
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function generateGeohash(lat: number, lon: number, precision = 8): string {
  const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
  let latRange = [-90, 90];
  let lonRange = [-180, 180];
  let hash = "";
  let bits = 0;
  let bit = 0;
  let even = true;

  while (hash.length < precision) {
    if (even) {
      const mid = (lonRange[0] + lonRange[1]) / 2;
      if (lon >= mid) {
        bit = (bit << 1) + 1;
        lonRange[0] = mid;
      } else {
        bit = bit << 1;
        lonRange[1] = mid;
      }
    } else {
      const mid = (latRange[0] + latRange[1]) / 2;
      if (lat >= mid) {
        bit = (bit << 1) + 1;
        latRange[0] = mid;
      } else {
        bit = bit << 1;
        latRange[1] = mid;
      }
    }

    even = !even;
    bits++;

    if (bits === 5) {
      hash += BASE32[bit];
      bits = 0;
      bit = 0;
    }
  }

  return hash;
}
