const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
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
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
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
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`
  });
}

const bucket = admin.storage().bucket();

// Create initial folder structure and upload sample files
async function initializeStorage() {
  console.log('Starting Storage initialization...');

  try {
    // Define folder structure
    const folders = [
      'users/avatars',
      'organizations/logos',
      'leads/documents',
      'exports',
      'imports',
      'templates',
      'public'
    ];

    // Create folders (in Firebase Storage, folders are just prefixes)
    for (const folder of folders) {
      console.log(`Creating folder: ${folder}`);
      
      // Create an empty file to establish the folder
      const file = bucket.file(`${folder}/.placeholder`);
      await file.save('', { contentType: 'text/plain' });
      
      // Make public folder contents publicly accessible
      if (folder === 'public') {
        await file.makePublic();
      }
    }

    // Create a sample logo file
    const logoPath = path.join(__dirname, 'sample-logo.png');
    
    // Check if the sample logo exists, if not create a text file instead
    if (fs.existsSync(logoPath)) {
      await bucket.upload(logoPath, {
        destination: 'organizations/logos/default-logo.png',
        metadata: {
          contentType: 'image/png',
        }
      });
      console.log('Uploaded sample logo');
    } else {
      // Create a text file as a placeholder
      const file = bucket.file('organizations/logos/default-logo.txt');
      await file.save('This is a placeholder for the default logo', { contentType: 'text/plain' });
      console.log('Created placeholder for sample logo');
    }

    console.log('Storage initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing Storage:', error);
  } finally {
    // Terminate the Firebase Admin app
    await admin.app().delete();
  }
}

// Run the initialization
initializeStorage(); 