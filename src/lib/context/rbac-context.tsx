import React, { createContext, useContext, useEffect, useState } from 'react';
import { RBACService } from '@/lib/services/rbac';
import { useAuth } from '@/lib/context/auth-context';
import type { Permission, RoleType, UserRole } from '@/lib/types/auth';

interface RBACContextType {
  role: UserRole | null;
  permissions: Permission[];
  isLoading: boolean;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  refreshPermissions: () => Promise<void>;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

export function RBACProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const rbacService = RBACService.getInstance();

  const loadUserRole = async () => {
    if (!user) {
      setRole(null);
      setPermissions([]);
      setIsLoading(false);
      return;
    }

    try {
      const userRole = await rbacService.getUserRole(user.uid);
      const userPermissions = await rbacService.getUserPermissions(user.uid);
      
      // Log roles when they're loaded or changed
      if (userRole) {
        console.log(`RBAC: Role loaded for user ${user.uid}`, {
          userId: user.uid,
          email: user.email,
          roleId: userRole.roleId,
          companyId: userRole.companyId || 'none',
          tenantId: userRole.tenantId || 'none',
          permissionsCount: userPermissions.length,
          timestamp: new Date().toISOString()
        });
        
        // Log detailed permissions in development environment
        if (process.env.NODE_ENV === 'development') {
          console.log('User permissions:', userPermissions);
        }
      } else {
        console.log(`RBAC: No role found for user ${user.uid}`);
      }
      
      setRole(userRole);
      setPermissions(userPermissions);
    } catch (error) {
      console.error('Error loading user role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserRole();
  }, [user]);

  // Track role changes
  useEffect(() => {
    if (role) {
      console.log(`RBAC: Active role ${role.roleId} for user ${role.userId}`);
    }
  }, [role]);

  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (perms: Permission[]): boolean => {
    return perms.some(permission => permissions.includes(permission));
  };

  const hasAllPermissions = (perms: Permission[]): boolean => {
    return perms.every(permission => permissions.includes(permission));
  };

  const refreshPermissions = async () => {
    console.log('RBAC: Refreshing permissions');
    await loadUserRole();
  };

  const value = {
    role,
    permissions,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshPermissions,
  };

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>;
}

export function useRBAC() {
  const context = useContext(RBACContext);
  if (context === undefined) {
    throw new Error('useRBAC must be used within a RBACProvider');
  }
  return context;
}

// Higher-order component to protect routes based on permissions
export function withPermission(
  WrappedComponent: React.ComponentType,
  requiredPermissions: Permission[]
) {
  return function PermissionGuard(props: any) {
    const { hasAllPermissions, isLoading } = useRBAC();

    if (isLoading) {
      return <div>Loading...</div>; // Replace with your loading component
    }

    if (!hasAllPermissions(requiredPermissions)) {
      return <div>Access Denied</div>; // Replace with your access denied component
    }

    return <WrappedComponent {...props} />;
  };
} 