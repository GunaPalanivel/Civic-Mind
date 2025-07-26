import { Router, Request, Response } from "express";

interface ClusterRequest {
  events: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    severity: string;
    location: {
      latitude: number;
      longitude: number;
    };
    timestamp: string;
    reporterId: string;
  }>;
}

const intelligenceRoutes = Router();

// Clustering endpoint - Fix: Add explicit return statements or void return type
intelligenceRoutes.post(
  "/api/intelligence/cluster",
  (req: Request, res: Response): void => {
    try {
      const { events }: ClusterRequest = req.body;

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
      const clusters: any[] = [];
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
    } catch (error) {
      console.error("Clustering error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error during clustering",
        timestamp: new Date().toISOString(),
      });
      return; // ✅ Explicit return
    }
  },
);

// Trends endpoint - Fix: Add void return type and explicit returns
intelligenceRoutes.get(
  "/api/intelligence/trends",
  (req: Request, res: Response): void => {
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
    } catch (error) {
      console.error("Trends error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error fetching trends",
        timestamp: new Date().toISOString(),
      });
      return; // ✅ Explicit return
    }
  },
);

export default intelligenceRoutes;
