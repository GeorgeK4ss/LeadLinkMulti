// System level roles
export type SystemRole = 'system_admin';

// Company level roles
export type CompanyRole = 'company_admin' | 'company_manager' | 'company_user' | 'company_support' | 'company_billing';

// Tenant level roles
export type TenantRole = 'tenant_admin' | 'tenant_manager' | 'tenant_agent';

// Combined roles
export type UserRole = SystemRole | CompanyRole | TenantRole;

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'invited' | 'pending';

export interface UserProfile {
  avatar?: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  department?: string;
  phone?: string;
  bio?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    inApp: boolean;
    digest: boolean;
  };
  dashboardLayout?: Record<string, any>;
}

export interface UserActivity {
  lastLogin?: string;
  loginCount: number;
  lastActive?: string;
  deviceInfo?: {
    browser: string;
    os: string;
    device: string;
  };
}

export interface UserPermissions {
  canCreateLeads: boolean;
  canEditLeads: boolean;
  canDeleteLeads: boolean;
  canAssignLeads: boolean;
  canExportData: boolean;
  canManageUsers: boolean;
  canManageSettings: boolean;
}

export interface User {
  id: string;
  uid: string; // Firebase Auth UID
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  tenantId?: string;
  companyId?: string;
  profile?: UserProfile;
  preferences?: UserPreferences;
  activity?: UserActivity;
  permissions?: UserPermissions;
  createdAt: string;
  lastUpdated: string;
} 