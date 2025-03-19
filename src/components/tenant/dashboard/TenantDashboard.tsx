import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { TenantSettings } from './TenantSettings';
import { TenantUsers } from './TenantUsers';
import { TenantLeads } from './TenantLeads';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from '@/lib/types/date';
import { useRBAC } from '@/lib/context/rbac-context';

interface TenantDashboardProps {
  tenantId: string;
}

export function TenantDashboard({ tenantId }: TenantDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  });
  
  const { hasPermission, isLoading } = useRBAC();
  
  // Define permission checks
  const canViewLeads = hasPermission('read:leads');
  const canViewUsers = hasPermission('read:users');
  const canViewSettings = hasPermission('read:settings');
  const canUpdateSettings = hasPermission('update:settings');
  
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
  
  // Get available tabs based on permissions
  const getAvailableTabs = () => {
    const tabs = [];
    const totalTabs = [canViewLeads, canViewUsers, canViewSettings].filter(Boolean).length;
    const gridCols = totalTabs > 0 ? `grid-cols-${totalTabs}` : 'grid-cols-1';
    
    if (canViewLeads) {
      tabs.push(
        <TabsTrigger key="leads" value="leads">Leads</TabsTrigger>
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
    
    return { tabs, gridCols };
  };
  
  // Determine default tab based on permissions
  const getDefaultTab = () => {
    if (canViewLeads) return "leads";
    if (canViewUsers) return "users";
    if (canViewSettings) return "settings";
    return "leads"; // Fallback
  };
  
  const { tabs, gridCols } = getAvailableTabs();

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tenant Dashboard</h1>
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {canViewUsers && (
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Total Users</h3>
            <p className="text-2xl">25</p>
          </Card>
        )}
        {canViewLeads && (
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Active Leads</h3>
            <p className="text-2xl">142</p>
          </Card>
        )}
        {canViewLeads && (
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Conversion Rate</h3>
            <p className="text-2xl">32%</p>
          </Card>
        )}
      </div>

      {tabs.length > 0 ? (
        <Tabs defaultValue={getDefaultTab()} className="w-full">
          <TabsList className={`grid w-full ${gridCols}`}>
            {tabs}
          </TabsList>

          {canViewLeads && (
            <TabsContent value="leads">
              <TenantLeads dateRange={dateRange} />
            </TabsContent>
          )}

          {canViewUsers && (
            <TabsContent value="users">
              <TenantUsers />
            </TabsContent>
          )}

          {canViewSettings && (
            <TabsContent value="settings">
              <TenantSettings tenantId={tenantId} />
            </TabsContent>
          )}
        </Tabs>
      ) : (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You don't have permissions to view tenant dashboard data. Please contact your administrator.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 