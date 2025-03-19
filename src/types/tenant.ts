export type TenantStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface TenantSettings {
  general: {
    tenantName: string;
    timezone: string;
    language: string;
    notificationsEnabled: boolean;
  };
  branding: {
    primaryColor: string;
    logo: string;
    customDomain: string;
  };
  workflow: {
    autoAssignLeads: boolean;
    leadFollowUpDays: number;
    requireLeadApproval: boolean;
    allowDuplicateLeads: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    notifyOnNewLead: boolean;
    notifyOnLeadUpdate: boolean;
    dailyDigest: boolean;
  };
}

export interface TenantLimits {
  maxUsers: number;
  maxLeads: number;
  maxStorage: number; // in MB
  maxEmailsPerMonth: number;
  maxSmsPerMonth: number;
}

export interface TenantUsage {
  users: number;
  leads: number;
  storage: number; // in MB
  emailsSent: number;
  smsSent: number;
}

export interface Tenant {
  id: string;
  name: string;
  companyId: string;
  status: TenantStatus;
  settings: TenantSettings;
  limits: TenantLimits;
  usage: TenantUsage;
  createdAt: string;
  lastUpdated: string;
  industry?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
} 