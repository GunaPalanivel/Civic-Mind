"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const app_1 = require("firebase-admin/app");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// Initialize Firebase Admin
(0, app_1.initializeApp)();
(0, v2_1.setGlobalOptions)({
    region: "asia-south1",
    memory: "1GiB",
    timeoutSeconds: 300,
});
// Create Express app with CORS handled by Express middleware
const createApp = () => {
    const app = (0, express_1.default)();
    // Handle CORS at Express level (more flexible)
    app.use((0, cors_1.default)({
        origin: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    }));
    app.use(express_1.default.json({ limit: "1mb" }));
    // Your existing routes here...
    app.get("/", (req, res) => {
        return res.status(200).json({
            success: true,
            message: "Civic Mind API - Express + Firebase Functions",
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
            method: req.method,
            path: req.path,
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
            console.error("Synthesis error:", error);
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
            console.error("Media error:", error);
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
                    title: "Test Traffic Report",
                    category: "traffic",
                    severity: "MEDIUM",
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
            console.error("Reports error:", error);
            return res.status(500).json({
                success: false,
                error: "Failed to fetch reports",
            });
        }
    });
    // 404 handler
    app.use((req, res) => {
        return res.status(404).json({
            success: false,
            error: "Not Found",
            path: req.path,
            method: req.method,
            available: ["/", "/health", "/test", "/synthesis", "/media", "/reports"],
        });
    });
    return app;
};
// FIXED: Simplified Firebase Functions v2 CORS configuration
exports.api = (0, https_1.onRequest)({
    cors: true,
    memory: "1GiB",
    timeoutSeconds: 60,
}, createApp());
//# sourceMappingURL=index.js.map