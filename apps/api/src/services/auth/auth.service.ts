import { FastifyRequest } from "fastify";
import { auth } from "@/config/firebase";
import { DecodedIdToken } from "firebase-admin/auth";
import { logger } from "@/utils/logger";
import { config } from "@/config/environment";
import { UnauthorizedError, ForbiddenError } from "@/utils/errors";

// Fix: Extend FastifyRequest instead of creating standalone interface
export interface AuthenticatedRequest extends FastifyRequest {
  user?: DecodedIdToken;
}

// Enhanced permission system
export type UserRole = "admin" | "moderator" | "analyst" | "user";
export type ResourceType =
  | "reports"
  | "alerts"
  | "clusters"
  | "users"
  | "analytics";
export type ActionType =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "analyze"
  | "moderate";

interface PermissionMatrix {
  [key: string]: string[];
}

interface UserClaims {
  role?: UserRole;
  permissions?: string[];
  region?: string;
  organization?: string;
}

export class AuthService {
  private static instance: AuthService;
  private readonly permissionMatrix: PermissionMatrix;

  private constructor() {
    // Comprehensive permission matrix
    this.permissionMatrix = {
      admin: ["*"], // Full access
      moderator: [
        "reports:read",
        "reports:update",
        "reports:delete",
        "reports:moderate",
        "alerts:read",
        "alerts:create",
        "alerts:update",
        "alerts:delete",
        "clusters:read",
        "clusters:analyze",
        "users:read",
        "analytics:read",
      ],
      analyst: [
        "reports:read",
        "reports:analyze",
        "alerts:read",
        "alerts:analyze",
        "clusters:read",
        "clusters:analyze",
        "analytics:read",
        "analytics:create",
      ],
      user: ["reports:create", "reports:read", "alerts:read", "clusters:read"],
    };
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async verifyToken(authToken: string): Promise<DecodedIdToken> {
    try {
      const cleanToken = authToken.replace(/^Bearer\s+/, "");

      // Development mode mock
      if (config.nodeEnv === "development" && !auth) {
        return this.createMockUser(cleanToken);
      }

      const decodedToken = await auth.verifyIdToken(cleanToken);

      // Enhanced token validation
      await this.validateTokenClaims(decodedToken);

      logger.info("Token verified successfully", {
        uid: decodedToken.uid,
        email: decodedToken.email,
        provider: decodedToken.firebase.sign_in_provider,
      });

      return decodedToken;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Token verification failed:", {
        error: err.message,
        stack: err.stack,
      });
      throw new UnauthorizedError("Invalid authentication token", {
        reason: err.message,
      });
    }
  }

  private async validateTokenClaims(
    decodedToken: DecodedIdToken,
  ): Promise<void> {
    // Check token expiration
    const now = Math.floor(Date.now() / 1000);
    if (decodedToken.exp < now) {
      throw new UnauthorizedError("Token has expired");
    }

    // Check if token is too old (issued more than 24 hours ago)
    if (now - decodedToken.iat > 86400) {
      throw new UnauthorizedError("Token is too old, please re-authenticate");
    }

    // Validate audience
    if (decodedToken.aud !== config.firebase.projectId) {
      throw new UnauthorizedError("Invalid token audience");
    }
  }

  async validatePermissions(
    uid: string,
    resource: ResourceType,
    action: ActionType,
    context?: { organizationCheck?: boolean; regionCheck?: string },
  ): Promise<boolean> {
    try {
      // Development mode - allow all permissions
      if (config.nodeEnv === "development") {
        logger.debug(
          `Development mode: allowing ${action} on ${resource} for ${uid}`,
        );
        return true;
      }

      const user = await auth.getUser(uid);
      const customClaims = (user.customClaims || {}) as UserClaims;

      // Extract user role
      const userRole = this.extractUserRole(customClaims);

      // Check basic role permissions
      const hasBasicPermission = this.checkRolePermission(
        userRole,
        resource,
        action,
      );
      if (!hasBasicPermission) {
        logger.warn("Permission denied", {
          uid,
          role: userRole,
          resource,
          action,
          reason: "insufficient_role_permissions",
        });
        throw new ForbiddenError("Insufficient permissions", {
          uid,
          role: userRole,
          resource,
          action,
        });
      }

      // Additional context-based validations
      if (context?.organizationCheck && customClaims.organization) {
        // Organization-based access control can be implemented here
      }

      if (context?.regionCheck && customClaims.region) {
        const hasRegionAccess =
          customClaims.region === context.regionCheck || userRole === "admin";
        if (!hasRegionAccess) {
          logger.warn("Region access denied", {
            uid,
            userRegion: customClaims.region,
            requestedRegion: context.regionCheck,
          });
          throw new ForbiddenError("Region access denied", {
            uid,
            userRegion: customClaims.region,
            requestedRegion: context.regionCheck,
          });
        }
      }

      logger.debug("Permission granted", {
        uid,
        role: userRole,
        resource,
        action,
      });

      return true;
    } catch (error: unknown) {
      if (error instanceof ForbiddenError) {
        throw error; // Re-throw permission errors
      }

      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Permission validation error:", {
        uid,
        resource,
        action,
        error: err.message,
      });
      return false;
    }
  }

  private extractUserRole(claims: UserClaims): UserRole {
    const role = claims.role;
    const validRoles: UserRole[] = ["admin", "moderator", "analyst", "user"];
    return validRoles.includes(role as UserRole) ? (role as UserRole) : "user";
  }

  private checkRolePermission(
    role: UserRole,
    resource: ResourceType,
    action: ActionType,
  ): boolean {
    const userPermissions =
      this.permissionMatrix[role] || this.permissionMatrix.user;
    const requiredPermission = `${resource}:${action}`;

    return (
      userPermissions.includes("*") ||
      userPermissions.includes(requiredPermission)
    );
  }

  async setUserRole(
    uid: string,
    role: UserRole,
    additionalClaims?: Partial<UserClaims>,
  ): Promise<void> {
    if (config.nodeEnv === "development") {
      logger.info(`Development mode: would set role ${role} for user ${uid}`);
      return;
    }

    const claims: UserClaims = {
      role,
      ...additionalClaims,
    };

    await auth.setCustomUserClaims(uid, claims);
    logger.info("User role updated", { uid, role, claims });
  }

  async getUserRole(uid: string): Promise<UserRole> {
    try {
      if (config.nodeEnv === "development") {
        return "user";
      }

      const user = await auth.getUser(uid);
      const customClaims = (user.customClaims || {}) as UserClaims;
      return this.extractUserRole(customClaims);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to get user role for ${uid}:`, err.message);
      return "user";
    }
  }

  // Enhanced mock user for development
  private createMockUser(_cleanToken: string): DecodedIdToken {
    const mockRoles: UserRole[] = ["admin", "moderator", "analyst", "user"];
    const randomRole = mockRoles[Math.floor(Math.random() * mockRoles.length)];

    return {
      uid: `dev-user-${Date.now()}`,
      email: `dev-${randomRole}@civic-mind.com`,
      name: `Development ${randomRole.charAt(0).toUpperCase() + randomRole.slice(1)}`,
      aud: config.firebase.projectId || "civic-mind-dev",
      auth_time: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      firebase: {
        identities: { email: [`dev-${randomRole}@civic-mind.com`] },
        sign_in_provider: "custom",
      },
      iat: Math.floor(Date.now() / 1000),
      iss: `https://securetoken.google.com/${config.firebase.projectId || "civic-mind-dev"}`,
      sub: `dev-user-${Date.now()}`,
      // Mock custom claims
      role: randomRole,
      organization: "civic-mind-dev",
      region: "dev-region",
    } as any;
  }

  // Batch permission check for performance
  async validateMultiplePermissions(
    uid: string,
    permissions: Array<{ resource: ResourceType; action: ActionType }>,
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const { resource, action } of permissions) {
      const key = `${resource}:${action}`;
      results[key] = await this.validatePermissions(uid, resource, action);
    }

    return results;
  }

  createAuthMiddleware(requiredPermission?: {
    resource: string;
    action: string;
  }) {
    return async (request: AuthenticatedRequest, reply: any) => {
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
            const user = await this.verifyToken(authHeader);
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
        const user = await this.verifyToken(authHeader);
        request.user = user;
        logger.info(`Authenticated user: ${user.uid}`);

        // Check specific permission if required
        if (requiredPermission) {
          const hasPermission = await this.validatePermissions(
            user.uid,
            requiredPermission.resource as any,
            requiredPermission.action as any,
          );

          if (!hasPermission) {
            return reply.code(403).send({
              success: false,
              error: "Insufficient permissions",
              code: "FORBIDDEN",
              timestamp: new Date().toISOString(),
            });
          }
        }
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
    };
  }
}

export const authService = AuthService.getInstance();
