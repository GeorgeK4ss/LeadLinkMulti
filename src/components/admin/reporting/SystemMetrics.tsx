import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { SystemService } from '@/lib/services/SystemService';
import type { DateRange } from '@/lib/types/date';
import type { SystemStats } from '@/lib/types/system';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SystemMetricsProps {
  dateRange: DateRange;
}

export function SystemMetrics({ dateRange }: SystemMetricsProps) {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const systemService = SystemService.getInstance();
        const data = await systemService.getSystemStats();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch system stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [dateRange]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
          <p className="text-2xl font-bold">{stats.totalUsers}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Companies</h3>
          <p className="text-2xl font-bold">{stats.totalCompanies}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Tenants</h3>
          <p className="text-2xl font-bold">{stats.totalTenants}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Active Subscriptions</h3>
          <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">System Activity</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="activeUsers"
                stroke="#8884d8"
                name="Active Users"
              />
              <Line
                type="monotone"
                dataKey="newSignups"
                stroke="#82ca9d"
                name="New Signups"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Resource Usage</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.resourceUsage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="storage"
                stroke="#8884d8"
                name="Storage Usage"
              />
              <Line
                type="monotone"
                dataKey="bandwidth"
                stroke="#82ca9d"
                name="Bandwidth Usage"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
} 