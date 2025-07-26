import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { RoomManager } from "./room.manager";
import { authService } from "@/services/auth/auth.service";
import { logger } from "@/utils/logger";
import { config } from "@/config/environment";

interface SynthesizedAlert {
  id: string;
  summary: string;
  recommendation: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    region?: string;
  };
  eventIds: string[];
  timestamp: string;
}

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  regionsSubscribed: Map<string, number>;
  connectionsByUser: Map<string, number>;
}

export class CivicSocketServer {
  private readonly io: SocketIOServer;
  private readonly roomManager = new RoomManager();
  private readonly metrics: ConnectionMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    regionsSubscribed: new Map(),
    connectionsByUser: new Map(),
  };

  constructor(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.frontendUrl || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
      pingTimeout: 60000,
      pingInterval: 25000,
      upgradeTimeout: 30000,
      allowUpgrades: true,
    });

    this.setupEventHandlers();
    this.startMetricsCollection();

    logger.info("WebSocket server initialized", {
      corsOrigin: config.frontendUrl || "http://localhost:3000",
    });
  }

  private setupEventHandlers(): void {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization;

        if (config.nodeEnv === "development" && !token) {
          // Allow unauthenticated connections in development
          socket.userId = "dev-user-123";
          socket.userEmail = "developer@civic-mind.com";
          return next();
        }

        if (!token) {
          return next(new Error("Authentication required"));
        }

        const user = await authService.verifyToken(token);
        socket.userId = user.uid;
        socket.userEmail = user.email || "anonymous@civic-mind.com";

        logger.debug(`Socket authenticated: ${socket.id}`, {
          userId: socket.userId,
          userEmail: socket.userEmail,
        });

        next();
      } catch (error) {
        logger.error("Socket authentication failed:", error);
        next(new Error("Invalid authentication token"));
      }
    });

    // Connection handling
    this.io.on("connection", (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);
    });
  }

  private handleConnection(socket: AuthenticatedSocket): void {
    this.metrics.totalConnections++;
    this.metrics.activeConnections++;

    if (socket.userId) {
      const userConnections =
        this.metrics.connectionsByUser.get(socket.userId) || 0;
      this.metrics.connectionsByUser.set(socket.userId, userConnections + 1);
    }

    logger.info(`Client connected: ${socket.id}`, {
      userId: socket.userId,
      userEmail: socket.userEmail,
      activeConnections: this.metrics.activeConnections,
    });

    // Send welcome message
    socket.emit("connection:established", {
      socketId: socket.id,
      timestamp: Date.now(),
      serverTime: new Date().toISOString(),
      message: "Connected to Civic Mind real-time service",
    });

    // Event handlers
    socket.on(
      "subscribe:region",
      async (data: {
        region: string;
        coordinates?: { latitude: number; longitude: number };
      }) => {
        await this.handleRegionSubscription(socket, data);
      },
    );

    socket.on("unsubscribe:region", (region: string) => {
      this.handleRegionUnsubscription(socket, region);
    });

    socket.on("ping", () => {
      socket.emit("pong", { timestamp: Date.now() });
    });

    socket.on("get:stats", () => {
      socket.emit("stats:update", this.getConnectionStats());
    });

    // Disconnection handling
    socket.on("disconnect", (reason) => {
      this.handleDisconnection(socket, reason);
    });

    // Error handling
    socket.on("error", (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  }

  private async handleRegionSubscription(
    socket: AuthenticatedSocket,
    data: {
      region: string;
      coordinates?: { latitude: number; longitude: number };
    },
  ): Promise<void> {
    try {
      const { region, coordinates } = data;

      // Validate region
      if (!region || typeof region !== "string") {
        socket.emit("error", { message: "Invalid region specified" });
        return;
      }

      await this.roomManager.subscribeToRegion(
        socket.id,
        region,
        socket.userId,
        coordinates,
      );

      // Update metrics
      const currentCount = this.metrics.regionsSubscribed.get(region) || 0;
      this.metrics.regionsSubscribed.set(region, currentCount + 1);

      // Confirm subscription
      socket.emit("subscription:confirmed", {
        region,
        timestamp: Date.now(),
        roomStats: this.roomManager.getRoomStats(),
      });

      logger.info(`Socket subscribed to region: ${region}`, {
        socketId: socket.id,
        userId: socket.userId,
        coordinates,
      });
    } catch (error) {
      logger.error("Failed to handle region subscription:", error);
      socket.emit("error", { message: "Failed to subscribe to region" });
    }
  }

  private handleRegionUnsubscription(
    socket: AuthenticatedSocket,
    region: string,
  ): void {
    try {
      // Update metrics
      const currentCount = this.metrics.regionsSubscribed.get(region) || 0;
      if (currentCount > 0) {
        this.metrics.regionsSubscribed.set(region, currentCount - 1);
      }

      socket.emit("unsubscription:confirmed", {
        region,
        timestamp: Date.now(),
      });

      logger.info(`Socket unsubscribed from region: ${region}`, {
        socketId: socket.id,
        userId: socket.userId,
      });
    } catch (error) {
      logger.error("Failed to handle region unsubscription:", error);
    }
  }

  private handleDisconnection(
    socket: AuthenticatedSocket,
    reason: string,
  ): void {
    this.metrics.activeConnections--;

    if (socket.userId) {
      const userConnections =
        this.metrics.connectionsByUser.get(socket.userId) || 0;
      if (userConnections > 1) {
        this.metrics.connectionsByUser.set(socket.userId, userConnections - 1);
      } else {
        this.metrics.connectionsByUser.delete(socket.userId);
      }
    }

    this.roomManager.removeFromAllRooms(socket.id);

    logger.info(`Client disconnected: ${socket.id}`, {
      userId: socket.userId,
      reason,
      activeConnections: this.metrics.activeConnections,
    });
  }

  // Main alert broadcasting method
  async broadcastAlert(alert: SynthesizedAlert): Promise<void> {
    try {
      const rooms = this.roomManager.getRoomsForLocation(alert.location);
      let totalRecipients = 0;

      for (const room of rooms) {
        // Fix: socket.io emit doesn't return recipient count
        this.io.to(room).emit("alert:new", {
          ...alert,
          broadcastTimestamp: Date.now(),
          serverTime: new Date().toISOString(),
        });

        // Count room members instead
        const roomInstance = this.io.sockets.adapter.rooms.get(room);
        const roomSize = roomInstance ? roomInstance.size : 0;
        totalRecipients += roomSize;
      }

      logger.info(`Alert broadcasted to ${rooms.length} rooms`, {
        alertId: alert.id,
        severity: alert.severity,
        rooms: rooms.length,
        estimatedRecipients: totalRecipients,
        location: alert.location,
      });

      // Update broadcast metrics
      this.updateBroadcastMetrics(alert);
    } catch (error) {
      logger.error("Failed to broadcast alert:", error);
      throw error;
    }
  }

  // Broadcast cluster updates
  async broadcastClusterUpdate(cluster: {
    id: string;
    events: any[];
    location: { latitude: number; longitude: number; region?: string };
    severity: string;
  }): Promise<void> {
    try {
      const rooms = this.roomManager.getRoomsForLocation(cluster.location);

      for (const room of rooms) {
        this.io.to(room).emit("cluster:update", {
          ...cluster,
          broadcastTimestamp: Date.now(),
          serverTime: new Date().toISOString(),
        });
      }

      logger.debug(`Cluster update broadcasted`, {
        clusterId: cluster.id,
        rooms: rooms.length,
        eventCount: cluster.events.length,
      });
    } catch (error) {
      logger.error("Failed to broadcast cluster update:", error);
    }
  }

  // Get connection statistics
  getConnectionStats(): any {
    return {
      ...this.metrics,
      roomStats: this.roomManager.getRoomStats(),
      uptime: process.uptime(),
      timestamp: Date.now(),
    };
  }

  private updateBroadcastMetrics(alert: SynthesizedAlert): void {
    // In a production system, you'd send these to a metrics service
    logger.debug("Alert broadcast metrics", {
      alertId: alert.id,
      severity: alert.severity,
      region: alert.location.region,
      confidence: alert.confidence,
    });
  }

  private startMetricsCollection(): void {
    // Collect metrics every 30 seconds
    setInterval(() => {
      const stats = this.getConnectionStats();
      logger.debug("WebSocket metrics", stats);
    }, 30000);
  }

  // Health check
  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    return {
      healthy: true,
      details: {
        activeConnections: this.metrics.activeConnections,
        totalConnections: this.metrics.totalConnections,
        rooms: this.roomManager.getRoomStats(),
        uptime: process.uptime(),
      },
    };
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    logger.info("Shutting down WebSocket server...");

    // Notify all connected clients
    this.io.emit("server:shutdown", {
      message: "Server is shutting down for maintenance",
      timestamp: Date.now(),
    });

    // Close all connections
    this.io.close();

    logger.info("WebSocket server shutdown complete");
  }
}

export let civicSocketServer: CivicSocketServer | null = null;

export function initializeSocketServer(
  httpServer: HttpServer,
): CivicSocketServer {
  civicSocketServer = new CivicSocketServer(httpServer);
  return civicSocketServer;
}
