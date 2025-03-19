'use client';

import React, { useState, useEffect } from 'react';
import { SubscriptionService } from '@/lib/services/SubscriptionService';
import { useAuth } from '@/hooks/useAuth';

interface FeatureAccessWrapperProps {
  featureKey: string;
  companyId?: string;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  children: React.ReactNode;
  usageCheck?: {
    currentUsage: number;
    showWarningAt?: number; // percentage threshold to show warning
  };
}

export function FeatureAccessWrapper({
  featureKey,
  companyId,
  fallback = <p className="text-sm text-red-500">This feature is not available with your current plan.</p>,
  loadingComponent = <div className="animate-pulse">Checking access...</div>,
  children,
  usageCheck,
}: FeatureAccessWrapperProps) {
  const { user, tenant } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isWithinUsageLimit, setIsWithinUsageLimit] = useState<boolean | null>(null);
  const [usageWarning, setUsageWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setHasAccess(false);
        setLoading(false);
        return;
      }
      
      try {
        const subscriptionService = new SubscriptionService();
        // Use provided companyId or try to get it from tenant
        const resolvedCompanyId = companyId || tenant?.id;
        
        if (!resolvedCompanyId) {
          setHasAccess(false);
          setLoading(false);
          return;
        }
        
        // Check if the feature is available in the subscription
        const featureAccess = await subscriptionService.hasFeatureAccess(resolvedCompanyId, featureKey);
        setHasAccess(featureAccess);
        
        // If we're checking usage limits
        if (usageCheck && featureAccess) {
          const withinLimit = await subscriptionService.checkUsageLimit(
            resolvedCompanyId,
            featureKey,
            usageCheck.currentUsage
          );
          setIsWithinUsageLimit(withinLimit);
          
          // Get the plan to check limits for warning
          const subscription = await subscriptionService.getCompanySubscription(resolvedCompanyId);
          if (subscription) {
            const plan = await subscriptionService.getPlan(subscription.planId);
            if (plan) {
              // Find the feature and check its limit
              const feature = plan.features.find(f => f.name === featureKey);
              if (feature && feature.limits && feature.limits.length > 0) {
                const limit = feature.limits[0].limit;
                
                // Calculate usage percentage
                const usagePercentage = (usageCheck.currentUsage / limit) * 100;
                
                // Show warning if usage is above the specified threshold
                if (usageCheck.showWarningAt && usagePercentage >= usageCheck.showWarningAt) {
                  setUsageWarning(`You're using ${usageCheck.currentUsage} of ${limit} ${featureKey} (${Math.round(usagePercentage)}%).`);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking feature access:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAccess();
  }, [user, featureKey, companyId, tenant, usageCheck]);
  
  if (loading) {
    return <>{loadingComponent}</>;
  }
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  if (usageCheck && isWithinUsageLimit === false) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded">
        <p className="text-red-700 font-medium">
          You've reached the usage limit for this feature in your current plan.
        </p>
        <p className="text-sm text-red-600 mt-1">
          Please upgrade your subscription to continue using this feature.
        </p>
      </div>
    );
  }
  
  return (
    <>
      {usageWarning && (
        <div className="p-3 border border-yellow-300 bg-yellow-50 rounded mb-4">
          <p className="text-sm text-yellow-800">
            <span className="font-medium">Usage warning:</span> {usageWarning}
          </p>
        </div>
      )}
      {children}
    </>
  );
}

// Simplified version that just renders children based on feature access
export function RequireFeature({ featureKey, companyId, children }: Omit<FeatureAccessWrapperProps, 'fallback' | 'loadingComponent' | 'usageCheck'>) {
  return (
    <FeatureAccessWrapper
      featureKey={featureKey}
      companyId={companyId}
      fallback={null}
      loadingComponent={null}
    >
      {children}
    </FeatureAccessWrapper>
  );
} 