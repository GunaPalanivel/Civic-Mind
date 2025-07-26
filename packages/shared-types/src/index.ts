import { z } from "zod";

// Example CivicEvent schema using zod
export const CivicEventSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    geohash: z.string().optional(),
  }),
  timestamp: z.string(),
  reporterId: z.string(),
  verified: z.boolean(),
  // Add other fields as per data model
});

// Export TypeScript type for convenience
export type CivicEvent = z.infer<typeof CivicEventSchema>;

// Shared types for Civic Mind project
export * from "./common";
export * from "./api";
