import { z } from "zod";

export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.message}`);
  }
  return result.data;
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
  lon2: number,
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

// Enhanced Geohash implementation for spatial indexing
export function generateGeohash(
  lat: number,
  lon: number,
  precision = 8,
): string {
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new Error(
      "Invalid coordinates: latitude must be [-90,90], longitude must be [-180,180]",
    );
  }

  const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
  let latRange = [-90.0, 90.0];
  let lonRange = [-180.0, 180.0];
  let hash = "";
  let bits = 0;
  let bit = 0;
  let even = true;

  while (hash.length < precision) {
    if (even) {
      // longitude
      const mid = (lonRange[0] + lonRange[1]) / 2;
      if (lon >= mid) {
        bit = (bit << 1) + 1;
        lonRange[0] = mid;
      } else {
        bit = bit << 1;
        lonRange[1] = mid;
      }
    } else {
      // latitude
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

// Decode geohash back to coordinates (useful for spatial queries)
export function decodeGeohash(geohash: string): {
  latitude: number;
  longitude: number;
  error: { lat: number; lon: number };
} {
  const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
  let latRange = [-90.0, 90.0];
  let lonRange = [-180.0, 180.0];
  let even = true;

  for (let i = 0; i < geohash.length; i++) {
    const c = geohash[i];
    const cd = BASE32.indexOf(c);

    if (cd === -1) {
      throw new Error(`Invalid geohash character: ${c}`);
    }

    for (let mask = 16; mask >= 1; mask >>= 1) {
      if (even) {
        // longitude
        const mid = (lonRange[0] + lonRange[1]) / 2;
        if (cd & mask) {
          lonRange[0] = mid;
        } else {
          lonRange[1] = mid;
        }
      } else {
        // latitude
        const mid = (latRange[0] + latRange[1]) / 2;
        if (cd & mask) {
          latRange[0] = mid;
        } else {
          latRange[1] = mid;
        }
      }
      even = !even;
    }
  }

  const latitude = (latRange[0] + latRange[1]) / 2;
  const longitude = (lonRange[0] + lonRange[1]) / 2;
  const latError = latRange[1] - latRange[0];
  const lonError = lonRange[1] - lonRange[0];

  return {
    latitude,
    longitude,
    error: {
      lat: latError / 2,
      lon: lonError / 2,
    },
  };
}

// Get neighboring geohashes for spatial queries
export function getGeohashNeighbors(geohash: string): string[] {
  // This would return surrounding geohashes for efficient spatial queries
  // Simplified implementation - in production, use a proper geohash library
  const neighbors = [];
  const precision = geohash.length;

  // Generate neighboring hashes by slightly modifying coordinates
  const { latitude, longitude } = decodeGeohash(geohash);
  const delta = Math.pow(32, -(precision - 1)) * 45; // Approximate delta

  const coords = [
    [latitude + delta, longitude], // north
    [latitude - delta, longitude], // south
    [latitude, longitude + delta], // east
    [latitude, longitude - delta], // west
    [latitude + delta, longitude + delta], // northeast
    [latitude + delta, longitude - delta], // northwest
    [latitude - delta, longitude + delta], // southeast
    [latitude - delta, longitude - delta], // southwest
  ];

  for (const [lat, lon] of coords) {
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      neighbors.push(generateGeohash(lat, lon, precision));
    }
  }

  return neighbors;
}

export * from "./validation";
export * from "./formatting";
