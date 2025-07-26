import { FastifyInstance } from "fastify";

export default async function analyticsRoutes(fastify: FastifyInstance) {
  fastify.get("/", async (_request, _reply) => {
    return { message: "Analytics endpoint - coming soon" };
  });
}
