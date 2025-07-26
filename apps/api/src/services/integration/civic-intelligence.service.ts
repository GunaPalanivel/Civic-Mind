import { spatialClusteringService } from "../clustering/spatial.service";
import { geminiService } from "../ai/gemini.service";
import { authService } from "../auth/auth.service";
import { logger } from "@/utils/logger";

interface CivicEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    geohash?: string;
  };
  timestamp: string;
  reporterId: string;
}

export class CivicIntelligenceService {
  private static instance: CivicIntelligenceService;

  public static getInstance(): CivicIntelligenceService {
    if (!CivicIntelligenceService.instance) {
      CivicIntelligenceService.instance = new CivicIntelligenceService();
    }
    return CivicIntelligenceService.instance;
  }

  /**
   * Process new civic events through the complete intelligence pipeline
   */
  async processEvents(
    events: CivicEvent[],
    userId: string,
  ): Promise<{
    clusters: any[];
    alerts: any[];
    metrics: any;
  }> {
    const startTime = performance.now();

    try {
      logger.info(
        `Processing ${events.length} civic events for user ${userId}`,
      );

      // Step 1: Validate user permissions
      const hasPermission = await authService.validatePermissions(
        userId,
        "reports",
        "read",
      );
      if (!hasPermission) {
        throw new Error("Insufficient permissions to process events");
      }

      // Step 2: Spatial clustering
      const clusterResult = await spatialClusteringService.clusterEvents(
        events,
        500,
        3,
      );

      // Step 3: AI synthesis for each cluster
      const alerts = [];
      for (const cluster of clusterResult.clusters) {
        try {
          const alert = await geminiService.synthesizeEvents(cluster);
          alerts.push(alert);
        } catch (error) {
          logger.error(`Failed to synthesize cluster ${cluster.id}:`, error);
          // Continue with other clusters
        }
      }

      const processingTime = performance.now() - startTime;

      const result = {
        clusters: clusterResult.clusters,
        alerts,
        metrics: {
          ...clusterResult.metrics,
          alertsGenerated: alerts.length,
          totalProcessingTime: processingTime,
        },
      };

      logger.info(`Civic intelligence processing completed`, {
        clusters: result.clusters.length,
        alerts: result.alerts.length,
        processingTime: `${processingTime.toFixed(2)}ms`,
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Civic intelligence processing failed:", err.message);
      throw err;
    }
  }
}

export const civicIntelligenceService = CivicIntelligenceService.getInstance();
