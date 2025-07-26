import { logger } from "@/utils/logger";

export interface CircuitBreakerOptions {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  expectedErrors?: (_error: Error) => boolean;
}

export enum CircuitState {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN",
}

interface CircuitBreakerStats {
  failures: number;
  successes: number;
  requests: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private stats: CircuitBreakerStats = {
    failures: 0,
    successes: 0,
    requests: 0,
  };

  constructor(private _options: CircuitBreakerOptions) {
    this.startMonitoring();
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        logger.info("Circuit breaker transitioning to HALF_OPEN state");
      } else {
        throw new Error("Circuit breaker is OPEN - operation blocked");
      }
    }

    return this.executeOperation(operation);
  }

  private async executeOperation<T>(operation: () => Promise<T>): Promise<T> {
    this.stats.requests++;

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  private onSuccess(): void {
    this.stats.failures = 0;
    this.stats.successes++;
    this.stats.lastSuccessTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.CLOSED;
      logger.info(
        "Circuit breaker reset to CLOSED state after successful operation",
      );
    }
  }

  private onFailure(error: Error): void {
    this.stats.failures++;
    this.stats.lastFailureTime = Date.now();

    // Check if this is an expected error that shouldn't trip the circuit
    if (this._options.expectedErrors && this._options.expectedErrors(error)) {
      logger.debug(
        "Expected error encountered, not counting towards circuit breaker",
      );
      return;
    }

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      logger.warn("Circuit breaker opened due to failure in HALF_OPEN state");
    } else if (this.stats.failures >= this._options.failureThreshold) {
      this.state = CircuitState.OPEN;
      logger.warn(
        `Circuit breaker opened due to ${this.stats.failures} failures`,
      );
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.stats.lastFailureTime) return false;

    const timeSinceLastFailure = Date.now() - this.stats.lastFailureTime;
    return timeSinceLastFailure >= this._options.recoveryTimeout;
  }

  private startMonitoring(): void {
    setInterval(() => {
      this.logStats();

      // Reset stats periodically
      if (this.state === CircuitState.CLOSED && this.stats.requests > 0) {
        this.stats = {
          failures: 0,
          successes: 0,
          requests: 0,
          lastFailureTime: this.stats.lastFailureTime,
          lastSuccessTime: this.stats.lastSuccessTime,
        };
      }
    }, this._options.monitoringPeriod);
  }

  private logStats(): void {
    if (this.stats.requests > 0) {
      const successRate = (this.stats.successes / this.stats.requests) * 100;
      logger.debug("Circuit breaker stats", {
        state: this.state,
        requests: this.stats.requests,
        successes: this.stats.successes,
        failures: this.stats.failures,
        successRate: `${successRate.toFixed(2)}%`,
      });
    }
  }

  // Public methods for monitoring
  getState(): CircuitState {
    return this.state;
  }

  getStats(): Readonly<CircuitBreakerStats> {
    return { ...this.stats };
  }

  // Manual reset (for admin operations)
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.stats = {
      failures: 0,
      successes: 0,
      requests: 0,
    };
    logger.info("Circuit breaker manually reset");
  }
}
