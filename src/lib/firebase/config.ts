// Import from the main firebase.ts instead of initializing separately
import { app, db, auth, storage, getDb, getAuth, getStorage, initializeFirebase } from '../firebase';

// Re-export for compatibility
export { app, db, auth, storage, getDb, getAuth, getStorage, initializeFirebase }; 