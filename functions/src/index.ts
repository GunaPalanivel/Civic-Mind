import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import { initializeApp } from "firebase-admin/app";
import express from "express";
import cors from "cors";

// Initialize Firebase Admin
initializeApp();

setGlobalOptions({
  region: "asia-south1",
  memory: "1GiB",
  timeoutSeconds: 300,
});

// Create Express app with CORS handled by Express middleware
const createApp = () => {
  const app = express();

  // Handle CORS at Express level (more flexible)
  app.use(
    cors({
      origin: true, // Allow all origins
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );

  app.use(express.json({ limit: "1mb" }));

  // Your existing routes here...
  app.get("/", (req: express.Request, res: express.Response) => {
    return res.status(200).json({
      success: true,
      message: "Civic Mind API - Express + Firebase Functions",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      status: "operational",
    });
  });

  app.get("/health", (req: express.Request, res: express.Response) => {
    return res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      platform: "Firebase Functions + Express",
    });
  });

  app.get("/test", (req: express.Request, res: express.Response) => {
    return res.status(200).json({
      success: true,
      message: "Test endpoint working",
      method: req.method,
      path: req.path,
      timestamp: new Date().toISOString(),
    });
  });

  app.post("/synthesis", (req: express.Request, res: express.Response) => {
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
      console.error("Synthesis error:", error);
      return res.status(500).json({
        success: false,
        error: "Synthesis failed",
      });
    }
  });

  app.post("/media", (req: express.Request, res: express.Response) => {
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
      console.error("Media error:", error);
      return res.status(500).json({
        success: false,
        error: "Media analysis failed",
      });
    }
  });

  app.get("/reports", (req: express.Request, res: express.Response) => {
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
    } catch (error) {
      console.error("Reports error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch reports",
      });
    }
  });

  // 404 handler
  app.use((req: express.Request, res: express.Response) => {
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
export const api = onRequest(
  {
    cors: true, // ✅ Simple: allow all origins
    memory: "1GiB",
    timeoutSeconds: 60,
  },
  createApp(),
);
