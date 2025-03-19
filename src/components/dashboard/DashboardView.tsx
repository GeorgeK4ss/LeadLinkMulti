import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CustomerService } from '@/lib/services/CustomerService';
import { LeadService } from '@/lib/services/LeadService';
import { Customer, CustomerCategory, CustomerStatus } from '@/types/customer';
import { Lead, LeadStatus } from '@/types/lead';
import { PieChart, LineChart, BarChart } from '@/components/charts';
import { useRBAC } from '@/lib/context/rbac-context';
import type { Permission } from '@/lib/types/auth';

interface DashboardViewProps {
  tenantId: string;
}

interface CustomerStats {
  total: number;
  active: number;
  inactive: number;
  atRisk: number;
  churned: number;
  averageLifetimeValue: number;
  customersByCategory: Record<CustomerCategory, number>;
}

interface LeadStats {
  total: number;
  new: number;
  contacted: number;
  qualified: number;
  proposal: number;
  closed: number;
  lost: number;
  conversionRate: number;
}

export function DashboardView({ tenantId }: DashboardViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null);
  const [leadStats, setLeadStats] = useState<LeadStats | null>(null);
  const [leadsByMonth, setLeadsByMonth] = useState<{ month: string; count: number }[]>([]);
  const [customersByMonth, setCustomersByMonth] = useState<{ month: string; count: number }[]>([]);
  const [timeframe, setTimeframe] = useState<'30days' | '90days' | '12months'>('30days');
  
  const customerService = new CustomerService();
  const leadService = new LeadService(tenantId);
  const { hasPermission, role, isLoading: isRbacLoading } = useRBAC();

  // Required permissions for different dashboard sections
  const canViewLeads = hasPermission('read:leads');
  const canViewCustomers = hasPermission('read:customers');
  const canManageLeads = hasPermission('manage:leads');
  const canManageCustomers = hasPermission('manage:customers');
  
  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        // Load customer statistics
        const customerStatsData = await customerService.getCustomerStats(tenantId);
        setCustomerStats(customerStatsData);
        
        // Load leads
        const leadsData = await leadService.getLeads();
        
        // Calculate lead statistics
        const newLeads = leadsData.filter(lead => lead.status === 'new').length;
        const contactedLeads = leadsData.filter(lead => lead.status === 'contacted').length;
        const qualifiedLeads = leadsData.filter(lead => lead.status === 'qualified').length;
        const proposalLeads = leadsData.filter(lead => lead.status === 'proposal').length;
        const closedLeads = leadsData.filter(lead => lead.status === 'closed').length;
        const lostLeads = leadsData.filter(lead => lead.status === 'lost').length;
        
        // Calculate conversion rate (closed leads / total qualified or higher)
        const conversionRateTotal = qualifiedLeads + proposalLeads + closedLeads + lostLeads;
        const conversionRate = conversionRateTotal > 0 
          ? (closedLeads / conversionRateTotal) * 100 
          : 0;
        
        setLeadStats({
          total: leadsData.length,
          new: newLeads,
          contacted: contactedLeads,
          qualified: qualifiedLeads,
          proposal: proposalLeads,
          closed: closedLeads,
          lost: lostLeads,
          conversionRate
        });
        
        // Process monthly data for charts
        const leadData = processMonthlyData(leadsData, timeframe);
        setLeadsByMonth(leadData);
        
        // Load customers
        const customers = await customerService.getCustomers(tenantId, 1000);
        const customerData = processMonthlyData(customers, timeframe);
        setCustomersByMonth(customerData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadDashboardData();
  }, [tenantId, timeframe]);
  
  // Function to process monthly data for charts
  const processMonthlyData = (items: (Lead | Customer)[], period: '30days' | '90days' | '12months') => {
    // Get date range
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '30days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 90);
        break;
      case '12months':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 12);
        break;
    }
    
    // Initialize months array
    const months: { [key: string]: number } = {};
    
    // If 30 or 90 days, we'll use daily data points, otherwise monthly
    if (period === '30days' || period === '90days') {
      const dayCount = period === '30days' ? 30 : 90;
      for (let i = 0; i < dayCount; i++) {
        const date = new Date(now);
        date.setDate(now.getDate() - (dayCount - 1 - i));
        const dayLabel = `${date.getMonth() + 1}/${date.getDate()}`;
        months[dayLabel] = 0;
      }
    } else {
      // 12 months view
      for (let i = 0; i < 12; i++) {
        const date = new Date(now);
        date.setMonth(now.getMonth() - (11 - i));
        const monthLabel = date.toLocaleString('default', { month: 'short' });
        months[monthLabel] = 0;
      }
    }
    
    // Count items by month or day
    items.forEach(item => {
      const createdDate = new Date(item.createdAt);
      if (createdDate >= startDate) {
        if (period === '30days' || period === '90days') {
          const dayLabel = `${createdDate.getMonth() + 1}/${createdDate.getDate()}`;
          if (months[dayLabel] !== undefined) {
            months[dayLabel]++;
          }
        } else {
          // 12 months view
          const monthLabel = createdDate.toLocaleString('default', { month: 'short' });
          if (months[monthLabel] !== undefined) {
            months[monthLabel]++;
          }
        }
      }
    });
    
    // Convert to array format for charts
    return Object.entries(months).map(([month, count]) => ({
      month,
      count
    }));
  };
  
  const renderCustomerCategoryChart = () => {
    if (!customerStats) return null;
    
    const data = Object.entries(customerStats.customersByCategory).map(([category, count]) => ({
      name: category.replace('_', ' '),
      value: count
    }));
    
    return <PieChart data={data} />;
  };
  
  const renderLeadStatusChart = () => {
    if (!leadStats) return null;
    
    const data = [
      { name: 'New', value: leadStats.new },
      { name: 'Contacted', value: leadStats.contacted },
      { name: 'Qualified', value: leadStats.qualified },
      { name: 'Proposal', value: leadStats.proposal },
      { name: 'Closed', value: leadStats.closed },
      { name: 'Lost', value: leadStats.lost }
    ];
    
    return <PieChart data={data} />;
  };
  
  const renderLeadTrendChart = () => {
    if (leadsByMonth.length === 0) return null;
    
    return (
      <LineChart 
        data={leadsByMonth} 
        xKey="month" 
        yKey="count" 
        name="New Leads" 
      />
    );
  };
  
  const renderCustomerTrendChart = () => {
    if (customersByMonth.length === 0) return null;
    
    return (
      <LineChart 
        data={customersByMonth} 
        xKey="month" 
        yKey="count" 
        name="New Customers" 
      />
    );
  };
  
  const renderConversionRateChart = () => {
    if (!leadStats) return null;
    
    // Create a simple chart with only the conversion rate
    const data = [
      { name: 'Converted', value: leadStats.conversionRate },
      { name: 'Not Converted', value: 100 - leadStats.conversionRate }
    ];
    
    return <PieChart data={data} />;
  };
  
  if (isLoading || isRbacLoading) {
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
    
    // Overview tab is available to everyone with basic read permissions
    if (canViewLeads || canViewCustomers) {
      tabs.push(
        <TabsTrigger key="overview" value="overview">Overview</TabsTrigger>
      );
    }
    
    // Leads tab is only available to users with lead permissions
    if (canViewLeads) {
      tabs.push(
        <TabsTrigger key="leads" value="leads">Leads</TabsTrigger>
      );
    }
    
    // Customers tab is only available to users with customer permissions
    if (canViewCustomers) {
      tabs.push(
        <TabsTrigger key="customers" value="customers">Customers</TabsTrigger>
      );
    }
    
    return tabs;
  };
  
  // Determine default tab based on permissions
  const getDefaultTab = () => {
    if (canViewLeads || canViewCustomers) return "overview";
    if (canViewLeads) return "leads";
    if (canViewCustomers) return "customers";
    return "overview"; // Fallback
  };
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        
        <div className="flex space-x-2 mt-4 md:mt-0">
          <Button 
            variant={timeframe === '30days' ? 'default' : 'outline'} 
            onClick={() => setTimeframe('30days')}
          >
            30 Days
          </Button>
          <Button 
            variant={timeframe === '90days' ? 'default' : 'outline'} 
            onClick={() => setTimeframe('90days')}
          >
            90 Days
          </Button>
          <Button 
            variant={timeframe === '12months' ? 'default' : 'outline'} 
            onClick={() => setTimeframe('12months')}
          >
            12 Months
          </Button>
        </div>
      </div>
      
      {/* KPI Cards - conditionally rendered based on permissions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {canViewLeads && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">
                {leadStats?.total || 0}
              </CardTitle>
              <CardDescription>Total Leads</CardDescription>
            </CardHeader>
          </Card>
        )}
        
        {canViewCustomers && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">
                {customerStats?.total || 0}
              </CardTitle>
              <CardDescription>Total Customers</CardDescription>
            </CardHeader>
          </Card>
        )}
        
        {canViewLeads && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">
                {leadStats?.conversionRate.toFixed(1) || 0}%
              </CardTitle>
              <CardDescription>Lead Conversion Rate</CardDescription>
            </CardHeader>
          </Card>
        )}
        
        {canViewCustomers && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">
                ${Math.round(customerStats?.averageLifetimeValue || 0).toLocaleString()}
              </CardTitle>
              <CardDescription>Avg. Customer Value</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
      
      {/* Role-based tabs */}
      <Tabs defaultValue={getDefaultTab()} className="w-full">
        <TabsList className="mb-4">
          {getAvailableTabs()}
        </TabsList>
        
        {(canViewLeads || canViewCustomers) && (
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {canViewLeads && (
                <Card>
                  <CardHeader>
                    <CardTitle>New Leads Over Time</CardTitle>
                    <CardDescription>
                      Tracking lead generation over the selected time period
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {renderLeadTrendChart()}
                  </CardContent>
                </Card>
              )}
              
              {canViewCustomers && (
                <Card>
                  <CardHeader>
                    <CardTitle>New Customers Over Time</CardTitle>
                    <CardDescription>
                      Tracking customer acquisition over the selected time period
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {renderCustomerTrendChart()}
                  </CardContent>
                </Card>
              )}
              
              {canViewLeads && (
                <Card>
                  <CardHeader>
                    <CardTitle>Lead Status Distribution</CardTitle>
                    <CardDescription>
                      Breakdown of leads by their current status
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {renderLeadStatusChart()}
                  </CardContent>
                </Card>
              )}
              
              {canViewCustomers && (
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Categories</CardTitle>
                    <CardDescription>
                      Distribution of customers by category
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {renderCustomerCategoryChart()}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        )}
        
        {canViewLeads && (
          <TabsContent value="leads">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lead Status Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of leads by their current status
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {renderLeadStatusChart()}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Lead Conversion Rate</CardTitle>
                  <CardDescription>
                    Percentage of qualified leads that convert to customers
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {renderConversionRateChart()}
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Lead Generation Trend</CardTitle>
                  <CardDescription>
                    Number of new leads over time
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {renderLeadTrendChart()}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
        
        {canViewCustomers && (
          <TabsContent value="customers">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Categories</CardTitle>
                  <CardDescription>
                    Distribution of customers by category
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {renderCustomerCategoryChart()}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Customer Status</CardTitle>
                  <CardDescription>
                    Distribution of customers by their current status
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {customerStats && (
                    <PieChart 
                      data={[
                        { name: 'Active', value: customerStats.active },
                        { name: 'Inactive', value: customerStats.inactive },
                        { name: 'At Risk', value: customerStats.atRisk },
                        { name: 'Churned', value: customerStats.churned }
                      ]} 
                    />
                  )}
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Customer Acquisition Trend</CardTitle>
                  <CardDescription>
                    Number of new customers over time
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {renderCustomerTrendChart()}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
      
      {!canViewLeads && !canViewCustomers && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You don't have permissions to view dashboard data. Please contact your administrator.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 