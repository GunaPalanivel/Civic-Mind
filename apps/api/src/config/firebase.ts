import admin from 'firebase-admin';
import { config } from './environment';

if (!admin.apps.length) {
  const serviceAccount = require(config.firebase.serviceAccountPath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: config.firebase.projectId,
  });
}

export const firestore = admin.firestore();
export const auth = admin.auth();
export { admin };
