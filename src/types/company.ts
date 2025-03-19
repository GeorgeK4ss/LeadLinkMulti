import { Timestamp } from 'firebase/firestore';

export type CompanyStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export type CompanyPlan = 'free' | 'starter' | 'professional' | 'enterprise' | 'custom';

export interface CompanyAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CompanyBilling {
  plan: CompanyPlan;
  billingEmail: string;
  billingContact?: string;
  billingAddress?: CompanyAddress;
  paymentMethod?: {
    type: 'credit_card' | 'bank_transfer' | 'paypal' | 'other';
    lastFour?: string;
    expiryDate?: string;
  };
  subscriptionId?: string;
  nextBillingDate?: string;
}

export interface CompanyBranding {
  logo?: string;
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  customDomain?: string;
}

export interface CompanyPreferences {
  language: string;
  timezone: string;
  dateFormat: string;
  notificationSettings: {
    email: boolean;
    inApp: boolean;
    slack?: boolean;
  };
}

export interface Company {
  id: string;
  name: string;
  tenantId: string;
  logo?: string;
  industry?: string;
  website?: string;
  description?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  contactInfo?: {
    email?: string;
    phone?: string;
  };
  settings?: {
    [key: string]: any;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: 'active' | 'inactive' | 'pending';
  size?: string;
  contacts: {
    primary: {
      name: string;
      email: string;
      phone?: string;
      position?: string;
    };
    additional?: Array<{
      name: string;
      email: string;
      phone?: string;
      position?: string;
    }>;
  };
  billing: CompanyBilling;
  branding?: CompanyBranding;
  preferences: CompanyPreferences;
  maxTenants: number;
  maxUsersPerTenant: number;
  tenantsCount?: number;
  usersCount?: number;
} 