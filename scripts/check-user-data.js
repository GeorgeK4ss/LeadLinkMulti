const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin with the service account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://lead-link-multi-tenant-default-rtdb.europe-west1.firebasedatabase.app"
});

const db = admin.firestore();

// Fetch and check user document and role for an email
async function checkUserData(email) {
  try {
    console.log(`\n👉 Checking data for user: ${email}`);
    
    // Find user by email in users collection
    const usersQuery = await db.collection('users').where('email', '==', email).limit(1).get();
    
    if (usersQuery.empty) {
      console.log(`❌ No user document found for email: ${email}`);
      return;
    }
    
    // Get the user document
    const userDoc = usersQuery.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;
    
    console.log(`\n📄 User Document (users/${userId}):`);
    console.log(`  - Email: ${userData.email}`);
    console.log(`  - Display Name: ${userData.displayName}`);
    console.log(`  - Role: ${userData.role}`);
    console.log(`  - TenantId: ${userData.tenantId || 'null'}`);
    console.log(`  - CompanyId: ${userData.companyId || 'null'}`);
    
    // Check user role document
    const roleDoc = await db.collection('userRoles').doc(userId).get();
    
    if (!roleDoc.exists) {
      console.log(`\n❌ No role document found for user: ${userId}`);
      return;
    }
    
    const roleData = roleDoc.data();
    
    console.log(`\n📄 User Role Document (userRoles/${userId}):`);
    console.log(`  - RoleId: ${roleData.roleId}`);
    console.log(`  - TenantId: ${roleData.tenantId || 'null'}`);
    console.log(`  - CompanyId: ${roleData.companyId || 'null'}`);
    
  } catch (error) {
    console.error(`❌ Error checking user data:`, error);
  }
}

// Check all users
async function checkAllUsers() {
  const emails = [
    'admin@leadlink.com',
    'company@leadlink.com',
    'tenant@leadlink.com',
    'agent@leadlink.com'
  ];
  
  console.log('🔍 Checking user data in Firestore...');
  
  for (const email of emails) {
    await checkUserData(email);
  }
  
  console.log('\n✅ Check complete');
}

// Run the script
checkAllUsers()
  .then(() => {
    console.log('Script execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script execution failed:', error);
    process.exit(1);
  }); 