const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin with the service account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://lead-link-multi-tenant-default-rtdb.europe-west1.firebasedatabase.app"
});

const auth = admin.auth();
const db = admin.firestore();

// User definitions with their roles
const users = [
  {
    email: "agent@leadlink.com",
    password: "Password123!",
    displayName: "Agent User",
    role: {
      roleId: "tenant_agent",
      tenantId: "tenant-123456"
    }
  },
  {
    email: "tenant@leadlink.com",
    password: "Password123!",
    displayName: "Tenant Admin",
    role: {
      roleId: "tenant_admin",
      tenantId: "tenant-123456"
    }
  },
  {
    email: "company@leadlink.com",
    password: "Password123!",
    displayName: "Company Admin",
    role: {
      roleId: "company_admin",
      companyId: "company-789012"
    }
  },
  {
    email: "admin@leadlink.com",
    password: "Password123!",
    displayName: "System Admin",
    role: {
      roleId: "system_admin"
    }
  }
];

// Create a user in Firebase Authentication
async function createAuthUser(email, password, displayName) {
  try {
    console.log(`Creating auth user: ${email}`);
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: true
    });
    console.log(`✅ Created auth user: ${userRecord.uid} (${email})`);
    return userRecord;
  } catch (error) {
    console.error(`❌ Error creating auth user ${email}:`, error);
    throw error;
  }
}

// Create a user document in Firestore
async function createUserDocument(userRecord, userData) {
  try {
    console.log(`Creating user document for: ${userRecord.email}`);
    
    // Map role to the simplified role field expected in users collection
    let userRole;
    switch(userData.role.roleId) {
      case 'system_admin':
        userRole = 'admin';
        break;
      case 'company_admin':
        userRole = 'company';
        break;
      case 'tenant_admin':
        userRole = 'tenant';
        break;
      case 'tenant_agent':
        userRole = 'agent';
        break;
      default:
        userRole = 'agent';
    }
    
    const userDoc = {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      role: userRole,
      status: 'active',
      companyId: userData.role.companyId || null,
      tenantId: userData.role.tenantId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Add document with UID as the document ID
    await db.collection('users').doc(userRecord.uid).set(userDoc);
    console.log(`✅ Created user document for: ${userRecord.email}`);
    return userDoc;
  } catch (error) {
    console.error(`❌ Error creating user document for ${userRecord.email}:`, error);
    throw error;
  }
}

// Assign a role to a user
async function assignUserRole(userId, roleData) {
  try {
    console.log(`Assigning role ${roleData.roleId} to user: ${userId}`);
    
    const userRole = {
      userId,
      roleId: roleData.roleId,
      companyId: roleData.companyId || null,
      tenantId: roleData.tenantId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('userRoles').doc(userId).set(userRole);
    console.log(`✅ Role '${roleData.roleId}' assigned to user '${userId}'`);
    return true;
  } catch (error) {
    console.error(`❌ Error assigning role to user '${userId}':`, error);
    return false;
  }
}

// Process all users
async function setupUsers() {
  console.log('🚀 Starting user setup process...');
  console.log(`Firebase Project: ${serviceAccount.project_id}`);
  
  let createdUsers = 0;
  let failedUsers = 0;
  
  for (const userData of users) {
    try {
      // Create the auth user
      const userRecord = await createAuthUser(
        userData.email, 
        userData.password, 
        userData.displayName
      );
      
      // Create the user document in Firestore
      await createUserDocument(userRecord, userData);
      
      // Assign user role
      await assignUserRole(userRecord.uid, userData.role);
      
      createdUsers++;
      console.log(`✨ Completed setup for user: ${userData.email}\n`);
    } catch (error) {
      failedUsers++;
      console.error(`❌ Failed to set up user: ${userData.email}`, error);
    }
  }
  
  console.log('\n📊 User Setup Summary:');
  console.log(`✅ Successfully created: ${createdUsers}`);
  console.log(`❌ Failed: ${failedUsers}`);
  console.log('✨ Process complete');
}

// Run the script
setupUsers()
  .then(() => {
    console.log('Script execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script execution failed:', error);
    process.exit(1);
  }); 