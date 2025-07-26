import { z } from "zod";
export declare const CivicEventSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    location: z.ZodObject<{
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
        geohash: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        latitude: number;
        longitude: number;
        geohash?: string | undefined;
    }, {
        latitude: number;
        longitude: number;
        geohash?: string | undefined;
    }>;
    timestamp: z.ZodString;
    reporterId: z.ZodString;
    verified: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    location: {
        latitude: number;
        longitude: number;
        geohash?: string | undefined;
    };
    title: string;
    timestamp: string;
    reporterId: string;
    verified: boolean;
    description?: string | undefined;
}, {
    location: {
        latitude: number;
        longitude: number;
        geohash?: string | undefined;
    };
    title: string;
    timestamp: string;
    reporterId: string;
    verified: boolean;
    description?: string | undefined;
}>;
export type CivicEvent = z.infer<typeof CivicEventSchema>;
export * from "./common";
export * from "./api";
//# sourceMappingURL=index.d.ts.map