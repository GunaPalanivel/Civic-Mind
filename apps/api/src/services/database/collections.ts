import { firestore } from "@/config/firebase";
import { CollectionReference, DocumentData } from "@google-cloud/firestore";
import { logger } from "@/utils/logger";
import { v4 as uuidv4 } from "uuid";

// Define collection names as constants
export const COLLECTIONS = {
  CIVIC_EVENTS: "civic_events",
  SPATIAL_CLUSTERS: "spatial_clusters",
  ALERTS: "alerts",
  USERS: "users",
  REPORTS: "reports",
} as const;

// Type-safe collection references
class DatabaseCollections {
  public readonly civicEvents!: CollectionReference<DocumentData>; // Definite assignment assertion
  public readonly spatialClusters!: CollectionReference<DocumentData>;
  public readonly alerts!: CollectionReference<DocumentData>;
  public readonly users!: CollectionReference<DocumentData>;
  public readonly reports!: CollectionReference<DocumentData>;

  constructor() {
    if (firestore) {
      // Initialize all collection references
      (this as any).civicEvents = firestore.collection(
        COLLECTIONS.CIVIC_EVENTS,
      );
      (this as any).spatialClusters = firestore.collection(
        COLLECTIONS.SPATIAL_CLUSTERS,
      );
      (this as any).alerts = firestore.collection(COLLECTIONS.ALERTS);
      (this as any).users = firestore.collection(COLLECTIONS.USERS);
      (this as any).reports = firestore.collection(COLLECTIONS.REPORTS);
    } else {
      // Mock collections for development
      logger.warn("Using mock database collections - Firebase not available");
    }
  }

  // Initialize database with test data
  public async initializeDatabase(): Promise<void> {
    try {
      logger.info("Initializing database collections and indexes...");

      if (!firestore) {
        await this.createMockData();
        return;
      }

      await this.createGeoIndexes();
      await this.seedInitialData();
      logger.info("✅ Database initialization complete");
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Database initialization failed:", err.message);
    }
  }

  private async createGeoIndexes(): Promise<void> {
    // Document required Firestore indexes
    logger.info("Required Firestore indexes (create in Firebase Console):");
    logger.info("1. civic_events: [location.geohash ASC, timestamp DESC]");
    logger.info("2. spatial_clusters: [location.geohash ASC, updatedAt DESC]");
    logger.info(
      "3. alerts: [severity ASC, createdAt DESC, location.geohash ASC]",
    );
    logger.info("4. reports: [reporterId ASC, timestamp DESC]");
  }

  private async seedInitialData(): Promise<void> {
    try {
      const eventsSnapshot = await this.civicEvents.limit(1).get();

      if (eventsSnapshot.empty) {
        logger.info("Seeding initial test data...");

        const testEvents = [
          {
            id: uuidv4(),
            title: "Traffic Congestion - MG Road",
            description: "Heavy traffic reported due to road construction",
            category: "traffic",
            severity: "MEDIUM",
            location: {
              latitude: 12.9716,
              longitude: 77.5946,
              address: "MG Road, Bangalore, Karnataka",
              area: "MG Road",
              city: "Bangalore",
              region: "Karnataka",
              geohash: "tdr1u4qq",
            },
            timestamp: new Date().toISOString(),
            reporterId: "system",
            verified: false,
            tags: ["traffic", "construction", "congestion"],
            mediaUrls: [],
          },
          {
            id: uuidv4(),
            title: "Pothole on Brigade Road",
            description: "Large pothole causing vehicle damage",
            category: "infrastructure",
            severity: "HIGH",
            location: {
              latitude: 12.9698,
              longitude: 77.6055,
              address: "Brigade Road, Bangalore, Karnataka",
              area: "Brigade Road",
              city: "Bangalore",
              region: "Karnataka",
              geohash: "tdr1u7bb",
            },
            timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            reporterId: "system",
            verified: true,
            tags: ["infrastructure", "pothole", "road-damage"],
            mediaUrls: [],
          },
        ];

        for (const event of testEvents) {
          await this.civicEvents.doc(event.id).set(event);
        }

        logger.info(`✅ Seeded ${testEvents.length} test events`);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Failed to seed initial data:", err.message);
    }
  }

  private async createMockData(): Promise<void> {
    logger.info("Creating mock data for development mode");
    // In development without Firebase, you could store in memory or use a local JSON file
    // This is handled by the API routes returning mock data
  }
}

export const db = new DatabaseCollections();
