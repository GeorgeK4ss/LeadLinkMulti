import React, { useEffect, useState } from 'react';
import { DashboardWidget } from '@/components/ui/responsive-dashboard';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PieChart } from '@/components/charts/PieChart';
import { Card } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon } from '@radix-ui/react-icons';

interface LeadMetricsWidgetProps {
  tenantId: string;
  period?: '7days' | '30days' | '90days';
  desktopWidth?: "full" | "half" | "third" | "two-thirds" | "quarter";
}

interface LeadMetrics {
  totalLeads: number;
  newLeadsCount: number;
  convertedLeadsCount: number;
  conversionRate: number;
  statusDistribution: {
    name: string;
    value: number;
  }[];
  changeFromLastPeriod: number;
}

export function LeadMetricsWidget({ 
  tenantId, 
  period = '30days', 
  desktopWidth = "half"
}: LeadMetricsWidgetProps) {
  const [metrics, setMetrics] = useState<LeadMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeadMetrics = async () => {
      try {
        setLoading(true);
        
        // Calculate start date for the selected period
        const now = new Date();
        const startDate = new Date();
        
        switch (period) {
          case '7days':
            startDate.setDate(now.getDate() - 7);
            break;
          case '90days':
            startDate.setDate(now.getDate() - 90);
            break;
          case '30days':
          default:
            startDate.setDate(now.getDate() - 30);
            break;
        }
        
        // Get all leads for this tenant
        const leadsCollection = collection(db, `tenants/${tenantId}/leads`);
        const leadsQuery = query(leadsCollection);
        const querySnapshot = await getDocs(leadsQuery);
        
        // Initialize counters
        let totalLeads = 0;
        let newLeadsCount = 0;
        let convertedLeadsCount = 0;
        const statusCounts: Record<string, number> = {};
        
        // Process each lead
        querySnapshot.forEach((doc) => {
          const leadData = doc.data();
          totalLeads++;
          
          // Count new leads in the selected period
          if (leadData.createdAt && new Date(leadData.createdAt.seconds * 1000) >= startDate) {
            newLeadsCount++;
          }
          
          // Count converted leads
          if (leadData.status === 'converted') {
            convertedLeadsCount++;
          }
          
          // Count leads by status
          const status = leadData.status || 'unknown';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        
        // Calculate conversion rate
        const conversionRate = totalLeads > 0 ? Math.round((convertedLeadsCount / totalLeads) * 100) : 0;
        
        // Transform status counts into chart data
        const statusDistribution = Object.keys(statusCounts).map(status => ({
          name: status.charAt(0).toUpperCase() + status.slice(1),
          value: statusCounts[status]
        }));
        
        // For demo purposes, generate a random change percentage
        const changeFromLastPeriod = Math.floor(Math.random() * 41) - 20; // -20 to +20
        
        // Set the metrics
        setMetrics({
          totalLeads,
          newLeadsCount,
          convertedLeadsCount,
          conversionRate,
          statusDistribution,
          changeFromLastPeriod
        });
      } catch (error) {
        console.error('Error fetching lead metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeadMetrics();
  }, [tenantId, period]);

  const renderTrendIndicator = () => {
    if (!metrics) return null;
    
    const { changeFromLastPeriod } = metrics;
    
    if (changeFromLastPeriod > 0) {
      return (
        <div className="flex items-center text-green-500 text-sm font-medium">
          <ArrowUpIcon className="mr-1 h-4 w-4" />
          <span>+{changeFromLastPeriod}%</span>
        </div>
      );
    } else if (changeFromLastPeriod < 0) {
      return (
        <div className="flex items-center text-red-500 text-sm font-medium">
          <ArrowDownIcon className="mr-1 h-4 w-4" />
          <span>{changeFromLastPeriod}%</span>
        </div>
      );
    }
    
    return <span className="text-muted-foreground text-sm">No change</span>;
  };

  return (
    <DashboardWidget
      title="Lead Metrics"
      description="Lead generation and conversion"
      desktopWidth={desktopWidth}
      loading={loading}
    >
      {metrics ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">{metrics.conversionRate}%</h3>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
              </div>
              {renderTrendIndicator()}
            </div>
          </div>
          
          <Card className="p-3">
            <p className="text-sm text-muted-foreground">Total Leads</p>
            <p className="text-xl font-semibold">{metrics.totalLeads}</p>
          </Card>
          
          <Card className="p-3">
            <p className="text-sm text-muted-foreground">New Leads</p>
            <p className="text-xl font-semibold">{metrics.newLeadsCount}</p>
          </Card>
          
          <div className="col-span-2 h-[200px]">
            <p className="text-sm font-medium mb-2">Lead Status Distribution</p>
            <div className="h-[180px]">
              {metrics.statusDistribution.length > 0 ? (
                <PieChart data={metrics.statusDistribution} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No lead data available
        </div>
      )}
    </DashboardWidget>
  );
} 