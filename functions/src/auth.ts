import { beforeUserCreated } from "firebase-functions/v2/identity";
import * as admin from "firebase-admin";
import type { AuthBlockingEvent } from "firebase-functions/v2/identity";
import * as functions from 'firebase-functions';
import { CustomClaimRoleType, Permission } from '../../../src/lib/types/auth';

// Define custom claim types directly in this file to avoid import issues
type CustomClaimRoleType = 'admin' | 'tenantAdmin' | 'manager' | 'user' | 'guest';
type Permission = string; // Simplified for cloud functions

// Handle user creation and set custom claims
export const onUserCreated = beforeUserCreated(async (event: AuthBlockingEvent) => {
  if (!event.data) {
    throw new Error("No user data provided");
  }

  try {
    // Create a user document in Firestore
    await admin.firestore().collection("users").doc(event.data.uid).set({
      email: event.data.email,
      displayName: event.data.displayName,
      photoURL: event.data.photoURL,
      role: "tenant", // Default role
      permissions: ["read:own", "write:own"],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Set custom claims
    const customClaims = {
      role: "tenant",
      permissions: ["read:own", "write:own"],
    };

    return { customClaims };
  } catch (error) {
    console.error("Error in user creation process:", error);
    throw new Error("Failed to complete user creation process");
  }
});

// Define permissions by role - should be kept in sync with client-side definitions
const ROLE_PERMISSIONS: Record<CustomClaimRoleType, Permission[]> = {
  admin: [
    'read:all',
    'write:all',
    'manage:users',
    'manage:tenants',
    'manage:companies',
    'manage:subscriptions',
    'manage:plans',
    'manage:settings',
    'access:admin'
  ],
  tenantAdmin: [
    'read:tenant',
    'write:tenant',
    'manage:tenant_users',
    'manage:tenant_settings',
    'access:tenant_admin'
  ],
  manager: [
    'read:tenant',
    'create:leads',
    'update:leads',
    'read:leads',
    'create:customers',
    'update:customers',
    'read:customers',
    'manage:assigned_users'
  ],
  user: [
    'read:tenant',
    'create:leads', 
    'update:leads',
    'read:leads',
    'create:customers',
    'update:customers',
    'read:customers'
  ],
  guest: [
    'read:tenant'
  ]
};

// Types for callable function data
interface SetCustomClaimsData {
  userId: string;
  role: CustomClaimRoleType;
  tenantId?: string;
  companyId?: string;
}

interface GetUserRoleData {
  userId: string;
}

/**
 * Set custom claims for a user
 * This function should be called by administrators or system processes
 */
export const setCustomClaims = functions.https.onCall(async (data, context) => {
  // Security check - only admins can set custom claims
  if (!context?.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  
  try {
    // Get caller's custom claims to check if they're an admin
    const callerUid = context.auth.uid;
    const callerUser = await admin.auth().getUser(callerUid);
    const callerClaims = callerUser.customClaims || {};
    
    if (callerClaims.role !== 'admin' && data.role === 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can create other admin users.'
      );
    }

    const { userId, role, tenantId, companyId } = data;
    
    if (!userId || !role) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'The function must be called with userId and role.'
      );
    }
    
    // Security check for tenant admins
    if (callerClaims.role === 'tenantAdmin') {
      // Tenant admins can only manage users in their own tenant
      if (callerClaims.tenantId !== tenantId) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Tenant admins can only manage users in their own tenant.'
        );
      }
      
      // Tenant admins can't create admin users
      if (role === 'admin') {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Tenant admins cannot create system admins.'
        );
      }
    }
    
    // Set the custom claims
    const customClaims = {
      role,
      tenantId: tenantId || '',
      companyId: companyId || '',
      permissions: ROLE_PERMISSIONS[role as CustomClaimRoleType] || []
    };
    
    await admin.auth().setCustomUserClaims(userId, customClaims);
    
    // Update the user document to force token refresh
    await admin.firestore().collection('customUserRoles').doc(userId).set({
      userId,
      role,
      tenantId: tenantId || '',
      companyId: companyId || '',
      permissions: ROLE_PERMISSIONS[role as CustomClaimRoleType] || [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error('Error setting custom claims:', error);
    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while setting custom claims.'
    );
  }
});

/**
 * Get a user's role and permissions
 */
export const getUserRole = functions.https.onCall(async (data, context) => {
  // Security check - must be authenticated
  if (!context?.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  
  const { userId } = data;
  
  if (!userId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The function must be called with userId.'
    );
  }
  
  // Security check - users can only get their own role unless they're an admin
  const callerUid = context.auth.uid;
  const callerUser = await admin.auth().getUser(callerUid);
  const callerClaims = callerUser.customClaims || {};
  
  if (callerUid !== userId && callerClaims.role !== 'admin') {
    const targetUser = await admin.auth().getUser(userId);
    const targetClaims = targetUser.customClaims || {};
    
    // Tenant admins can get roles for users in their tenant
    if (
      callerClaims.role !== 'tenantAdmin' || 
      callerClaims.tenantId !== targetClaims.tenantId
    ) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Users can only get their own role unless they are an admin or tenant admin.'
      );
    }
  }
  
  try {
    // Get the user's custom claims
    const user = await admin.auth().getUser(userId);
    const claims = user.customClaims || {};
    
    // Get the user's role from Firestore for additional details
    const roleDoc = await admin.firestore().collection('customUserRoles').doc(userId).get();
    const roleData = roleDoc.exists ? roleDoc.data() : null;
    
    return { 
      auth: {
        role: claims.role || null,
        tenantId: claims.tenantId || null,
        companyId: claims.companyId || null,
        permissions: claims.permissions || []
      },
      firestore: roleData
    };
  } catch (error) {
    console.error('Error getting user role:', error);
    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while getting the user role.'
    );
  }
});

/**
 * Remove user custom claims
 */
export const removeCustomClaims = functions.https.onCall(async (data, context) => {
  // Security check - only admins can remove custom claims
  if (!context?.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  
  const { userId } = data;
  
  if (!userId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The function must be called with userId.'
    );
  }
  
  // Security check for admins and tenant admins
  const callerUid = context.auth.uid;
  const callerUser = await admin.auth().getUser(callerUid);
  const callerClaims = callerUser.customClaims || {};
  
  // Get the target user to check their tenant
  const targetUser = await admin.auth().getUser(userId);
  const targetClaims = targetUser.customClaims || {};
  
  // Tenant admins can only remove claims from users in their tenant
  if (
    callerClaims.role !== 'admin' && 
    (callerClaims.role !== 'tenantAdmin' || callerClaims.tenantId !== targetClaims.tenantId)
  ) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins or tenant admins (for their own tenant) can remove user claims.'
    );
  }
  
  // Prevent removing admin claims unless you're an admin
  if (targetClaims.role === 'admin' && callerClaims.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can remove admin claims.'
    );
  }
  
  try {
    // Clear the custom claims
    await admin.auth().setCustomUserClaims(userId, null);
    
    // Delete the role document from Firestore
    await admin.firestore().collection('customUserRoles').doc(userId).delete();
    
    return { success: true };
  } catch (error) {
    console.error('Error removing custom claims:', error);
    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while removing custom claims.'
    );
  }
});
