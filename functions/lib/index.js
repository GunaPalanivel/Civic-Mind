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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
// src/index.ts - Complete Firebase Functions Setup
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// Load environment variables for local development
if (process.env.NODE_ENV !== "production") {
    try {
        require("dotenv").config();
    }
    catch (error) {
        // Ignore if dotenv is not available
    }
}
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
// Create Express app
const createApp = () => {
    const app = (0, express_1.default)();
    // CORS configuration
    app.use((0, cors_1.default)({
        origin: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
        optionsSuccessStatus: 200,
    }));
    // Body parsing middleware
    app.use(express_1.default.json({ limit: "1mb" }));
    app.use(express_1.default.urlencoded({ extended: true, limit: "1mb" }));
    // Root endpoint
    app.get("/", (req, res) => {
        res.status(200).json({
            success: true,
            message: "Civic Mind API - Express + Firebase Functions",
            timestamp: new Date().toISOString(),
            version: "1.0.0",
            status: "operational",
        });
    });
    // Health check endpoint
    app.get("/health", (req, res) => {
        res.status(200).json({
            status: "healthy",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            platform: "Firebase Functions + Express",
            region: "asia-south1",
        });
    });
    // Intelligence health check
    app.get("/intelligence/health", (req, res) => {
        res.status(200).json({
            success: true,
            services: {
                ai: { healthy: true },
                clustering: { healthy: true },
                auth: { healthy: true },
            },
            timestamp: new Date().toISOString(),
        });
    });
    // Intelligence status
    app.get("/intelligence/status", (req, res) => {
        res.status(200).json({
            success: true,
            message: "Intelligence service is running",
            version: "1.0.0",
            timestamp: new Date().toISOString(),
        });
    });
    // Clustering endpoint
    app.post("/intelligence/cluster", async (req, res) => {
        try {
            const { events } = req.body;
            if (!events || !Array.isArray(events)) {
                res.status(400).json({
                    success: false,
                    error: "Events array is required",
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const processingStart = Date.now();
            // TODO: Add actual clustering logic here
            const result = {
                clusters: [],
                outliers: events,
                metrics: {
                    totalEvents: events.length,
                    clusteredEvents: 0,
                    processingTime: (Date.now() - processingStart) / 1000,
                    clusterCount: 0,
                },
            };
            res.status(200).json({
                success: true,
                data: result,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            console.error("Clustering error:", error);
            res.status(500).json({
                success: false,
                error: "Clustering failed",
                timestamp: new Date().toISOString(),
            });
        }
    });
    // Synthesis endpoint
    app.post("/intelligence/synthesize", async (req, res) => {
        var _a;
        try {
            const cluster = req.body;
            if (!cluster) {
                res.status(400).json({
                    success: false,
                    error: "Cluster data required",
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const result = {
                id: `synthesis_${Date.now()}`,
                summary: `Analyzed ${((_a = cluster.events) === null || _a === void 0 ? void 0 : _a.length) || 0} events`,
                recommendation: "Monitor situation and follow local guidance",
                severity: cluster.severity || "MEDIUM",
                confidence: 85,
                timestamp: new Date().toISOString(),
            };
            res.status(200).json({
                success: true,
                data: result,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            console.error("Synthesis error:", error);
            res.status(500).json({
                success: false,
                error: "AI synthesis failed",
                timestamp: new Date().toISOString(),
            });
        }
    });
    // Process events endpoint
    app.post("/intelligence/process", async (req, res) => {
        try {
            const { events } = req.body;
            if (!events || !Array.isArray(events)) {
                res.status(400).json({
                    success: false,
                    error: "Events array is required",
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const result = {
                id: `process_${Date.now()}`,
                processedEvents: events.length,
                clusters: [],
                synthesis: null,
                timestamp: new Date().toISOString(),
            };
            res.status(200).json({
                success: true,
                data: result,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            console.error("Processing error:", error);
            res.status(500).json({
                success: false,
                error: "Intelligence processing failed",
                timestamp: new Date().toISOString(),
            });
        }
    });
    // Media analysis endpoint
    app.post("/intelligence/media", (req, res) => {
        try {
            const { mediaUrl, reportId } = req.body || {};
            if (!mediaUrl || !reportId) {
                res.status(400).json({
                    success: false,
                    error: "mediaUrl and reportId required",
                    timestamp: new Date().toISOString(),
                });
                return;
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
            res.status(200).json({
                success: true,
                data: result,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            console.error("Media error:", error);
            res.status(500).json({
                success: false,
                error: "Media analysis failed",
                timestamp: new Date().toISOString(),
            });
        }
    });
    // Reports endpoint
    app.get("/reports", (req, res) => {
        try {
            const reports = [
                {
                    id: "report_1",
                    title: "Test Traffic Report",
                    category: "traffic",
                    severity: "MEDIUM",
                    timestamp: new Date().toISOString(),
                },
                {
                    id: "report_2",
                    title: "Road Closure Alert",
                    category: "infrastructure",
                    severity: "HIGH",
                    timestamp: new Date().toISOString(),
                },
            ];
            return res.status(200).json({
                success: true,
                data: reports,
                count: reports.length,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            console.error("Reports error:", error);
            return res.status(500).json({
                success: false,
                error: "Failed to fetch reports",
                timestamp: new Date().toISOString(),
            });
        }
    });
    // 404 handler
    app.use("*", (req, res) => {
        res.status(404).json({
            success: false,
            error: "Endpoint not found",
            path: req.originalUrl,
            method: req.method,
            availableEndpoints: [
                "GET /",
                "GET /health",
                "GET /intelligence/health",
                "GET /intelligence/status",
                "POST /intelligence/cluster",
                "POST /intelligence/synthesize",
                "POST /intelligence/process",
                "POST /intelligence/media",
                "GET /reports",
            ],
            timestamp: new Date().toISOString(),
        });
    });
    return app;
};
// Create app once at module level for better performance
const app = createApp();
// Export Firebase Function
exports.api = (0, https_1.onRequest)({
    cors: true,
    memory: "1GiB",
    timeoutSeconds: 60,
    maxInstances: 10,
}, app);
//# sourceMappingURL=index.js.map