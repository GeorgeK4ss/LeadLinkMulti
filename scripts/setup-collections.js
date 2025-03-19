const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin with the service account
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://lead-link-multi-tenant-default-rtdb.europe-west1.firebasedatabase.app"
  });
}

const db = admin.firestore();

// Create companies collection
async function setupCompanies() {
  console.log('\n🏢 Setting up companies collection...');
  
  const companyId = 'company-789012';
  
  try {
    // Create or update company document
    await db.collection('companies').doc(companyId).set({
      id: companyId,
      name: 'LeadLink Company',
      status: 'active',
      industry: 'Technology',
      address: {
        street: '123 Main Street',
        city: 'San Francisco',
        state: 'CA',
        zip: '94105',
        country: 'USA'
      },
      contactEmail: 'contact@leadlinkcompany.com',
      contactPhone: '+1-555-123-4567',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Company ${companyId} created/updated successfully`);
  } catch (error) {
    console.error(`❌ Error creating company: ${error.message}`);
  }
}

// Create tenants collection
async function setupTenants() {
  console.log('\n🏘️ Setting up tenants collection...');
  
  const tenantId = 'tenant-123456';
  const companyId = 'company-789012';
  
  try {
    // Create or update tenant document
    await db.collection('tenants').doc(tenantId).set({
      id: tenantId,
      name: 'LeadLink Tenant',
      companyId: companyId,
      status: 'active',
      tier: 'professional',
      settings: {
        theme: 'light',
        language: 'en',
        notifications: true
      },
      billingInfo: {
        plan: 'monthly',
        nextBillingDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Tenant ${tenantId} created/updated successfully`);
  } catch (error) {
    console.error(`❌ Error creating tenant: ${error.message}`);
  }
}

// Sync users with companies and tenants
async function syncUsers() {
  console.log('\n👥 Syncing users with companies and tenants...');
  
  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('No users found to sync');
      return;
    }
    
    const updates = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      // Get role data
      const roleDoc = await db.collection('userRoles').doc(userId).get();
      
      if (!roleDoc.exists) {
        console.log(`⚠️ No role document found for user: ${userId}`);
        continue;
      }
      
      const roleData = roleDoc.data();
      
      // Prepare update data based on role
      const updateData = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      if (roleData.companyId) {
        updateData.companyId = roleData.companyId;
        
        // Verify company exists
        const companyDoc = await db.collection('companies').doc(roleData.companyId).get();
        if (!companyDoc.exists) {
          console.log(`⚠️ Company ${roleData.companyId} does not exist for user ${userId}`);
        }
      }
      
      if (roleData.tenantId) {
        updateData.tenantId = roleData.tenantId;
        
        // Verify tenant exists
        const tenantDoc = await db.collection('tenants').doc(roleData.tenantId).get();
        if (!tenantDoc.exists) {
          console.log(`⚠️ Tenant ${roleData.tenantId} does not exist for user ${userId}`);
        }
      }
      
      // Update user document
      await db.collection('users').doc(userId).update(updateData);
      console.log(`✅ User ${userId} (${userData.email}) synced successfully`);
    }
    
    console.log('👍 All users synced successfully');
  } catch (error) {
    console.error(`❌ Error syncing users: ${error.message}`);
  }
}

// Main function to run all setup
async function setupCollections() {
  console.log('🚀 Starting collection setup...');
  
  // Setup collections in order
  await setupCompanies();
  await setupTenants();
  await syncUsers();
  
  console.log('\n✨ Collection setup complete!');
}

// Run the script
setupCollections()
  .then(() => {
    console.log('Script execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script execution failed:', error);
    process.exit(1);
  }); 