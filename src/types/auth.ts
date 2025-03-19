import { User as FirebaseUser } from 'firebase/auth';

export interface UserData {
  tenantId?: string;
  role?: UserRole;
  permissions?: UserPermission[];
}

export type AuthUser = FirebaseUser & UserData;

export type UserRole = 'admin' | 'manager' | 'user' | 'guest';

export enum UserPermission {
  // Tenant management
  MANAGE_TENANTS = 'manage:tenants',
  VIEW_TENANTS = 'view:tenants',
  
  // User management
  MANAGE_USERS = 'manage:users',
  VIEW_USERS = 'view:users',
  
  // Customer management
  MANAGE_CUSTOMERS = 'manage:customers',
  VIEW_CUSTOMERS = 'view:customers',
  
  // Lead management
  MANAGE_LEADS = 'manage:leads',
  VIEW_LEADS = 'view:leads',
  
  // Task management
  MANAGE_TASKS = 'manage:tasks',
  VIEW_TASKS = 'view:tasks',
  
  // Activity management
  MANAGE_ACTIVITIES = 'manage:activities',
  VIEW_ACTIVITIES = 'view:activities',
  
  // Workflow management
  MANAGE_WORKFLOWS = 'manage:workflows',
  VIEW_WORKFLOWS = 'view:workflows',
  
  // Report management
  MANAGE_REPORTS = 'manage:reports',
  VIEW_REPORTS = 'view:reports',
  
  // Analytics
  VIEW_ANALYTICS = 'view:analytics',
  
  // Settings
  MANAGE_SETTINGS = 'manage:settings',
  VIEW_SETTINGS = 'view:settings',
}

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, UserPermission[]> = {
  admin: Object.values(UserPermission),
  manager: [
    UserPermission.VIEW_TENANTS,
    UserPermission.MANAGE_USERS,
    UserPermission.VIEW_USERS,
    UserPermission.MANAGE_CUSTOMERS,
    UserPermission.VIEW_CUSTOMERS,
    UserPermission.MANAGE_LEADS,
    UserPermission.VIEW_LEADS,
    UserPermission.MANAGE_TASKS,
    UserPermission.VIEW_TASKS,
    UserPermission.MANAGE_ACTIVITIES,
    UserPermission.VIEW_ACTIVITIES,
    UserPermission.MANAGE_WORKFLOWS,
    UserPermission.VIEW_WORKFLOWS,
    UserPermission.MANAGE_REPORTS,
    UserPermission.VIEW_REPORTS,
    UserPermission.VIEW_ANALYTICS,
    UserPermission.VIEW_SETTINGS,
  ],
  user: [
    UserPermission.VIEW_CUSTOMERS,
    UserPermission.VIEW_LEADS,
    UserPermission.MANAGE_TASKS,
    UserPermission.VIEW_TASKS,
    UserPermission.VIEW_ACTIVITIES,
    UserPermission.VIEW_WORKFLOWS,
    UserPermission.VIEW_REPORTS,
  ],
  guest: [
    UserPermission.VIEW_CUSTOMERS,
    UserPermission.VIEW_LEADS,
    UserPermission.VIEW_TASKS,
  ],
};

export interface Tenant {
  id: string;
  name: string;
  plan?: 'free' | 'pro' | 'enterprise';
  createdAt?: Date | string;
  updatedAt?: Date | string;
  ownerId?: string;
  settings?: TenantSettings;
}

export interface TenantSettings {
  theme?: 'light' | 'dark' | 'system';
  logo?: string;
  colors?: {
    primary?: string;
    secondary?: string;
  };
  features?: {
    workflows?: boolean;
    reports?: boolean;
    analytics?: boolean;
  };
} 