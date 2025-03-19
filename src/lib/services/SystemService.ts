import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  getCountFromServer,
  Timestamp,
  doc,
  setDoc,
} from 'firebase/firestore';
import type { SystemStats, SystemHealth, AuditLog, AuditLogFilters, GeneralSettings } from '@/lib/types/system';
import type { DateRange } from '@/lib/types/date';
import type { IntegrationSettings, SecuritySettings, FeatureFlag } from '@/lib/types/settings';

export class SystemService {
  private static instance: SystemService;
  private constructor() {}

  static getInstance(): SystemService {
    if (!SystemService.instance) {
      SystemService.instance = new SystemService();
    }
    return SystemService.instance;
  }

  async getSystemStats(dateRange?: DateRange): Promise<SystemStats> {
    const [
      totalUsers,
      totalCompanies,
      totalTenants,
      activeSubscriptions,
      activityData,
      resourceUsage,
    ] = await Promise.all([
      this.getTotalUsers(),
      this.getTotalCompanies(),
      this.getTotalTenants(),
      this.getActiveSubscriptions(),
      this.getActivityData(dateRange),
      this.getResourceUsage(dateRange),
    ]);

    return {
      totalUsers,
      totalCompanies,
      totalTenants,
      activeSubscriptions,
      activityData,
      resourceUsage,
    };
  }

  private async getTotalUsers(): Promise<number> {
    const snapshot = await getCountFromServer(collection(db, 'users'));
    return snapshot.data().count;
  }

  private async getTotalCompanies(): Promise<number> {
    const snapshot = await getCountFromServer(collection(db, 'companies'));
    return snapshot.data().count;
  }

  private async getTotalTenants(): Promise<number> {
    const snapshot = await getCountFromServer(collection(db, 'tenants'));
    return snapshot.data().count;
  }

  private async getActiveSubscriptions(): Promise<number> {
    const q = query(
      collection(db, 'companies'),
      where('subscription.status', '==', 'active')
    );
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  }

  private async getActivityData(dateRange?: DateRange) {
    const q = query(
      collection(db, 'systemMetrics'),
      where('timestamp', '>=', dateRange?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
      where('timestamp', '<=', dateRange?.to || new Date())
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      date: (doc.data().timestamp as Timestamp).toDate().toISOString(),
      activeUsers: doc.data().activeUsers,
      newSignups: doc.data().newSignups,
    }));
  }

  private async getResourceUsage(dateRange?: DateRange) {
    const q = query(
      collection(db, 'systemMetrics'),
      where('timestamp', '>=', dateRange?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
      where('timestamp', '<=', dateRange?.to || new Date())
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      date: (doc.data().timestamp as Timestamp).toDate().toISOString(),
      storage: doc.data().storageUsage,
      bandwidth: doc.data().bandwidthUsage,
    }));
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const snapshot = await getDocs(collection(db, 'systemHealth'));
    const healthData = snapshot.docs[0]?.data();

    if (!healthData) {
      throw new Error('System health data not found');
    }

    return {
      status: healthData.status,
      services: healthData.services,
      metrics: healthData.metrics,
    };
  }

  async getAuditLogs(filters: AuditLogFilters): Promise<AuditLog[]> {
    let q = query(collection(db, 'auditLogs'));

    if (filters.startDate) {
      q = query(q, where('timestamp', '>=', filters.startDate));
    }
    if (filters.endDate) {
      q = query(q, where('timestamp', '<=', filters.endDate));
    }
    if (filters.userId) {
      q = query(q, where('userId', '==', filters.userId));
    }
    if (filters.action) {
      q = query(q, where('action', '==', filters.action));
    }
    if (filters.resource) {
      q = query(q, where('resource', '==', filters.resource));
    }
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as AuditLog[];
  }

  async updateGeneralSettings(settings: GeneralSettings): Promise<void> {
    const settingsRef = doc(db, 'systemSettings', 'general');
    await setDoc(settingsRef, settings, { merge: true });
  }

  async updateIntegrationSettings(settings: IntegrationSettings): Promise<void> {
    const settingsRef = doc(db, 'systemSettings', 'integrations');
    await setDoc(settingsRef, settings, { merge: true });
  }

  async updateSecuritySettings(settings: SecuritySettings): Promise<void> {
    const settingsRef = doc(db, 'systemSettings', 'security');
    await setDoc(settingsRef, settings, { merge: true });
  }

  async updateFeatureFlags(featureFlags: FeatureFlag[]): Promise<void> {
    const settingsRef = doc(db, 'systemSettings', 'featureFlags');
    await setDoc(settingsRef, { flags: featureFlags }, { merge: true });
  }
} 