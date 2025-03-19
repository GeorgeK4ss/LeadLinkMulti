// Script to assign roles to users in Firebase
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, collection, getDocs, serverTimestamp } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Load Firebase configuration from .env file
require('dotenv').config({ path: '.env.local' });

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Role assignments for each user
const roleAssignments = [
  {
    userId: "OKqFv3f4HdWiKXrC6SdVCDeOVzQ2", // agent@leadlink.com
    roleId: "tenant_agent",
    tenantId: "default-tenant"
  },
  {
    userId: "ZVEiU5l59gYItRiq225Donz6IYH3", // tenant@leadlink.com
    roleId: "tenant_admin",
    tenantId: "default-tenant"
  },
  {
    userId: "3rRDU8uIJwdUHpJJLmIdGUwPyJk2", // company@leadlink.com
    roleId: "company_admin",
    companyId: "default-company"
  },
  {
    userId: "aMtp1zZfMBX2mUR1Mxa7xnOSj0E3", // admin@leadlink.com
    roleId: "system_admin"
  }
];

// Check existing roles in the database
async function checkExistingRoles() {
  console.log('📋 Checking existing user roles...');
  
  try {
    const userRolesRef = collection(db, 'userRoles');
    const snapshot = await getDocs(userRolesRef);
    
    if (snapshot.empty) {
      console.log('  No existing roles found in the database.');
      return [];
    }
    
    const roles = [];
    snapshot.forEach(doc => {
      roles.push({
        userId: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`  Found ${roles.length} existing role assignments:`);
    roles.forEach(role => {
      console.log(`  - User ${role.userId}: ${role.roleId} ${role.companyId ? `(Company: ${role.companyId})` : ''} ${role.tenantId ? `(Tenant: ${role.tenantId})` : ''}`);
    });
    
    return roles;
  } catch (error) {
    console.error('  Error checking existing roles:', error);
    return [];
  }
}

// Function to assign a role
async function assignRole(userId, roleId, companyId, tenantId) {
  // First check if the role already exists
  try {
    const roleDoc = await getDoc(doc(db, 'userRoles', userId));
    if (roleDoc.exists()) {
      const existingRole = roleDoc.data();
      console.log(`ℹ️ User ${userId} already has role: ${existingRole.roleId}`);
      
      // Check if the roles are the same
      if (existingRole.roleId === roleId && 
          existingRole.companyId === (companyId || null) && 
          existingRole.tenantId === (tenantId || null)) {
        console.log(`  Role is already correct, skipping update.`);
        return true;
      }
      
      console.log(`  Updating from role '${existingRole.roleId}' to '${roleId}'`);
    }
  } catch (error) {
    console.error(`  Error checking existing role for ${userId}:`, error);
  }

  const userRole = {
    userId,
    roleId,
    companyId: companyId || null,
    tenantId: tenantId || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    await setDoc(doc(db, 'userRoles', userId), userRole);
    console.log(`✅ Role '${roleId}' assigned to user '${userId}'`);
    return true;
  } catch (error) {
    console.error(`❌ Error assigning role to user '${userId}':`, error);
    return false;
  }
}

// Execute role assignments
async function assignRoles() {
  console.log('🚀 Starting role assignment process...');
  console.log(`Firebase Project: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
  
  // Check existing roles first
  await checkExistingRoles();
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const assignment of roleAssignments) {
    const success = await assignRole(
      assignment.userId,
      assignment.roleId,
      assignment.companyId,
      assignment.tenantId
    );
    
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
  }
  
  console.log('\n📊 Role Assignment Summary:');
  console.log(`✅ Successfully assigned: ${successCount}`);
  console.log(`❌ Failed assignments: ${failureCount}`);
  console.log('✨ Process complete');
}

// Run the script
assignRoles()
  .then(() => {
    console.log('Script execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script execution failed:', error);
    process.exit(1);
  }); 