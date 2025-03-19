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

// Update tenant users with their tenant's company ID
async function updateTenantUsers() {
  console.log('🔄 Updating tenant users with company IDs...');
  
  try {
    // Get all tenants to map tenantId -> companyId
    const tenantsSnapshot = await db.collection('tenants').get();
    
    if (tenantsSnapshot.empty) {
      console.log('No tenants found');
      return;
    }
    
    // Create a map of tenant IDs to company IDs
    const tenantToCompanyMap = {};
    tenantsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.companyId) {
        tenantToCompanyMap[doc.id] = data.companyId;
        console.log(`Mapped tenant ${doc.id} to company ${data.companyId}`);
      }
    });
    
    // Get all users with tenant IDs
    const usersSnapshot = await db.collection('users').where('tenantId', '!=', null).get();
    
    if (usersSnapshot.empty) {
      console.log('No users with tenant IDs found');
      return;
    }
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Update each user with their tenant's company ID
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      const tenantId = userData.tenantId;
      
      if (!tenantId) {
        console.log(`Skipping user ${userId}: No tenant ID`);
        skippedCount++;
        continue;
      }
      
      const companyId = tenantToCompanyMap[tenantId];
      
      if (!companyId) {
        console.log(`Skipping user ${userId}: No company ID found for tenant ${tenantId}`);
        skippedCount++;
        continue;
      }
      
      // Update user document with company ID
      await db.collection('users').doc(userId).update({
        companyId: companyId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Also update user role with company ID
      await db.collection('userRoles').doc(userId).update({
        companyId: companyId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ Updated user ${userId} (${userData.email}): Added company ID ${companyId} from tenant ${tenantId}`);
      updatedCount++;
    }
    
    console.log(`\n📊 Update Summary:`);
    console.log(`✅ Updated: ${updatedCount} users`);
    console.log(`⏭️ Skipped: ${skippedCount} users`);
    
  } catch (error) {
    console.error(`❌ Error updating users: ${error.message}`);
  }
}

// Run the script
updateTenantUsers()
  .then(() => {
    console.log('Script execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script execution failed:', error);
    process.exit(1);
  }); 