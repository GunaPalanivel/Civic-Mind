import { FastifyPluginAsync } from 'fastify';

const healthRoutes: FastifyPluginAsync = async (server) => {
  server.get('/', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    };
  });

  server.get('/ready', async () => {
    // Add readiness checks here
    return { status: 'ready' };
  });

  server.get('/live', async () => {
    return { status: 'alive' };
  });
};

export default healthRoutes;
