"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSynthesis = exports.processMediaAnalysis = exports.generateDailyMetrics = exports.cleanupOldReports = exports.onAlertGenerated = exports.onClusterUpdate = exports.onReportCreated = void 0;
// import * as functions from 'firebase-functions'; // Will be used later
const admin = require("firebase-admin");
// Initialize Firebase Admin
admin.initializeApp();
// Trigger functions
var onReportCreated_1 = require("./triggers/onReportCreated");
Object.defineProperty(exports, "onReportCreated", { enumerable: true, get: function () { return onReportCreated_1.onReportCreated; } });
var onClusterUpdate_1 = require("./triggers/onClusterUpdate");
Object.defineProperty(exports, "onClusterUpdate", { enumerable: true, get: function () { return onClusterUpdate_1.onClusterUpdate; } });
var onAlertGenerated_1 = require("./triggers/onAlertGenerated");
Object.defineProperty(exports, "onAlertGenerated", { enumerable: true, get: function () { return onAlertGenerated_1.onAlertGenerated; } });
// Scheduled functions
var cleanupOldReports_1 = require("./scheduled/cleanupOldReports");
Object.defineProperty(exports, "cleanupOldReports", { enumerable: true, get: function () { return cleanupOldReports_1.cleanupOldReports; } });
var generateDailyMetrics_1 = require("./scheduled/generateDailyMetrics");
Object.defineProperty(exports, "generateDailyMetrics", { enumerable: true, get: function () { return generateDailyMetrics_1.generateDailyMetrics; } });
// HTTP functions
var processMediaAnalysis_1 = require("./http/processMediaAnalysis");
Object.defineProperty(exports, "processMediaAnalysis", { enumerable: true, get: function () { return processMediaAnalysis_1.processMediaAnalysis; } });
var generateSynthesis_1 = require("./http/generateSynthesis");
Object.defineProperty(exports, "generateSynthesis", { enumerable: true, get: function () { return generateSynthesis_1.generateSynthesis; } });
//# sourceMappingURL=index.js.map