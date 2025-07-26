import { firestore } from "@/config/firebase";
import { CollectionReference, DocumentData } from "@google-cloud/firestore";

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
  public readonly civicEvents: CollectionReference<DocumentData>;
  public readonly spatialClusters: CollectionReference<DocumentData>;
  public readonly alerts: CollectionReference<DocumentData>;
  public readonly users: CollectionReference<DocumentData>;
  public readonly reports: CollectionReference<DocumentData>;

  constructor() {
    this.civicEvents = firestore.collection(COLLECTIONS.CIVIC_EVENTS);
    this.spatialClusters = firestore.collection(COLLECTIONS.SPATIAL_CLUSTERS);
    this.alerts = firestore.collection(COLLECTIONS.ALERTS);
    this.users = firestore.collection(COLLECTIONS.USERS);
    this.reports = firestore.collection(COLLECTIONS.REPORTS);
  }

  // Initialize indexes and setup
  public async initializeDatabase(): Promise<void> {
    console.log("Initializing database collections and indexes...");

    // Create composite indexes programmatically
    await this.createGeoIndexes();
    await this.seedInitialData();
  }

  private async createGeoIndexes(): Promise<void> {
    // Note: Firestore indexes are typically created via Firebase console or CLI
    // This method documents the required indexes
    console.log("Required Firestore indexes:");
    console.log("- civic_events: [location.geohash, timestamp]");
    console.log("- spatial_clusters: [location.geohash, updatedAt]");
    console.log("- alerts: [severity, createdAt, location.geohash]");
  }

  private async seedInitialData(): Promise<void> {
    // Create initial test data if collections are empty
    const eventsSnapshot = await this.civicEvents.limit(1).get();

    if (eventsSnapshot.empty) {
      console.log("Seeding initial test data...");

      const testEvent = {
        id: "test-event-1",
        title: "Test Traffic Incident",
        description: "Sample traffic incident for testing",
        category: "traffic",
        severity: "MEDIUM",
        location: {
          latitude: 12.9716,
          longitude: 77.5946,
          address: "Bangalore, Karnataka",
          geohash: "tdr1u4qq",
        },
        timestamp: new Date().toISOString(),
        reporterId: "system",
        verified: false,
        tags: ["test", "traffic"],
      };

      await this.civicEvents.doc("test-event-1").set(testEvent);
      console.log("✅ Test data seeded successfully");
    }
  }
}

export const db = new DatabaseCollections();
