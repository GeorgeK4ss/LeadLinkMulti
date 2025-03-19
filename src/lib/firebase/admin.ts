import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// Initialize Firebase Admin with environment variables if available, otherwise use service account file
if (!getApps().length) {
  // Check for environment variables first (for CI/CD environments)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    // Service account from environment variable (base64 encoded)
    const serviceAccountJson = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
      'base64'
    ).toString('utf8');
    
    const serviceAccount = JSON.parse(serviceAccountJson);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
  } else if (process.env.FIREBASE_PROJECT_ID) {
    // For environments with Application Default Credentials or specified project ID
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
  } else {
    // Fallback to local service account file (development only)
    try {
      const serviceAccount = require('./service-account.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      });
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
      throw new Error('Firebase Admin credentials not found. Set environment variables or provide service-account.json');
    }
  }
}

const auth = admin.auth();
const db = admin.firestore();
const storage = admin.storage();

export { auth, db, storage }; 