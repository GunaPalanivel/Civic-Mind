import admin from "firebase-admin";
import { Firestore } from "@google-cloud/firestore";
import { config } from "./environment";
import { logger } from "@/utils/logger";

class FirebaseService {
  private static instance: FirebaseService;
  public firestore!: Firestore; // Definite assignment assertion
  public auth!: admin.auth.Auth; // Definite assignment assertion
  private initialized = false;

  private constructor() {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    try {
      if (!admin.apps.length) {
        // For development, use project ID only (works with emulators)
        if (config.nodeEnv === "development") {
          admin.initializeApp({
            projectId: config.firebase.projectId || "civic-mind-dev",
          });
        } else {
          // Production: use service account
          const serviceAccount = require(config.firebase.serviceAccountPath);
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: config.firebase.projectId,
            storageBucket: `${config.firebase.projectId}.appspot.com`,
          });
        }
      }

      // Initialize properties after admin is set up
      this.firestore = admin.firestore();
      this.auth = admin.auth();

      // Configure Firestore settings
      this.firestore.settings({
        timestampsInSnapshots: true,
      });

      this.initialized = true;
      logger.info("Firebase initialized successfully");
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Firebase initialization failed:", err.message);
      // Don't throw in development mode
      if (config.nodeEnv !== "development") {
        throw err;
      }
    }
  }

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  // Health check method
  public async healthCheck(): Promise<boolean> {
    if (!this.initialized) return false;

    try {
      // Simple test query
      await this.firestore.collection("_health").limit(1).get();
      return true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Firebase health check failed:", err.message);
      return false;
    }
  }

  // Mock mode for development without Firebase
  public enableMockMode(): void {
    logger.info("Firebase running in mock mode for development");
    this.initialized = true;
  }
}

export const firebaseService = FirebaseService.getInstance();
export const firestore = firebaseService.firestore;
export const auth = firebaseService.auth;
