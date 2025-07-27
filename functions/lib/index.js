"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}
// Set global options
(0, v2_1.setGlobalOptions)({
    region: "asia-south1",
    memory: "1GiB",
    timeoutSeconds: 300,
});
// Create Express app with minimal, safe routes
const createApp = () => {
    const app = (0, express_1.default)();
    // Basic middleware
    app.use((0, cors_1.default)({ origin: true }));
    app.use(express_1.default.json({ limit: "1mb" }));
    // SAFE ROUTES - No parameter syntax that could cause path-to-regexp errors
    app.get("/", (req, res) => {
        return res.status(200).json({
            success: true,
            message: "Civic Mind API - Firebase Functions",
            timestamp: new Date().toISOString(),
            version: "1.0.0",
            status: "operational",
        });
    });
    app.get("/health", (req, res) => {
        return res.status(200).json({
            status: "healthy",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            platform: "Firebase Functions + Express",
        });
    });
    app.get("/test", (req, res) => {
        return res.status(200).json({
            success: true,
            message: "Test endpoint working",
            timestamp: new Date().toISOString(),
        });
    });
    app.post("/synthesis", (req, res) => {
        var _a;
        try {
            const { cluster } = req.body || {};
            if (!cluster) {
                return res.status(400).json({
                    success: false,
                    error: "Cluster data required",
                });
            }
            const result = {
                id: `synthesis_${Date.now()}`,
                summary: `Analyzed ${((_a = cluster.events) === null || _a === void 0 ? void 0 : _a.length) || 0} events`,
                recommendation: "Monitor situation and follow local guidance",
                severity: cluster.severity || "MEDIUM",
                confidence: 85,
                timestamp: new Date().toISOString(),
            };
            return res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                error: "Synthesis failed",
            });
        }
    });
    app.post("/media", (req, res) => {
        try {
            const { mediaUrl, reportId } = req.body || {};
            if (!mediaUrl || !reportId) {
                return res.status(400).json({
                    success: false,
                    error: "mediaUrl and reportId required",
                });
            }
            const result = {
                id: `media_${Date.now()}`,
                reportId,
                mediaUrl,
                analysis: {
                    detected: ["traffic", "vehicles"],
                    confidence: 0.9,
                },
                timestamp: new Date().toISOString(),
            };
            return res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                error: "Media analysis failed",
            });
        }
    });
    app.get("/reports", (req, res) => {
        try {
            const reports = [
                {
                    id: "report_1",
                    title: "Traffic Report",
                    category: "traffic",
                    severity: "MEDIUM",
                    location: {
                        lat: 12.9716,
                        lng: 77.5946,
                        address: "MG Road, Bangalore",
                    },
                    timestamp: new Date().toISOString(),
                },
            ];
            return res.status(200).json({
                success: true,
                data: reports,
                count: reports.length,
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                error: "Failed to fetch reports",
            });
        }
    });
    app.get("/alerts", (req, res) => {
        try {
            const alerts = [
                {
                    id: `alert_${Date.now()}`,
                    summary: "Traffic congestion detected",
                    recommendation: "Use alternate routes",
                    severity: "HIGH",
                    confidence: 92,
                    timestamp: new Date().toISOString(),
                },
            ];
            return res.status(200).json({
                success: true,
                data: alerts,
                count: alerts.length,
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                error: "Failed to fetch alerts",
            });
        }
    });
    app.get("/clusters", (req, res) => {
        try {
            const clusters = [
                {
                    id: `cluster_${Date.now()}`,
                    events: [{ id: "report_1", title: "Traffic issue" }],
                    location: {
                        lat: 12.9716,
                        lng: 77.5946,
                        address: "Central Bangalore",
                    },
                    radius: 500,
                    severity: "HIGH",
                },
            ];
            return res.status(200).json({
                success: true,
                data: clusters,
                count: clusters.length,
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                error: "Failed to fetch clusters",
            });
        }
    });
    // SAFE 404 handler - using proper wildcard syntax
    app.use((req, res) => {
        return res.status(404).json({
            success: false,
            error: "Endpoint not found",
            path: req.path,
            method: req.method,
            availableEndpoints: [
                "GET /",
                "GET /health",
                "GET /test",
                "POST /synthesis",
                "POST /media",
                "GET /reports",
                "GET /alerts",
                "GET /clusters",
            ],
        });
    });
    return app;
};
// Export Firebase Function
exports.api = (0, https_1.onRequest)({
    cors: true,
    memory: "1GiB",
    timeoutSeconds: 60,
    maxInstances: 10,
}, createApp());
//# sourceMappingURL=index.js.map