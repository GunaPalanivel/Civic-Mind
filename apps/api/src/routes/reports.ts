import { FastifyPluginAsync } from "fastify";
// import { db } from "@/services/database/collections";
import {
  authService,
  AuthenticatedRequest,
} from "@/services/auth/auth.service";
import { logger } from "@/utils/logger";
import { config } from "@/config/environment";

const reportsRoutes: FastifyPluginAsync = async (server) => {
  // Smart Authentication Middleware - Works in Development & Production
  server.addHook("preHandler", async (request: AuthenticatedRequest, reply) => {
    try {
      const authHeader = request.headers.authorization;

      // Development Mode: Flexible Authentication
      if (config.nodeEnv === "development") {
        if (!authHeader) {
          // Allow requests without auth in development
          logger.debug(
            "Development mode: Creating mock user for unauthenticated request",
          );
          request.user = {
            uid: "dev-user-123",
            email: "developer@civic-mind.com",
            name: "Development User",
            aud: "civic-mind-dev",
            auth_time: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
            firebase: {
              identities: { email: ["developer@civic-mind.com"] },
              sign_in_provider: "custom",
            },
            iat: Math.floor(Date.now() / 1000),
            iss: "https://securetoken.google.com/civic-mind-dev",
            sub: "dev-user-123",
          } as any;
          return;
        }

        // If auth header provided in development, verify it
        try {
          const user = await authService.verifyToken(authHeader);
          request.user = user;
          logger.debug(`Development mode: Authenticated user ${user.uid}`);
        } catch (error) {
          // In development, fall back to mock user even if token is invalid
          logger.warn("Development mode: Invalid token, using mock user");
          request.user = {
            uid: "dev-user-123",
            email: "developer@civic-mind.com",
            name: "Development User (Fallback)",
          } as any;
        }
        return;
      }

      // Production Mode: Strict Authentication
      if (!authHeader) {
        logger.warn("Production mode: Missing authorization header");
        return reply.code(401).send({
          success: false,
          error: "Authentication required",
          code: "MISSING_AUTH_HEADER",
          timestamp: new Date().toISOString(),
        });
      }

      // Verify token in production
      const user = await authService.verifyToken(authHeader);
      request.user = user;
      logger.info(`Authenticated user: ${user.uid}`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Authentication failed:", err.message);

      return reply.code(401).send({
        success: false,
        error: "Invalid authentication token",
        code: "INVALID_TOKEN",
        details: config.nodeEnv === "development" ? err.message : undefined,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // GET /api/reports - List all reports
  server.get("/", async (request: AuthenticatedRequest, reply) => {
    try {
      const user = request.user!; // We know user exists after auth middleware
      logger.info(`User ${user.uid} requesting reports list`);

      // Check user permissions
      const hasPermission = await authService.validatePermissions(
        user.uid,
        "reports",
        "read",
      );
      if (!hasPermission) {
        return reply.code(403).send({
          success: false,
          error: "Insufficient permissions to read reports",
          code: "FORBIDDEN",
          timestamp: new Date().toISOString(),
        });
      }

      // Mock data with user context
      const mockReports = [
        {
          id: "report-1",
          title: "Traffic Jam on MG Road",
          description: "Heavy traffic due to construction work",
          category: "traffic",
          severity: "MEDIUM",
          location: {
            latitude: 12.9716,
            longitude: 77.5946,
            address: "MG Road, Bangalore",
            geohash: "tdr1u4qq",
          },
          timestamp: new Date().toISOString(),
          reporterId: "system",
          verified: false,
          tags: ["traffic", "construction"],
          mediaUrls: [],
        },
        {
          id: "report-2",
          title: "Pothole on Brigade Road",
          description: "Large pothole causing issues for vehicles",
          category: "infrastructure",
          severity: "HIGH",
          location: {
            latitude: 12.9698,
            longitude: 77.6055,
            address: "Brigade Road, Bangalore",
            geohash: "tdr1u7bb",
          },
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          reporterId: user.uid, // Use authenticated user's ID
          verified: true,
          tags: ["infrastructure", "pothole"],
          mediaUrls: [],
        },
      ];

      return {
        success: true,
        data: mockReports,
        count: mockReports.length,
        timestamp: new Date().toISOString(),
        user: {
          uid: user.uid,
          email: user.email || "anonymous@civic-mind.com",
        },
        message: `Reports fetched successfully (${config.nodeEnv} mode)`,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Failed to fetch reports:", err.message);
      return reply.code(500).send({
        success: false,
        error: "Failed to fetch reports",
        code: "INTERNAL_ERROR",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // POST /api/reports - Create new report
  server.post("/", async (request: AuthenticatedRequest, reply) => {
    try {
      const user = request.user!;
      const reportData = request.body as any;

      logger.info(`User ${user.uid} creating new report:`, reportData);

      // Check user permissions
      const hasPermission = await authService.validatePermissions(
        user.uid,
        "reports",
        "create",
      );
      if (!hasPermission) {
        return reply.code(403).send({
          success: false,
          error: "Insufficient permissions to create reports",
          code: "FORBIDDEN",
          timestamp: new Date().toISOString(),
        });
      }

      // Basic validation
      if (
        !reportData.title ||
        !reportData.description ||
        !reportData.category
      ) {
        return reply.code(400).send({
          success: false,
          error: "Missing required fields: title, description, category",
          code: "VALIDATION_ERROR",
          timestamp: new Date().toISOString(),
        });
      }

      // Generate geohash if location provided
      let geohash;
      if (reportData.location?.latitude && reportData.location?.longitude) {
        const { generateGeohash } = require("@civic-mind/utils");
        geohash = generateGeohash(
          reportData.location.latitude,
          reportData.location.longitude,
        );
      }

      const newReport = {
        id: `report-${Date.now()}`,
        ...reportData,
        location: {
          ...reportData.location,
          geohash,
        },
        timestamp: new Date().toISOString(),
        reporterId: user.uid, // Use authenticated user's ID
        reporterEmail: user.email,
        verified: false,
        tags: reportData.tags || [],
        mediaUrls: reportData.mediaUrls || [],
      };

      return reply.code(201).send({
        success: true,
        data: newReport,
        message: "Report created successfully",
        timestamp: new Date().toISOString(),
        user: {
          uid: user.uid,
          email: user.email,
        },
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Failed to create report:", err.message);
      return reply.code(400).send({
        success: false,
        error: "Failed to create report",
        code: "CREATION_ERROR",
        details: config.nodeEnv === "development" ? err.message : undefined,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // GET /api/reports/:id - Get specific report
  server.get("/:id", async (request: AuthenticatedRequest, reply) => {
    try {
      const user = request.user!;
      const { id } = request.params as { id: string };

      logger.info(`User ${user.uid} requesting report: ${id}`);

      // Check permissions
      const hasPermission = await authService.validatePermissions(
        user.uid,
        "reports",
        "read",
      );
      if (!hasPermission) {
        return reply.code(403).send({
          success: false,
          error: "Insufficient permissions to read reports",
          code: "FORBIDDEN",
          timestamp: new Date().toISOString(),
        });
      }

      // Mock single report response
      const mockReport = {
        id: id,
        title: "Authenticated Report Access",
        description: `Report accessed by authenticated user ${user.uid}`,
        category: "infrastructure",
        severity: "MEDIUM",
        location: {
          latitude: 12.9716,
          longitude: 77.5946,
          address: "Sample Address, Bangalore",
          geohash: "tdr1u4qq",
        },
        timestamp: new Date().toISOString(),
        reporterId: user.uid,
        reporterEmail: user.email,
        verified: false,
        tags: ["authenticated-access"],
        mediaUrls: [],
      };

      return {
        success: true,
        data: mockReport,
        timestamp: new Date().toISOString(),
        user: {
          uid: user.uid,
          email: user.email,
        },
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Failed to fetch report:", err.message);
      return reply.code(500).send({
        success: false,
        error: "Failed to fetch report",
        code: "INTERNAL_ERROR",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // DELETE /api/reports/:id - Delete report (admin/moderator only)
  server.delete("/:id", async (request: AuthenticatedRequest, reply) => {
    try {
      const user = request.user!;
      const { id } = request.params as { id: string };

      logger.info(`User ${user.uid} attempting to delete report: ${id}`);

      // Check permissions (only admin/moderator can delete)
      const hasPermission = await authService.validatePermissions(
        user.uid,
        "reports",
        "delete",
      );
      if (!hasPermission) {
        return reply.code(403).send({
          success: false,
          error: "Insufficient permissions to delete reports",
          code: "FORBIDDEN",
          timestamp: new Date().toISOString(),
        });
      }

      // Mock deletion
      logger.info(`Report ${id} deleted by user ${user.uid}`);

      return {
        success: true,
        message: `Report ${id} deleted successfully`,
        timestamp: new Date().toISOString(),
        deletedBy: {
          uid: user.uid,
          email: user.email,
        },
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Failed to delete report:", err.message);
      return reply.code(500).send({
        success: false,
        error: "Failed to delete report",
        code: "DELETION_ERROR",
        timestamp: new Date().toISOString(),
      });
    }
  });
};

export default reportsRoutes;
