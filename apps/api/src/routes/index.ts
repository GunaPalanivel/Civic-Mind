import { FastifyInstance } from 'fastify';
import healthRoutes from './health';
import authRoutes from './auth';
import reportsRoutes from './reports';
import alertsRoutes from './alerts';
import analyticsRoutes from './analytics';

export async function setupRoutes(server: FastifyInstance) {
  await server.register(healthRoutes, { prefix: '/api/health' });
  await server.register(authRoutes, { prefix: '/api/auth' });
  await server.register(reportsRoutes, { prefix: '/api/reports' });
  await server.register(alertsRoutes, { prefix: '/api/alerts' });
  await server.register(analyticsRoutes, { prefix: '/api/analytics' });
}
