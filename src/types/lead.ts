export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'closed' | 'lost';

export type LeadSource = 'website' | 'referral' | 'cold_call' | 'social_media' | 'event' | 'email_campaign' | 'partner' | 'other';

export type LeadPriority = 'low' | 'medium' | 'high';

export interface LeadContact {
  name: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
}

export interface LeadCompany {
  name: string;
  website?: string;
  industry?: string;
  size?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

export interface LeadNote {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

export interface LeadActivity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'task' | 'note';
  description: string;
  createdBy: string;
  createdAt: string;
  scheduledAt?: string;
  completed?: boolean;
  completedAt?: string;
}

export interface LeadScore {
  total: number;
  components: {
    engagement: number;
    fit: number;
    interest: number;
    timeline: number;
  };
  lastUpdated: string;
}

export interface Lead {
  id: string;
  contact: LeadContact;
  company?: LeadCompany;
  status: LeadStatus;
  source: LeadSource;
  priority?: LeadPriority;
  value?: number;
  assignedTo?: string;
  tags?: string[];
  notes?: LeadNote[];
  activities?: LeadActivity[];
  score?: LeadScore;
  nextFollowUp?: string;
  createdAt: string;
  lastUpdated: string;
  convertedAt?: string;
  convertedToCustomerId?: string;
} 