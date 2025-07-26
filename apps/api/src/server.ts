import { fastify } from 'fastify';
import { config } from '@/config/environment';
import { setupMiddleware } from '@/middleware';
import { setupRoutes } from '@/routes';
import { logger } from '@/utils/logger';

const server = fastify({
  logger: false, // Use Winston instead
  trustProxy: true,
});

async function start() {
  try {
    // Setup middleware
    await setupMiddleware(server);
    
    // Setup routes
    await setupRoutes(server);
    
    // Health check
    server.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });
    
    const port = config.port;
    const host = config.host;
    
    await server.listen({ port, host });
    logger.info(`Server running on http://${host}:${port}`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await server.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await server.close();
  process.exit(0);
});

start();
