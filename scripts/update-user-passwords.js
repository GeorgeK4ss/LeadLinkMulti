const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin with the service account
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://lead-link-multi-tenant-default-rtdb.europe-west1.firebasedatabase.app"
  });
}

const auth = admin.auth();

// List of users to update passwords for
const users = [
  {
    email: "admin@leadlink.com",
    password: "AdminPass123!"
  },
  {
    email: "company@leadlink.com",
    password: "CompanyPass123!"
  },
  {
    email: "tenant@leadlink.com",
    password: "TenantPass123!"
  },
  {
    email: "agent@leadlink.com",
    password: "AgentPass123!"
  }
];

// Update a user's password
async function updateUserPassword(email, newPassword) {
  try {
    // Get the user by email
    const userRecord = await auth.getUserByEmail(email);
    console.log(`Found user: ${userRecord.uid} (${email})`);
    
    // Update the password
    await auth.updateUser(userRecord.uid, {
      password: newPassword,
    });
    
    console.log(`✅ Password updated for user: ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating password for ${email}:`, error);
    return false;
  }
}

// Process all users
async function updatePasswords() {
  console.log('🔑 Starting password update process...');
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const user of users) {
    const success = await updateUserPassword(user.email, user.password);
    
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
  }
  
  console.log('\n📊 Password Update Summary:');
  console.log(`✅ Successfully updated: ${successCount}`);
  console.log(`❌ Failed updates: ${failureCount}`);
  console.log('✨ Process complete');
}

// Run the script
updatePasswords()
  .then(() => {
    console.log('Script execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script execution failed:', error);
    process.exit(1);
  }); 