import admin from "firebase-admin";
import { Firestore } from "@google-cloud/firestore";
import { config } from "./environment";

class FirebaseService {
  private static instance: FirebaseService;
  public firestore: Firestore;
  public auth: admin.auth.Auth;

  private constructor() {
    if (!admin.apps.length) {
      // Initialize with service account
      const serviceAccount = require(config.firebase.serviceAccountPath);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: config.firebase.projectId,
        storageBucket: `${config.firebase.projectId}.appspot.com`,
      });
    }

    this.firestore = admin.firestore();
    this.auth = admin.auth();

    // Configure Firestore settings
    this.firestore.settings({
      timestampsInSnapshots: true,
    });
  }

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  // Health check method
  public async healthCheck(): Promise<boolean> {
    try {
      await this.firestore.collection("_health").limit(1).get();
      return true;
    } catch (error) {
      console.error("Firebase health check failed:", error);
      return false;
    }
  }
}

export const firebaseService = FirebaseService.getInstance();
export const firestore = firebaseService.firestore;
export const auth = firebaseService.auth;
