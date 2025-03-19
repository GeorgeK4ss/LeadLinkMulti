"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { AdvancedSearch, FilterConfig, FilterValues } from '@/components/ui/advanced-search';
import { applyFilters, sortData, paginateData } from '@/lib/searchUtils';
import { ChevronDown, ChevronUp, ExternalLink, User, Users, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';

// Sample data for demonstration
import { CustomerCategory, CustomerStatus } from '@/types/customer';
import { LeadStatus, LeadSource } from '@/types/lead';
import { Task, TaskPriority, TaskStatus } from '@/types/task';

// Simplified interfaces for search results
interface SearchCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: CustomerStatus;
  category: CustomerCategory;
  industry?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  lifetimeValue: number;
  assignedTo?: string;
  notes?: string;
  company?: string;
}

interface SearchLead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status: LeadStatus;
  source?: LeadSource;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  tags?: string[];
  score?: number;
}

interface SearchTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  relatedTo?: {
    type: 'lead' | 'customer' | 'deal';
    id: string;
    name: string;
  };
}

// Sample customers (fake data for demo)
const mockCustomers: SearchCustomer[] = [
  {
    id: '1',
    name: 'Acme Corporation',
    email: 'info@acme.com',
    phone: '555-123-4567',
    status: 'active',
    category: 'enterprise',
    industry: 'Technology',
    createdAt: '2023-01-15',
    updatedAt: '2023-06-10',
    tags: ['vip', 'tech'],
    lifetimeValue: 150000,
    notes: 'Key account, regular renewals',
    assignedTo: 'user123'
  },
  {
    id: '2',
    name: 'Globex Inc',
    email: 'contact@globex.com',
    phone: '555-987-6543',
    status: 'active',
    category: 'mid_market',
    industry: 'Finance',
    createdAt: '2023-02-20',
    updatedAt: '2023-07-15',
    tags: ['finance', 'growing'],
    lifetimeValue: 75000,
    notes: 'Expanding their usage, potential for upsell',
    assignedTo: 'user456'
  },
  {
    id: '3',
    name: 'Massive Health',
    email: 'info@massivehealth.com',
    phone: '555-456-7890',
    status: 'active',
    category: 'enterprise',
    industry: 'Healthcare',
    createdAt: '2022-11-10',
    updatedAt: '2023-04-05',
    tags: ['healthcare', 'enterprise'],
    lifetimeValue: 200000,
    notes: 'Long-term contract, strategic partner',
    assignedTo: 'user789'
  },
  {
    id: '4',
    name: 'Stark Industries',
    email: 'sales@stark.com',
    phone: '555-789-0123',
    status: 'at_risk',
    category: 'enterprise',
    industry: 'Manufacturing',
    createdAt: '2023-03-05',
    updatedAt: '2023-08-01',
    tags: ['manufacturing', 'vip'],
    lifetimeValue: 300000,
    notes: 'Needs attention, contract renewal coming up',
    assignedTo: 'user123'
  },
  {
    id: '5',
    name: 'Wayne Enterprises',
    email: 'contact@wayne.com',
    phone: '555-321-6547',
    status: 'active',
    category: 'enterprise',
    industry: 'Technology',
    createdAt: '2022-10-20',
    updatedAt: '2023-05-15',
    tags: ['tech', 'vip'],
    lifetimeValue: 250000,
    notes: 'Expanding to new markets, potential for growth',
    assignedTo: 'user456'
  }
];

// Sample leads (fake data for demo)
const mockLeads: SearchLead[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john@futuretech.com',
    phone: '555-111-2222',
    company: 'Future Tech',
    status: 'new',
    assignedTo: 'user123',
    createdAt: '2023-06-10',
    updatedAt: '2023-06-10',
    notes: 'Interested in our SaaS product',
    tags: ['tech', 'saas', 'inbound']
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@financepro.com',
    phone: '555-333-4444',
    company: 'Finance Pro',
    status: 'contacted',
    assignedTo: 'user456',
    createdAt: '2023-06-15',
    updatedAt: '2023-06-18',
    notes: 'Referred by Wayne Enterprises, needs demo',
    tags: ['finance', 'referral', 'demo-needed']
  },
  {
    id: '3',
    name: 'Michael Chen',
    email: 'michael@healthinnovate.com',
    phone: '555-555-6666',
    company: 'Health Innovate',
    status: 'qualified',
    assignedTo: 'user789',
    createdAt: '2023-06-20',
    updatedAt: '2023-07-01',
    notes: 'Met at HealthTech Conference, needs custom solution',
    tags: ['healthcare', 'event', 'custom']
  }
];

// Sample tasks (fake data for demo)
const mockTasks: SearchTask[] = [
  {
    id: '1',
    title: 'Follow up with Acme Corp',
    description: 'Send proposal and schedule demo',
    status: 'pending',
    priority: 'high',
    dueDate: '2023-07-10',
    assignedTo: 'user123',
    createdAt: '2023-06-20',
    updatedAt: '2023-06-20',
    relatedTo: {
      type: 'customer',
      id: '1',
      name: 'Acme Corporation'
    }
  },
  {
    id: '2',
    title: 'Prepare quarterly review',
    description: 'Compile metrics and prepare presentation',
    status: 'in_progress',
    priority: 'medium',
    dueDate: '2023-07-15',
    assignedTo: 'user456',
    createdAt: '2023-06-25',
    updatedAt: '2023-07-01',
    relatedTo: {
      type: 'customer',
      id: '2',
      name: 'Globex Inc'
    }
  },
  {
    id: '3',
    title: 'Renewal negotiation',
    description: 'Prepare renewal options and negotiate terms',
    status: 'pending',
    priority: 'high',
    dueDate: '2023-07-05',
    assignedTo: 'user789',
    createdAt: '2023-06-15',
    updatedAt: '2023-06-15',
    relatedTo: {
      type: 'customer',
      id: '3',
      name: 'Umbrella Corp'
    }
  }
];

// Define filter configurations for each entity type
const customerFilters: FilterConfig[] = [
  {
    id: 'status',
    label: 'Status',
    type: 'multiSelect',
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
      { label: 'At Risk', value: 'at_risk' },
      { label: 'Churned', value: 'churned' }
    ]
  },
  {
    id: 'category',
    label: 'Category',
    type: 'multiSelect',
    options: [
      { label: 'Enterprise', value: 'enterprise' },
      { label: 'Mid-Market', value: 'mid_market' },
      { label: 'Small Business', value: 'small_business' },
      { label: 'Startup', value: 'startup' },
      { label: 'VIP', value: 'vip' }
    ]
  },
  {
    id: 'industry',
    label: 'Industry',
    type: 'select',
    options: [
      { label: 'Technology', value: 'Technology' },
      { label: 'Finance', value: 'Finance' },
      { label: 'Healthcare', value: 'Healthcare' },
      { label: 'Manufacturing', value: 'Manufacturing' },
      { label: 'Retail', value: 'Retail' },
      { label: 'Other', value: 'Other' }
    ]
  },
  {
    id: 'lifetimeValue',
    label: 'Lifetime Value',
    type: 'range',
    min: 0,
    max: 500000
  },
  {
    id: 'healthScore.overall',
    label: 'Health Score',
    type: 'range',
    min: 0,
    max: 100
  },
  {
    id: 'createdAt',
    label: 'Created Date',
    type: 'dateRange'
  },
  {
    id: 'tags',
    label: 'Tags Include',
    type: 'multiSelect',
    options: [
      { label: 'VIP', value: 'vip' },
      { label: 'Tech', value: 'tech' },
      { label: 'Finance', value: 'finance' },
      { label: 'Healthcare', value: 'healthcare' },
      { label: 'Manufacturing', value: 'manufacturing' },
      { label: 'Growing', value: 'growing' },
      { label: 'Enterprise', value: 'enterprise' }
    ]
  }
];

const leadFilters: FilterConfig[] = [
  {
    id: 'status',
    label: 'Status',
    type: 'multiSelect',
    options: [
      { label: 'New', value: 'new' },
      { label: 'Contacted', value: 'contacted' },
      { label: 'Qualified', value: 'qualified' },
      { label: 'Proposal', value: 'proposal' },
      { label: 'Closed', value: 'closed' },
      { label: 'Lost', value: 'lost' }
    ]
  },
  {
    id: 'source',
    label: 'Source',
    type: 'select',
    options: [
      { label: 'Website', value: 'website' },
      { label: 'Referral', value: 'referral' },
      { label: 'Event', value: 'event' },
      { label: 'Cold Call', value: 'cold_call' },
      { label: 'Social Media', value: 'social_media' },
      { label: 'Email Campaign', value: 'email_campaign' }
    ]
  },
  {
    id: 'company.industry',
    label: 'Industry',
    type: 'select',
    options: [
      { label: 'Technology', value: 'Technology' },
      { label: 'Finance', value: 'Finance' },
      { label: 'Healthcare', value: 'Healthcare' },
      { label: 'Manufacturing', value: 'Manufacturing' },
      { label: 'Retail', value: 'Retail' },
      { label: 'Other', value: 'Other' }
    ]
  },
  {
    id: 'createdAt',
    label: 'Created Date',
    type: 'dateRange'
  }
];

const taskFilters: FilterConfig[] = [
  {
    id: 'status',
    label: 'Status',
    type: 'multiSelect',
    options: [
      { label: 'Pending', value: 'pending' },
      { label: 'In Progress', value: 'in_progress' },
      { label: 'Completed', value: 'completed' },
      { label: 'Cancelled', value: 'cancelled' }
    ]
  },
  {
    id: 'priority',
    label: 'Priority',
    type: 'multiSelect',
    options: [
      { label: 'Low', value: 'low' },
      { label: 'Medium', value: 'medium' },
      { label: 'High', value: 'high' }
    ]
  },
  {
    id: 'dueDate',
    label: 'Due Date',
    type: 'dateRange'
  },
  {
    id: 'overdue',
    label: 'Show Overdue Only',
    type: 'boolean'
  }
];

// Search fields for each entity type
const customerSearchFields = ['name', 'email', 'phone', 'industry', 'notes', 'tags'];
const leadSearchFields = ['contact.name', 'contact.email', 'contact.phone', 'company.name', 'company.industry', 'notes', 'tags'];
const taskSearchFields = ['title', 'description', 'relatedTo.name'];

export default function SearchPage() {
  const { user, tenant } = useAuth();
  const [activeTab, setActiveTab] = useState('customers');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' }>({ 
    field: 'name', 
    direction: 'asc' 
  });
  
  // Filtered and sorted data state
  const [filteredCustomers, setFilteredCustomers] = useState<SearchCustomer[]>(mockCustomers);
  const [filteredLeads, setFilteredLeads] = useState<SearchLead[]>(mockLeads);
  const [filteredTasks, setFilteredTasks] = useState<SearchTask[]>(mockTasks);
  
  // Handle search and filter updates based on active tab
  useEffect(() => {
    updateFilteredResults();
  }, [searchTerm, filterValues, sortConfig, activeTab]);
  
  const updateFilteredResults = () => {
    // Apply search term filter
    let customers = mockCustomers;
    let leads = mockLeads;
    let tasks = mockTasks;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      customers = customers.filter(c => 
        c.name.toLowerCase().includes(term) || 
        (c.email && c.email.toLowerCase().includes(term)) ||
        (c.notes && c.notes.toLowerCase().includes(term))
      );
      
      leads = leads.filter(l => 
        l.name.toLowerCase().includes(term) || 
        (l.email && l.email.toLowerCase().includes(term)) || 
        (l.company && l.company.toLowerCase().includes(term)) ||
        (l.notes && l.notes.toLowerCase().includes(term))
      );
      
      tasks = tasks.filter(t => 
        t.title.toLowerCase().includes(term) || 
        t.description.toLowerCase().includes(term)
      );
    }
    
    // Apply date range filter if set
    if (filterValues.createdAt) {
      const dateRange = filterValues.createdAt;
      if (dateRange.from || dateRange.to) {
        if (dateRange.from) {
          const fromDate = new Date(dateRange.from);
          customers = customers.filter(c => new Date(c.createdAt) >= fromDate);
          leads = leads.filter(l => new Date(l.createdAt) >= fromDate);
          tasks = tasks.filter(t => new Date(t.createdAt) >= fromDate);
        }
        if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          customers = customers.filter(c => new Date(c.createdAt) <= toDate);
          leads = leads.filter(l => new Date(l.createdAt) <= toDate);
          tasks = tasks.filter(t => new Date(t.createdAt) <= toDate);
        }
      }
    }
    
    // Apply advanced filters
    if (Object.keys(filterValues).length > 0) {
      // Customer filters
      if (filterValues.status) {
        customers = customers.filter(c => c.status === filterValues.status);
      }
      if (filterValues.category) {
        customers = customers.filter(c => c.category === filterValues.category);
      }
      
      // Lead filters
      if (filterValues.leadStatus) {
        leads = leads.filter(l => l.status === filterValues.leadStatus);
      }
      if (filterValues.leadSource) {
        leads = leads.filter(l => l.source === filterValues.leadSource);
      }
      
      // Task filters
      if (filterValues.taskStatus) {
        tasks = tasks.filter(t => t.status === filterValues.taskStatus);
      }
      if (filterValues.priority) {
        tasks = tasks.filter(t => t.priority === filterValues.priority);
      }
    }
    
    // Sort function for leads and tasks
    const sortLeadsAndTasks = (a: any, b: any, sortBy: string, sortOrder: 'asc' | 'desc') => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      
      switch (sortBy) {
        case 'name':
        case 'title':
          return multiplier * a[sortBy].localeCompare(b[sortBy]);
        case 'date':
          return multiplier * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        default:
          return 0;
      }
    };
    
    // Apply sorting
    if (sortConfig.field) {
      customers = [...customers].sort((a, b) => sortLeadsAndTasks(a, b, sortConfig.field, sortConfig.direction));
      leads = [...leads].sort((a, b) => sortLeadsAndTasks(a, b, sortConfig.field, sortConfig.direction));
      tasks = [...tasks].sort((a, b) => sortLeadsAndTasks(a, b, sortConfig.field, sortConfig.direction));
    }
    
    // Update state with filtered results
    setFilteredCustomers(customers);
    setFilteredLeads(leads);
    setFilteredTasks(tasks);
  };
  
  const handleSearch = (term: string, filters: FilterValues) => {
    setSearchTerm(term);
    setFilterValues(filters);
  };
  
  const handleSortChange = (field: string) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  const getSortIndicator = (field: string) => {
    if (sortConfig.field !== field) return null;
    
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="ml-1 h-4 w-4" /> 
      : <ChevronDown className="ml-1 h-4 w-4" />;
  };
  
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      // Customer statuses
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'at_risk': 'bg-red-100 text-red-800',
      'churned': 'bg-gray-100 text-gray-800',
      
      // Lead statuses
      'new': 'bg-blue-100 text-blue-800',
      'contacted': 'bg-purple-100 text-purple-800',
      'qualified': 'bg-cyan-100 text-cyan-800',
      'proposal': 'bg-amber-100 text-amber-800',
      'closed': 'bg-green-100 text-green-800',
      'lost': 'bg-red-100 text-red-800',
      
      // Task statuses
      'pending': 'bg-amber-100 text-amber-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-gray-100 text-gray-800',
    };
    
    return `${statusMap[status] || 'bg-gray-100 text-gray-800'}`;
  };
  
  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-amber-100 text-amber-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Render the appropriate filter configuration based on active tab
  const getActiveFilters = (): FilterConfig[] => {
    switch (activeTab) {
      case 'customers': return customerFilters;
      case 'leads': return leadFilters;
      case 'tasks': return taskFilters;
      default: return [];
    }
  };
  
  // Customer card component
  const CustomerCard = ({ customer }: { customer: SearchCustomer }) => {
    return (
      <Card className="mb-4 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-medium">{customer.name}</CardTitle>
              <CardDescription>{customer.industry}</CardDescription>
            </div>
            <Badge variant={customer.status === 'active' ? 'default' : 
                           customer.status === 'at_risk' ? 'destructive' : 
                           'secondary'}>
              {customer.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <div className="text-sm text-muted-foreground mb-2">
            <div className="flex items-center gap-2 mb-1">
              <Mail className="h-4 w-4" />
              <span>{customer.email}</span>
            </div>
            {customer.phone && (
              <div className="flex items-center gap-2 mb-1">
                <Phone className="h-4 w-4" />
                <span>{customer.phone}</span>
              </div>
            )}
          </div>
          {customer.tags && customer.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {customer.tags.map((tag, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-0 text-xs text-muted-foreground">
          <div className="flex justify-between w-full">
            <span>Added {new Date(customer.createdAt).toLocaleDateString()}</span>
            <span>${customer.lifetimeValue.toLocaleString()}</span>
          </div>
        </CardFooter>
      </Card>
    );
  };
  
  // Lead card component
  const LeadCard = ({ lead }: { lead: SearchLead }) => {
    return (
      <Card className="mb-4 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-medium">{lead.name}</CardTitle>
              <CardDescription>{lead.company || '-'}</CardDescription>
            </div>
            <Badge variant={lead.status === 'qualified' ? 'default' : 
                           lead.status === 'lost' ? 'destructive' : 
                           'secondary'}>
              {lead.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <div className="text-sm text-muted-foreground mb-2">
            {lead.email && (
              <div className="flex items-center gap-2 mb-1">
                <Mail className="h-4 w-4" />
                <span>{lead.email || '-'}</span>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-2 mb-1">
                <Phone className="h-4 w-4" />
                <span>{lead.phone || '-'}</span>
              </div>
            )}
          </div>
          {lead.tags && lead.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {lead.tags.map((tag, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-0 text-xs text-muted-foreground">
          <div className="flex justify-between w-full">
            <span>Added {new Date(lead.createdAt).toLocaleDateString()}</span>
            {lead.score && <span>Score: {lead.score}</span>}
          </div>
        </CardFooter>
      </Card>
    );
  };
  
  if (!user || !tenant) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please log in to view this page.</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Advanced Search</h2>
          <p className="text-muted-foreground">
            Search and filter across customers, leads, and tasks.
          </p>
        </div>
        
        <Tabs 
          defaultValue="customers" 
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value);
            setSortConfig({ field: value === 'customers' ? 'name' : (value === 'leads' ? 'contact.name' : 'dueDate'), direction: 'asc' });
            setFilterValues({});
          }}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="customers">
              <Users className="mr-2 h-4 w-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="leads">
              <User className="mr-2 h-4 w-4" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <ExternalLink className="mr-2 h-4 w-4" />
              Tasks
            </TabsTrigger>
          </TabsList>
          
          <Card>
            <CardHeader>
              <CardTitle>Search {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</CardTitle>
              <CardDescription>
                Use the advanced search below to find specific {activeTab}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdvancedSearch
                filters={getActiveFilters()}
                onSearch={handleSearch}
                placeholder={`Search ${activeTab}...`}
                buttonText="Search"
              />
            </CardContent>
          </Card>
          
          <TabsContent value="customers" className="space-y-4">
            <Card>
              <CardHeader className="px-6 py-4">
                <CardTitle>Customer Results</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableCaption>Found {filteredCustomers.length} customers</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSortChange('name')}
                      >
                        <div className="flex items-center">
                          Company {getSortIndicator('name')}
                        </div>
                      </TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSortChange('lifetimeValue')}
                      >
                        <div className="flex items-center">
                          Lifetime Value {getSortIndicator('lifetimeValue')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSortChange('healthScore.overall')}
                      >
                        <div className="flex items-center">
                          Health Score {getSortIndicator('healthScore.overall')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer text-right"
                        onClick={() => handleSortChange('createdAt')}
                      >
                        <div className="flex items-center justify-end">
                          Created {getSortIndicator('createdAt')}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6">
                          No customers found matching your search criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCustomers.map(customer => (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>{customer.industry}</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(customer.status)}>
                              {customer.status === 'at_risk' ? 'At Risk' : 
                                customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {customer.category === 'mid_market' ? 'Mid-Market' : 
                              customer.category === 'small_business' ? 'Small Business' :
                              customer.category.charAt(0).toUpperCase() + customer.category.slice(1)}
                          </TableCell>
                          <TableCell>${customer.lifetimeValue.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                              <div 
                                className={`h-2.5 rounded-full bg-blue-500`}
                                style={{ width: '75%' }}
                              ></div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {format(new Date(customer.createdAt), 'PP')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="leads" className="space-y-4">
            <Card>
              <CardHeader className="px-6 py-4">
                <CardTitle>Lead Results</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableCaption>Found {filteredLeads.length} leads</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSortChange('contact.name')}
                      >
                        <div className="flex items-center">
                          Contact {getSortIndicator('contact.name')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSortChange('company.name')}
                      >
                        <div className="flex items-center">
                          Company {getSortIndicator('company.name')}
                        </div>
                      </TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead 
                        className="text-right"
                        onClick={() => handleSortChange('createdAt')}
                      >
                        <div className="flex items-center justify-end">
                          Created {getSortIndicator('createdAt')}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6">
                          No leads found matching your search criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLeads.map(lead => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">{lead.name}</TableCell>
                          <TableCell>{lead.company || '-'}</TableCell>
                          <TableCell>{lead.email || '-'}</TableCell>
                          <TableCell>
                            <Badge className="bg-blue-500">
                              {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {lead.source ? (
                              lead.source === 'cold_call' ? 'Cold Call' : 
                              lead.source === 'email_campaign' ? 'Email Campaign' : 
                              lead.source === 'social_media' ? 'Social Media' :
                              lead.source.charAt(0).toUpperCase() + lead.source.slice(1)
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {format(new Date(lead.createdAt), 'PP')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader className="px-6 py-4">
                <CardTitle>Task Results</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableCaption>Found {filteredTasks.length} tasks</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSortChange('title')}
                      >
                        <div className="flex items-center">
                          Title {getSortIndicator('title')}
                        </div>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Related To</TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSortChange('dueDate')}
                      >
                        <div className="flex items-center">
                          Due Date {getSortIndicator('dueDate')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="text-right"
                        onClick={() => handleSortChange('createdAt')}
                      >
                        <div className="flex items-center justify-end">
                          Created {getSortIndicator('createdAt')}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6">
                          No tasks found matching your search criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTasks.map(task => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">{task.title}</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(task.status)}>
                              {task.status === 'in_progress' ? 'In Progress' :
                                task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPriorityBadge(task.priority)}>
                              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>{task.relatedTo?.name || '-'}</TableCell>
                          <TableCell>
                            {format(new Date(task.dueDate), 'PP')}
                          </TableCell>
                          <TableCell className="text-right">
                            {format(new Date(task.createdAt), 'PP')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 