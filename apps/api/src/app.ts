// src/index.ts - Express.js version (your current approach)
import express from "express";
import cors from "cors";
import { onRequest } from "firebase-functions/v2/https";

const createApp = (): express.Application => {
  const app = express();

  app.use(cors({ origin: true }));
  app.use(express.json());

  // Your existing routes
  app.get("/health", (req, res) => {
    res.json({
      success: true,
      message: "Civic Mind API is operational",
      timestamp: new Date().toISOString(),
      environment: "firebase-functions",
    });
  });

  // ✅ FIXED: Named wildcard parameter
  app.use("/:catchall*", (req, res) => {
    res.status(404).json({
      success: false,
      error: "Endpoint not found",
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
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
