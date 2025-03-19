const admin = require('firebase-admin');
const { google } = require('googleapis');
const serviceAccount = require('../src/lib/firebase/service-account.json');

// Initialize Firebase Admin if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function setupMonitoring() {
  console.log('Setting up Firebase monitoring and alerts...');

  try {
    // Create alert policy for high error rates
    const alertingClient = new google.monitoring({
      version: 'v3',
      auth: admin.credential.applicationDefault(),
    });
    
    // This is a simplified example. In production, you would use a more robust approach.
    console.log('To set up monitoring and alerts, visit the Google Cloud Console:');
    console.log('https://console.cloud.google.com/monitoring/alerting');
    
    console.log('\nRecommended alerts to set up:');
    console.log('1. Firestore Read/Write Operations (exceeding quota)');
    console.log('2. Firebase Function Errors (error rate > 5%)');
    console.log('3. Firebase Function Execution Time (latency > 1s)');
    console.log('4. Firebase Storage Usage (approaching quota)');
    console.log('5. Authentication Failures (high rate of failed logins)');
    
    console.log('\nTo set up performance monitoring in your app:');
    console.log('1. Enable NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true in your .env file');
    console.log('2. Add Firebase Performance initialization to your app');
    
    console.log('\nTo set up Crashlytics for error reporting:');
    console.log('1. Initialize Firebase Crashlytics in your app');
    console.log('2. Configure error boundaries to report errors');
    
    // Set up Cloud Logging export to BigQuery
    console.log('\nTo set up Cloud Logging export to BigQuery:');
    console.log('1. Visit: https://console.cloud.google.com/logs/router');
    console.log('2. Create a sink to export logs to BigQuery for long-term analysis');
    
    console.log('\nMonitoring setup guidelines completed. Follow the instructions above to complete the setup.');
  } catch (error) {
    console.error('Error setting up monitoring:', error);
  } finally {
    // Terminate the Firebase Admin app
    await admin.app().delete();
  }
}

// Run the configuration
setupMonitoring(); 