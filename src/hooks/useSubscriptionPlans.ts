"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  subscriptionPlanService, 
  type SubscriptionPlan, 
  type CompanySubscription 
} from '@/lib/services/SubscriptionPlanService';

interface SubscriptionPlansState {
  plans: SubscriptionPlan[];
  activePlan: SubscriptionPlan | null;
  companySubscription: CompanySubscription | null;
  loading: boolean;
  error: Error | null;
  createPlan: (plan: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<SubscriptionPlan>;
  updatePlan: (planId: string, planData: Partial<SubscriptionPlan>) => Promise<void>;
  deletePlan: (planId: string) => Promise<void>;
  assignPlanToCompany: (companyId: string, tenantId: string, planId: string) => Promise<CompanySubscription>;
  cancelSubscription: (subscriptionId: string) => Promise<void>;
  checkFeatureAccess: (companyId: string, featureId: string) => Promise<{ allowed: boolean, limit?: number, usage?: number }>;
  refreshPlans: () => Promise<void>;
  refreshCompanySubscription: (companyId: string) => Promise<void>;
}

/**
 * Hook for managing subscription plans and company subscriptions
 * @param companyId Optional company ID to load active subscription
 * @returns Subscription plan state and functions
 */
export function useSubscriptionPlans(companyId?: string): SubscriptionPlansState {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [activePlan, setActivePlan] = useState<SubscriptionPlan | null>(null);
  const [companySubscription, setCompanySubscription] = useState<CompanySubscription | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Load all active plans
  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      const activePlans = await subscriptionPlanService.getActivePlans();
      setPlans(activePlans);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load plans'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Load company subscription and active plan
  const loadCompanySubscription = useCallback(async (companyId: string) => {
    try {
      setLoading(true);
      const subscription = await subscriptionPlanService.getActiveSubscription(companyId);
      setCompanySubscription(subscription);
      
      if (subscription) {
        const plan = await subscriptionPlanService.getPlanById(subscription.planId);
        setActivePlan(plan);
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load subscription'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadPlans();
    
    if (companyId) {
      loadCompanySubscription(companyId);
    }
  }, [loadPlans, loadCompanySubscription, companyId]);

  // Create a new plan
  const createPlan = useCallback(async (plan: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newPlan = await subscriptionPlanService.createPlan(plan);
      await loadPlans(); // Refresh the plans list
      return newPlan;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create plan'));
      throw err;
    }
  }, [loadPlans]);

  // Update an existing plan
  const updatePlan = useCallback(async (planId: string, planData: Partial<SubscriptionPlan>) => {
    try {
      await subscriptionPlanService.updatePlan(planId, planData);
      await loadPlans(); // Refresh the plans list
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update plan'));
      throw err;
    }
  }, [loadPlans]);

  // Delete a plan
  const deletePlan = useCallback(async (planId: string) => {
    try {
      await subscriptionPlanService.deletePlan(planId);
      await loadPlans(); // Refresh the plans list
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete plan'));
      throw err;
    }
  }, [loadPlans]);

  // Assign plan to company
  const assignPlanToCompany = useCallback(async (
    companyId: string, 
    tenantId: string,
    planId: string
  ) => {
    try {
      const subscription = await subscriptionPlanService.assignPlanToCompany(
        companyId,
        tenantId,
        planId
      );
      
      if (companyId) {
        await loadCompanySubscription(companyId);
      }
      
      return subscription;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to assign plan'));
      throw err;
    }
  }, [loadCompanySubscription]);

  // Cancel subscription
  const cancelSubscription = useCallback(async (subscriptionId: string) => {
    try {
      await subscriptionPlanService.cancelSubscription(subscriptionId);
      
      if (companyId) {
        await loadCompanySubscription(companyId);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to cancel subscription'));
      throw err;
    }
  }, [companyId, loadCompanySubscription]);

  // Check feature access
  const checkFeatureAccess = useCallback(async (
    companyId: string, 
    featureId: string
  ) => {
    try {
      return await subscriptionPlanService.checkFeatureAccess(companyId, featureId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to check feature access'));
      throw err;
    }
  }, []);

  // Manual refresh functions
  const refreshPlans = useCallback(async () => {
    await loadPlans();
  }, [loadPlans]);

  const refreshCompanySubscription = useCallback(async (companyId: string) => {
    await loadCompanySubscription(companyId);
  }, [loadCompanySubscription]);

  return {
    plans,
    activePlan,
    companySubscription,
    loading,
    error,
    createPlan,
    updatePlan,
    deletePlan,
    assignPlanToCompany,
    cancelSubscription,
    checkFeatureAccess,
    refreshPlans,
    refreshCompanySubscription
  };
} 