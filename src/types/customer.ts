import { Lead } from './lead';

export type CustomerStatus = 'active' | 'inactive' | 'at_risk' | 'churned';

export type CustomerCategory = 'vip' | 'enterprise' | 'mid_market' | 'small_business' | 'startup';

export interface CustomerContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  title?: string;
  department?: string;
  isPrimary: boolean;
  isDecisionMaker: boolean;
  lastContactedAt?: string;
  notes?: string;
  createdAt: string;
  lastUpdated: string;
}

export interface CustomerAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  type: 'billing' | 'shipping' | 'both';
  isPrimary: boolean;
}

export interface CustomerContract {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  value: number;
  status: 'draft' | 'sent' | 'negotiating' | 'signed' | 'expired' | 'cancelled';
  renewalDate?: string;
  autoRenew: boolean;
  documentUrl?: string;
  notes?: string;
  createdAt: string;
  lastUpdated: string;
}

export interface CustomerSubscription {
  id: string;
  plan: string;
  startDate: string;
  endDate?: string;
  billingCycle: 'monthly' | 'quarterly' | 'annual';
  amount: number;
  status: 'active' | 'past_due' | 'cancelled' | 'trialing';
  nextBillingDate: string;
  paymentMethod?: {
    type: 'credit_card' | 'bank_transfer' | 'paypal' | 'other';
    lastFour?: string;
    expiry?: string;
  };
  createdAt: string;
  lastUpdated: string;
}

export interface CustomerInteraction {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'support' | 'other';
  description: string;
  outcome?: string;
  contactId?: string;
  userId: string;
  scheduledAt?: string;
  completedAt?: string;
  duration?: number; // in minutes
  nextSteps?: string;
  relatedInteractionId?: string;
  tags?: string[];
  createdAt: string;
  lastUpdated: string;
}

export interface CustomerHealthScore {
  overall: number; // 0-100
  engagement: number; // 0-100
  support: number; // 0-100
  growth: number; // 0-100
  satisfaction: number; // 0-100
  financials: number; // 0-100
  lastAssessmentDate: string;
  trend: 'improving' | 'stable' | 'declining';
}

export interface CustomerNote {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
  lastUpdated: string;
  pinned: boolean;
  category?: 'general' | 'support' | 'billing' | 'product' | 'opportunity';
}

export interface CustomerOpportunity {
  id: string;
  name: string;
  description?: string;
  value: number;
  probability: number; // 0-100
  expectedCloseDate: string;
  status: 'identified' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  products?: string[];
  assignedTo?: string;
  notes?: string;
  createdAt: string;
  lastUpdated: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  originalLeadId?: string;
  contacts: CustomerContact[];
  addresses: CustomerAddress[];
  website?: string;
  industry?: string;
  size?: string;
  annualRevenue?: number;
  logoUrl?: string;
  status: CustomerStatus;
  category: CustomerCategory;
  contracts: CustomerContract[];
  subscriptions: CustomerSubscription[];
  interactions: CustomerInteraction[];
  notes: CustomerNote[];
  opportunities: CustomerOpportunity[];
  healthScore: CustomerHealthScore;
  tags?: string[];
  customFields?: Record<string, any>;
  assignedTo?: string;
  createdAt: string;
  lastUpdated: string;
  convertedFromLead?: boolean;
  conversionDate?: string;
  lifetimeValue: number;
}

export interface CustomerSearchFilters {
  status?: CustomerStatus[];
  category?: CustomerCategory[];
  industries?: string[];
  tags?: string[];
  assignedTo?: string[];
  minLifetimeValue?: number;
  maxLifetimeValue?: number;
  minHealthScore?: number;
  maxHealthScore?: number;
  dateRange?: {
    start: string;
    end: string;
  };
} 