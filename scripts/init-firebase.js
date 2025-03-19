const admin = require('firebase-admin');
const serviceAccount = require('../src/lib/firebase/service-account.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}-default-rtdb.europe-west1.firebasedatabase.app`
});

const db = admin.firestore();
const auth = admin.auth();

// Create initial collections and documents
async function initializeFirebase() {
  console.log('Starting Firebase initialization...');

  try {
    // Create admin user if it doesn't exist
    try {
      const adminUser = await auth.getUserByEmail('admin@leadlink.com');
      console.log('Admin user already exists:', adminUser.uid);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        const adminUser = await auth.createUser({
          email: 'admin@leadlink.com',
          password: 'Admin123!',
          displayName: 'Admin User',
        });
        console.log('Created admin user:', adminUser.uid);
        
        // Set custom claims for admin role
        await auth.setCustomUserClaims(adminUser.uid, { role: 'admin' });
        console.log('Set admin role for user');
      } else {
        throw error;
      }
    }

    // Create collections
    const collections = [
      {
        name: 'users',
        documents: [
          {
            id: 'admin',
            email: 'admin@leadlink.com',
            displayName: 'Admin User',
            role: 'admin',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastLogin: admin.firestore.FieldValue.serverTimestamp(),
            status: 'active'
          }
        ]
      },
      {
        name: 'userRoles',
        documents: [
          {
            id: 'admin',
            name: 'Administrator',
            permissions: ['read', 'write', 'delete', 'manage_users', 'manage_settings'],
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          },
          {
            id: 'manager',
            name: 'Manager',
            permissions: ['read', 'write', 'delete'],
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          },
          {
            id: 'user',
            name: 'Standard User',
            permissions: ['read', 'write'],
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          }
        ]
      },
      {
        name: 'organizations',
        documents: [
          {
            id: 'default',
            name: 'Default Organization',
            plan: 'basic',
            status: 'active',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            settings: {
              maxUsers: 5,
              maxLeads: 100,
              features: {
                analytics: true,
                automation: false,
                customFields: true
              }
            }
          }
        ]
      },
      {
        name: 'leads',
        documents: [
          {
            id: 'sample-lead-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '+1234567890',
            status: 'new',
            source: 'website',
            assignedTo: 'admin',
            organizationId: 'default',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }
        ]
      },
      {
        name: 'activities',
        documents: [
          {
            id: 'sample-activity-1',
            leadId: 'sample-lead-1',
            type: 'note',
            content: 'Initial contact made',
            createdBy: 'admin',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          }
        ]
      }
    ];

    // Create collections and documents
    for (const collection of collections) {
      console.log(`Creating collection: ${collection.name}`);
      
      for (const doc of collection.documents) {
        const docId = doc.id;
        delete doc.id;
        
        await db.collection(collection.name).doc(docId).set(doc);
        console.log(`Created document: ${collection.name}/${docId}`);
      }
    }

    console.log('Firebase initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  } finally {
    // Terminate the Firebase Admin app
    await admin.app().delete();
  }
}

// Run the initialization
initializeFirebase(); 