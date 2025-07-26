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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupOldReports = void 0;
const functions = __importStar(require("firebase-functions"));
// // import * as admin from "firebase-admin"; // Will be used for database operations // Will be used for database operations
exports.cleanupOldReports = functions.pubsub
    .schedule("0 2 * * *") // Run daily at 2 AM
    .timeZone("America/New_York")
    .onRun(async (context) => {
    console.log("Starting cleanup of old reports...");
    // const db = admin.firestore(); // Will be used for cleanup operations
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 365); // Keep reports for 1 year
    // TODO: Implement cleanup logic
    // - Query old reports
    // - Archive or delete as per policy
    // - Update cleanup metrics
    console.log("Cleanup completed");
    return null;
});
//# sourceMappingURL=cleanupOldReports.js.map