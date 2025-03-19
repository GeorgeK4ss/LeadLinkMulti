"use client";

import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { UserPermission, DEFAULT_ROLE_PERMISSIONS, AuthUser } from '@/types/auth';

export function usePermissions() {
  const { user } = useAuth();
  
  const hasPermission = useCallback((permission: UserPermission): boolean => {
    if (!user) return false;
    
    // Cast user to AuthUser type
    const authUser = user as AuthUser;
    
    // If user has explicit permissions, check those
    if (authUser.permissions && authUser.permissions.length > 0) {
      return authUser.permissions.includes(permission);
    }
    
    // Otherwise, check role-based permissions
    if (authUser.role) {
      const rolePermissions = DEFAULT_ROLE_PERMISSIONS[authUser.role];
      return rolePermissions.includes(permission);
    }
    
    // Default to no permission
    return false;
  }, [user]);
  
  const hasAnyPermission = useCallback((permissions: UserPermission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  }, [hasPermission]);
  
  const hasAllPermissions = useCallback((permissions: UserPermission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  }, [hasPermission]);
  
  const isAdmin = useCallback((): boolean => {
    return (user as AuthUser)?.role === 'admin';
  }, [user]);
  
  const isManager = useCallback((): boolean => {
    const authUser = user as AuthUser;
    return authUser?.role === 'manager' || authUser?.role === 'admin';
  }, [user]);
  
  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isManager
  };
} 