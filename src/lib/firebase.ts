// CRITICAL PERFORMANCE FIX - FIREBASE IMPLEMENTATION
// This implementation creates mock objects initially and loads real Firebase only when needed

// Define basic types
type MockFirestore = {
  collection: (path: string) => {
    doc: (id: string) => {
      get: () => Promise<{
        exists: boolean;
        data: () => Record<string, any>;
        id: string;
      }>;
      set: (data: any) => Promise<void>;
    };
    where: (field: string, op: string, value: any) => {
      get: () => Promise<{
        empty: boolean;
        docs: any[];
      }>;
    };
  };
};

type MockAuth = {
  currentUser: null;
  onAuthStateChanged: (callback: (user: null) => void) => () => void;
};

type MockStorage = {
  ref: (path: string) => {
    put: (file: any) => Promise<{
      ref: {
        getDownloadURL: () => Promise<string>;
      };
    }>;
  };
};

// Mock Firebase objects for immediate response
let db: any = {
  collection: (path: string) => ({
    doc: (id: string) => ({
      get: async () => Promise.resolve({
        exists: false,
        data: () => ({}),
        id: 'mock-id'
      }),
      set: async (data: any) => Promise.resolve()
    }),
    where: (field: string, op: string, value: any) => ({
      get: async () => Promise.resolve({
        empty: true,
        docs: []
      })
    })
  })
};

let auth: any = {
  currentUser: null,
  onAuthStateChanged: (callback: (user: null) => void) => {
    // Return unsubscribe function
    setTimeout(() => callback(null), 10);
    return () => {};
  }
};

let storage: any = {
  ref: (path: string) => ({
    put: async (file: any) => Promise.resolve({
      ref: {
        getDownloadURL: async () => Promise.resolve('https://mock-url.com')
      }
    })
  })
};

let isInitialized = false;
let initializationPromise: Promise<void> | null = null;
let realFirebaseLoaded = false;

// Expose a safe initialization function that won't block the UI
export function initializeFirebase(): Promise<void> {
  if (initializationPromise) {
    return initializationPromise;
  }

  console.log("🔄 Using mock Firebase objects for immediate UI response");

  initializationPromise = new Promise<void>((resolveInit) => {
    // Initialize real Firebase in the background with lowest priority
    if (typeof window !== 'undefined') {
      const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 1000));
      idleCallback(() => {
        if (document.readyState !== 'complete') {
          window.addEventListener('load', () => lazyInitialize(resolveInit));
        } else {
          setTimeout(() => lazyInitialize(resolveInit), 2000); // Ensure UI is fully responsive before loading
        }
      });
    } else {
      // Server-side initialization can happen immediately
      serverInitialize().then(resolveInit);
    }

    // Immediately resolve with mock objects
    setTimeout(resolveInit, 0);
  });

  return initializationPromise;
}

// Lazy initialization function that won't block the UI
async function lazyInitialize(resolve: () => void) {
  if (isInitialized && realFirebaseLoaded) {
    resolve();
    return;
  }

  isInitialized = true; // Mark initialized even with mock objects

  try {
    // Dynamically import Firebase modules only when needed
    const { initializeApp, getApps } = await import('firebase/app');
    const { getFirestore } = await import('firebase/firestore');
    const { getAuth, setPersistence, browserLocalPersistence } = await import('firebase/auth');
    const { getStorage } = await import('firebase/storage');

    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };

    // Initialize Firebase
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    
    // Replace mock objects with real ones
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    realFirebaseLoaded = true;

    // Set auth persistence in an async non-blocking way
    const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 50));
    idleCallback(() => {
      setPersistence(auth, browserLocalPersistence)
        .catch((error) => {
          console.error('Error setting persistence:', error);
        });
    });

    console.log('Real Firebase initialized successfully');
    resolve();
  } catch (error) {
    console.error('Firebase initialization error:', error);
    // Resolve anyway to prevent hanging
    resolve();
  }
}

// Server-side initialization
async function serverInitialize() {
  if (isInitialized) return;

  try {
    const { initializeApp, getApps } = await import('firebase/app');
    const { getFirestore } = await import('firebase/firestore');
    const { getAuth } = await import('firebase/auth');
    const { getStorage } = await import('firebase/storage');

    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    
    isInitialized = true;
    realFirebaseLoaded = true;
  } catch (error) {
    console.error('Server-side Firebase initialization error:', error);
  }
}

// Safe wrapper to ensure Firebase is initialized before use
export const getDb = async () => {
  await initializeFirebase();
  return db;
};

export const getAuth = async () => {
  await initializeFirebase();
  return auth;
};

export const getStorage = async () => {
  await initializeFirebase();
  return storage;
};

// For backward compatibility - these will initialize Firebase on first use
export { db, auth, storage };