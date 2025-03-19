import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { auth } from '@/lib/firebase/admin';
import { User } from 'firebase/auth';
import { 
  type CustomClaimRoleType, 
  type Permission,
  type CustomClaimUserRole,
  type CustomClaims
} from '@/lib/types/auth';

// Define permissions by role
export const ROLE_PERMISSIONS: Record<CustomClaimRoleType, Permission[]> = {
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

export class CustomClaimsService {
  /**
   * Set custom claims for a user (requires admin SDK)
   * This should be called from a Cloud Function or secure server environment
   */
  async setUserCustomClaims(userId: string, claims: Record<string, any> | null): Promise<void> {
    try {
      const user = await auth.getUser(userId);
      await auth.setCustomUserClaims(userId, claims || {});
      
      // Update the metadata to force token refresh
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, { 
        customClaimsUpdatedAt: new Date().toISOString()
      }, { merge: true });
      
      return;
    } catch (error) {
      console.error('Error setting custom claims:', error);
      throw new Error('Failed to set custom claims');
    }
  }

  /**
   * Set role for a user with custom claims
   */
  async setUserRole(
    userId: string, 
    role: CustomClaimRoleType, 
    tenantId?: string, 
    companyId?: string
  ): Promise<void> {
    try {
      // Set role in Firestore
      const roleAssignment: Omit<CustomClaimUserRole, 'id'> = {
        userId,
        role,
        tenantId: tenantId || '',
        companyId,
        permissions: ROLE_PERMISSIONS[role],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const roleRef = doc(db, 'customUserRoles', userId);
      await setDoc(roleRef, roleAssignment);
      
      // Set custom claims
      const customClaims: CustomClaims = {
        role,
        tenantId: tenantId || '',
        companyId,
        permissions: ROLE_PERMISSIONS[role]
      };
      
      await this.setUserCustomClaims(userId, customClaims);
      
      return;
    } catch (error) {
      console.error('Error setting user role:', error);
      throw new Error('Failed to set user role');
    }
  }

  /**
   * Get user role by user ID
   */
  async getUserRole(userId: string): Promise<CustomClaimUserRole | null> {
    try {
      const roleRef = doc(db, 'customUserRoles', userId);
      const roleDoc = await getDoc(roleRef);
      
      if (!roleDoc.exists()) {
        return null;
      }
      
      return {
        id: roleDoc.id,
        ...roleDoc.data()
      } as unknown as CustomClaimUserRole;
    } catch (error) {
      console.error('Error getting user role:', error);
      throw new Error('Failed to get user role');
    }
  }

  /**
   * Get all user roles for a tenant
   */
  async getTenantUserRoles(tenantId: string): Promise<CustomClaimUserRole[]> {
    try {
      const rolesCollection = collection(db, 'customUserRoles');
      const rolesQuery = query(rolesCollection, where('tenantId', '==', tenantId));
      const rolesSnapshot = await getDocs(rolesQuery);
      
      return rolesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as unknown as CustomClaimUserRole));
    } catch (error) {
      console.error('Error getting tenant user roles:', error);
      throw new Error('Failed to get tenant user roles');
    }
  }

  /**
   * Delete a user role
   */
  async deleteUserRole(userId: string): Promise<void> {
    try {
      const roleRef = doc(db, 'customUserRoles', userId);
      await deleteDoc(roleRef);
      
      // Remove custom claims
      await this.setUserCustomClaims(userId, {});
      
      return;
    } catch (error) {
      console.error('Error deleting user role:', error);
      throw new Error('Failed to delete user role');
    }
  }

  /**
   * Check if user has a specific permission
   * Client-side function to check against user object with custom claims
   */
  async hasPermission(user: User, permission: string): Promise<boolean> {
    if (!user) {
      return false;
    }
    
    try {
      const tokenResult = await user.getIdTokenResult();
      const claims = tokenResult.claims;
      
      if (!claims || !claims.permissions) {
        return false;
      }
      
      return (claims.permissions as string[]).includes(permission);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Check if user has access to a specific tenant
   * Client-side function to check against user object with custom claims
   */
  async hasTenantAccess(user: User, tenantId: string): Promise<boolean> {
    if (!user) {
      return false;
    }
    
    try {
      const tokenResult = await user.getIdTokenResult();
      const claims = tokenResult.claims;
      
      if (!claims) {
        return false;
      }
      
      // Admin has access to all tenants
      if (claims.role === 'admin') {
        return true;
      }
      
      return claims.tenantId === tenantId;
    } catch (error) {
      console.error('Error checking tenant access:', error);
      return false;
    }
  }

  /**
   * Check if user is an admin
   * Client-side function to check against user object with custom claims
   */
  async isAdmin(user: User): Promise<boolean> {
    if (!user) {
      return false;
    }
    
    try {
      const tokenResult = await user.getIdTokenResult();
      const claims = tokenResult.claims;
      
      if (!claims) {
        return false;
      }
      
      return claims.role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  /**
   * Check if user is a tenant admin for a specific tenant
   * Client-side function to check against user object with custom claims
   */
  async isTenantAdmin(user: User, tenantId: string): Promise<boolean> {
    if (!user) {
      return false;
    }
    
    try {
      const tokenResult = await user.getIdTokenResult();
      const claims = tokenResult.claims;
      
      if (!claims) {
        return false;
      }
      
      return claims.role === 'tenantAdmin' && claims.tenantId === tenantId;
    } catch (error) {
      console.error('Error checking tenant admin status:', error);
      return false;
    }
  }
}

export const customClaimsService = new CustomClaimsService();
export default customClaimsService; 