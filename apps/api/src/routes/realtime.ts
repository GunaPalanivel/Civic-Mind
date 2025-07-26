import { FastifyPluginAsync } from "fastify";
import { reportIngestionService } from "@/services/ingestion/report.service";
import { civicSocketServer } from "@/services/websocket/socket.server";
import { civicIntelligenceService } from "@/services/integration/civic-intelligence.service";
import {
  authService,
  AuthenticatedRequest,
} from "@/services/auth/auth.service";
import { logger } from "@/utils/logger";

const realtimeRoutes: FastifyPluginAsync = async (server) => {
  // Apply auth middleware
  server.addHook("preHandler", authService.createAuthMiddleware());

  // Helper function to get nearby reports (moved outside the route handler)
  async function getNearbyReports(
    lat: number,
    lng: number,
    minutesBack: number,
  ): Promise<any[]> {
    // This would normally query your database
    // For now, return empty array as we're using mock data
    logger.debug(
      `Mock: would search for reports near ${lat}, ${lng} from last ${minutesBack} minutes`,
    );
    return [];
  }

  // Submit new civic report with real-time processing
  server.post("/submit", async (request: AuthenticatedRequest, reply) => {
    try {
      const user = request.user!;
      const reportData = request.body as any;

      // Extract client metadata
      const metadata = {
        source: "web",
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"],
      };

      logger.info(
        `Processing real-time report submission from user ${user.uid}`,
      );

      // Ingest report with rate limiting and validation
      const enrichedReport = await reportIngestionService.ingestReport(
        {
          ...reportData,
          reporterId: user.uid,
        },
        metadata,
      );

      // Get recent reports in the area for clustering
      const nearbyReports = await getNearbyReports(
        enrichedReport.location.latitude,
        enrichedReport.location.longitude,
        30, // 30 minutes
      );

      // Process through intelligence pipeline if we have enough events
      if (nearbyReports.length >= 2) {
        // Include the new report
        const allEvents = [...nearbyReports, enrichedReport];
        const intelligenceResult = await civicIntelligenceService.processEvents(
          allEvents,
          user.uid,
        );

        // Broadcast clusters and alerts in real-time
        if (civicSocketServer) {
          // Broadcast cluster updates
          for (const cluster of intelligenceResult.clusters) {
            await civicSocketServer.broadcastClusterUpdate(cluster);
          }

          // Broadcast new alerts
          for (const alert of intelligenceResult.alerts) {
            await civicSocketServer.broadcastAlert(alert);
          }
        }

        return reply.code(201).send({
          success: true,
          data: {
            report: enrichedReport,
            intelligence: intelligenceResult,
            realTimeProcessing: true,
          },
          message: "Report submitted and processed in real-time",
          timestamp: new Date().toISOString(),
        });
      }

      // Single report - no clustering yet
      return reply.code(201).send({
        success: true,
        data: {
          report: enrichedReport,
          realTimeProcessing: false,
        },
        message: "Report submitted successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Real-time report submission failed:", err.message);

      return reply.code(400).send({
        success: false,
        error: err.message,
        code: "SUBMISSION_FAILED",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Get real-time system statistics
  server.get("/stats", async (request: AuthenticatedRequest, reply) => {
    try {
      const [ingestionStats, socketStats] = await Promise.all([
        reportIngestionService.getIngestionStats(),
        civicSocketServer?.getConnectionStats() || {
          error: "WebSocket server not available",
        },
      ]);

      return {
        success: true,
        data: {
          ingestion: ingestionStats,
          websocket: socketStats,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: "Failed to get system statistics",
      });
    }
  });

  // Health check for real-time services
  server.get("/health", async (request, reply) => {
    try {
      const socketHealth = (await civicSocketServer?.healthCheck()) || {
        healthy: false,
        details: { error: "WebSocket server not initialized" },
      };

      const ingestionHealth = {
        healthy: true,
        details: await reportIngestionService.getIngestionStats(),
      };

      const overallHealthy = socketHealth.healthy && ingestionHealth.healthy;

      return reply.code(overallHealthy ? 200 : 503).send({
        success: true,
        healthy: overallHealthy,
        services: {
          ingestion: ingestionHealth,
          websocket: socketHealth,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        healthy: false,
        error: "Health check failed",
      });
    }
  });
};

export default realtimeRoutes;
