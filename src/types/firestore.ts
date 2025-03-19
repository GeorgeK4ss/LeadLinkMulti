import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'company' | 'tenant' | 'agent';
  companyId?: string;
  tenantId?: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Company {
  id: string;
  name: string;
  plan: 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'cancelled';
  maxTenants: number;
  maxUsersPerTenant: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Tenant {
  id: string;
  companyId: string;
  name: string;
  status: 'active' | 'suspended';
  maxLeads: number;
  maxCustomers: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Lead {
  id: string;
  tenantId: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  source: string;
  assignedTo?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Customer {
  id: string;
  tenantId: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  type: 'individual' | 'business';
  status: 'active' | 'inactive';
  assignedTo?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Activity {
  id: string;
  tenantId: string;
  companyId: string;
  type: 'note' | 'call' | 'email' | 'meeting' | 'task';
  title: string;
  description: string;
  relatedTo: {
    type: 'lead' | 'customer';
    id: string;
  };
  assignedTo?: string;
  dueDate?: Timestamp;
  completed?: boolean;
  timestamp: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
} 