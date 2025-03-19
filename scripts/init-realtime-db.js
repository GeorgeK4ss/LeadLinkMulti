const admin = require('firebase-admin');
let serviceAccount;

// Initialize Firebase Admin with environment variables if available, otherwise use service account file
if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  // Service account from environment variable (base64 encoded)
  const serviceAccountJson = Buffer.from(
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
    'base64'
  ).toString('utf8');
  
  serviceAccount = JSON.parse(serviceAccountJson);
} else if (process.env.FIREBASE_PROJECT_ID) {
  // For environments with Application Default Credentials
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
} else {
  // Fallback to local service account file
  try {
    serviceAccount = require('../src/lib/firebase/service-account.json');
  } catch (error) {
    console.error('Failed to load service account:', error);
    process.exit(1);
  }
}

// Initialize the app if we have a service account
if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
  });
}

const db = admin.database();

// Create initial data structure
async function initializeRealtimeDatabase() {
  console.log('Starting Realtime Database initialization...');

  try {
    // Define the initial data structure
    const initialData = {
      status: {
        users: {
          admin: {
            state: 'online',
            lastActive: new Date().toISOString()
          }
        }
      },
      notifications: {
        admin: {
          unread: 0,
          items: {
            welcome: {
              title: 'Welcome to LeadLink CRM',
              body: 'Thank you for setting up LeadLink CRM. Get started by exploring the dashboard.',
              read: false,
              timestamp: new Date().toISOString(),
              type: 'info'
            }
          }
        }
      },
      metrics: {
        system: {
          activeUsers: 1,
          totalLeads: 1,
          conversionRate: 0,
          lastUpdated: new Date().toISOString()
        }
      },
      presence: {
        users: {
          // Will be populated by client connections
        }
      },
      activity: {
        recent: {
          // Will be populated by user actions
        }
      }
    };

    // Set the data
    await db.ref('/').set(initialData);
    console.log('Realtime Database initialized successfully!');

    // Set up security rules programmatically (optional)
    const rules = {
      rules: {
        ".read": "auth != null",
        ".write": "auth != null && root.child('userRoles').child(auth.uid).child('role').val() === 'admin'",
        "status": {
          "users": {
            "$uid": {
              ".read": "auth != null",
              ".write": "auth != null && auth.uid === $uid"
            }
          }
        },
        "notifications": {
          "$uid": {
            ".read": "auth != null && auth.uid === $uid",
            ".write": "auth != null && auth.uid === $uid"
          }
        },
        "metrics": {
          "system": {
            ".read": "auth != null",
            ".write": "auth != null && root.child('userRoles').child(auth.uid).child('role').val() === 'admin'"
          }
        },
        "presence": {
          "users": {
            "$uid": {
              ".read": "auth != null",
              ".write": "auth != null && auth.uid === $uid"
            }
          }
        },
        "activity": {
          "recent": {
            ".read": "auth != null",
            ".write": "auth != null"
          }
        }
      }
    };

    console.log('Realtime Database rules would be set here (requires separate deployment)');
    
  } catch (error) {
    console.error('Error initializing Realtime Database:', error);
  } finally {
    // Terminate the Firebase Admin app
    await admin.app().delete();
  }
}

// Run the initialization
initializeRealtimeDatabase(); 