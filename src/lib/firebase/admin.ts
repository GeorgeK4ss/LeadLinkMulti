import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

const serviceAccount = require('./service-account.json');

if (!getApps().length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });
}

const auth = admin.auth();
const db = admin.firestore();
const storage = admin.storage();

export { auth, db, storage }; 