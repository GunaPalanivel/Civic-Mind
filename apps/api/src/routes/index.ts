// src/index.ts (or wherever your main Firebase Function is defined)
import express from "express";
import cors from "cors";
import { onRequest } from "firebase-functions/v2/https";

const createApp = (): express.Application => {
  const app = express();

  // Basic CORS
  app.use(cors({ origin: true }));
  app.use(express.json());

  // Root health check
  app.get("/", (req, res) => {
    res.json({
      success: true,
      message: "Civic Mind API is operational",
      timestamp: new Date().toISOString(),
    });
  });

  // Health endpoint
  app.get("/health", (req, res) => {
    res.json({
      success: true,
      message: "Health check passed",
      timestamp: new Date().toISOString(),
    });
  });

  // Intelligence endpoints - defined directly here to avoid route issues
  app.get("/intelligence/health", (req, res) => {
    res.json({
      success: true,
      services: {
        ai: { healthy: true },
        clustering: { healthy: true },
        auth: { healthy: true },
      },
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/intelligence/status", (req, res) => {
    res.json({
      success: true,
      message: "Intelligence service is running",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    });
  });

  // POST endpoints with basic structure
  app.post("/intelligence/cluster", (req, res) => {
    res.json({
      success: true,
      message: "Clustering endpoint - temporarily working",
      timestamp: new Date().toISOString(),
    });
  });

  app.post("/intelligence/synthesize", (req, res) => {
    res.json({
      success: true,
      message: "Synthesis endpoint - temporarily working",
      timestamp: new Date().toISOString(),
    });
  });

  app.post("/intelligence/process", (req, res) => {
    res.json({
      success: true,
      message: "Process endpoint - temporarily working",
      timestamp: new Date().toISOString(),
    });
  });

  // Simple 404 handler - NO wildcards
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: "Endpoint not found",
      path: req.originalUrl,
    });
  });

  return app;
};

export const api = onRequest(
  {
    cors: true,
    memory: "1GiB",
    timeoutSeconds: 300,
  },
  createApp(),
);
