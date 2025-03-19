import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { DateRange } from '@/lib/types/date';

interface TenantUsageReportProps {
  dateRange: DateRange;
}

// Sample data for demonstration
const tenantData = [
  { name: 'Enterprise', value: 45, color: '#8884d8' },
  { name: 'Mid-Market', value: 30, color: '#82ca9d' },
  { name: 'Small Business', value: 15, color: '#ffc658' },
  { name: 'Startup', value: 10, color: '#ff8042' },
];

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

export function TenantUsageReport({ dateRange }: TenantUsageReportProps) {
  // In a real implementation, we would fetch data based on the date range
  // For now, we'll just use the sample data

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Tenant Usage Distribution</CardTitle>
        <CardDescription>
          Tenant usage metrics from {dateRange.from ? new Date(dateRange.from).toLocaleDateString() : 'start'} to {dateRange.to ? new Date(dateRange.to).toLocaleDateString() : 'now'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={tenantData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {tenantData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-center">
          <div className="rounded-lg bg-muted p-2">
            <p className="text-muted-foreground">Total Tenants</p>
            <p className="text-2xl font-bold">42</p>
          </div>
          <div className="rounded-lg bg-muted p-2">
            <p className="text-muted-foreground">Active Tenants</p>
            <p className="text-2xl font-bold">38</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 