import { FastifyInstance } from "fastify";

export default async function alertsRoutes(fastify: FastifyInstance) {
  fastify.get("/", async (_request, _reply) => {
    return { message: "Alerts endpoint - coming soon" };
  });
}
