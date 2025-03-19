"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import {
  Database,
  Server,
  HardDrive,
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  BarChart3,
  ArrowUpDown
} from 'lucide-react';

// Types
interface DatabaseStatus {
  status: 'healthy' | 'degraded' | 'critical';
  message: string;
  lastChecked: Date;
}

interface QueryMetric {
  name: string;
  averageTime: number;
  count: number;
  errors: number;
}

interface DatabaseConnection {
  id: string;
  type: string;
  status: 'active' | 'idle';
  duration: number;
  query?: string;
}

interface StorageMetric {
  name: string;
  current: number;
  max: number;
  unit: string;
}

interface PerformanceTrend {
  timestamp: string;
  queryTime: number;
  connections: number;
  cpu: number;
  memory: number;
}

// Mock data - in a real app, this would come from API calls
const getMockDatabaseStatus = (): DatabaseStatus => ({
  status: 'healthy',
  message: 'All database systems operational',
  lastChecked: new Date()
});

const getMockQueryMetrics = (): QueryMetric[] => [
  { name: 'SELECT', averageTime: 12, count: 542, errors: 0 },
  { name: 'INSERT', averageTime: 18, count: 127, errors: 2 },
  { name: 'UPDATE', averageTime: 24, count: 83, errors: 1 },
  { name: 'DELETE', averageTime: 15, count: 19, errors: 0 },
  { name: 'JOIN Operations', averageTime: 56, count: 138, errors: 3 }
];

const getMockDatabaseConnections = (): DatabaseConnection[] => [
  { id: 'conn-001', type: 'App Server', status: 'active', duration: 1250, query: 'SELECT * FROM users WHERE last_login > ?' },
  { id: 'conn-002', type: 'App Server', status: 'idle', duration: 5430 },
  { id: 'conn-003', type: 'Admin Panel', status: 'active', duration: 780, query: 'UPDATE leads SET status = ? WHERE id = ?' },
  { id: 'conn-004', type: 'Reporting', status: 'active', duration: 12800, query: 'SELECT COUNT(*) FROM customers GROUP BY region' },
  { id: 'conn-005', type: 'Batch Job', status: 'idle', duration: 34520 }
];

const getMockStorageMetrics = (): StorageMetric[] => [
  { name: 'Data Size', current: 2.4, max: 10, unit: 'GB' },
  { name: 'Index Size', current: 0.8, max: 5, unit: 'GB' },
  { name: 'Total Size', current: 3.2, max: 15, unit: 'GB' },
  { name: 'Transaction Log', current: 0.3, max: 2, unit: 'GB' }
];

const getMockPerformanceTrends = (): PerformanceTrend[] => {
  const now = new Date();
  const data: PerformanceTrend[] = [];

  for (let i = 0; i < 24; i++) {
    const time = new Date(now);
    time.setHours(time.getHours() - (24 - i));
    
    data.push({
      timestamp: time.toISOString(),
      queryTime: 5 + Math.random() * 20 + (i % 8 === 0 ? 15 : 0), // Simulate periodic spikes
      connections: 15 + Math.round(Math.random() * 10) + (i > 16 ? 10 : 0), // More connections during "work hours"
      cpu: 20 + Math.random() * 30 + (i > 16 ? 20 : 0),
      memory: 30 + Math.random() * 20 + (i > 16 ? 15 : 0)
    });
  }

  return data;
};

// Helper functions
const formatDate = (date: Date): string => {
  return date.toLocaleString();
};

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

const getStatusColor = (status: 'healthy' | 'degraded' | 'critical') => {
  switch (status) {
    case 'healthy':
      return 'bg-green-100 text-green-800';
    case 'degraded':
      return 'bg-amber-100 text-amber-800';
    case 'critical':
      return 'bg-red-100 text-red-800';
  }
};

const getStatusIcon = (status: 'healthy' | 'degraded' | 'critical') => {
  switch (status) {
    case 'healthy':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'degraded':
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    case 'critical':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
  }
};

const getConnectionStatusColor = (status: 'active' | 'idle') => {
  return status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600';
};

const getProgressColor = (value: number, max: number) => {
  const percentage = (value / max) * 100;
  if (percentage < 50) return 'bg-green-500';
  if (percentage < 80) return 'bg-amber-500';
  return 'bg-red-500';
};

export function DatabaseMonitor() {
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>(getMockDatabaseStatus());
  const [queryMetrics, setQueryMetrics] = useState<QueryMetric[]>(getMockQueryMetrics());
  const [connections, setConnections] = useState<DatabaseConnection[]>(getMockDatabaseConnections());
  const [storageMetrics, setStorageMetrics] = useState<StorageMetric[]>(getMockStorageMetrics());
  const [performanceTrends, setPerformanceTrends] = useState<PerformanceTrend[]>(getMockPerformanceTrends());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Simulate refreshing data
  const refreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setDbStatus(getMockDatabaseStatus());
      setQueryMetrics(getMockQueryMetrics());
      setConnections(getMockDatabaseConnections());
      setStorageMetrics(getMockStorageMetrics());
      setPerformanceTrends(getMockPerformanceTrends());
      setIsLoading(false);
    }, 1000);
  };

  // Format trend data for charts
  const formatTrendData = () => {
    return performanceTrends.map(point => ({
      time: new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      queryTime: point.queryTime,
      connections: point.connections,
      cpu: point.cpu,
      memory: point.memory
    }));
  };

  // Periodically refresh data
  useEffect(() => {
    const interval = setInterval(refreshData, 1000 * 60 * 5); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Database Monitoring</h2>
        <Button 
          onClick={refreshData} 
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Database Status Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(dbStatus.status)}
            Database Status
          </CardTitle>
          <CardDescription>
            Last checked: {formatDate(dbStatus.lastChecked)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <Alert className={getStatusColor(dbStatus.status)}>
                <AlertTitle className="font-semibold">
                  {dbStatus.status === 'healthy' ? 'Database System Operational' : 
                   dbStatus.status === 'degraded' ? 'Database Performance Issues' : 
                   'Critical Database Problems'}
                </AlertTitle>
                <AlertDescription>
                  {dbStatus.message}
                </AlertDescription>
              </Alert>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="text-center">
                  <div className="text-2xl font-bold">{connections.length}</div>
                  <div className="text-sm text-gray-500">Active Connections</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {connections.filter(c => c.status === 'active').length}
                  </div>
                  <div className="text-sm text-gray-500">Running Queries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-500">
                    {queryMetrics.reduce((sum, metric) => sum + metric.errors, 0)}
                  </div>
                  <div className="text-sm text-gray-500">Query Errors (24h)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {queryMetrics.reduce((sum, metric) => sum + metric.count, 0)}
                  </div>
                  <div className="text-sm text-gray-500">Total Queries (24h)</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="queries" className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="queries" className="flex items-center gap-2">
            <Database className="h-4 w-4" /> Queries
          </TabsTrigger>
          <TabsTrigger value="storage" className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" /> Storage
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Performance Trends
          </TabsTrigger>
        </TabsList>

        {/* Queries Tab */}
        <TabsContent value="queries" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Query Performance Metrics</CardTitle>
              <CardDescription>Average query times and error rates by query type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 font-medium">Query Type</th>
                      <th className="text-right py-3 font-medium">Avg Time (ms)</th>
                      <th className="text-right py-3 font-medium">Count</th>
                      <th className="text-right py-3 font-medium">Errors</th>
                      <th className="text-right py-3 font-medium">Error Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queryMetrics.map((metric) => (
                      <tr key={metric.name} className="border-b">
                        <td className="py-3">{metric.name}</td>
                        <td className="text-right py-3">
                          <span className={`font-medium ${metric.averageTime > 50 ? 'text-red-500' : metric.averageTime > 30 ? 'text-amber-500' : 'text-green-500'}`}>
                            {metric.averageTime}
                          </span>
                        </td>
                        <td className="text-right py-3">{metric.count}</td>
                        <td className="text-right py-3">
                          <span className={metric.errors > 0 ? 'text-red-500 font-medium' : ''}>
                            {metric.errors}
                          </span>
                        </td>
                        <td className="text-right py-3">
                          <span className={metric.errors > 0 ? 'text-red-500 font-medium' : ''}>
                            {metric.count > 0 ? ((metric.errors / metric.count) * 100).toFixed(2) : '0.00'}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Database Connections</CardTitle>
              <CardDescription>Current connections and running queries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 font-medium">Connection ID</th>
                      <th className="text-left py-3 font-medium">Type</th>
                      <th className="text-left py-3 font-medium">Status</th>
                      <th className="text-right py-3 font-medium">Duration</th>
                      <th className="text-left py-3 font-medium">Current Query</th>
                    </tr>
                  </thead>
                  <tbody>
                    {connections.map((conn) => (
                      <tr key={conn.id} className="border-b">
                        <td className="py-3 font-mono text-xs">{conn.id}</td>
                        <td className="py-3">{conn.type}</td>
                        <td className="py-3">
                          <Badge className={getConnectionStatusColor(conn.status)}>
                            {conn.status}
                          </Badge>
                        </td>
                        <td className="text-right py-3 font-mono">
                          {formatDuration(conn.duration)}
                        </td>
                        <td className="py-3 font-mono text-xs truncate max-w-xs">
                          {conn.query || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Storage Tab */}
        <TabsContent value="storage" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {storageMetrics.map((metric) => (
              <Card key={metric.name}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    {metric.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">
                      {metric.current.toFixed(1)} {metric.unit} / {metric.max} {metric.unit}
                    </span>
                    <span className="text-sm font-medium">
                      {Math.round((metric.current / metric.max) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={(metric.current / metric.max) * 100} 
                    className={getProgressColor(metric.current, metric.max)}
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Storage Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Consider index optimization</h4>
                    <p className="text-sm text-gray-600">
                      Several unused indexes were detected which are consuming 
                      approximately 120MB of storage space.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Sufficient storage space</h4>
                    <p className="text-sm text-gray-600">
                      Based on current growth rates, you have approximately 8 months
                      before reaching 80% capacity.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Transaction log growth</h4>
                    <p className="text-sm text-gray-600">
                      Transaction logs are growing faster than expected. Consider 
                      more frequent log backups or implementing log size management.
                    </p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Trends Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Performance Trends</CardTitle>
              <CardDescription>
                Performance metrics over the last 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={formatTrendData()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="queryTime" 
                      name="Avg Query Time (ms)" 
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="connections" 
                      name="Active Connections" 
                      stroke="#82ca9d" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Database Resource Usage</CardTitle>
              <CardDescription>
                CPU and memory utilization over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={formatTrendData()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="cpu" 
                      name="CPU Usage (%)" 
                      stroke="#ff7300" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="memory" 
                      name="Memory Usage (%)" 
                      stroke="#0088fe" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Query Spike Detected</h4>
                    <p className="text-sm text-gray-600">
                      A regular spike in query times was detected at 8:00 AM, 
                      which coincides with daily batch processing.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Overall Healthy Performance</h4>
                    <p className="text-sm text-gray-600">
                      Database performance is within expected parameters for
                      your current workload.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Connection Pooling Recommendation</h4>
                    <p className="text-sm text-gray-600">
                      Consider implementing connection pooling to optimize resource
                      usage during peak hours.
                    </p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 