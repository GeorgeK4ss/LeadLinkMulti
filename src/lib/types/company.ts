export interface CompanyAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CompanyBranding {
  logoUrl?: string;
  primaryColorHex?: string;
  secondaryColorHex?: string;
  faviconUrl?: string;
}

export interface Company {
  id: string;
  name: string;
  tenantId: string; // The tenant ID this company belongs to
  email?: string;
  phone?: string;
  website?: string;
  address?: CompanyAddress;
  branding?: CompanyBranding;
  active: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  activeSubscriptionId?: string; // Reference to the active subscription
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  TRIAL = 'trial'
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
  CUSTOM = 'custom'
}

export interface FeatureLimit {
  name: string;
  limit: number;
  current?: number;
}

export interface PlanFeature {
  name: string;
  enabled: boolean;
  description?: string;
  limits?: FeatureLimit[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  billingCycle: BillingCycle;
  features: PlanFeature[];
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  pricing?: {
    monthly?: number;
    quarterly?: number;
    annual: number;
    currency: string;
  };
}

export interface CompanySubscription {
  id: string;
  companyId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: Date | string;
  endDate?: Date | string;
  renewalDate?: Date | string;
  trialEndDate?: Date | string;
  cancelledAt?: Date | string;
  paymentMethod?: string;
  paymentId?: string;
  billingCycle: BillingCycle;
  price: number;
  currency?: string;
  autoRenew?: boolean;
  metadata?: Record<string, any>;
  createdAt: Date | string;
  updatedAt: Date | string;
} 