import React from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import type { PermissionResource } from '@/lib/types/auth';

interface RbacWrapperProps {
  requiredPermission?: string;
  requiredResource?: PermissionResource;
  requiredRole?: string;
  tenantId?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * A wrapper component that conditionally renders content based on user permissions
 */
export const RbacWrapper: React.FC<RbacWrapperProps> = ({
  requiredPermission,
  requiredResource,
  requiredRole,
  tenantId,
  fallback = null,
  children
}) => {
  const { isAuthenticated, hasPermission, hasRole, hasTenantAccess } = useAuth();
  
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }
  
  // Check tenant access if tenantId is provided
  if (tenantId && !hasTenantAccess(tenantId)) {
    return <>{fallback}</>;
  }
  
  // Check role if required
  if (requiredRole && !hasRole(requiredRole)) {
    return <>{fallback}</>;
  }
  
  // Check permission if required
  if (requiredPermission && !hasPermission(requiredPermission, requiredResource)) {
    return <>{fallback}</>;
  }
  
  // All checks passed, render the children
  return <>{children}</>;
};

/**
 * A simple component to show content only to administrators
 */
export const AdminOnly: React.FC<{ children: React.ReactNode, fallback?: React.ReactNode }> = ({
  children,
  fallback = null
}) => {
  return (
    <RbacWrapper requiredRole="admin" fallback={fallback}>
      {children}
    </RbacWrapper>
  );
};

/**
 * A component to show content only to tenant administrators
 */
export const TenantAdminOnly: React.FC<{ 
  tenantId: string, 
  children: React.ReactNode, 
  fallback?: React.ReactNode 
}> = ({
  tenantId,
  children,
  fallback = null
}) => {
  return (
    <RbacWrapper requiredRole="tenantAdmin" tenantId={tenantId} fallback={fallback}>
      {children}
    </RbacWrapper>
  );
};

/**
 * A component to show content only to users with a specific permission
 */
export const PermissionRequired: React.FC<{
  permission: string,
  resource?: PermissionResource,
  children: React.ReactNode,
  fallback?: React.ReactNode
}> = ({
  permission,
  resource,
  children,
  fallback = null
}) => {
  return (
    <RbacWrapper 
      requiredPermission={permission} 
      requiredResource={resource} 
      fallback={fallback}
    >
      {children}
    </RbacWrapper>
  );
}; 