import { FastifyRequest } from "fastify";
import { auth } from "@/config/firebase";
import { DecodedIdToken } from "firebase-admin/auth";
import { logger } from "@/utils/logger";
import { config } from "@/config/environment";

export interface AuthenticatedRequest extends FastifyRequest {
  user?: DecodedIdToken;
}

// Define proper types for roles and permissions
type UserRole = "admin" | "moderator" | "user";
type PermissionAction = "create" | "read" | "update" | "delete";
type ResourceType = "reports" | "alerts" | "users";

interface PermissionMatrix {
  admin: string[];
  moderator: string[];
  user: string[];
}

export class AuthService {
  private static instance: AuthService;

  // Define permission matrix with proper typing
  private readonly permissions: PermissionMatrix = {
    admin: ["*"],
    moderator: [
      "reports:read",
      "reports:update",
      "reports:delete",
      "alerts:create",
      "alerts:update",
    ],
    user: ["reports:create", "reports:read", "alerts:read"],
  };

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

      // In development mode without Firebase, create mock user
      if (config.nodeEnv === "development" && !auth) {
        return this.createMockUser(cleanToken);
      }

      return await auth.verifyIdToken(cleanToken);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Token verification failed:", err.message);
      throw new Error(`Token verification failed: ${err.message}`);
    }
  }

  private createMockUser(_token: string): DecodedIdToken {
    // Mock user for development - prefix unused parameter with underscore
    return {
      uid: "dev-user-123",
      email: "developer@civic-mind.com",
      name: "Development User",
      aud: "civic-mind-dev",
      auth_time: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      firebase: {
        identities: {
          email: ["developer@civic-mind.com"],
        },
        sign_in_provider: "custom",
      },
      iat: Math.floor(Date.now() / 1000),
      iss: "https://securetoken.google.com/civic-mind-dev",
      sub: "dev-user-123",
    } as DecodedIdToken;
  }

  // Type guard to ensure role is valid
  private isValidRole(role: any): role is UserRole {
    return (
      typeof role === "string" && ["admin", "moderator", "user"].includes(role)
    );
  }

  // Safe role extraction with fallback
  private extractUserRole(customClaims: Record<string, any>): UserRole {
    const role = customClaims?.role;
    return this.isValidRole(role) ? role : "user";
  }

  async validatePermissions(
    uid: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    try {
      // In development mode, allow all permissions
      if (config.nodeEnv === "development") {
        logger.debug(
          `Development mode: allowing ${action} on ${resource} for ${uid}`,
        );
        return true;
      }

      const user = await auth.getUser(uid);
      const customClaims = user.customClaims || {};

      // Type-safe role extraction
      const userRole: UserRole = this.extractUserRole(customClaims);

      // Now TypeScript knows userRole is a valid key
      const userPermissions = this.permissions[userRole];
      const requiredPermission = `${resource}:${action}`;

      const hasPermission =
        userPermissions.includes("*") ||
        userPermissions.includes(requiredPermission);

      logger.debug(
        `Permission check for ${uid}: ${requiredPermission} = ${hasPermission} (role: ${userRole})`,
      );
      return hasPermission;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Permission validation error:", err.message);
      return false;
    }
  }

  // Enhanced permission check with resource and action validation
  async hasPermission(
    uid: string,
    resource: ResourceType,
    action: PermissionAction,
  ): Promise<boolean> {
    return this.validatePermissions(uid, resource, action);
  }

  // Create custom token for testing
  async createCustomToken(uid: string, claims?: object): Promise<string> {
    if (config.nodeEnv === "development") {
      // Return a simple mock token for development
      return `dev-token-${uid}-${Date.now()}`;
    }

    return await auth.createCustomToken(uid, claims);
  }

  // Set custom claims for user roles with type safety
  async setUserRole(uid: string, role: UserRole): Promise<void> {
    if (config.nodeEnv === "development") {
      logger.info(`Development mode: would set role ${role} for user ${uid}`);
      return;
    }

    // Validate role before setting
    if (!this.isValidRole(role)) {
      throw new Error(
        `Invalid role: ${role}. Must be one of: admin, moderator, user`,
      );
    }

    await auth.setCustomUserClaims(uid, { role });
    logger.info(`Set role ${role} for user ${uid}`);
  }

  // Get user role safely
  async getUserRole(uid: string): Promise<UserRole> {
    try {
      if (config.nodeEnv === "development") {
        return "user"; // Default role in development
      }

      const user = await auth.getUser(uid);
      const customClaims = user.customClaims || {};
      return this.extractUserRole(customClaims);
    } catch (error) {
      logger.error(`Failed to get user role for ${uid}:`, error);
      return "user"; // Safe fallback
    }
  }

  // List all permissions for a role
  getPermissionsForRole(role: UserRole): string[] {
    return [...this.permissions[role]]; // Return copy to prevent mutation
  }
}

export const authService = AuthService.getInstance();
