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
exports.processMediaAnalysis = void 0;
const functions = __importStar(require("firebase-functions"));
// import * as admin from "firebase-admin"; // Will be used for database operations
exports.processMediaAnalysis = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }
    const { mediaUrl, reportId } = data;
    console.log(`Processing media analysis for report: ${reportId}`, { mediaUrl });
    // TODO: Implement media analysis
    // - Extract metadata from images/videos
    // - Perform object detection
    // - Extract location data
    // - Update report with analysis results
    return {
        success: true,
        message: "Media analysis completed",
        analysisResults: {
            // Placeholder results
            detected_objects: [],
            location_data: null,
            content_type: "image"
        }
    };
});
//# sourceMappingURL=processMediaAnalysis.js.map