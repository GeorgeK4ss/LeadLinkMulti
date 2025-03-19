import { db } from '@/lib/firebase/config';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, Timestamp, setDoc, deleteDoc } from 'firebase/firestore';
import { 
  Company, 
  CompanySubscription, 
  SubscriptionPlan,
  SubscriptionStatus,
  BillingCycle,
  PlanFeature
} from '@/lib/types/company';

export class SubscriptionService {
  /**
   * Get all active subscription plans
   */
  async getActivePlans(): Promise<SubscriptionPlan[]> {
    try {
      const plansRef = collection(db, 'subscriptionPlans');
      const plansQuery = query(plansRef, where('isActive', '==', true));
      const snapshot = await getDocs(plansQuery);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        // Convert Firestore Timestamps to Dates
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt
        } as SubscriptionPlan;
      });
    } catch (error) {
      console.error('Error fetching active plans:', error);
      throw new Error('Failed to fetch subscription plans');
    }
  }

  /**
   * Get all subscription plans (active and inactive)
   */
  async getAllPlans(): Promise<SubscriptionPlan[]> {
    try {
      const plansRef = collection(db, 'subscriptionPlans');
      const snapshot = await getDocs(plansRef);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt
        } as SubscriptionPlan;
      });
    } catch (error) {
      console.error('Error fetching all plans:', error);
      throw new Error('Failed to fetch subscription plans');
    }
  }

  /**
   * Get a subscription plan by ID
   */
  async getPlan(planId: string): Promise<SubscriptionPlan | null> {
    try {
      const planRef = doc(db, 'subscriptionPlans', planId);
      const planDoc = await getDoc(planRef);
      
      if (!planDoc.exists()) {
        return null;
      }
      
      const data = planDoc.data();
      return {
        id: planDoc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt
      } as SubscriptionPlan;
    } catch (error) {
      console.error(`Error fetching plan ${planId}:`, error);
      throw new Error('Failed to fetch subscription plan');
    }
  }

  /**
   * Create a new subscription plan
   */
  async createPlan(planData: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const plansRef = collection(db, 'subscriptionPlans');
      
      const data = {
        ...planData,
        createdAt: now,
        updatedAt: now
      };
      
      const docRef = await addDoc(plansRef, data);
      return docRef.id;
    } catch (error) {
      console.error('Error creating plan:', error);
      throw new Error('Failed to create subscription plan');
    }
  }

  /**
   * Update an existing plan
   */
  async updatePlan(id: string, data: Partial<SubscriptionPlan>): Promise<void> {
    try {
      const planRef = doc(db, 'subscriptionPlans', id);
      
      // Make sure we're not overwriting createdAt
      const { createdAt, ...updateData } = data;
      
      await updateDoc(planRef, {
        ...updateData,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error(`Error updating plan ${id}:`, error);
      throw new Error('Failed to update subscription plan');
    }
  }

  /**
   * Assign a plan to a company
   */
  async assignPlanToCompany(
    companyId: string,
    planId: string,
    startDate: Date = new Date(),
    endDate?: Date
  ): Promise<string> {
    try {
      // Validate that company and plan exist
      const companyRef = doc(db, 'companies', companyId);
      const companyDoc = await getDoc(companyRef);
      
      if (!companyDoc.exists()) {
        throw new Error(`Company ${companyId} not found`);
      }
      
      const planRef = doc(db, 'subscriptionPlans', planId);
      const planDoc = await getDoc(planRef);
      
      if (!planDoc.exists()) {
        throw new Error(`Plan ${planId} not found`);
      }
      
      const plan = planDoc.data() as SubscriptionPlan;
      
      // Calculate end date if not provided
      if (!endDate) {
        endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1); // Default to 1 year
      }
      
      // Create the subscription
      const now = new Date();
      
      const subscriptionData: Omit<CompanySubscription, 'id'> = {
        companyId,
        planId,
        status: SubscriptionStatus.ACTIVE,
        startDate: startDate,
        endDate: endDate,
        billingCycle: BillingCycle.ANNUAL,
        price: plan.pricing?.annual || plan.price,
        currency: plan.pricing?.currency || 'USD',
        autoRenew: true,
        createdAt: now,
        updatedAt: now
      };
      
      // Create subscription document
      const subscriptionsRef = collection(db, 'companySubscriptions');
      const docRef = await addDoc(subscriptionsRef, subscriptionData);
      
      // Update company with subscription info
      await updateDoc(companyRef, {
        activeSubscriptionId: docRef.id,
        updatedAt: now
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error assigning plan to company:', error);
      throw new Error('Failed to assign subscription plan to company');
    }
  }

  /**
   * Get company's active subscription
   */
  async getCompanySubscription(companyId: string): Promise<CompanySubscription | null> {
    try {
      const subscriptionsRef = collection(db, 'companySubscriptions');
      const q = query(
        subscriptionsRef,
        where('companyId', '==', companyId),
        where('status', '==', SubscriptionStatus.ACTIVE)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }
      
      // Get the most recent subscription if multiple exist
      const subscriptions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : data.startDate,
          endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : data.endDate,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
          cancelledAt: data.cancelledAt instanceof Timestamp ? data.cancelledAt.toDate() : data.cancelledAt,
          renewalDate: data.renewalDate instanceof Timestamp ? data.renewalDate.toDate() : data.renewalDate,
          trialEndDate: data.trialEndDate instanceof Timestamp ? data.trialEndDate.toDate() : data.trialEndDate
        } as CompanySubscription;
      });
      
      // Sort by creation date, newest first
      subscriptions.sort((a, b) => {
        const aDate = a.createdAt instanceof Date 
          ? a.createdAt.getTime() 
          : new Date(a.createdAt).getTime();
        
        const bDate = b.createdAt instanceof Date 
          ? b.createdAt.getTime() 
          : new Date(b.createdAt).getTime();
        
        return bDate - aDate;
      });
      
      return subscriptions[0];
    } catch (error) {
      console.error(`Error fetching subscription for company ${companyId}:`, error);
      throw new Error('Failed to fetch company subscription');
    }
  }

  /**
   * Get all subscriptions for a company
   */
  async getCompanySubscriptions(companyId: string): Promise<CompanySubscription[]> {
    try {
      const subscriptionsRef = collection(db, 'companySubscriptions');
      const q = query(subscriptionsRef, where('companyId', '==', companyId));
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : data.startDate,
          endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : data.endDate,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
          cancelledAt: data.cancelledAt instanceof Timestamp ? data.cancelledAt.toDate() : data.cancelledAt,
          renewalDate: data.renewalDate instanceof Timestamp ? data.renewalDate.toDate() : data.renewalDate,
          trialEndDate: data.trialEndDate instanceof Timestamp ? data.trialEndDate.toDate() : data.trialEndDate
        } as CompanySubscription;
      });
    } catch (error) {
      console.error(`Error fetching subscriptions for company ${companyId}:`, error);
      throw new Error('Failed to fetch company subscriptions');
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      const subscriptionRef = doc(db, 'companySubscriptions', subscriptionId);
      const subscriptionDoc = await getDoc(subscriptionRef);
      
      if (!subscriptionDoc.exists()) {
        throw new Error(`Subscription ${subscriptionId} not found`);
      }
      
      const subscription = subscriptionDoc.data() as CompanySubscription;
      
      // Update subscription status
      await updateDoc(subscriptionRef, {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
        updatedAt: new Date()
      });
      
      // Update company record if this was the active subscription
      const companyRef = doc(db, 'companies', subscription.companyId);
      const companyDoc = await getDoc(companyRef);
      
      if (companyDoc.exists()) {
        const company = companyDoc.data() as Company;
        
        if (company.activeSubscriptionId === subscriptionId) {
          await updateDoc(companyRef, {
            activeSubscriptionId: null,
            updatedAt: new Date()
          });
        }
      }
    } catch (error) {
      console.error(`Error canceling subscription ${subscriptionId}:`, error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Check if a company has access to a feature
   */
  async hasFeatureAccess(companyId: string, featureKey: string): Promise<boolean> {
    try {
      // Get the company's active subscription
      const subscription = await this.getCompanySubscription(companyId);
      
      if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
        return false;
      }
      
      // Get the plan
      const plan = await this.getPlan(subscription.planId);
      
      if (!plan) {
        return false;
      }
      
      // Check if the feature exists and is enabled in the plan
      const feature = plan.features.find(f => f.name === featureKey);
      return feature?.enabled === true;
    } catch (error) {
      console.error(`Error checking feature access for company ${companyId}:`, error);
      return false;
    }
  }

  /**
   * Check if a company is within usage limits for a feature
   */
  async checkUsageLimit(companyId: string, featureKey: string, currentUsage: number): Promise<boolean> {
    try {
      // Get the company's active subscription
      const subscription = await this.getCompanySubscription(companyId);
      
      if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
        return false;
      }
      
      // Get the plan
      const plan = await this.getPlan(subscription.planId);
      
      if (!plan) {
        return false;
      }
      
      // Check if the feature exists, is enabled, and has a limit
      const feature = plan.features.find(f => f.name === featureKey);
      
      if (!feature || !feature.enabled) {
        return false;
      }
      
      // If there's no limits array or it's empty, it's unlimited
      if (!feature.limits || feature.limits.length === 0) {
        return true;
      }
      
      // Check if the current usage is within any of the limits
      const relevantLimit = feature.limits.find(limit => limit.name === featureKey);
      if (!relevantLimit) {
        return true; // No specific limit for this feature
      }
      
      // Check if the current usage is within the limit
      return currentUsage <= relevantLimit.limit;
    } catch (error) {
      console.error(`Error checking usage limit for company ${companyId}:`, error);
      return false;
    }
  }
} 