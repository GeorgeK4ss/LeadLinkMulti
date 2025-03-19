import { User as FirebaseUser } from 'firebase/auth';

// Legacy role types - keep for compatibility
export type CompanyRoleType = 'company_admin' | 'company_manager' | 'company_user' | 'company_support' | 'company_billing';
export type TenantRoleType = 'tenant_admin' | 'tenant_manager' | 'tenant_agent';
export type SystemRoleType = 'system_admin';
export type RoleType = SystemRoleType | CompanyRoleType | TenantRoleType;

// New simplified role types for custom claims
export type CustomClaimRoleType = 'admin' | 'tenantAdmin' | 'manager' | 'user' | 'guest';

// Permission types
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage';
export type PermissionResource = 'users' | 'companies' | 'tenants' | 'leads' | 'customers' | 'activities' | 'settings' | 'billing' | 'support' | 'plans' | 'subscriptions';

export type Permission = 
  | 'users:read' 
  | 'users:write' 
  | 'leads:read' 
  | 'leads:write' 
  | 'contacts:read' 
  | 'contacts:write'
  | 'companies:read'
  | 'companies:write'
  | 'admin:settings'
  | 'billing:read'
  | 'billing:write'
  | 'reports:read'
  | 'reports:write';

// Legacy role interface - keep for compatibility
export interface Role {
  id: RoleType;
  name: string;
  description: string;
  permissions: Permission[];
  scope: 'system' | 'company' | 'tenant';
}

// Legacy user role interface - keep for compatibility
export interface UserRole {
  userId: string;
  roleId: RoleType;
  companyId?: string;
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// New custom claims user role interface
export interface CustomClaimUserRole {
  userId: string;
  role: CustomClaimRoleType;
  tenantId: string;
  companyId?: string;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

// Custom claims as stored in Firebase auth token
export interface CustomClaims {
  role?: CustomClaimUserRole;
  permissions?: string[];
  tenants?: Record<string, CustomClaimUserRole>;
}

// Extended user type with custom claims
export interface AuthUser extends FirebaseUser {
  customClaims?: CustomClaims;
}

// Default role configurations
export const DEFAULT_ROLES: Record<RoleType, Role> = {
  // System Level
  system_admin: {
    id: 'system_admin',
    name: 'System Administrator',
    description: 'Full system access with all permissions',
    scope: 'system',
    permissions: [
      'create:users', 'read:users', 'update:users', 'delete:users', 'manage:users',
      'create:companies', 'read:companies', 'update:companies', 'delete:companies', 'manage:companies',
      'create:tenants', 'read:tenants', 'update:tenants', 'delete:tenants', 'manage:tenants',
      'create:leads', 'read:leads', 'update:leads', 'delete:leads', 'manage:leads',
      'create:customers', 'read:customers', 'update:customers', 'delete:customers', 'manage:customers',
      'create:activities', 'read:activities', 'update:activities', 'delete:activities', 'manage:activities',
      'create:settings', 'read:settings', 'update:settings', 'delete:settings', 'manage:settings',
      'create:billing', 'read:billing', 'update:billing', 'delete:billing', 'manage:billing',
      'create:support', 'read:support', 'update:support', 'delete:support', 'manage:support'
    ]
  },

  // Company Level Roles
  company_admin: {
    id: 'company_admin',
    name: 'Company Administrator',
    description: 'Full access to company resources and tenant management',
    scope: 'company',
    permissions: [
      'create:users', 'read:users', 'update:users', 'delete:users', 'manage:users',
      'read:companies', 'update:companies',
      'create:tenants', 'read:tenants', 'update:tenants', 'delete:tenants', 'manage:tenants',
      'manage:leads', 'manage:customers', 'manage:activities',
      'read:settings', 'update:settings',
      'read:billing', 'update:billing',
      'read:support', 'create:support'
    ]
  },
  company_manager: {
    id: 'company_manager',
    name: 'Company Manager',
    description: 'Manages company operations and tenant oversight',
    scope: 'company',
    permissions: [
      'read:users', 'create:users', 'update:users',
      'read:companies',
      'read:tenants', 'update:tenants', 'manage:tenants',
      'read:leads', 'manage:leads',
      'read:customers', 'manage:customers',
      'read:activities', 'manage:activities',
      'read:settings',
      'read:billing',
      'read:support', 'create:support'
    ]
  },
  company_user: {
    id: 'company_user',
    name: 'Company User',
    description: 'Basic company user with limited access',
    scope: 'company',
    permissions: [
      'read:users',
      'read:companies',
      'read:tenants',
      'read:leads',
      'read:customers',
      'read:activities',
      'read:settings',
      'create:support'
    ]
  },
  company_support: {
    id: 'company_support',
    name: 'Company Support',
    description: 'Handles support tickets and customer service',
    scope: 'company',
    permissions: [
      'read:users',
      'read:tenants',
      'read:leads',
      'read:customers',
      'read:activities',
      'read:support', 'update:support', 'manage:support',
      'read:settings'
    ]
  },
  company_billing: {
    id: 'company_billing',
    name: 'Company Billing',
    description: 'Manages company billing and financial operations',
    scope: 'company',
    permissions: [
      'read:users',
      'read:companies',
      'read:tenants',
      'read:billing', 'update:billing', 'manage:billing',
      'read:settings'
    ]
  },

  // Tenant Level Roles
  tenant_admin: {
    id: 'tenant_admin',
    name: 'Tenant Administrator',
    description: 'Full access to tenant resources and agent management',
    scope: 'tenant',
    permissions: [
      'create:users', 'read:users', 'update:users', 'manage:users',
      'read:tenants', 'update:tenants',
      'create:leads', 'read:leads', 'update:leads', 'delete:leads', 'manage:leads',
      'create:customers', 'read:customers', 'update:customers', 'delete:customers', 'manage:customers',
      'create:activities', 'read:activities', 'update:activities', 'delete:activities', 'manage:activities',
      'read:settings', 'update:settings',
      'create:support', 'read:support'
    ]
  },
  tenant_manager: {
    id: 'tenant_manager',
    name: 'Tenant Manager',
    description: 'Manages tenant operations and agent oversight',
    scope: 'tenant',
    permissions: [
      'read:users', 'create:users',
      'read:tenants',
      'create:leads', 'read:leads', 'update:leads', 'manage:leads',
      'create:customers', 'read:customers', 'update:customers', 'manage:customers',
      'create:activities', 'read:activities', 'update:activities', 'manage:activities',
      'read:settings',
      'create:support', 'read:support'
    ]
  },
  tenant_agent: {
    id: 'tenant_agent',
    name: 'Tenant Agent',
    description: 'Handles leads and customer interactions',
    scope: 'tenant',
    permissions: [
      'read:users',
      'create:leads', 'read:leads', 'update:leads',
      'create:customers', 'read:customers', 'update:customers',
      'create:activities', 'read:activities', 'update:activities',
      'read:settings',
      'create:support'
    ]
  }
};

export interface UserRoleAssignment {
  id: string;
  userId: string;
  tenantId: string;
  role: CustomClaimUserRole;
  createdAt: Date;
  updatedAt: Date;
}

// Standard interface for role-based access control permissions
export interface RBACPermissions {
  admin: Permission[];
  tenantAdmin: Permission[];
  manager: Permission[];
  user: Permission[];
  guest: Permission[];
} 