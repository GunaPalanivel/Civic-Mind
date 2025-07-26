import { VertexAI, HarmBlockThreshold, HarmCategory } from '@google-cloud/vertexai';
import { CircuitBreaker, CircuitBreakerOptions } from './circuit-breaker';
import { logger } from '@/utils/logger';
import { config } from '@/config/environment';

interface EventCluster {
  id: string;
  events: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    location: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    timestamp: string;
  }>;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    area?: string;
  };
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  categories: string[];
}

interface SynthesizedAlert {
  id: string;
  summary: string;
  recommendation: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    area?: string;
  };
  eventIds: string[];
  timestamp: string;
  synthesisMetadata: {
    model: string;
    processingTime: number;
    tokensUsed?: number;
    fallbackUsed: boolean;
  };
}

class AIServiceError extends Error {
  constructor(message: string, public readonly _code: string) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export class GeminiService {
  private static instance: GeminiService;
  private vertexAI?: VertexAI;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly isProductionMode: boolean;

  // Circuit breaker configuration
  private readonly circuitBreakerOptions: CircuitBreakerOptions = {
    failureThreshold: 5,
    recoveryTimeout: 30000, // 30 seconds
    monitoringPeriod: 60000, // 1 minute
    expectedErrors: (error: Error) => {
      // Don't trip circuit breaker for rate limiting or quota errors
      return error.message.includes('quota') || 
             error.message.includes('rate limit') ||
             error.message.includes('RESOURCE_EXHAUSTED');
    }
  };

  constructor() {
    this.isProductionMode = config.nodeEnv === 'production';
    this.circuitBreaker = new CircuitBreaker(this.circuitBreakerOptions);
    this.initializeVertexAI();
  }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  private initializeVertexAI(): void {
    try {
      if (this.isProductionMode && process.env.GCP_PROJECT_ID) {
        this.vertexAI = new VertexAI({
          project: process.env.GCP_PROJECT_ID,
          location: 'us-central1',
        });
        logger.info('Vertex AI initialized for production');
      } else {
        logger.info('Vertex AI running in mock mode for development');
      }
    } catch (error) {
      logger.error('Failed to initialize Vertex AI:', error);
      // Don't throw - fall back to mock mode
    }
  }

  /**
   * Main synthesis method with circuit breaker protection
   */
  async synthesizeEvents(cluster: EventCluster): Promise<SynthesizedAlert> {
    const startTime = performance.now();
    
    try {
      logger.info(`Starting event synthesis for cluster ${cluster.id} with ${cluster.events.length} events`);

      const result = await this.circuitBreaker.execute(async () => {
        return this.isProductionMode && this.vertexAI 
          ? await this.performGeminiSynthesis(cluster)
          : await this.performMockSynthesis(cluster);
      });

      const processingTime = performance.now() - startTime;
      result.synthesisMetadata.processingTime = processingTime;

      logger.info(`Event synthesis completed for cluster ${cluster.id}`, {
        processingTime: `${processingTime.toFixed(2)}ms`,
        confidence: result.confidence,
        severity: result.severity,
        fallbackUsed: result.synthesisMetadata.fallbackUsed
      });

      return result;
    } catch (error) {
      const processingTime = performance.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));
      
      logger.error('Event synthesis failed, using fallback', {
        clusterId: cluster.id,
        error: err.message,
        processingTime: `${processingTime.toFixed(2)}ms`
      });

      // Return fallback synthesis
      return this.createFallbackSynthesis(cluster, processingTime);
    }
  }

  /**
   * Perform actual Gemini synthesis
   */
  private async performGeminiSynthesis(cluster: EventCluster): Promise<SynthesizedAlert> {
    if (!this.vertexAI) {
      throw new AIServiceError('Vertex AI not initialized', 'VERTEXAI_NOT_INITIALIZED');
    }

    try {
      const model = this.vertexAI.preview.getGenerativeModel({
        model: 'gemini-pro',
        generation_config: {
          max_output_tokens: 512,
          temperature: 0.1,
          top_p: 0.8,
          top_k: 40,
        },
        safety_settings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      });

      const prompt = this.buildSynthesisPrompt(cluster);
      
      logger.debug('Sending prompt to Gemini', {
        clusterId: cluster.id,
        promptLength: prompt.length,
        eventCount: cluster.events.length
      });

      const result = await model.generateContent(prompt);
      
      if (!result.response) {
        throw new AIServiceError('No response from Gemini', 'NO_RESPONSE');
      }

      const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) {
        throw new AIServiceError('Empty response from Gemini', 'EMPTY_RESPONSE');
      }

      const parsedResult = this.parseGeminiResponse(responseText, cluster);
      
      return {
        ...parsedResult,
        synthesisMetadata: {
          model: 'gemini-pro',
          processingTime: 0, // Will be set by caller
          tokensUsed: this.extractTokenCount(result),
          fallbackUsed: false
        }
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      if (err.message.includes('quota') || err.message.includes('RESOURCE_EXHAUSTED')) {
        throw new AIServiceError('Vertex AI quota exceeded', 'QUOTA_EXCEEDED');
      }
      
      if (err.message.includes('SAFETY')) {
        throw new AIServiceError('Content blocked by safety filters', 'SAFETY_FILTER');
      }
      
      throw new AIServiceError(`Gemini synthesis failed: ${err.message}`, 'SYNTHESIS_FAILED');
    }
  }

  /**
   * Build structured prompt for Gemini
   */
  private buildSynthesisPrompt(cluster: EventCluster): string {
    const eventSummaries = cluster.events.map(e => 
      `- ${e.category.toUpperCase()}: ${e.title} | ${e.description} | Severity: ${e.severity}`
    ).join('\n');

    const locationInfo = cluster.location.area || cluster.location.address || 
                        `${cluster.location.latitude.toFixed(4)}, ${cluster.location.longitude.toFixed(4)}`;

    return `
You are an AI assistant analyzing civic events for a smart city platform. Analyze these ${cluster.events.length} related civic events in ${locationInfo}:

EVENTS:
${eventSummaries}

TASK: Generate a concise, actionable civic alert with the following requirements:
1. Provide a clear SUMMARY (max 40 words) of the situation
2. Give a specific RECOMMENDATION (max 30 words) for citizens or authorities
3. Assign appropriate SEVERITY level: LOW, MEDIUM, HIGH, or CRITICAL
4. Estimate CONFIDENCE (0-100) in your analysis

CONTEXT:
- Location: ${locationInfo}
- Event Categories: ${cluster.categories.join(', ')}
- Time Range: Recent events requiring attention

Respond ONLY with valid JSON in this exact format:
{
  "summary": "Brief description of the situation",
  "recommendation": "Specific actionable advice",
  "severity": "LOW|MEDIUM|HIGH|CRITICAL",
  "confidence": 85
}

Ensure severity matches the urgency and potential impact of the situation.`;
  }

  /**
   * Parse and validate Gemini response
   */
  private parseGeminiResponse(responseText: string, cluster: EventCluster): Omit<SynthesizedAlert, 'synthesisMetadata'> {
    try {
      // Clean response text
      const cleanedText = responseText.trim()
        .replace(/```json/g, '')
        .replace(/```\n?/g, '')
        .replace(/^[^{]*({.*})[^}]*$/s, '$1');

      const parsed = JSON.parse(cleanedText);

      // Validate required fields
      if (!parsed.summary || !parsed.recommendation || !parsed.severity) {
        throw new Error('Missing required fields in Gemini response');
      }

      // Validate severity
      const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      if (!validSeverities.includes(parsed.severity)) {
        logger.warn(`Invalid severity from Gemini: ${parsed.severity}, defaulting to MEDIUM`);
        parsed.severity = 'MEDIUM';
      }

      // Validate confidence
      const confidence = Math.min(100, Math.max(0, parsed.confidence || 75));

      return {
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        summary: this.truncateText(parsed.summary, 100),
        recommendation: this.truncateText(parsed.recommendation, 80),
        severity: parsed.severity,
        confidence,
        location: cluster.location,
        eventIds: cluster.events.map(e => e.id),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to parse Gemini response', {
        error: error instanceof Error ? error.message : String(error),
        responseText: responseText.substring(0, 200)
      });

      // Return structured fallback
      return this.createStructuredFallback(cluster);
    }
  }

  /**
   * Create mock synthesis for development
   */
  private async performMockSynthesis(cluster: EventCluster): Promise<SynthesizedAlert> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));

    const mockResponses = [
      {
        summary: "Multiple traffic incidents detected causing significant congestion",
        recommendation: "Use alternative routes and expect delays",
        confidence: 88
      },
      {
        summary: "Infrastructure issues reported requiring immediate attention",
        recommendation: "Contact local authorities and avoid affected areas",
        confidence: 92
      },
      {
        summary: "Safety concerns identified in the vicinity",
        recommendation: "Exercise caution and report to relevant authorities",
        confidence: 78
      }
    ];

    const selectedResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];

    return {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      summary: selectedResponse.summary,
      recommendation: selectedResponse.recommendation,
      severity: cluster.severity,
      confidence: selectedResponse.confidence,
      location: cluster.location,
      eventIds: cluster.events.map(e => e.id),
      timestamp: new Date().toISOString(),
      synthesisMetadata: {
        model: 'mock-ai',
        processingTime: 0,
        fallbackUsed: false
      }
    };
  }

  /**
   * Create fallback synthesis when AI fails
   */
  private createFallbackSynthesis(cluster: EventCluster, processingTime: number): SynthesizedAlert {
    const categoryCount = cluster.categories.length;
    const eventCount = cluster.events.length;
    
    const summary = categoryCount > 1 
      ? `Multiple issues reported: ${cluster.categories.join(', ')} (${eventCount} events)`
      : `${cluster.categories[0]} issues reported in the area (${eventCount} events)`;

    return {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      summary: this.truncateText(summary, 100),
      recommendation: "Monitor the situation and follow local guidance",
      severity: cluster.severity,
      confidence: 60, // Lower confidence for fallback
      location: cluster.location,
      eventIds: cluster.events.map(e => e.id),
      timestamp: new Date().toISOString(),
      synthesisMetadata: {
        model: 'fallback',
        processingTime,
        fallbackUsed: true
      }
    };
  }

  private createStructuredFallback(cluster: EventCluster): Omit<SynthesizedAlert, 'synthesisMetadata'> {
    return {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      summary: `${cluster.events.length} civic events require attention in ${cluster.location.area || 'the area'}`,
      recommendation: "Review individual reports and take appropriate action",
      severity: cluster.severity,
      confidence: 65,
      location: cluster.location,
      eventIds: cluster.events.map(e => e.id),
      timestamp: new Date().toISOString()
    };
  }

  private extractTokenCount(result: any): number | undefined {
    try {
      return result.response?.usageMetadata?.totalTokenCount;
    } catch {
      return undefined;
    }
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Health check for the AI service
   */
  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    const circuitState = this.circuitBreaker.getState();
    const stats = this.circuitBreaker.getStats();
    
    return {
      healthy: circuitState === 'CLOSED',
      details: {
        circuitState,
        stats,
        vertexAIInitialized: !!this.vertexAI,
        mode: this.isProductionMode ? 'production' : 'development'
      }
    };
  }

  /**
   * Manual circuit breaker reset (for admin endpoints)
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
    logger.info('Gemini service circuit breaker manually reset');
  }
}

export const geminiService = GeminiService.getInstance();
export { AIServiceError };
