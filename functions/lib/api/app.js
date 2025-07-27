"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.civicApi = void 0;
const API_BASE_URL = process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:5001/civicmind-e1041/asia-south1/api"
    : "https://asia-south1-civicmind-e1041.cloudfunctions.net/api";
class CivicApiClient {
    constructor(baseUrl = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = Object.assign({ headers: Object.assign({ "Content-Type": "application/json" }, options.headers) }, options);
        try {
            console.log(`Making request to: ${url}`);
            const response = await fetch(url, config);
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API Error ${response.status}:`, errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            console.error(`API request failed: ${endpoint}`, error);
            throw error;
        }
    }
    // Health check
    async healthCheck() {
        return this.request("/health");
    }
    // Intelligence health check
    async getIntelligenceHealth() {
        return this.request("/intelligence/health");
    }
    // Get reports
    async getReports() {
        return this.request("/reports");
    }
    // Get intelligence status
    async getIntelligenceStatus() {
        return this.request("/intelligence/status");
    }
    // Cluster events
    async clusterEvents(events, radius = 500, minClusterSize = 3) {
        return this.request("/intelligence/cluster", {
            method: "POST",
            body: JSON.stringify({ events, radius, minClusterSize }),
        });
    }
    // Synthesize events
    async synthesizeEvents(cluster) {
        return this.request("/intelligence/synthesize", {
            method: "POST",
            body: JSON.stringify(cluster),
        });
    }
    // Process events through full pipeline
    async processEvents(events) {
        return this.request("/intelligence/process", {
            method: "POST",
            body: JSON.stringify({ events }),
        });
    }
    // Analyze media
    async analyzeMedia(data) {
        return this.request("/intelligence/media", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }
    // Mock methods for alerts and clusters (implement as needed)
    async getAlerts(region) {
        // TODO: Implement actual alerts endpoint
        return [];
    }
    async getClusters(region) {
        // TODO: Implement actual clusters endpoint
        return [];
    }
}
exports.civicApi = new CivicApiClient();
//# sourceMappingURL=app.js.map