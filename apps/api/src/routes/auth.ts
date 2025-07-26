import { FastifyInstance } from "fastify";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.get("/login", async (_request, _reply) => {
    return { message: "Auth login endpoint - coming soon" };
  });

  fastify.get("/logout", async (_request, _reply) => {
    return { message: "Auth logout endpoint - coming soon" };
  });
}
