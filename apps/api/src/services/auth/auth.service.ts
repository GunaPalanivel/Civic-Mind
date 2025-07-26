import { FastifyRequest } from "fastify";
import { auth } from "@/config/firebase";
import { DecodedIdToken } from "firebase-admin/auth";

export interface AuthenticatedRequest extends FastifyRequest {
  user?: DecodedIdToken;
}

export class AuthService {
  private static instance: AuthService;

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async verifyToken(token: string): Promise<DecodedIdToken> {
    try {
      // Remove 'Bearer ' prefix if present
      const cleanToken = token.replace(/^Bearer\s+/, "");
      return await auth.verifyIdToken(cleanToken);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Token verification failed: ${message}`);
    }
  }

  async validatePermissions(
    uid: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    try {
      const user = await auth.getUser(uid);
      const customClaims = user.customClaims || {};

      // Basic role-based access control
      const userRole = customClaims.role || "user";

      // Define permission matrix
      const permissions = {
        admin: ["*"],
        moderator: ["reports:read", "reports:update", "alerts:create"],
        user: ["reports:create", "reports:read"],
      };

      const userPermissions =
        permissions[userRole as keyof typeof permissions] || permissions.user;
      const requiredPermission = `${resource}:${action}`;

      return (
        userPermissions.includes("*") ||
        userPermissions.includes(requiredPermission)
      );
    } catch (error) {
      console.error("Permission validation error:", error);
      return false;
    }
  }

  // Create custom token for testing
  async createCustomToken(uid: string, claims?: object): Promise<string> {
    return await auth.createCustomToken(uid, claims);
  }
}

export const authService = AuthService.getInstance();
