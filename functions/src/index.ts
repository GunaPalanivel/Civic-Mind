import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Set global options
setGlobalOptions({
  region: "asia-south1",
  memory: "1GiB",
  timeoutSeconds: 300,
});

// Create Express app with minimal, safe routes
const createApp = (): express.Application => {
  const app = express();

  // Basic middleware
  app.use(cors({ origin: true }));
  app.use(express.json({ limit: "1mb" }));

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
        summary: `Analyzed ${cluster.events?.length || 0} events`,
        recommendation: "Monitor situation and follow local guidance",
        severity: cluster.severity || "MEDIUM",
        confidence: 85,
        timestamp: new Date().toISOString(),
      };

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
export const api = onRequest(
  {
    cors: true,
    memory: "1GiB",
    timeoutSeconds: 60,
    maxInstances: 10,
  },
  createApp(),
);
