import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SystemMetrics } from './SystemMetrics';
import { UserActivityReport } from './UserActivityReport';
import { TenantUsageReport } from './TenantUsageReport';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from '@/lib/types/date';

export function ReportingDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    to: new Date(),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">System Reports</h1>
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
        />
      </div>

      <Tabs defaultValue="metrics" className="w-full">
        <TabsList>
          <TabsTrigger value="metrics">System Metrics</TabsTrigger>
          <TabsTrigger value="activity">User Activity</TabsTrigger>
          <TabsTrigger value="usage">Tenant Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics">
          <Card className="p-6">
            <SystemMetrics dateRange={dateRange} />
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card className="p-6">
            <UserActivityReport dateRange={dateRange} />
          </Card>
        </TabsContent>

        <TabsContent value="usage">
          <Card className="p-6">
            <TenantUsageReport dateRange={dateRange} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 