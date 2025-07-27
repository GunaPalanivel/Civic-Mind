// src/routes/intelligence.ts
import express, { Request, Response, NextFunction, Router } from "express";
import cors from "cors";
import { civicIntelligenceService } from "@/services/integration/civic-intelligence.service";
import { spatialClusteringService } from "@/services/clustering/spatial.service";
import { geminiService } from "@/services/ai/gemini.service";
import { authService } from "@/services/auth/auth.service";
import { logger } from "@/utils/logger";

const router: Router = express.Router();

// CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://your-frontend-domain.com",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Apply CORS to all routes
router.use(cors(corsOptions));

// Interfaces for type safety
interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    [key: string]: any;
  };
  body: any;
}

interface ClusterRequestBody {
  events: any[];
  radius?: number;
  minClusterSize?: number;
}

interface ProcessRequestBody {
  events: any[];
}

// REMOVED: Delete the requireAuth function entirely since you're not using it

// Input validation middleware
const validateClusterInput = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { events } = req.body as ClusterRequestBody;

  if (!events || !Array.isArray(events)) {
    return res.status(400).json({
      success: false,
      error: "Invalid input: events array is required",
    });
  }

  next();
};

const validateProcessInput = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { events } = req.body as ProcessRequestBody;

  if (!events || !Array.isArray(events)) {
    return res.status(400).json({
      success: false,
      error: "Invalid input: events array is required",
    });
  }

  next();
};

// Test spatial clustering
router.post(
  "/cluster",
  authService.createAuthMiddleware(),
  validateClusterInput,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        events,
        radius = 500,
        minClusterSize = 3,
      } = req.body as ClusterRequestBody;

      logger.info(
        `Clustering ${events.length} events with radius ${radius}m and min cluster size ${minClusterSize}`,
      );

      const result = await spatialClusteringService.clusterEvents(
        events,
        radius,
        minClusterSize,
      );

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Clustering test failed:", err.message);

      res.status(500).json({
        success: false,
        error: "Clustering failed",
        details: err.message,
      });
    }
  },
);

// Test AI synthesis
router.post(
  "/synthesize",
  authService.createAuthMiddleware(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const cluster = req.body;

      if (!cluster) {
        return res.status(400).json({
          success: false,
          error: "Cluster data is required",
        });
      }

      logger.info("Starting AI synthesis for cluster");

      const result = await geminiService.synthesizeEvents(cluster);

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("AI synthesis test failed:", err.message);

      res.status(500).json({
        success: false,
        error: "AI synthesis failed",
        details: err.message,
      });
    }
  },
);

// Full intelligence pipeline test
router.post(
  "/process",
  authService.createAuthMiddleware(),
  validateProcessInput,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { events } = req.body as ProcessRequestBody;
      const user = req.user!;

      logger.info(`Processing ${events.length} events for user ${user.uid}`);

      const result = await civicIntelligenceService.processEvents(
        events,
        user.uid,
      );

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Intelligence processing test failed:", err.message);

      res.status(500).json({
        success: false,
        error: "Intelligence processing failed",
        details: err.message,
      });
    }
  },
);

// Service health checks (no auth required)
router.get("/health", async (req: Request, res: Response) => {
  try {
    logger.info("Performing health check");

    const aiHealth = await geminiService.healthCheck();

    res.json({
      success: true,
      services: {
        ai: aiHealth,
        clustering: { healthy: true },
        auth: { healthy: true },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Health check failed:", err.message);

    res.status(500).json({
      success: false,
      error: "Health check failed",
      details: err.message,
    });
  }
});

// Additional utility routes
router.get("/status", async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Intelligence service is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

export default router;
