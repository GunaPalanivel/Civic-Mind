import { FastifyPluginAsync } from "fastify";
import { db } from "@/services/database/collections";
import { authService } from "@/services/auth/auth.service";
import { validateSchema, generateGeohash } from "@civic-mind/utils";
import { CivicEventSchema } from "@civic-mind/shared-types";

const reportsRoutes: FastifyPluginAsync = async (server) => {
  // Middleware for authentication
  server.addHook("preHandler", async (request, reply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return reply.code(401).send({
        error: "Missing authorization header",
      });
    }

    try {
      const user = await authService.verifyToken(authHeader);
      (request as any).user = user;
    } catch (error: unknown) {
      if (error instanceof Error) {
        server.log.error("Token verification failed:", error.message);
      }
      return reply.code(401).send({
        error: "Invalid token",
      });
    }
  });

  // GET /api/reports - List all reports
  server.get("/", async (request, reply) => {
    try {
      const snapshot = await db.civicEvents
        .orderBy("timestamp", "desc")
        .limit(50)
        .get();

      const reports = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...(data as object || {}),
        };
      });

      return {
        success: true,
        data: reports,
        count: reports.length,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        server.log.error("Failed to fetch reports:", error.message);
      } else {
        server.log.error("Failed to fetch reports:", error);
      }
      return reply.code(500).send({
        error: "Failed to fetch reports",
      });
    }
  });

  // POST /api/reports - Create new report
  server.post("/", async (request, reply) => {
    try {
      const user = (request as any).user;

      // Validate input using the imported validateSchema function
      const reportData = validateSchema(CivicEventSchema, {
        ...(request.body as object),
        reporterId: user.uid,
        timestamp: new Date().toISOString(),
        verified: false,
      });

      // Add geohash for spatial queries using the imported generateGeohash function
      const geohash = generateGeohash(
        reportData.location.latitude,
        reportData.location.longitude,
      );

      // Modify the reportData to include geohash
      const dataWithGeohash = {
        ...reportData,
        location: {
          ...reportData.location,
          geohash: geohash,
        },
      };

      // Save to Firestore
      const docRef = await db.civicEvents.add(dataWithGeohash);

      return reply.code(201).send({
        success: true,
        data: {
          id: docRef.id,
          ...dataWithGeohash,
        },
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        server.log.error("Failed to create report:", error.message);
        return reply.code(400).send({
          error: error.message,
        });
      } else {
        server.log.error("Failed to create report:", error);
        return reply.code(400).send({
          error: "Failed to create report",
        });
      }
    }
  });

  // GET /api/reports/:id - Get specific report
  server.get("/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const doc = await db.civicEvents.doc(id).get();

      if (!doc.exists) {
        return reply.code(404).send({
          error: "Report not found",
        });
      }

      const data = doc.data();
      return {
        success: true,
        data: {
          id: doc.id,
          ...(data as object || {}),
        },
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        server.log.error("Failed to fetch report:", error.message);
      } else {
        server.log.error("Failed to fetch report:", error);
      }
      return reply.code(500).send({
        error: "Failed to fetch report",
      });
    }
  });

  // PUT /api/reports/:id - Update specific report
  server.put("/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const user = (request as any).user;

      // Check if report exists
      const doc = await db.civicEvents.doc(id).get();
      if (!doc.exists) {
        return reply.code(404).send({
          error: "Report not found",
        });
      }

      // Validate update data
      const updateData = validateSchema(CivicEventSchema.partial(), request.body);

      // Add geohash if location is being updated
      if (updateData.location) {
        const geohash = generateGeohash(
          updateData.location.latitude,
          updateData.location.longitude,
        );
        updateData.location.geohash = geohash;
      }

      // Add update metadata
      const finalUpdateData = {
        ...updateData,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid,
      };

      // Update in Firestore
      await db.civicEvents.doc(id).update(finalUpdateData);

      // Fetch updated document
      const updatedDoc = await db.civicEvents.doc(id).get();
      const updatedData = updatedDoc.data();

      return {
        success: true,
        data: {
          id: updatedDoc.id,
          ...(updatedData as object || {}),
        },
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        server.log.error("Failed to update report:", error.message);
        return reply.code(400).send({
          error: error.message,
        });
      } else {
        server.log.error("Failed to update report:", error);
        return reply.code(400).send({
          error: "Failed to update report",
        });
      }
    }
  });

  // DELETE /api/reports/:id - Delete specific report
  server.delete("/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const _user = (request as any).user; // Prefixed with _ since it will be used for permissions later

      // Check if report exists
      const doc = await db.civicEvents.doc(id).get();
      if (!doc.exists) {
        return reply.code(404).send({
          error: "Report not found",
        });
      }

      // TODO: Add permission check - only admin or report owner can delete
      // if (_user.role !== "admin" && doc.data()?.reporterId !== _user.uid) {
      //   return reply.code(403).send({ error: "Insufficient permissions" });
      // }
      
      // Delete from Firestore
      await db.civicEvents.doc(id).delete();

      return {
        success: true,
        message: "Report deleted successfully",
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        server.log.error("Failed to delete report:", error.message);
      } else {
        server.log.error("Failed to delete report:", error);
      }
      return reply.code(500).send({
        error: "Failed to delete report",
      });
    }
  });
};

export default reportsRoutes;
