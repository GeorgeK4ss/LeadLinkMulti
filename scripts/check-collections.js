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

// Check companies collection
async function checkCompanies() {
  console.log('\n🏢 Checking companies collection:');
  
  try {
    const companiesSnapshot = await db.collection('companies').get();
    
    if (companiesSnapshot.empty) {
      console.log('  No companies found');
      return;
    }
    
    console.log(`  Found ${companiesSnapshot.size} companies:`);
    
    for (const companyDoc of companiesSnapshot.docs) {
      const companyData = companyDoc.data();
      console.log(`\n  📄 Company (${companyDoc.id}):`);
      console.log(`    - Name: ${companyData.name || 'N/A'}`);
      console.log(`    - Status: ${companyData.status || 'N/A'}`);
      console.log(`    - Industry: ${companyData.industry || 'N/A'}`);
      if (companyData.address) {
        console.log(`    - Address: ${companyData.address.city || 'N/A'}, ${companyData.address.country || 'N/A'}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error checking companies: ${error.message}`);
  }
}

// Check tenants collection
async function checkTenants() {
  console.log('\n🏘️ Checking tenants collection:');
  
  try {
    const tenantsSnapshot = await db.collection('tenants').get();
    
    if (tenantsSnapshot.empty) {
      console.log('  No tenants found');
      return;
    }
    
    console.log(`  Found ${tenantsSnapshot.size} tenants:`);
    
    for (const tenantDoc of tenantsSnapshot.docs) {
      const tenantData = tenantDoc.data();
      console.log(`\n  📄 Tenant (${tenantDoc.id}):`);
      console.log(`    - Name: ${tenantData.name || 'N/A'}`);
      console.log(`    - Company ID: ${tenantData.companyId || 'N/A'}`);
      console.log(`    - Status: ${tenantData.status || 'N/A'}`);
      console.log(`    - Tier: ${tenantData.tier || 'N/A'}`);
    }
  } catch (error) {
    console.error(`❌ Error checking tenants: ${error.message}`);
  }
}

// Check users with their roles
async function checkUsers() {
  console.log('\n👥 Checking users collection:');
  
  try {
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('  No users found');
      return;
    }
    
    console.log(`  Found ${usersSnapshot.size} users:`);
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      console.log(`\n  📄 User (${userId}):`);
      console.log(`    - Email: ${userData.email || 'N/A'}`);
      console.log(`    - Display Name: ${userData.displayName || 'N/A'}`);
      console.log(`    - Role: ${userData.role || 'N/A'}`);
      console.log(`    - Tenant ID: ${userData.tenantId || 'N/A'}`);
      console.log(`    - Company ID: ${userData.companyId || 'N/A'}`);
      
      // Get role data
      try {
        const roleDoc = await db.collection('userRoles').doc(userId).get();
        
        if (roleDoc.exists) {
          const roleData = roleDoc.data();
          console.log(`    - Role ID: ${roleData.roleId || 'N/A'}`);
        } else {
          console.log(`    - Role: No role document found`);
        }
      } catch (error) {
        console.log(`    - Role: Error getting role - ${error.message}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error checking users: ${error.message}`);
  }
}

// Main function to check all collections
async function checkAllCollections() {
  console.log('🔍 Checking Firestore collections...');
  
  await checkCompanies();
  await checkTenants();
  await checkUsers();
  
  console.log('\n✅ Check complete');
}

// Run the script
checkAllCollections()
  .then(() => {
    console.log('Script execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script execution failed:', error);
    process.exit(1);
  }); 