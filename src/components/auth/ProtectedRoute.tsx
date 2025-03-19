"use client";

import React, { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { UserPermission } from '@/types/auth';
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermissions?: UserPermission[];
  requireAllPermissions?: boolean;
  fallbackUrl?: string;
}

export default function ProtectedRoute({
  children,
  requiredPermissions = [],
  requireAllPermissions = false,
  fallbackUrl = '/login',
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { hasAllPermissions, hasAnyPermission } = usePermissions();
  const router = useRouter();
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Redirect if not authenticated
  if (!user) {
    router.push(fallbackUrl);
    return null;
  }
  
  // Check permissions if required
  if (requiredPermissions.length > 0) {
    const hasPermission = requireAllPermissions
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);
    
    if (!hasPermission) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-center mb-6">
            You don't have the required permissions to access this page.
          </p>
          <Button
            onClick={() => router.back()}
            className="px-4 py-2"
          >
            Go Back
          </Button>
        </div>
      );
    }
  }
  
  // Render children if authenticated and has permissions
  return <>{children}</>;
} 