import { FastifyInstance } from "fastify";

export default async function reportsRoutes(fastify: FastifyInstance) {
  fastify.get("/", async (_request, _reply) => {
    return { message: "Reports endpoint - coming soon" };
  });
}
