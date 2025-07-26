import { z } from "zod";
export * from "./validation";
export * from "./formatting";
export * from "./constants";
export declare function validateAndThrow(condition: boolean, message: string): void;
export declare function generateId(): string;
export declare function formatTimestamp(date?: Date): string;
export declare function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
export declare function generateGeohash(lat: number, lon: number, precision?: number): string;
export declare function validateSchema<T>(schema: z.Schema<T>, data: unknown): T;
//# sourceMappingURL=index.d.ts.map