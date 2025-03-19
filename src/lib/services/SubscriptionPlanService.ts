import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface PlanFeature {
  id: string;
  name: string;
  description: string;
  included: boolean;
  limit?: number;
}

export interface PlanPricing {
  monthly: number;
  yearly: number;
  discount?: number;
  currency: string;
  trialDays?: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  features: PlanFeature[];
  pricing: PlanPricing;
  active: boolean;
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  maxUsers?: number;
  maxStorage?: number;
  isDefault?: boolean;
  tier: 'free' | 'basic' | 'professional' | 'enterprise' | 'custom';
}

export interface CompanySubscription {
  id: string;
  companyId: string;
  tenantId: string;
  planId: string;
  status: 'active' | 'canceled' | 'trialing' | 'past_due' | 'unpaid' | 'incomplete';
  startDate: Timestamp;
  endDate: Timestamp;
  expiresAt: Timestamp;
  autoRenew: boolean;
  paymentMethod?: string;
  paymentStatus?: string;
  usageStats?: {
    usersCount: number;
    storageUsed: number;
    [key: string]: any;
  };
  metadata?: Record<string, any>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

class SubscriptionPlanService {
  private plansCollection = collection(db, 'subscriptionPlans');
  private subscriptionsCollection = collection(db, 'companySubscriptions');
  
  /**
   * Get all active subscription plans ordered by tier
   */
  async getActivePlans(): Promise<SubscriptionPlan[]> {
    const q = query(
      this.plansCollection,
      where('active', '==', true),
      orderBy('order', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SubscriptionPlan));
  }
  
  /**
   * Get a subscription plan by ID
   */
  async getPlanById(planId: string): Promise<SubscriptionPlan | null> {
    const docRef = doc(this.plansCollection, planId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as SubscriptionPlan;
  }
  
  /**
   * Create a new subscription plan (admin only)
   */
  async createPlan(plan: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<SubscriptionPlan> {
    const planData = {
      ...plan,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(this.plansCollection, planData);
    
    return {
      id: docRef.id,
      ...plan,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    } as SubscriptionPlan;
  }
  
  /**
   * Update an existing subscription plan (admin only)
   */
  async updatePlan(planId: string, planData: Partial<SubscriptionPlan>): Promise<void> {
    const docRef = doc(this.plansCollection, planId);
    
    await updateDoc(docRef, {
      ...planData,
      updatedAt: serverTimestamp()
    });
  }
  
  /**
   * Delete a subscription plan (admin only)
   */
  async deletePlan(planId: string): Promise<void> {
    const docRef = doc(this.plansCollection, planId);
    await deleteDoc(docRef);
  }
  
  /**
   * Assign a subscription plan to a company
   */
  async assignPlanToCompany(
    companyId: string, 
    tenantId: string,
    planId: string, 
    startDate: Date = new Date(),
    endDate: Date = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year
    autoRenew = true
  ): Promise<CompanySubscription> {
    // Check if plan exists
    const plan = await this.getPlanById(planId);
    if (!plan) {
      throw new Error(`Plan with ID ${planId} not found`);
    }
    
    // Check if company already has a subscription
    const existingSubscriptions = await this.getCompanySubscriptions(companyId);
    
    // If exists, update the existing subscription
    if (existingSubscriptions.length > 0) {
      const existingSubscription = existingSubscriptions[0];
      const subscriptionRef = doc(this.subscriptionsCollection, existingSubscription.id);
      
      await updateDoc(subscriptionRef, {
        planId,
        status: 'active',
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        expiresAt: Timestamp.fromDate(endDate),
        autoRenew,
        updatedAt: serverTimestamp()
      });
      
      return {
        ...existingSubscription,
        planId,
        status: 'active',
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        expiresAt: Timestamp.fromDate(endDate),
        autoRenew,
        updatedAt: Timestamp.now()
      };
    }
    
    // Create a new subscription
    const subscriptionData: Omit<CompanySubscription, 'id'> = {
      companyId,
      tenantId,
      planId,
      status: 'active',
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate),
      expiresAt: Timestamp.fromDate(endDate),
      autoRenew,
      usageStats: {
        usersCount: 0,
        storageUsed: 0
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(this.subscriptionsCollection, {
      ...subscriptionData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return {
      id: docRef.id,
      ...subscriptionData
    };
  }
  
  /**
   * Get all subscriptions for a company
   */
  async getCompanySubscriptions(companyId: string): Promise<CompanySubscription[]> {
    const q = query(
      this.subscriptionsCollection,
      where('companyId', '==', companyId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CompanySubscription));
  }
  
  /**
   * Get active subscription for a company
   */
  async getActiveSubscription(companyId: string): Promise<CompanySubscription | null> {
    const q = query(
      this.subscriptionsCollection,
      where('companyId', '==', companyId),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    
    return {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data()
    } as CompanySubscription;
  }
  
  /**
   * Cancel a company's subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    const docRef = doc(this.subscriptionsCollection, subscriptionId);
    
    await updateDoc(docRef, {
      status: 'canceled',
      autoRenew: false,
      updatedAt: serverTimestamp()
    });
  }
  
  /**
   * Update subscription usage statistics
   */
  async updateUsageStats(
    subscriptionId: string, 
    usageStats: Partial<CompanySubscription['usageStats']>
  ): Promise<void> {
    const docRef = doc(this.subscriptionsCollection, subscriptionId);
    
    await updateDoc(docRef, {
      'usageStats': usageStats,
      updatedAt: serverTimestamp()
    });
  }
  
  /**
   * Check if a feature is available in a company's active plan
   */
  async checkFeatureAccess(
    companyId: string, 
    featureId: string
  ): Promise<{ allowed: boolean, limit?: number, usage?: number }> {
    // Get active subscription
    const subscription = await this.getActiveSubscription(companyId);
    if (!subscription) {
      return { allowed: false };
    }
    
    // Get the plan
    const plan = await this.getPlanById(subscription.planId);
    if (!plan) {
      return { allowed: false };
    }
    
    // Check if feature exists in plan
    const feature = plan.features.find(f => f.id === featureId);
    if (!feature) {
      return { allowed: false };
    }
    
    // Check if feature is included
    if (!feature.included) {
      return { allowed: false };
    }
    
    // Check if feature has a limit
    if (feature.limit !== undefined) {
      const usage = subscription.usageStats?.[featureId] || 0;
      return { 
        allowed: usage < feature.limit,
        limit: feature.limit,
        usage
      };
    }
    
    return { allowed: true };
  }
}

export const subscriptionPlanService = new SubscriptionPlanService();
export default subscriptionPlanService; 