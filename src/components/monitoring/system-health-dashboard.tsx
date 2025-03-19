"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Database, 
  HardDrive, 
  Cpu, 
  BarChart3, 
  RefreshCw, 
  Users, 
  ArrowUpDown 
} from 'lucide-react';

// Types
interface SystemStatus {
  status: 'healthy' | 'degraded' | 'critical';
  message: string;
  lastChecked: Date;
}

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'critical';
  responseTime: number;
  uptime: number;
  errorRate: number;
}

interface ResourceUsage {
  name: string;
  current: number;
  max: number;
  unit: string;
}

interface MetricDataPoint {
  timestamp: string;
  value: number;
}

interface PerformanceMetric {
  name: string;
  description: string;
  unit: string;
  current: number;
  history: MetricDataPoint[];
  threshold: number;
}

interface Alert {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
  source: string;
  acknowledged: boolean;
}

interface UserStatistics {
  activeUsers: number;
  totalUsers: number;
  newUsers: number;
  activeSessions: number;
}

// Mock data - in a real app, this would come from API calls
const getMockSystemStatus = (): SystemStatus => ({
  status: 'healthy',
  message: 'All systems operational',
  lastChecked: new Date()
});

const getMockServiceHealth = (): ServiceHealth[] => [
  { name: 'API Service', status: 'healthy', responseTime: 42, uptime: 99.98, errorRate: 0.01 },
  { name: 'Authentication', status: 'healthy', responseTime: 78, uptime: 99.99, errorRate: 0 },
  { name: 'Database', status: 'healthy', responseTime: 12, uptime: 99.95, errorRate: 0.02 },
  { name: 'File Storage', status: 'degraded', responseTime: 156, uptime: 99.7, errorRate: 0.15 },
  { name: 'Email Service', status: 'healthy', responseTime: 320, uptime: 99.9, errorRate: 0.05 }
];

const getMockResourceUsage = (): ResourceUsage[] => [
  { name: 'CPU', current: 24, max: 100, unit: '%' },
  { name: 'Memory', current: 3.4, max: 8, unit: 'GB' },
  { name: 'Storage', current: 78, max: 200, unit: 'GB' },
  { name: 'Bandwidth', current: 1.2, max: 5, unit: 'GB/day' }
];

const getMockPerformanceMetrics = (): PerformanceMetric[] => {
  const generateHistory = (baseline: number, variance: number, count: number): MetricDataPoint[] => {
    const now = new Date();
    return Array.from({ length: count }, (_, i) => {
      const date = new Date(now);
      date.setHours(date.getHours() - (count - i));
      return {
        timestamp: date.toISOString(),
        value: baseline + (Math.random() * variance * 2 - variance)
      };
    });
  };

  return [
    {
      name: 'API Response Time',
      description: 'Average API response time',
      unit: 'ms',
      current: 48,
      threshold: 100,
      history: generateHistory(50, 20, 24)
    },
    {
      name: 'Database Query Time',
      description: 'Average database query execution time',
      unit: 'ms',
      current: 12,
      threshold: 50,
      history: generateHistory(15, 10, 24)
    },
    {
      name: 'Error Rate',
      description: 'Percentage of requests resulting in errors',
      unit: '%',
      current: 0.05,
      threshold: 1,
      history: generateHistory(0.1, 0.15, 24)
    },
    {
      name: 'CPU Usage',
      description: 'Average CPU utilization',
      unit: '%',
      current: 24,
      threshold: 80,
      history: generateHistory(30, 20, 24)
    }
  ];
};

const getMockAlerts = (): Alert[] => [
  {
    id: '1',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    level: 'warning',
    message: 'File storage service experiencing degraded performance',
    source: 'Storage Monitor',
    acknowledged: false
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    level: 'info',
    message: 'Automatic backup completed successfully',
    source: 'Backup Service',
    acknowledged: true
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    level: 'error',
    message: 'High memory usage detected - 90% utilization',
    source: 'Resource Monitor',
    acknowledged: true
  }
];

const getMockUserStatistics = (): UserStatistics => ({
  activeUsers: 342,
  totalUsers: 1256,
  newUsers: 28,
  activeSessions: 156
});

// Helper functions
const formatDate = (date: Date): string => {
  return date.toLocaleString();
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

const getAlertIcon = (level: 'info' | 'warning' | 'error') => {
  switch (level) {
    case 'info':
      return <CheckCircle2 className="h-5 w-5 text-blue-500" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    case 'error':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
  }
};

const getProgressColor = (value: number, max: number) => {
  const percentage = (value / max) * 100;
  if (percentage < 50) return 'bg-green-500';
  if (percentage < 80) return 'bg-amber-500';
  return 'bg-red-500';
};

const SystemHealthDashboard = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(getMockSystemStatus());
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth[]>(getMockServiceHealth());
  const [resourceUsage, setResourceUsage] = useState<ResourceUsage[]>(getMockResourceUsage());
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>(getMockPerformanceMetrics());
  const [alerts, setAlerts] = useState<Alert[]>(getMockAlerts());
  const [userStats, setUserStats] = useState<UserStatistics>(getMockUserStatistics());
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedMetric, setSelectedMetric] = useState<string>(performanceMetrics[0].name);

  // Simulate loading fresh data
  const refreshData = () => {
    setLoading(true);
    setTimeout(() => {
      setSystemStatus(getMockSystemStatus());
      setServiceHealth(getMockServiceHealth());
      setResourceUsage(getMockResourceUsage());
      setPerformanceMetrics(getMockPerformanceMetrics());
      setAlerts(getMockAlerts());
      setUserStats(getMockUserStatistics());
      setLoading(false);
    }, 1000);
  };

  // Format metric history data for charts
  const formatMetricHistoryData = (metric: PerformanceMetric) => {
    return metric.history.map(point => ({
      time: new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: point.value,
      threshold: metric.threshold
    }));
  };

  // Handle acknowledging an alert
  const acknowledgeAlert = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  // Periodically refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(refreshData, 1000 * 60 * 5);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">System Health Monitoring</h1>
        <Button 
          onClick={refreshData} 
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* System Status Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            {getStatusIcon(systemStatus.status)}
            System Status
          </CardTitle>
          <CardDescription>
            Last checked: {formatDate(systemStatus.lastChecked)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <Alert className={getStatusColor(systemStatus.status)}>
                <AlertTitle className="font-semibold">
                  {systemStatus.status === 'healthy' ? 'All Systems Operational' : 
                   systemStatus.status === 'degraded' ? 'Partial Service Disruption' : 
                   'Critical Service Outage'}
                </AlertTitle>
                <AlertDescription>
                  {systemStatus.message}
                </AlertDescription>
              </Alert>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {serviceHealth.filter(s => s.status === 'healthy').length}
                  </div>
                  <div className="text-sm text-gray-500">Healthy Services</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-500">
                    {serviceHealth.filter(s => s.status === 'degraded').length}
                  </div>
                  <div className="text-sm text-gray-500">Degraded Services</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">
                    {serviceHealth.filter(s => s.status === 'critical').length}
                  </div>
                  <div className="text-sm text-gray-500">Critical Services</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {alerts.filter(a => !a.acknowledged).length}
                  </div>
                  <div className="text-sm text-gray-500">Active Alerts</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Database className="h-4 w-4" /> Services
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" /> Resources
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Performance
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Alerts
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Users
          </TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {serviceHealth.map((service) => (
              <Card key={service.name}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{service.name}</span>
                    <Badge className={getStatusColor(service.status)}>
                      {service.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Response Time:</span>
                      <span className="font-medium">{service.responseTime} ms</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Uptime:</span>
                      <span className="font-medium">{service.uptime}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Error Rate:</span>
                      <span className="font-medium">{service.errorRate}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resourceUsage.map((resource) => (
              <Card key={resource.name}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {resource.name === 'CPU' ? <Cpu className="h-4 w-4" /> :
                     resource.name === 'Memory' ? <HardDrive className="h-4 w-4" /> :
                     resource.name === 'Storage' ? <Database className="h-4 w-4" /> :
                     <ArrowUpDown className="h-4 w-4" />}
                    {resource.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">
                      {resource.current} / {resource.max} {resource.unit}
                    </span>
                    <span className="text-sm font-medium">
                      {Math.round((resource.current / resource.max) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={(resource.current / resource.max) * 100} 
                    className={getProgressColor(resource.current, resource.max)}
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resource Usage Over Time</CardTitle>
              <CardDescription>Last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={performanceMetrics.find(m => m.name === 'CPU Usage')?.history.map(h => ({
                      time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      cpu: h.value,
                      memory: h.value * 0.8 + 10, // Just for visualization
                      storage: h.value * 0.3 + 70, // Just for visualization
                      bandwidth: h.value * 0.1 + 20 // Just for visualization
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="cpu" stroke="#8884d8" name="CPU (%)" />
                    <Line type="monotone" dataKey="memory" stroke="#82ca9d" name="Memory (%)" />
                    <Line type="monotone" dataKey="storage" stroke="#ffc658" name="Storage (%)" />
                    <Line type="monotone" dataKey="bandwidth" stroke="#ff8042" name="Bandwidth (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            {performanceMetrics.map((metric) => (
              <Card 
                key={metric.name} 
                className={`cursor-pointer transition-all ${selectedMetric === metric.name ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setSelectedMetric(metric.name)}
              >
                <CardHeader className="p-4">
                  <CardTitle className="text-base">{metric.name}</CardTitle>
                  <CardDescription className="text-xs">{metric.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-4 pt-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-2xl font-bold">
                        {metric.current} {metric.unit}
                      </div>
                      <div className="text-xs text-gray-500">
                        Threshold: {metric.threshold} {metric.unit}
                      </div>
                    </div>
                    <div className={`text-xs ${metric.current > metric.threshold ? 'text-red-500' : 'text-green-500'}`}>
                      {metric.current > metric.threshold ? 'Over threshold' : 'Healthy'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{selectedMetric}</CardTitle>
              <CardDescription>
                {performanceMetrics.find(m => m.name === selectedMetric)?.description} - Last 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={formatMetricHistoryData(
                      performanceMetrics.find(m => m.name === selectedMetric) || performanceMetrics[0]
                    )}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8884d8" 
                      name={selectedMetric} 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="threshold" 
                      stroke="#ff0000" 
                      strokeDasharray="5 5" 
                      name="Threshold" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Recent alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <Alert key={alert.id} className={alert.acknowledged ? 'opacity-70' : ''}>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-0.5">
                          {getAlertIcon(alert.level)}
                        </div>
                        <div className="flex-1">
                          <AlertTitle className="flex items-center gap-2">
                            <span>{alert.message}</span>
                            {!alert.acknowledged && (
                              <Badge className="bg-red-100 text-red-800">New</Badge>
                            )}
                          </AlertTitle>
                          <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                            <span className="text-xs text-gray-500">
                              {alert.source} • {formatDate(alert.timestamp)}
                            </span>
                            {!alert.acknowledged && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="mt-2 sm:mt-0"
                                onClick={() => acknowledgeAlert(alert.id)}
                              >
                                Acknowledge
                              </Button>
                            )}
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No alerts at this time
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{userStats.activeUsers}</div>
                <div className="text-sm text-gray-500">Current active users</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{userStats.totalUsers}</div>
                <div className="text-sm text-gray-500">Registered accounts</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">New Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{userStats.newUsers}</div>
                <div className="text-sm text-gray-500">Last 24 hours</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Active Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{userStats.activeSessions}</div>
                <div className="text-sm text-gray-500">Current sessions</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>User Activity</CardTitle>
              <CardDescription>Last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { day: 'Mon', 'New Users': 12, 'Active Users': 145 },
                      { day: 'Tue', 'New Users': 19, 'Active Users': 162 },
                      { day: 'Wed', 'New Users': 8, 'Active Users': 139 },
                      { day: 'Thu', 'New Users': 15, 'Active Users': 187 },
                      { day: 'Fri', 'New Users': 23, 'Active Users': 219 },
                      { day: 'Sat', 'New Users': 17, 'Active Users': 158 },
                      { day: 'Sun', 'New Users': 28, 'Active Users': 176 },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="New Users" fill="#8884d8" />
                    <Bar dataKey="Active Users" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { SystemHealthDashboard };
export default SystemHealthDashboard; 