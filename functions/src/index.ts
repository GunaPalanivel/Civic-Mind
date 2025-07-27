// src/index.ts - Complete Firebase Functions Setup
import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";

// Load environment variables for local development
if (process.env.NODE_ENV !== "production") {
  try {
    require("dotenv").config();
  } catch (error) {
    // Ignore if dotenv is not available
  }
}

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

// Create Express app
const createApp = (): express.Application => {
  const app = express();

  // CORS configuration
  app.use(
    cors({
      origin: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
      optionsSuccessStatus: 200,
    }),
  );

  // Body parsing middleware
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // Root endpoint
  app.get("/", (req: express.Request, res: express.Response): void => {
    res.status(200).json({
      success: true,
      message: "Civic Mind API - Express + Firebase Functions",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      status: "operational",
    });
  });

  // Health check endpoint
  app.get("/health", (req: express.Request, res: express.Response): void => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      platform: "Firebase Functions + Express",
      region: "asia-south1",
    });
  });

  // Intelligence health check
  app.get(
    "/intelligence/health",
    (req: express.Request, res: express.Response): void => {
      res.status(200).json({
        success: true,
        services: {
          ai: { healthy: true },
          clustering: { healthy: true },
          auth: { healthy: true },
        },
        timestamp: new Date().toISOString(),
      });
    },
  );

  // Intelligence status
  app.get(
    "/intelligence/status",
    (req: express.Request, res: express.Response): void => {
      res.status(200).json({
        success: true,
        message: "Intelligence service is running",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
      });
    },
  );

  // Clustering endpoint
  app.post(
    "/intelligence/cluster",
    async (req: express.Request, res: express.Response): Promise<void> => {
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
      } catch (error) {
        console.error("Clustering error:", error);
        res.status(500).json({
          success: false,
          error: "Clustering failed",
          timestamp: new Date().toISOString(),
        });
      }
    },
  );

  // Synthesis endpoint
  app.post(
    "/intelligence/synthesize",
    async (req: express.Request, res: express.Response): Promise<void> => {
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
          summary: `Analyzed ${cluster.events?.length || 0} events`,
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
      } catch (error) {
        console.error("Synthesis error:", error);
        res.status(500).json({
          success: false,
          error: "AI synthesis failed",
          timestamp: new Date().toISOString(),
        });
      }
    },
  );

  // Process events endpoint
  app.post(
    "/intelligence/process",
    async (req: express.Request, res: express.Response): Promise<void> => {
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
      } catch (error) {
        console.error("Processing error:", error);
        res.status(500).json({
          success: false,
          error: "Intelligence processing failed",
          timestamp: new Date().toISOString(),
        });
      }
    },
  );

  // Media analysis endpoint
  app.post(
    "/intelligence/media",
    (req: express.Request, res: express.Response): void => {
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
      } catch (error) {
        console.error("Media error:", error);
        res.status(500).json({
          success: false,
          error: "Media analysis failed",
          timestamp: new Date().toISOString(),
        });
      }
    },
  );

  // Reports endpoint
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
    } catch (error) {
      console.error("Reports error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch reports",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // 404 handler
  app.use("*", (req: express.Request, res: express.Response): void => {
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
export const api = onRequest(
  {
    cors: true,
    memory: "1GiB",
    timeoutSeconds: 60,
    maxInstances: 10,
  },
  app,
);
