"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useClientAuth";
import { RBACService } from "@/lib/services/rbac";
import { AdminDashboard } from "@/components/admin/dashboard/AdminDashboard";
import { CompanyDashboard } from "@/components/company/dashboard/CompanyDashboard";
import { TenantDashboard } from "@/components/tenant/dashboard/TenantDashboard";
import { AgentDashboard } from "@/components/agent/dashboard/AgentDashboard";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    const loadUserRole = async () => {
      if (!user) {
        router.push("/login");
        return;
      }

      const userId = user.uid || (user as any).id;
      if (!userId) {
        console.error("No user ID found");
        router.push("/login");
        return;
      }

      try {
        const rbacService = RBACService.getInstance();
        const userRole = await rbacService.getUserRole(userId);
        
        if (!userRole) {
          console.error("No role found for user");
          setLoading(false);
          return;
        }

        setRole(userRole.roleId);
        setCompanyId(userRole.companyId || null);
        setTenantId(userRole.tenantId || null);
        
        // Store the role in localStorage for quick access
        try {
          localStorage.setItem(`user_role_${userId}`, userRole.roleId);
          // Also store company and tenant IDs if available
          if (userRole.companyId) {
            localStorage.setItem(`user_company_${userId}`, userRole.companyId);
          }
          if (userRole.tenantId) {
            localStorage.setItem(`user_tenant_${userId}`, userRole.tenantId);
          }
        } catch (e) {
          console.warn("Could not store role in localStorage:", e);
        }
        
        // Redirect system_admin users to the dedicated admin dashboard
        if (userRole.roleId === "system_admin") {
          router.push("/admin-dashboard");
        }
      } catch (error) {
        console.error("Error loading user role:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserRole();
  }, [user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 h-screen" data-testid="dashboard-loading">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login in useEffect
  }

  if (!role) {
    return (
      <div className="container mx-auto py-6" data-testid="dashboard-no-role">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">
                No role assigned to your account. Please contact an administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Role-based dashboard rendering (system_admin is handled by redirect)
  if (role === "company_admin" && companyId) {
    return <CompanyDashboard companyId={companyId} />;
  }

  if (role === "tenant_admin" && tenantId) {
    return <TenantDashboard tenantId={tenantId} />;
  }

  if (role === "tenant_agent" && tenantId) {
    return <AgentDashboard tenantId={tenantId} />;
  }

  // Fallback
  return (
    <div data-testid="dashboard-summary">
      <div className="container mx-auto py-6">
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-amber-700">
                Unable to load the appropriate dashboard for your role. Please contact support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 