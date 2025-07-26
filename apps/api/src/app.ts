import fastify, { FastifyInstance } from 'fastify';
import { setupMiddleware } from '@/middleware';
import { setupRoutes } from '@/routes';

export async function buildApp(opts = {}): Promise<FastifyInstance> {
  const app = fastify(opts);
  
  await setupMiddleware(app);
  await setupRoutes(app);
  
  return app;
}
