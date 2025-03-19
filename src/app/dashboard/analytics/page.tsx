"use client";

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart,
  PieChart,
  LineChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  Pie,
  Cell
} from 'recharts';
import {
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  ArrowUp,
  ArrowDown,
  Users,
  DollarSign,
  CreditCard,
  Activity,
  ArrowRight
} from 'lucide-react';

// Sample data for the charts
const leadData = [
  { month: 'Jan', new: 45, qualified: 30, converted: 15 },
  { month: 'Feb', new: 55, qualified: 40, converted: 25 },
  { month: 'Mar', new: 75, qualified: 55, converted: 30 },
  { month: 'Apr', new: 85, qualified: 60, converted: 35 },
  { month: 'May', new: 65, qualified: 40, converted: 30 },
  { month: 'Jun', new: 95, qualified: 75, converted: 45 },
];

const revenueData = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 6000 },
  { name: 'Apr', value: 8000 },
  { name: 'May', value: 12000 },
  { name: 'Jun', value: 15000 },
];

const conversionData = [
  { name: 'Email', value: 400 },
  { name: 'Social', value: 300 },
  { name: 'Referral', value: 300 },
  { name: 'Direct', value: 200 },
  { name: 'Other', value: 100 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// KPI data
const kpiData = [
  {
    title: 'Total Leads',
    value: '2,815',
    change: '+12.5%',
    increasing: true,
    icon: Users,
  },
  {
    title: 'Conversion Rate',
    value: '28.6%',
    change: '+3.2%',
    increasing: true,
    icon: Activity,
  },
  {
    title: 'Revenue',
    value: '$48,281',
    change: '+8.1%',
    increasing: true,
    icon: DollarSign,
  },
  {
    title: 'Avg. Deal Size',
    value: '$1,850',
    change: '-2.3%',
    increasing: false,
    icon: CreditCard,
  },
];

export default function AnalyticsPage() {
  const { user, tenant } = useAuth();
  const [timeRange, setTimeRange] = useState('6months');
  
  if (!user || !tenant) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please log in to view this page.</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col space-y-1.5">
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Track your sales performance and customer acquisition metrics.
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="leads">Leads</TabsTrigger>
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
                <TabsTrigger value="customers">Customers</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="flex items-center gap-2">
            <Select
              value={timeRange}
              onValueChange={setTimeRange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="12months">Last 12 Months</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiData.map((kpi, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {kpi.title}
                </CardTitle>
                <kpi.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className={`text-xs flex items-center ${kpi.increasing ? 'text-green-500' : 'text-red-500'}`}>
                  {kpi.increasing ? <ArrowUp className="mr-1 h-4 w-4" /> : <ArrowDown className="mr-1 h-4 w-4" />}
                  {kpi.change} from previous period
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Lead Performance</CardTitle>
                  <CardDescription>New vs qualified vs converted leads</CardDescription>
                </div>
                <BarChartIcon className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="px-2">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={leadData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="new" fill="#8884d8" name="New Leads" />
                  <Bar dataKey="qualified" fill="#82ca9d" name="Qualified Leads" />
                  <Bar dataKey="converted" fill="#ffc658" name="Converted Leads" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Revenue Trend</CardTitle>
                  <CardDescription>Monthly revenue performance</CardDescription>
                </div>
                <LineChartIcon className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="px-2">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="Revenue"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Lead Sources</CardTitle>
                  <CardDescription>Lead acquisition by channel</CardDescription>
                </div>
                <PieChartIcon className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="flex justify-center items-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={conversionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {conversionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Leads']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Sales Funnel</CardTitle>
                  <CardDescription>Conversion through sales stages</CardDescription>
                </div>
                <BarChartIcon className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="px-2">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  layout="vertical"
                  data={[
                    { name: 'Lead Created', value: 350 },
                    { name: 'Qualified', value: 275 },
                    { name: 'Demo Completed', value: 220 },
                    { name: 'Proposal Sent', value: 180 },
                    { name: 'Negotiation', value: 120 },
                    { name: 'Closed Won', value: 85 },
                  ]}
                  margin={{ top: 20, right: 30, left: 90, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#82ca9d" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your team's sales activity over the past week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex">
                <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Sara Johnson created 12 new leads</p>
                  <p className="text-sm text-muted-foreground">14 minutes ago</p>
                </div>
                <div className="flex items-center">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="flex">
                <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Michael Smith closed a $4,500 deal with Acme Inc.</p>
                  <p className="text-sm text-muted-foreground">2 hours ago</p>
                </div>
                <div className="flex items-center">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="flex">
                <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">David Rodriguez qualified 8 leads</p>
                  <p className="text-sm text-muted-foreground">Yesterday at 3:42 PM</p>
                </div>
                <div className="flex items-center">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="flex">
                <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Emma Wilson sent 5 new proposals worth $12,500</p>
                  <p className="text-sm text-muted-foreground">Yesterday at 5:15 PM</p>
                </div>
                <div className="flex items-center">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 