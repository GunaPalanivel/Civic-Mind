import fastify from "fastify";
import { config } from "./config/environment";
import { setupRoutes } from "./routes";
import { db } from "./services/database/collections";
import { logger } from "./utils/logger";
import { initializeSocketServer } from "./services/websocket/socket.server";

const server = fastify({
  logger: false, // Use our custom logger
});

// Create HTTP server for WebSocket integration
const httpServer = server.server;

async function startServer() {
  try {
    // Setup API routes
    await setupRoutes(server);

    // Initialize database
    await db.initializeDatabase();

    // Initialize WebSocket server
    const socketServer = initializeSocketServer(httpServer);

    // Start server
    await server.listen({
      port: config.port,
      host: config.host,
    });

    logger.info(`Server running on http://${config.host}:${config.port}`);
    logger.info("WebSocket server ready for real-time connections");

    // Graceful shutdown
    process.on("SIGTERM", async () => {
      logger.info("SIGTERM received, shutting down gracefully");
      await socketServer.shutdown();
      await server.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
