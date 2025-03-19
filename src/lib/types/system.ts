import type { DateString } from './date';

export interface SystemStats {
  totalUsers: number;
  totalCompanies: number;
  totalTenants: number;
  activeSubscriptions: number;
  activityData: Array<{
    date: DateString;
    activeUsers: number;
    newSignups: number;
  }>;
  resourceUsage: Array<{
    date: DateString;
    storage: number; // in GB
    bandwidth: number; // in GB
  }>;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  services: {
    [key: string]: {
      status: 'up' | 'down';
      latency: number;
      lastChecked: DateString;
    };
  };
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  };
}

export interface AuditLogFilters {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  action?: string;
  resource?: string;
  status?: 'success' | 'failure';
}

export interface AuditLog {
  id: string;
  timestamp: DateString;
  userId: string;
  action: string;
  resource: string;
  status: 'success' | 'failure';
  details: Record<string, unknown>;
  metadata: {
    ip: string;
    userAgent: string;
    location?: string;
  };
}

export interface GeneralSettings {
  systemName: string;
  supportEmail: string;
  maxUsersPerTenant: number;
  maxTenantsPerCompany: number;
  enableUserRegistration: boolean;
  enableCompanyRegistration: boolean;
  maintenanceMode: boolean;
} 