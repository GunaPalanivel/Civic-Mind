"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const intelligenceRoutes = (0, express_1.Router)();
// Clustering endpoint - Fix: Add explicit return statements or void return type
intelligenceRoutes.post("/api/intelligence/cluster", (req, res) => {
    try {
        const { events } = req.body;
        // Validate input
        if (!events || !Array.isArray(events) || events.length === 0) {
            res.status(400).json({
                success: false,
                error: "Events array is required and cannot be empty",
                timestamp: new Date().toISOString(),
            });
            return; // ✅ Explicit return
        }
        // Your clustering logic here
        const startTime = Date.now();
        const clusters = [];
        const outliers = events;
        const processingTime = (Date.now() - startTime) / 1000;
        res.json({
            success: true,
            data: {
                clusters,
                outliers,
                metrics: {
                    totalEvents: events.length,
                    clusteredEvents: 0,
                    processingTime,
                    clusterCount: clusters.length,
                },
            },
            timestamp: new Date().toISOString(),
        });
        return; // ✅ Explicit return
    }
    catch (error) {
        console.error("Clustering error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error during clustering",
            timestamp: new Date().toISOString(),
        });
        return; // ✅ Explicit return
    }
});
// Trends endpoint - Fix: Add void return type and explicit returns
intelligenceRoutes.get("/api/intelligence/trends", (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                trends: [],
                timeframe: "24h",
            },
            timestamp: new Date().toISOString(),
        });
        return; // ✅ Explicit return
    }
    catch (error) {
        console.error("Trends error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error fetching trends",
            timestamp: new Date().toISOString(),
        });
        return; // ✅ Explicit return
    }
});
exports.default = intelligenceRoutes;
//# sourceMappingURL=intelligence.js.map