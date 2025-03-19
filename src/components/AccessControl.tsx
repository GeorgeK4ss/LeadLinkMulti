'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SubscriptionService } from '@/lib/services/SubscriptionService';
import type { PermissionResource } from '@/lib/types/auth';

interface AccessControlProps {
  // RBAC properties
  permission?: string;
  resource?: PermissionResource;
  role?: string;
  tenantId?: string;
  
  // Feature access properties
  feature?: string;
  companyId?: string;
  checkUsage?: {
    currentUsage: number;
    showWarningAt?: number; // percentage threshold for warning
  };
  
  // Common properties
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * A unified access control component that combines RBAC and feature access checks
 * This allows for complex access patterns like "user must have admin role AND the company
 * must have access to the premium analytics feature"
 */
export function AccessControl({
  // RBAC props
  permission,
  resource,
  role,
  tenantId,
  
  // Feature props
  feature,
  companyId,
  checkUsage,
  
  // Common props
  fallback = null,
  loadingComponent = <div className="animate-pulse p-4">Checking access...</div>,
  children,
}: AccessControlProps) {
  const { user, tenant } = useAuth();
  const [featureAccess, setFeatureAccess] = useState<boolean | null>(null);
  const [usageLimitOk, setUsageLimitOk] = useState<boolean | null>(null);
  const [usageWarning, setUsageWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(feature !== undefined);
  
  // Check RBAC permissions - these are immediate checks
  const hasRbacAccess = () => {
    // Not authenticated
    if (!user) return false;
    
    // Check tenant access if required
    if (tenantId && (!tenant || tenant.id !== tenantId)) return false;
    
    // Check role if required 
    if (role && (!tenant || tenant.role !== role)) return false;
    
    // Check permission if required (would need a more complex implementation)
    if (permission) {
      // For now, a simple implementation based on role
      // In a real app, you'd check custom claims or a permissions database
      const userRole = tenant?.role || 'user';
      
      // Admin has all permissions
      if (userRole === 'admin') return true;
      
      // Tenant admin has all permissions for their tenant
      if (userRole === 'tenantAdmin' && (!tenantId || tenant?.id === tenantId)) {
        // Could exclude certain admin-only permissions here
        return true;
      }
      
      // Simple permission check based on conventional naming
      // e.g., "leads:read", "contacts:write", etc.
      const [resourceType, action] = permission.split(':');
      
      // Manager can read everything and write most things
      if (userRole === 'manager') {
        if (action === 'read') return true;
        if (action === 'write' && resourceType !== 'admin' && resourceType !== 'billing') {
          return true;
        }
      }
      
      // Basic user can only read most things and edit their own data
      if (userRole === 'user') {
        if (action === 'read' && resourceType !== 'admin' && resourceType !== 'billing') {
          return true;
        }
      }
      
      return false;
    }
    
    // All RBAC checks passed
    return true;
  };
  
  // Check feature access - this requires async API calls
  useEffect(() => {
    const checkFeatureAccess = async () => {
      if (!feature) {
        setFeatureAccess(true); // No feature check needed
        setLoading(false);
        return;
      }
      
      if (!user) {
        setFeatureAccess(false);
        setLoading(false);
        return;
      }
      
      try {
        const subscriptionService = new SubscriptionService();
        // Use provided companyId or get from tenant
        const resolvedCompanyId = companyId || tenant?.id;
        
        if (!resolvedCompanyId) {
          setFeatureAccess(false);
          setLoading(false);
          return;
        }
        
        // Check if feature is available in subscription
        const hasFeature = await subscriptionService.hasFeatureAccess(resolvedCompanyId, feature);
        setFeatureAccess(hasFeature);
        
        // Check usage limits if needed
        if (checkUsage && hasFeature) {
          const withinLimit = await subscriptionService.checkUsageLimit(
            resolvedCompanyId,
            feature,
            checkUsage.currentUsage
          );
          setUsageLimitOk(withinLimit);
          
          // Get plan limits to check for warning threshold
          const subscription = await subscriptionService.getCompanySubscription(resolvedCompanyId);
          if (subscription) {
            const plan = await subscriptionService.getPlan(subscription.planId);
            if (plan) {
              // Find feature and check limits
              const featureData = plan.features.find(f => f.name === feature);
              if (featureData?.limits?.length) {
                const limit = featureData.limits[0].limit;
                
                // Calculate usage percentage
                const usagePercentage = (checkUsage.currentUsage / limit) * 100;
                
                // Show warning if above threshold
                if (checkUsage.showWarningAt && usagePercentage >= checkUsage.showWarningAt) {
                  setUsageWarning(
                    `You're using ${checkUsage.currentUsage} of ${limit} ${feature} (${Math.round(usagePercentage)}%).`
                  );
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking feature access:', error);
        setFeatureAccess(false);
      } finally {
        setLoading(false);
      }
    };
    
    if (feature) {
      checkFeatureAccess();
    }
  }, [user, feature, companyId, tenant, checkUsage]);
  
  // Show loading state if needed
  if (loading) {
    return <>{loadingComponent}</>;
  }
  
  // Check combined access
  const rbacPassed = hasRbacAccess();
  const featurePassed = feature ? featureAccess === true : true;
  const usagePassed = checkUsage ? usageLimitOk !== false : true;
  
  // If any check fails, show fallback
  if (!rbacPassed || !featurePassed || !usagePassed) {
    return <>{fallback}</>;
  }
  
  // Show usage warning if needed
  if (usageWarning) {
    return (
      <>
        <div className="p-3 mb-4 border border-yellow-300 bg-yellow-50 rounded">
          <p className="text-sm text-yellow-800">
            <span className="font-medium">Usage warning:</span> {usageWarning}
          </p>
        </div>
        {children}
      </>
    );
  }
  
  // All checks passed, render children
  return <>{children}</>;
}

/**
 * Utility component for admin-only access
 */
export function AdminOnly({ 
  feature, 
  children, 
  fallback = null 
}: Omit<AccessControlProps, 'role'> & { children: React.ReactNode }) {
  return (
    <AccessControl 
      role="admin" 
      feature={feature} 
      fallback={fallback}
    >
      {children}
    </AccessControl>
  );
}

/**
 * Utility component for feature-only access (subscription based)
 */
export function FeatureOnly({ 
  feature, 
  companyId,
  checkUsage,
  children, 
  fallback = <p className="text-sm text-red-500">This feature is not available with your current plan.</p>
}: Omit<AccessControlProps, 'permission' | 'resource' | 'role' | 'tenantId'>) {
  return (
    <AccessControl 
      feature={feature} 
      companyId={companyId}
      checkUsage={checkUsage}
      fallback={fallback}
    >
      {children}
    </AccessControl>
  );
}

/**
 * Utility component for permission-based access
 */
export function PermissionRequired({ 
  permission, 
  resource,
  children, 
  fallback = null 
}: Omit<AccessControlProps, 'feature' | 'companyId' | 'checkUsage' | 'role' | 'tenantId'>) {
  return (
    <AccessControl 
      permission={permission} 
      resource={resource}
      fallback={fallback}
    >
      {children}
    </AccessControl>
  );
} 