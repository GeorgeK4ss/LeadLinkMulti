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

// Define role types
export type RoleType = 'admin' | 'tenantAdmin' | 'manager' | 'user' | 'guest';

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

// Role assignment interface
export interface UserRoleAssignment {
  id: string;
  userId: string;
  role: RoleType;
  tenantId: string;
  companyId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Set custom claims for a user (requires admin SDK)
 * This should be called from a Cloud Function or secure server environment
 */
export async function setUserCustomClaims(userId: string, claims: Record<string, any> | null): Promise<void> {
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
export async function setUserRole(
  userId: string, 
  role: CustomClaimRoleType, 
  tenantId: string, 
  companyId?: string
): Promise<void> {
  try {
    // Set role in Firestore
    const roleAssignment: Omit<CustomClaimUserRole, 'id'> = {
      userId,
      role,
      tenantId,
      companyId,
      permissions: ROLE_PERMISSIONS[role],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const roleRef = doc(db, 'userRoles', userId);
    await setDoc(roleRef, roleAssignment);
    
    // Set custom claims
    const customClaims: CustomClaims = {
      role,
      tenantId,
      companyId,
      permissions: ROLE_PERMISSIONS[role]
    };
    
    await setUserCustomClaims(userId, customClaims);
    
    return;
  } catch (error) {
    console.error('Error setting user role:', error);
    throw new Error('Failed to set user role');
  }
}

/**
 * Get user role by user ID
 */
export async function getUserRole(userId: string): Promise<CustomClaimUserRole | null> {
  try {
    const roleRef = doc(db, 'userRoles', userId);
    const roleDoc = await getDoc(roleRef);
    
    if (!roleDoc.exists()) {
      return null;
    }
    
    const data = roleDoc.data();
    return {
      id: roleDoc.id,
      userId: data.userId,
      role: data.role,
      tenantId: data.tenantId,
      companyId: data.companyId,
      permissions: data.permissions,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    } as CustomClaimUserRole;
  } catch (error) {
    console.error('Error getting user role:', error);
    throw new Error('Failed to get user role');
  }
}

/**
 * Get all user roles for a tenant
 */
export async function getTenantUserRoles(tenantId: string): Promise<CustomClaimUserRole[]> {
  try {
    const rolesCollection = collection(db, 'userRoles');
    const rolesQuery = query(rolesCollection, where('tenantId', '==', tenantId));
    const rolesSnapshot = await getDocs(rolesQuery);
    
    return rolesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        role: data.role,
        tenantId: data.tenantId,
        companyId: data.companyId,
        permissions: data.permissions,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      } as CustomClaimUserRole;
    });
  } catch (error) {
    console.error('Error getting tenant user roles:', error);
    throw new Error('Failed to get tenant user roles');
  }
}

/**
 * Delete a user role
 */
export async function deleteUserRole(userId: string): Promise<void> {
  try {
    const roleRef = doc(db, 'userRoles', userId);
    await deleteDoc(roleRef);
    
    // Remove custom claims
    await setUserCustomClaims(userId, null);
    
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
export async function hasPermission(user: User, permission: string): Promise<boolean> {
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
export async function hasTenantAccess(user: User, tenantId: string): Promise<boolean> {
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
export async function isAdmin(user: User): Promise<boolean> {
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
export async function isTenantAdmin(user: User, tenantId: string): Promise<boolean> {
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

export class RBACService {
  private static instance: RBACService;
  private constructor() {}

  static getInstance(): RBACService {
    if (!RBACService.instance) {
      RBACService.instance = new RBACService();
    }
    return RBACService.instance;
  }

  // Assign a role to a user
  async assignRole(userId: string, role: RoleType, companyId?: string, tenantId?: string): Promise<void> {
    const userRole: UserRoleAssignment = {
      id: userId,
      userId,
      role,
      companyId,
      tenantId: tenantId || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'userRoles', userId), userRole);
  }

  // Get user's role
  async getUserRole(userId: string): Promise<UserRoleAssignment | null> {
    const roleDoc = await getDoc(doc(db, 'userRoles', userId));
    return roleDoc.exists() ? roleDoc.data() as UserRoleAssignment : null;
  }

  // Get user's permissions
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const userRole = await this.getUserRole(userId);
    if (!userRole) return [];
    
    const roleType = userRole.role as unknown as CustomClaimRoleType;
    return ROLE_PERMISSIONS[roleType] || [];
  }

  // Check if user has a specific permission
  async hasPermission(userId: string, permission: Permission): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permission);
  }

  // Check if user has any of the specified permissions
  async hasAnyPermission(userId: string, permissions: Permission[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return permissions.some(permission => userPermissions.includes(permission));
  }

  // Check if user has all of the specified permissions
  async hasAllPermissions(userId: string, permissions: Permission[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return permissions.every(permission => userPermissions.includes(permission));
  }

  // Get all users with a specific role
  async getUsersByRole(roleId: RoleType): Promise<UserRoleAssignment[]> {
    const q = query(collection(db, 'userRoles'), where('roleId', '==', roleId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as UserRoleAssignment);
  }

  // Get all users in a company
  async getUsersByCompany(companyId: string): Promise<UserRoleAssignment[]> {
    const q = query(collection(db, 'userRoles'), where('companyId', '==', companyId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as UserRoleAssignment);
  }

  // Get all users in a tenant
  async getUsersByTenant(tenantId: string): Promise<UserRoleAssignment[]> {
    const q = query(collection(db, 'userRoles'), where('tenantId', '==', tenantId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as UserRoleAssignment);
  }

  // Remove role from user
  async removeRole(userId: string): Promise<void> {
    await deleteDoc(doc(db, 'userRoles', userId));
  }

  // Update user's role
  async updateRole(userId: string, updates: Partial<UserRoleAssignment>): Promise<void> {
    const userRole = await this.getUserRole(userId);
    if (!userRole) throw new Error('User role not found');

    const updatedRole = {
      ...userRole,
      ...updates,
      updatedAt: new Date()
    } as UserRoleAssignment;

    await setDoc(doc(db, 'userRoles', userId), updatedRole);
  }
} 