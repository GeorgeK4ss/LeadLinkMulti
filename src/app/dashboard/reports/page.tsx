"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ExportButton } from '@/components/export/ExportButton';
import { 
  FileText, 
  Download, 
  User, 
  Users, 
  DollarSign, 
  BarChart3, 
  CalendarIcon,
  FileDown,
  Mail
} from 'lucide-react';

// Sample data for reports
const sampleLeadData = [
  { id: 1, name: 'John Smith', email: 'john@example.com', source: 'Website', status: 'New', createdAt: new Date('2024-04-01') },
  { id: 2, name: 'Sarah Johnson', email: 'sarah@example.com', source: 'Referral', status: 'Contacted', createdAt: new Date('2024-04-05') },
  { id: 3, name: 'Michael Brown', email: 'michael@example.com', source: 'Social Media', status: 'Qualified', createdAt: new Date('2024-04-08') },
  { id: 4, name: 'Emily Davis', email: 'emily@example.com', source: 'Email Campaign', status: 'New', createdAt: new Date('2024-04-10') },
  { id: 5, name: 'David Wilson', email: 'david@example.com', source: 'Website', status: 'Contacted', createdAt: new Date('2024-04-12') },
];

const sampleSalesData = [
  { id: 1, customer: 'Acme Corp', amount: 5000, status: 'Closed Won', closedAt: new Date('2024-04-02') },
  { id: 2, customer: 'Globex Inc', amount: 7500, status: 'Negotiation', closedAt: null },
  { id: 3, customer: 'Initech', amount: 3000, status: 'Closed Won', closedAt: new Date('2024-04-07') },
  { id: 4, customer: 'Umbrella Corp', amount: 12000, status: 'Proposal', closedAt: null },
  { id: 5, customer: 'Stark Industries', amount: 25000, status: 'Closed Won', closedAt: new Date('2024-04-15') },
];

const reportTypes = [
  {
    id: 'lead-overview',
    title: 'Lead Overview',
    description: 'Summary of all leads, their status, and conversion rates',
    icon: Users,
    category: 'leads',
    data: sampleLeadData
  },
  {
    id: 'lead-source',
    title: 'Lead Source Analysis',
    description: 'Analysis of lead generation channels and their effectiveness',
    icon: BarChart3,
    category: 'leads',
    data: sampleLeadData
  },
  {
    id: 'sales-performance',
    title: 'Sales Performance',
    description: 'Detailed sales data, revenue, and goal progress',
    icon: DollarSign,
    category: 'sales',
    data: sampleSalesData
  },
  {
    id: 'team-activity',
    title: 'Team Activity',
    description: 'Team member activity, productivity, and performance metrics',
    icon: User,
    category: 'team',
    data: []
  },
  {
    id: 'customer-retention',
    title: 'Customer Retention',
    description: 'Customer retention rates, churn analysis, and lifetime value',
    icon: Users,
    category: 'customers',
    data: []
  },
  {
    id: 'deal-pipeline',
    title: 'Deal Pipeline',
    description: 'Active deals, stages, and forecasted revenue',
    icon: DollarSign,
    category: 'sales',
    data: sampleSalesData
  },
];

export default function ReportsPage() {
  const { user, tenant } = useAuth();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('all');
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [exportFormat, setExportFormat] = useState<string>('pdf');
  
  const [selectedOptions, setSelectedOptions] = useState({
    includeCharts: true,
    includeSummary: true,
    includeRawData: false,
    scheduleEmail: false
  });
  
  if (!user || !tenant) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please log in to view this page.</p>
      </div>
    );
  }
  
  const filteredReports = selectedTab === 'all' 
    ? reportTypes 
    : reportTypes.filter(report => report.category === selectedTab);
  
  const handleCheckboxChange = (key: keyof typeof selectedOptions) => {
    setSelectedOptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  const generateReport = () => {
    // In a real implementation, this would call an API to generate the report
    console.log('Generating report:', {
      reportType: selectedReport,
      dateRange: { startDate, endDate },
      exportFormat,
      options: selectedOptions
    });
    
    // For demo purposes, show an alert
    alert('Report generation started. You will be notified when it is ready to download.');
  };
  
  // Get the selected report data
  const getSelectedReportData = () => {
    if (!selectedReport) return [];
    const report = reportTypes.find(r => r.id === selectedReport);
    return report?.data || [];
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground">
            Generate, customize, and export reports for your team.
          </p>
        </div>
        
        <Tabs 
          defaultValue="all" 
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="space-y-4"
        >
          <TabsList className="grid grid-cols-5 w-[600px]">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>
          
          <TabsContent value={selectedTab}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredReports.map((report) => (
                <Card 
                  key={report.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    selectedReport === report.id ? "ring-2 ring-primary" : ""
                  )}
                  onClick={() => setSelectedReport(report.id)}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-md font-semibold">{report.title}</CardTitle>
                    <report.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {report.description}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-1">
                    <Badge variant="outline">{report.category}</Badge>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        
        {selectedReport && (
          <Card>
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
              <CardDescription>
                Customize and generate your report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <div className="grid gap-2 grid-cols-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="justify-start text-left font-normal w-full"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Start date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="justify-start text-left font-normal w-full"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "End date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Export Format</Label>
                  <Select
                    value={exportFormat}
                    onValueChange={setExportFormat}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                      <SelectItem value="csv">CSV File</SelectItem>
                      <SelectItem value="json">JSON Data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Report Options</Label>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeCharts" 
                      checked={selectedOptions.includeCharts}
                      onCheckedChange={() => handleCheckboxChange('includeCharts')}
                    />
                    <Label htmlFor="includeCharts">Include Charts & Visualizations</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeSummary" 
                      checked={selectedOptions.includeSummary}
                      onCheckedChange={() => handleCheckboxChange('includeSummary')}
                    />
                    <Label htmlFor="includeSummary">Include Executive Summary</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeRawData" 
                      checked={selectedOptions.includeRawData}
                      onCheckedChange={() => handleCheckboxChange('includeRawData')}
                    />
                    <Label htmlFor="includeRawData">Include Raw Data Tables</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="scheduleEmail" 
                      checked={selectedOptions.scheduleEmail}
                      onCheckedChange={() => handleCheckboxChange('scheduleEmail')}
                    />
                    <Label htmlFor="scheduleEmail">Schedule Email Delivery</Label>
                  </div>
                </div>
              </div>
              
              {selectedOptions.scheduleEmail && (
                <div className="flex items-center p-3 bg-muted rounded-md">
                  <Mail className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span className="text-sm">
                    This report will be emailed to {user.email} when it's ready
                  </span>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setSelectedReport(null)}>
                Cancel
              </Button>
              <div className="flex space-x-2">
                <ExportButton 
                  data={getSelectedReportData()}
                  filename={`${selectedReport}-report`}
                  label="Export Data"
                  variant="outline"
                />
                <Button onClick={generateReport}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>
                Reports generated in the last 30 days
              </CardDescription>
            </div>
            <ExportButton 
              data={sampleLeadData}
              filename="all-leads-report"
              label="Export All Leads"
              variant="outline"
              size="sm"
            />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Lead Overview Report</p>
                    <p className="text-sm text-muted-foreground">Generated on April 15, 2024</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Sales Performance Report</p>
                    <p className="text-sm text-muted-foreground">Generated on April 12, 2024</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Team Activity Report</p>
                    <p className="text-sm text-muted-foreground">Generated on April 8, 2024</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Customer Retention Analysis</p>
                    <p className="text-sm text-muted-foreground">Generated on April 3, 2024</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 