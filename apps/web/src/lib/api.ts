// src/lib/api.ts - COMPLETE CONSISTENCY FIX
import { Alert, EventCluster, CivicEvent, ApiResponse } from "@/types/civic";

const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:5001/civicmind-e1041/asia-south1/api"
    : "https://asia-south1-civicmind-e1041.cloudfunctions.net/api";

class CivicApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`Making request to: ${url}`); // Debug log
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error ${response.status}:`, errorText);
        throw new Error(
          `HTTP error! status: ${response.status} - ${errorText}`,
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // ✅ FIXED: Use /health instead of /
  async healthCheck() {
    return this.request("/health");
  }

  // ✅ FIXED: Consistent endpoint path
  async getReports() {
    return this.request("/intelligence/status");
  }

  // ✅ FIXED: Remove /api prefix, use consistent path
  async clusterEvents(events: any[], radius = 500, minClusterSize = 3) {
    return this.request("/intelligence/cluster", {
      method: "POST",
      body: JSON.stringify({ events, radius, minClusterSize }),
    });
  }

  // ✅ FIXED: Remove /api prefix
  async synthesizeEvents(cluster: any): Promise<any> {
    return this.request("/intelligence/synthesize", {
      method: "POST",
      body: JSON.stringify(cluster),
    });
  }

  // ✅ FIXED: Remove /api prefix
  async processEvents(events: any[]): Promise<any> {
    return this.request("/intelligence/process", {
      method: "POST",
      body: JSON.stringify({ events }),
    });
  }

  // ✅ REMOVED DUPLICATE: This was the same as synthesizeEvents
  // Use synthesizeEvents instead of having duplicate generateSynthesis

  // ✅ FIXED: Remove /api prefix
  async analyzeMedia(data: {
    mediaUrl: string;
    reportId: string;
    mediaType: string;
  }): Promise<ApiResponse<any>> {
    return this.request("/intelligence/media", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Mock methods for alerts and clusters
  async getAlerts(region?: string): Promise<Alert[]> {
    return [];
  }

  async getClusters(region?: string): Promise<EventCluster[]> {
    return [];
  }
}

export const civicApi = new CivicApiClient();
