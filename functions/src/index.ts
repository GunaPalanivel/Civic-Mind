// import * as functions from 'firebase-functions'; // Will be used later
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Trigger functions
export { onReportCreated } from './triggers/onReportCreated';
export { onClusterUpdate } from './triggers/onClusterUpdate';
export { onAlertGenerated } from './triggers/onAlertGenerated';

// Scheduled functions
export { cleanupOldReports } from './scheduled/cleanupOldReports';
export { generateDailyMetrics } from './scheduled/generateDailyMetrics';

// HTTP functions
export { processMediaAnalysis } from './http/processMediaAnalysis';
export { generateSynthesis } from './http/generateSynthesis';
