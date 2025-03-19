const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin with the service account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://lead-link-multi-tenant-default-rtdb.europe-west1.firebasedatabase.app"
});

const auth = admin.auth();
const db = admin.firestore();

// Emails of users to delete
const userEmails = [
  'agent@leadlink.com',
  'tenant@leadlink.com',
  'company@leadlink.com',
  'admin@leadlink.com'
];

// Delete a user from Firebase Authentication
async function deleteAuthUser(email) {
  try {
    // First, get the user by email
    const userRecord = await auth.getUserByEmail(email);
    console.log(`Found user: ${userRecord.uid} (${email})`);
    
    // Delete the user
    await auth.deleteUser(userRecord.uid);
    console.log(`✅ Deleted auth user: ${userRecord.uid} (${email})`);
    
    return userRecord.uid;
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log(`⚠️ User not found: ${email}`);
      return null;
    }
    console.error(`❌ Error deleting auth user ${email}:`, error);
    throw error;
  }
}

// Delete a user document from Firestore
async function deleteUserDocument(uid) {
  if (!uid) return false;
  
  try {
    // Delete from users collection
    await db.collection('users').doc(uid).delete();
    console.log(`✅ Deleted user document: ${uid}`);
    return true;
  } catch (error) {
    console.error(`❌ Error deleting user document: ${uid}`, error);
    return false;
  }
}

// Delete a user role from Firestore
async function deleteUserRole(uid) {
  if (!uid) return false;
  
  try {
    // Delete from userRoles collection
    await db.collection('userRoles').doc(uid).delete();
    console.log(`✅ Deleted user role: ${uid}`);
    return true;
  } catch (error) {
    console.error(`❌ Error deleting user role: ${uid}`, error);
    return false;
  }
}

// Process all users
async function deleteUsers() {
  console.log('🚀 Starting user deletion process...');
  console.log(`Firebase Project: ${serviceAccount.project_id}`);
  
  let deletedUsers = 0;
  let failedUsers = 0;
  
  for (const email of userEmails) {
    try {
      // Delete the auth user
      const uid = await deleteAuthUser(email);
      
      if (uid) {
        // Delete the user document in Firestore
        await deleteUserDocument(uid);
        
        // Delete the user role
        await deleteUserRole(uid);
        
        deletedUsers++;
        console.log(`✨ Completed deletion for user: ${email}\n`);
      }
    } catch (error) {
      failedUsers++;
      console.error(`❌ Failed to delete user: ${email}`, error);
    }
  }
  
  console.log('\n📊 User Deletion Summary:');
  console.log(`✅ Successfully deleted: ${deletedUsers}`);
  console.log(`❌ Failed: ${failedUsers}`);
  console.log('✨ Process complete');
}

// Run the script
deleteUsers()
  .then(() => {
    console.log('Script execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script execution failed:', error);
    process.exit(1);
  }); 