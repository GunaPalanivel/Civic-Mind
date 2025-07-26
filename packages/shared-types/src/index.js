"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CivicEventSchema = void 0;
const zod_1 = require("zod");
// Example CivicEvent schema using zod
exports.CivicEventSchema = zod_1.z.object({
    title: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    location: zod_1.z.object({
        latitude: zod_1.z.number(),
        longitude: zod_1.z.number(),
        geohash: zod_1.z.string().optional(),
    }),
    timestamp: zod_1.z.string(),
    reporterId: zod_1.z.string(),
    verified: zod_1.z.boolean(),
    // Add other fields as per data model
});
// Shared types for Civic Mind project
__exportStar(require("./common"), exports);
__exportStar(require("./api"), exports);
//# sourceMappingURL=index.js.map