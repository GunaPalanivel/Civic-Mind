import { PubSub, Topic } from "@google-cloud/pubsub";
import { TokenBucket, RateLimitError } from "../utils/rate-limiter";
import { db } from "@/services/database/collections";
import { logger } from "@/utils/logger";
import { config } from "@/config/environment";
import { generateGeohash, generateId } from "@civic-mind/utils";
import { z } from "zod";

// Input validation schema
const CivicReportInputSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(1000),
  category: z.enum([
    "traffic",
    "infrastructure",
    "safety",
    "environment",
    "utilities",
    "other",
  ]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().optional(),
  }),
  reporterId: z.string(),
  mediaUrls: z.array(z.string().url()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
});

export type CivicReportInput = z.infer<typeof CivicReportInputSchema>;

interface EnrichedReport extends CivicReportInput {
  id: string;
  timestamp: string;
  correlationId: string;
  location: CivicReportInput["location"] & {
    geohash: string;
    region?: string;
  };
  metadata: {
    source: string;
    ipAddress?: string;
    userAgent?: string;
    processingTime: number;
  };
}

export class ReportIngestionService {
  private static instance: ReportIngestionService;
  private pubsub?: PubSub;
  private topics: Map<string, Topic> = new Map();
  private readonly rateLimiter = new TokenBucket(100, "per-second");
  private readonly globalRateLimiter = new TokenBucket(1000, "per-minute");
  private readonly isProductionMode: boolean;

  constructor() {
    this.isProductionMode = config.nodeEnv === "production";
    this.initializePubSub();
  }

  public static getInstance(): ReportIngestionService {
    if (!ReportIngestionService.instance) {
      ReportIngestionService.instance = new ReportIngestionService();
    }
    return ReportIngestionService.instance;
  }

  private initializePubSub(): void {
    try {
      if (this.isProductionMode && process.env.GCP_PROJECT_ID) {
        this.pubsub = new PubSub({
          projectId: process.env.GCP_PROJECT_ID,
        });
        logger.info("Pub/Sub initialized for production");
      } else {
        logger.info("Pub/Sub running in mock mode for development");
      }
    } catch (error) {
      logger.error("Failed to initialize Pub/Sub:", error);
      // Don't throw - fall back to mock mode
    }
  }

  async ingestReport(
    report: CivicReportInput,
    metadata: {
      source?: string;
      ipAddress?: string;
      userAgent?: string;
    } = {},
  ): Promise<EnrichedReport> {
    const startTime = performance.now();

    try {
      // Global rate limiting
      if (!(await this.globalRateLimiter.consume(1))) {
        throw new RateLimitError(
          "Global rate limit exceeded. Please try again later.",
        );
      }

      // Per-user rate limiting
      if (!(await this.rateLimiter.consume(1))) {
        throw new RateLimitError("Too many requests. Please slow down.");
      }

      logger.info(`Starting report ingestion for user ${report.reporterId}`);

      // Input validation
      const validatedReport = await this.validateReport(report);

      // Enrich with metadata
      const enrichedReport = await this.enrichReport(
        validatedReport,
        metadata,
        startTime,
      );

      // Publish to Pub/Sub (async)
      this.publishEvent("civic.events.new", enrichedReport).catch((error) => {
        logger.error("Failed to publish event to Pub/Sub:", error);
      });

      // Store in database
      await this.storeReport(enrichedReport);

      logger.info(`Report ingestion completed`, {
        reportId: enrichedReport.id,
        processingTime: `${enrichedReport.metadata.processingTime.toFixed(2)}ms`,
        category: enrichedReport.category,
        severity: enrichedReport.severity,
      });

      return enrichedReport;
    } catch (error) {
      const processingTime = performance.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));

      logger.error("Report ingestion failed", {
        error: err.message,
        reporterId: report.reporterId,
        processingTime: `${processingTime.toFixed(2)}ms`,
      });

      throw err;
    }
  }

  private async validateReport(
    report: CivicReportInput,
  ): Promise<CivicReportInput> {
    try {
      const validated = CivicReportInputSchema.parse(report);

      // Additional business logic validation
      if (validated.mediaUrls && validated.mediaUrls.length > 10) {
        throw new Error("Maximum 10 media URLs allowed per report");
      }

      if (validated.tags && validated.tags.length > 20) {
        throw new Error("Maximum 20 tags allowed per report");
      }

      return validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");
        throw new Error(`Validation failed: ${errorMessage}`);
      }
      throw error;
    }
  }

  private async enrichReport(
    report: CivicReportInput,
    metadata: any,
    startTime: number,
  ): Promise<EnrichedReport> {
    const reportId = generateId();
    const correlationId = `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Generate geohash for spatial indexing
    const geohash = generateGeohash(
      report.location.latitude,
      report.location.longitude,
      8,
    );

    // Determine region based on coordinates (simplified)
    const region = this.determineRegion(
      report.location.latitude,
      report.location.longitude,
    );

    const enriched: EnrichedReport = {
      ...report,
      id: reportId,
      timestamp: new Date().toISOString(),
      correlationId,
      location: {
        ...report.location,
        geohash,
        region,
      },
      metadata: {
        source: metadata.source || "web",
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        processingTime: performance.now() - startTime,
      },
    };

    return enriched;
  }

  private determineRegion(lat: number, lng: number): string {
    // Simplified region determination - in production, use proper geocoding
    if (lat >= 12.8 && lat <= 13.2 && lng >= 77.4 && lng <= 77.8) {
      return "bangalore-central";
    } else if (lat >= 12.7 && lat <= 13.3 && lng >= 77.3 && lng <= 77.9) {
      return "bangalore-metro";
    } else {
      return "unknown";
    }
  }

  private async publishEvent(
    topicName: string,
    data: EnrichedReport,
  ): Promise<void> {
    if (!this.pubsub) {
      logger.debug(`Mock Pub/Sub: would publish to ${topicName}`, {
        reportId: data.id,
        correlationId: data.correlationId,
      });
      return;
    }

    try {
      // Get or create topic
      let topic = this.topics.get(topicName);
      if (!topic) {
        topic = this.pubsub.topic(topicName);

        // Ensure topic exists
        const [exists] = await topic.exists();
        if (!exists) {
          await topic.create();
          logger.info(`Created Pub/Sub topic: ${topicName}`);
        }

        this.topics.set(topicName, topic);
      }

      // Publish message
      const messageId = await topic.publishMessage({
        data: Buffer.from(JSON.stringify(data)),
        attributes: {
          correlationId: data.correlationId,
          timestamp: data.timestamp,
          reportId: data.id,
          category: data.category,
          severity: data.severity,
          region: data.location.region || "unknown",
        },
      });

      logger.debug("Event published to Pub/Sub", {
        messageId,
        topic: topicName,
        reportId: data.id,
      });
    } catch (error) {
      logger.error("Failed to publish to Pub/Sub:", error);
      // Don't throw - this is fire-and-forget
    }
  }

  private async storeReport(report: EnrichedReport): Promise<void> {
    try {
      if (!db.civicEvents) {
        logger.warn("Database not available, skipping storage");
        return;
      }

      await db.civicEvents.doc(report.id).set({
        ...report,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      logger.debug(`Report stored in database: ${report.id}`);
    } catch (error) {
      logger.error("Failed to store report in database:", error);
      throw new Error("Failed to persist report");
    }
  }

  // Health check and metrics
  async getIngestionStats(): Promise<{
    rateLimiter: any;
    globalRateLimiter: any;
    pubsubStatus: string;
    activeTopics: string[];
  }> {
    return {
      rateLimiter: this.rateLimiter.getStatus(),
      globalRateLimiter: this.globalRateLimiter.getStatus(),
      pubsubStatus: this.pubsub ? "connected" : "mock",
      activeTopics: Array.from(this.topics.keys()),
    };
  }

  // Cleanup method
  async shutdown(): Promise<void> {
    if (this.pubsub) {
      await this.pubsub.close();
      logger.info("Pub/Sub connection closed");
    }
  }
}

export const reportIngestionService = ReportIngestionService.getInstance();
