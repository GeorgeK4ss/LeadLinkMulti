const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('../src/lib/firebase/service-account.json');

// Initialize Firebase Admin if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: `${serviceAccount.project_id}.firebasestorage.app`
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