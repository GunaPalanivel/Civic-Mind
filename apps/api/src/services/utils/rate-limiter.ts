import { logger } from "@/utils/logger";

export interface TokenBucketOptions {
  capacity: number;
  refillRate: number;
  interval: "per-second" | "per-minute" | "per-hour";
}

export class TokenBucket {
  private tokens: number;
  private readonly capacity: number;
  private readonly refillRate: number;
  private readonly refillInterval: number;
  private lastRefill: number;

  constructor(
    capacity: number,
    interval: "per-second" | "per-minute" | "per-hour" = "per-second",
  ) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = capacity;
    this.lastRefill = Date.now();

    // Convert interval to milliseconds
    this.refillInterval = {
      "per-second": 1000,
      "per-minute": 60000,
      "per-hour": 3600000,
    }[interval];
  }

  async consume(tokens: number = 1): Promise<boolean> {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      logger.debug(
        `Rate limiter: consumed ${tokens} tokens, ${this.tokens} remaining`,
      );
      return true;
    }

    logger.warn(
      `Rate limiter: insufficient tokens. Requested: ${tokens}, Available: ${this.tokens}`,
    );
    return false;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;

    if (timePassed >= this.refillInterval) {
      const intervalsElapsed = Math.floor(timePassed / this.refillInterval);
      const tokensToAdd = intervalsElapsed * this.refillRate;

      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;

      if (tokensToAdd > 0) {
        logger.debug(
          `Rate limiter: refilled ${tokensToAdd} tokens, total: ${this.tokens}`,
        );
      }
    }
  }

  getStatus(): { tokens: number; capacity: number; percentage: number } {
    this.refill();
    return {
      tokens: this.tokens,
      capacity: this.capacity,
      percentage: Math.round((this.tokens / this.capacity) * 100),
    };
  }
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}
