import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { CompanySettings } from './CompanySettings';
import { CompanyUsers } from './CompanyUsers';
import { CompanyTenants } from './CompanyTenants';
import type { DateRange } from '@/lib/types/date';
import { useRBAC } from '@/lib/context/rbac-context';

interface CompanyDashboardProps {
  companyId: string;
}

export function CompanyDashboard({ companyId }: CompanyDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  });
  
  const { hasPermission, role, isLoading } = useRBAC();
  
  // Define permission checks
  const canViewTenants = hasPermission('read:tenants');
  const canViewUsers = hasPermission('read:users');
  const canViewLeads = hasPermission('read:leads');
  const canViewSettings = hasPermission('read:settings');
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }
  
  // Only company-level roles should access this dashboard
  if (!role || !role.roleId.startsWith('company_')) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Access denied. You need a company role to view this dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Get available tabs based on permissions
  const getAvailableTabs = () => {
    const tabs = [];
    
    // Always include overview if any permissions exist
    if (canViewTenants || canViewUsers || canViewLeads) {
      tabs.push(
        <TabsTrigger key="overview" value="overview">Overview</TabsTrigger>
      );
    }
    
    if (canViewTenants) {
      tabs.push(
        <TabsTrigger key="tenants" value="tenants">Tenants</TabsTrigger>
      );
    }
    
    if (canViewUsers) {
      tabs.push(
        <TabsTrigger key="users" value="users">Users</TabsTrigger>
      );
    }
    
    if (canViewSettings) {
      tabs.push(
        <TabsTrigger key="settings" value="settings">Settings</TabsTrigger>
      );
    }
    
    return tabs;
  };
  
  // Determine default tab based on permissions
  const getDefaultTab = () => {
    if (canViewTenants || canViewUsers || canViewLeads) return "overview";
    if (canViewTenants) return "tenants";
    if (canViewUsers) return "users";
    if (canViewSettings) return "settings";
    return "overview"; // Fallback
  };
  
  const tabs = getAvailableTabs();
  const totalTabs = tabs.length;
  const gridCols = totalTabs > 0 ? `grid-cols-${totalTabs}` : 'grid-cols-1';

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Company Dashboard</h1>
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {canViewTenants && (
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Total Tenants</h3>
            <p className="text-2xl">12</p>
          </Card>
        )}
        {canViewUsers && (
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Total Users</h3>
            <p className="text-2xl">78</p>
          </Card>
        )}
        {canViewLeads && (
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Active Leads</h3>
            <p className="text-2xl">587</p>
          </Card>
        )}
        {canViewLeads && (
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Conversion Rate</h3>
            <p className="text-2xl">28%</p>
          </Card>
        )}
      </div>

      {tabs.length > 0 ? (
        <Tabs defaultValue={getDefaultTab()} className="w-full">
          <TabsList className={`grid w-full ${gridCols}`}>
            {tabs}
          </TabsList>

          {(canViewTenants || canViewUsers || canViewLeads) && (
            <TabsContent value="overview">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Company Performance</h2>
                <div className="space-y-4">
                  <p>Performance metrics and charts will be displayed here.</p>
                  {/* Add chart components here */}
                </div>
              </Card>
            </TabsContent>
          )}

          {canViewTenants && (
            <TabsContent value="tenants">
              <CompanyTenants companyId={companyId} />
            </TabsContent>
          )}

          {canViewUsers && (
            <TabsContent value="users">
              <CompanyUsers companyId={companyId} />
            </TabsContent>
          )}

          {canViewSettings && (
            <TabsContent value="settings">
              <CompanySettings companyId={companyId} />
            </TabsContent>
          )}
        </Tabs>
      ) : (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You don't have permissions to view company dashboard data. Please contact your administrator.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 