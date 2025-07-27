export interface Location {
  // Use Google Maps standard naming
  lat: number; // Changed from latitude
  lng: number; // Changed from longitude
  address?: string;
  region?: string;
}

export interface CivicEvent {
  id: string;
  title: string;
  description: string;
  category:
    | "traffic"
    | "infrastructure"
    | "safety"
    | "environment"
    | "utilities"
    | "other";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  location: Location;
  timestamp: string;
  reporterId: string;
  mediaUrls?: string[];
  tags?: string[];
}

export interface EventCluster {
  id: string;
  events: CivicEvent[];
  center: {
    lat: number;
    lng: number;
  };
  radius: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  category: string;
  timestamp: string;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  category: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  affectedArea?: {
    radius: number;
    coordinates: Array<[number, number]>;
  };
  recommendations: string[];
  timestamp: string;
  expiresAt?: string;
  source: "AI" | "OFFICIAL" | "COMMUNITY";
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  count?: number;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  uptime: number;
  platform?: string;
  region?: string;
}
