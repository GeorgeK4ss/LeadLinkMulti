import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import type { DateRange } from '@/lib/types/date';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TenantOverviewProps {
  dateRange: DateRange;
}

interface TenantStats {
  totalUsers: number;
  activeUsers: number;
  totalLeads: number;
  conversionRate: number;
  activityData: Array<{
    date: string;
    activeUsers: number;
    newLeads: number;
    conversions: number;
  }>;
}

export function TenantOverview({ dateRange }: TenantOverviewProps) {
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Implement actual data fetching from TenantService
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Mock data for now
        const mockStats: TenantStats = {
          totalUsers: 25,
          activeUsers: 18,
          totalLeads: 150,
          conversionRate: 12.5,
          activityData: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            activeUsers: Math.floor(Math.random() * 20) + 10,
            newLeads: Math.floor(Math.random() * 10) + 2,
            conversions: Math.floor(Math.random() * 3) + 1,
          })),
        };
        setStats(mockStats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tenant stats');
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
          <h3 className="text-sm font-medium text-gray-500">Active Users</h3>
          <p className="text-2xl font-bold">{stats.activeUsers}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Leads</h3>
          <p className="text-2xl font-bold">{stats.totalLeads}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Conversion Rate</h3>
          <p className="text-2xl font-bold">{stats.conversionRate}%</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Activity Overview</h3>
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
                dataKey="newLeads"
                stroke="#82ca9d"
                name="New Leads"
              />
              <Line
                type="monotone"
                dataKey="conversions"
                stroke="#ffc658"
                name="Conversions"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
} 