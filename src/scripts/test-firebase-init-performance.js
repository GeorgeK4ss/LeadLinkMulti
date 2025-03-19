/**
 * This script tests the performance of Firebase initialization
 * Run this in a browser environment to measure initialization times
 */

// Performance measurement utilities
const startPerformanceMeasure = (markName) => {
  if (typeof performance !== 'undefined') {
    performance.mark(markName);
  }
};

const endPerformanceMeasure = (markName, measureName) => {
  if (typeof performance !== 'undefined') {
    performance.mark(`${markName}_end`);
    performance.measure(measureName, markName, `${markName}_end`);
    
    const measures = performance.getEntriesByName(measureName);
    const lastMeasure = measures[measures.length - 1];
    
    console.log(`${measureName}: ${lastMeasure.duration.toFixed(2)}ms`);
    return lastMeasure.duration;
  }
  return 0;
};

// Test Firebase initialization performance
async function testFirebaseInitPerformance() {
  console.log('Testing Firebase initialization performance...');
  
  // Test 1: Main Firebase lazy initialization
  startPerformanceMeasure('firebase_init');
  const { initializeFirebase } = await import('../lib/firebase');
  await initializeFirebase();
  endPerformanceMeasure('firebase_init', 'Firebase Initialization');
  
  // Test 2: Auth initialization
  startPerformanceMeasure('auth_init');
  const { getAuth } = await import('../lib/firebase');
  const auth = getAuth();
  endPerformanceMeasure('auth_init', 'Auth Initialization');
  
  // Test 3: Firestore initialization
  startPerformanceMeasure('firestore_init');
  const { getDb } = await import('../lib/firebase');
  const db = getDb();
  endPerformanceMeasure('firestore_init', 'Firestore Initialization');
  
  // Test 4: Storage initialization
  startPerformanceMeasure('storage_init');
  const { getStorage } = await import('../lib/firebase');
  const storage = getStorage();
  endPerformanceMeasure('storage_init', 'Storage Initialization');
  
  // Compare with the performance of direct imports (comment out if not needed)
  /*
  startPerformanceMeasure('direct_firebase');
  const { getApps, initializeApp } = await import('firebase/app');
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  };
  
  if (getApps().length === 0) {
    initializeApp(firebaseConfig);
  }
  endPerformanceMeasure('direct_firebase', 'Direct Firebase Initialization');
  */
  
  console.log('Performance test completed');
}

// Run the test
testFirebaseInitPerformance().catch(console.error);

// Instructions for use:
// 1. Import this script in a test page
// 2. Open browser devtools and check console for results
// 3. You can also check Performance tab for detailed timing information 