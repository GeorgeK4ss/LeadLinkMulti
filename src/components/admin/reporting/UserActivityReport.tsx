import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { DateRange } from '@/lib/types/date';

interface UserActivityReportProps {
  dateRange: DateRange;
}

// Sample data for demonstration
const activityData = [
  { name: 'Mon', logins: 12, actions: 45, documents: 5 },
  { name: 'Tue', logins: 19, actions: 67, documents: 8 },
  { name: 'Wed', logins: 15, actions: 58, documents: 10 },
  { name: 'Thu', logins: 22, actions: 79, documents: 12 },
  { name: 'Fri', logins: 18, actions: 63, documents: 7 },
  { name: 'Sat', logins: 8, actions: 25, documents: 3 },
  { name: 'Sun', logins: 5, actions: 18, documents: 2 },
];

export function UserActivityReport({ dateRange }: UserActivityReportProps) {
  // In a real implementation, we would fetch data based on the date range
  // For now, we'll just use the sample data

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>User Activity</CardTitle>
        <CardDescription>
          User activity metrics from {dateRange.from ? new Date(dateRange.from).toLocaleDateString() : 'start'} to {dateRange.to ? new Date(dateRange.to).toLocaleDateString() : 'now'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={activityData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="logins" fill="#8884d8" name="Logins" />
              <Bar dataKey="actions" fill="#82ca9d" name="Actions" />
              <Bar dataKey="documents" fill="#ffc658" name="Documents" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="rounded-lg bg-muted p-2">
            <p className="text-muted-foreground">Total Logins</p>
            <p className="text-2xl font-bold">99</p>
          </div>
          <div className="rounded-lg bg-muted p-2">
            <p className="text-muted-foreground">Total Actions</p>
            <p className="text-2xl font-bold">355</p>
          </div>
          <div className="rounded-lg bg-muted p-2">
            <p className="text-muted-foreground">Documents Created</p>
            <p className="text-2xl font-bold">47</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 