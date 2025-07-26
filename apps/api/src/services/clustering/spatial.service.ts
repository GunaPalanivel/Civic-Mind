import { logger } from "@/utils/logger";
import { calculateDistance } from "@civic-mind/utils";

interface CivicEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    geohash?: string;
  };
  timestamp: string;
  reporterId: string;
}

interface EventCluster {
  id: string;
  events: CivicEvent[];
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    geohash?: string;
  };
  radius: number;
  createdAt: string;
  updatedAt: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  categories: string[];
}

interface ClusterResult {
  clusters: EventCluster[];
  outliers: CivicEvent[];
  metrics: {
    totalEvents: number;
    clusteredEvents: number;
    processingTime: number;
    clusterCount: number;
  };
}

export class SpatialClusteringService {
  private static instance: SpatialClusteringService;

  public static getInstance(): SpatialClusteringService {
    if (!SpatialClusteringService.instance) {
      SpatialClusteringService.instance = new SpatialClusteringService();
    }
    return SpatialClusteringService.instance;
  }

  /**
   * Enhanced clustering method with proper distance calculation
   */
  async clusterEvents(
    events: CivicEvent[],
    radius: number = 500,
    minClusterSize: number = 3,
  ): Promise<ClusterResult> {
    const startTime = performance.now();

    try {
      logger.info(
        `Starting spatial clustering for ${events.length} events with radius ${radius}m, minClusterSize ${minClusterSize}`,
      );

      if (!events || events.length === 0) {
        return {
          clusters: [],
          outliers: [],
          metrics: {
            totalEvents: 0,
            clusteredEvents: 0,
            processingTime: performance.now() - startTime,
            clusterCount: 0,
          },
        };
      }

      const clusters: EventCluster[] = [];
      const processed = new Set<string>();
      const outliers: CivicEvent[] = [];

      // For each unprocessed event, find nearby events
      for (const event of events) {
        if (processed.has(event.id)) continue;

        // Find all events within radius of this event
        const nearbyEvents = [event]; // Include the current event

        for (const otherEvent of events) {
          if (otherEvent.id === event.id || processed.has(otherEvent.id))
            continue;

          const distance = calculateDistance(
            event.location.latitude,
            event.location.longitude,
            otherEvent.location.latitude,
            otherEvent.location.longitude,
          );

          logger.debug(
            `Distance between ${event.id} and ${otherEvent.id}: ${distance.toFixed(2)}m`,
          );

          if (distance <= radius) {
            nearbyEvents.push(otherEvent);
          }
        }

        logger.info(
          `Event ${event.id} has ${nearbyEvents.length} nearby events (including itself)`,
        );

        // If we have enough events for a cluster
        if (nearbyEvents.length >= minClusterSize) {
          const cluster = this.createCluster(nearbyEvents, radius);
          clusters.push(cluster);

          // Mark all events in this cluster as processed
          nearbyEvents.forEach((e) => processed.add(e.id));

          logger.info(
            `Created cluster ${cluster.id} with ${nearbyEvents.length} events`,
          );
        }
      }

      // Add unprocessed events as outliers
      for (const event of events) {
        if (!processed.has(event.id)) {
          outliers.push(event);
          logger.info(`Event ${event.id} added as outlier`);
        }
      }

      const processingTime = performance.now() - startTime;

      const result: ClusterResult = {
        clusters,
        outliers,
        metrics: {
          totalEvents: events.length,
          clusteredEvents: events.length - outliers.length,
          processingTime,
          clusterCount: clusters.length,
        },
      };

      logger.info(`Spatial clustering completed`, {
        totalEvents: events.length,
        clusters: result.clusters.length,
        clusteredEvents: result.metrics.clusteredEvents,
        outliers: result.outliers.length,
        processingTime: `${processingTime.toFixed(2)}ms`,
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Clustering failed", {
        error: err.message,
        eventCount: events.length,
        radius,
        minClusterSize,
      });
      throw new Error(`Failed to cluster events: ${err.message}`);
    }
  }

  private createCluster(events: CivicEvent[], radius: number): EventCluster {
    // Calculate cluster center (centroid)
    const centerLat =
      events.reduce((sum, e) => sum + e.location.latitude, 0) / events.length;
    const centerLng =
      events.reduce((sum, e) => sum + e.location.longitude, 0) / events.length;

    // Determine cluster severity (highest severity wins)
    const severityLevels = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
    const maxSeverity = events.reduce(
      (max, event) => {
        return severityLevels[event.severity] > severityLevels[max]
          ? event.severity
          : max;
      },
      "LOW" as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    );

    // Get unique categories
    const categories = [...new Set(events.map((e) => e.category))];

    // Generate cluster address
    const address = this.generateClusterAddress(events);

    return {
      id: `cluster-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      events: events.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      ),
      location: {
        latitude: centerLat,
        longitude: centerLng,
        address,
      },
      radius,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      severity: maxSeverity,
      categories,
    };
  }

  private generateClusterAddress(events: CivicEvent[]): string {
    const addresses = events
      .map((e) => e.location.address)
      .filter((addr) => addr && addr.length > 0);

    if (addresses.length === 0) {
      // Generate address from coordinates
      const centerLat =
        events.reduce((sum, e) => sum + e.location.latitude, 0) / events.length;
      const centerLng =
        events.reduce((sum, e) => sum + e.location.longitude, 0) /
        events.length;
      return `Area near ${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}`;
    }

    // Find common address parts
    const addressParts = addresses.map((addr) => addr!.split(",")[0]); // Take first part
    const mostCommon = this.findMostCommon(addressParts);

    return mostCommon || addresses[0] || "Clustered Area";
  }

  private findMostCommon<T>(arr: T[]): T | null {
    const counts = arr.reduce((acc, item) => {
      acc.set(item, (acc.get(item) || 0) + 1);
      return acc;
    }, new Map<T, number>());

    let maxCount = 0;
    let mostCommon: T | null = null;

    for (const [item, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = item;
      }
    }

    return mostCommon;
  }

  private determineClusterSeverity(
    events: CivicEvent[],
  ): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
    const severityLevels = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
    const maxSeverity = events.reduce(
      (max, event) => {
        return severityLevels[event.severity] > severityLevels[max]
          ? event.severity
          : max;
      },
      "LOW" as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    );

    return maxSeverity;
  }
}

export const spatialClusteringService = SpatialClusteringService.getInstance();
