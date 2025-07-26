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
exports.validateAndThrow = validateAndThrow;
exports.generateId = generateId;
exports.formatTimestamp = formatTimestamp;
exports.calculateDistance = calculateDistance;
exports.generateGeohash = generateGeohash;
exports.validateSchema = validateSchema;
__exportStar(require("./validation"), exports);
__exportStar(require("./formatting"), exports);
__exportStar(require("./constants"), exports);
function validateAndThrow(condition, message) {
    if (!condition) {
        throw new Error(`Validation failed: ${message}`);
    }
}
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function formatTimestamp(date = new Date()) {
    return date.toISOString();
}
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function generateGeohash(lat, lon, precision = 8) {
    const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
    let latRange = [-90, 90];
    let lonRange = [-180, 180];
    let hash = "";
    let bits = 0;
    let bit = 0;
    let even = true;
    while (hash.length < precision) {
        if (even) {
            const mid = (lonRange[0] + lonRange[1]) / 2;
            if (lon >= mid) {
                bit = (bit << 1) + 1;
                lonRange[0] = mid;
            }
            else {
                bit = bit << 1;
                lonRange[1] = mid;
            }
        }
        else {
            const mid = (latRange[0] + latRange[1]) / 2;
            if (lat >= mid) {
                bit = (bit << 1) + 1;
                latRange[0] = mid;
            }
            else {
                bit = bit << 1;
                latRange[1] = mid;
            }
        }
        even = !even;
        bits++;
        if (bits === 5) {
            hash += BASE32[bit];
            bits = 0;
            bit = 0;
        }
    }
    return hash;
}
function validateSchema(schema, data) {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new Error(`Validation failed: ${JSON.stringify(result.error.format())}`);
    }
    return result.data;
}
//# sourceMappingURL=index.js.map