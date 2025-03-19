export interface GeneralSettings {
  systemName: string;
  supportEmail: string;
  maxUsersPerTenant: number;
  maxTenantsPerCompany: number;
  enableUserRegistration: boolean;
  enableCompanyRegistration: boolean;
  maintenanceMode: boolean;
}

export interface SecuritySettings {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  sessionTimeout: number; // minutes
  maxLoginAttempts: number;
  mfaEnabled: boolean;
  allowedIPs: string[];
}

export interface IntegrationSettings {
  emailService: {
    provider: 'none' | 'sendgrid' | 'mailchimp' | 'custom';
    apiKey: string;
    fromEmail: string;
  };
  smsService: {
    provider: 'none' | 'twilio' | 'custom';
    apiKey: string;
    fromNumber: string;
  };
  analytics: {
    provider: 'none' | 'google-analytics' | 'mixpanel' | 'custom';
    trackingId: string;
  };
}

export interface FeatureFlag {
  name: string;
  description: string;
  enabled: boolean;
  scope: 'system' | 'company' | 'tenant';
} 