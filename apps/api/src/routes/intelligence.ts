import { FastifyPluginAsync } from "fastify";
import { civicIntelligenceService } from "@/services/integration/civic-intelligence.service";
import { spatialClusteringService } from "@/services/clustering/spatial.service";
import { geminiService } from "@/services/ai/gemini.service";
import {
  authService,
  AuthenticatedRequest,
} from "@/services/auth/auth.service";
import { logger } from "@/utils/logger";

const intelligenceRoutes: FastifyPluginAsync = async (server) => {
  // Apply auth middleware
  server.addHook("preHandler", authService.createAuthMiddleware());

  // Test spatial clustering
  server.post("/cluster", async (request: AuthenticatedRequest, reply) => {
    try {
      const { events, radius = 500, minClusterSize = 3 } = request.body as any;

      const result = await spatialClusteringService.clusterEvents(
        events,
        radius,
        minClusterSize,
      );

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Clustering test failed:", err.message);
      return reply.code(500).send({
        success: false,
        error: "Clustering failed",
        details: err.message,
      });
    }
  });

  // Test AI synthesis
  server.post("/synthesize", async (request: AuthenticatedRequest, reply) => {
    try {
      const cluster = request.body as any;

      const result = await geminiService.synthesizeEvents(cluster);

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("AI synthesis test failed:", err.message);
      return reply.code(500).send({
        success: false,
        error: "AI synthesis failed",
        details: err.message,
      });
    }
  });

  // Full intelligence pipeline test
  server.post("/process", async (request: AuthenticatedRequest, reply) => {
    try {
      const { events } = request.body as any;
      const user = request.user!;

      const result = await civicIntelligenceService.processEvents(
        events,
        user.uid,
      );

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Intelligence processing test failed:", err.message);
      return reply.code(500).send({
        success: false,
        error: "Intelligence processing failed",
        details: err.message,
      });
    }
  });

  // Service health checks
  server.get("/health", async (request, reply) => {
    try {
      const aiHealth = await geminiService.healthCheck();

      return {
        success: true,
        services: {
          ai: aiHealth,
          clustering: { healthy: true },
          auth: { healthy: true },
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: "Health check failed",
      });
    }
  });
};

export default intelligenceRoutes;
