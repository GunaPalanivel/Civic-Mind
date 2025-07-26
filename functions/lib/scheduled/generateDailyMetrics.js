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
exports.generateDailyMetrics = void 0;
const functions = __importStar(require("firebase-functions"));
// import * as admin from "firebase-admin"; // Will be used for database operations
exports.generateDailyMetrics = functions.pubsub
    .schedule("0 1 * * *") // Run daily at 1 AM
    .timeZone("America/New_York")
    .onRun(async (context) => {
    console.log("Generating daily metrics...");
    // const db = admin.firestore(); // Will be used for metrics operations
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    // TODO: Implement metrics generation
    // - Count daily reports
    // - Calculate response times
    // - Generate trend analysis
    // - Store in analytics collection
    console.log("Daily metrics generated");
    return null;
});
//# sourceMappingURL=generateDailyMetrics.js.map