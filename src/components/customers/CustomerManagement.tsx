"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Customer, CustomerCategory, CustomerStatus, CustomerSearchFilters } from '@/types/customer';
import { CustomerService } from '@/lib/services/CustomerService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { 
  CalendarIcon, 
  ChevronDownIcon, 
  FilterIcon, 
  PlusIcon, 
  SearchIcon,
  Users,
  Edit,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { CustomerProfile } from './CustomerProfile';
import { NewCustomerForm } from './NewCustomerForm';
import { ConvertLeadForm } from './ConvertLeadForm';
import { useToast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileEntityList } from '@/components/ui/mobile-entity-list';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface CustomerManagementProps {
  tenantId: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export function CustomerManagement({ tenantId, dateRange }: CustomerManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const customerService = new CustomerService();
  const isMobile = useIsMobile();
  
  const [isLoading, setIsLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [showConvertLeadForm, setShowConvertLeadForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CustomerSearchFilters>({
    status: [],
    category: [],
    dateRange: dateRange || undefined,
  });
  const [customerStats, setCustomerStats] = useState<{
    total: number;
    active: number;
    inactive: number;
    atRisk: number;
    churned: number;
    averageLifetimeValue: number;
    customersByCategory: Record<CustomerCategory, number>;
  } | null>(null);

  useEffect(() => {
    loadCustomers();
    loadCustomerStats();
  }, [tenantId, filters]);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      let results: Customer[];
      
      // If we have active filters, use the search endpoint
      if (
        filters.status?.length ||
        filters.category?.length ||
        filters.tags?.length ||
        filters.assignedTo?.length ||
        filters.minLifetimeValue !== undefined ||
        filters.maxLifetimeValue !== undefined ||
        filters.minHealthScore !== undefined ||
        filters.maxHealthScore !== undefined ||
        filters.industries?.length ||
        filters.dateRange
      ) {
        results = await customerService.searchCustomers(tenantId, filters);
      } else {
        // Otherwise just get all customers
        results = await customerService.getCustomers(tenantId);
      }
      
      setCustomers(results);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load customers',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomerStats = async () => {
    try {
      const stats = await customerService.getCustomerStats(tenantId);
      setCustomerStats(stats);
    } catch (error) {
      console.error('Error loading customer stats:', error);
    }
  };

  const handleCustomerCreated = (customerId: string) => {
    setShowNewCustomerForm(false);
    loadCustomers();
    loadCustomerStats();
    
    // Optionally, navigate to the customer profile
    setSelectedCustomerId(customerId);
    setShowProfile(true);
  };

  const handleLeadConverted = (customerId: string) => {
    setShowConvertLeadForm(false);
    loadCustomers();
    loadCustomerStats();
    
    // Optionally, navigate to the customer profile
    setSelectedCustomerId(customerId);
    setShowProfile(true);
    
    toast({
      title: 'Lead Converted',
      description: 'Lead has been successfully converted to a customer',
    });
  };

  const handleStatusChange = async (customerId: string, status: CustomerStatus) => {
    try {
      await customerService.updateCustomerStatus(tenantId, customerId, status);
      
      // Update the customer in the local state
      setCustomers(customers.map(customer => {
        if (customer.id === customerId) {
          return { ...customer, status };
        }
        return customer;
      }));
      
      toast({
        title: 'Status Updated',
        description: `Customer status changed to ${status.replace('_', ' ')}`,
      });
      
      // Refresh stats
      loadCustomerStats();
    } catch (error) {
      console.error('Error updating customer status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update customer status',
        variant: 'destructive',
      });
    }
  };

  const handleCategoryChange = async (customerId: string, category: CustomerCategory) => {
    try {
      await customerService.updateCustomerCategory(tenantId, customerId, category);
      
      // Update the customer in the local state
      setCustomers(customers.map(customer => {
        if (customer.id === customerId) {
          return { ...customer, category };
        }
        return customer;
      }));
      
      toast({
        title: 'Category Updated',
        description: `Customer category changed to ${category.replace('_', ' ')}`,
      });
      
      // Refresh stats
      loadCustomerStats();
    } catch (error) {
      console.error('Error updating customer category:', error);
      toast({
        title: 'Error',
        description: 'Failed to update customer category',
        variant: 'destructive',
      });
    }
  };

  const handleViewCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setShowProfile(true);
  };

  const handleDelete = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return;
    }
    
    try {
      await customerService.deleteCustomer(tenantId, customerId);
      
      // Remove the customer from the local state
      setCustomers(customers.filter(customer => customer.id !== customerId));
      
      toast({
        title: 'Customer Deleted',
        description: 'Customer has been successfully deleted',
      });
      
      // Refresh stats
      loadCustomerStats();
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete customer',
        variant: 'destructive',
      });
    }
  };

  const handleFilterChange = (field: keyof CustomerSearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      category: [],
      dateRange: dateRange || undefined,
    });
    setShowFilters(false);
  };

  const getStatusBadgeVariant = (status: CustomerStatus): string => {
    const variants: Record<CustomerStatus, string> = {
      active: 'success',
      inactive: 'secondary',
      at_risk: 'destructive',
      churned: 'outline',
    };
    return variants[status] || 'default';
  };

  const getCategoryBadgeVariant = (category: CustomerCategory): string => {
    const variants: Record<CustomerCategory, string> = {
      vip: 'purple',
      enterprise: 'blue',
      mid_market: 'green',
      small_business: 'yellow',
      startup: 'orange',
    };
    return variants[category] || 'default';
  };

  // Filter customers by search term
  const filteredCustomers = customers.filter(customer => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      (customer.industry && customer.industry.toLowerCase().includes(searchLower)) ||
      customer.contacts.some(contact => 
        contact.name.toLowerCase().includes(searchLower) ||
        contact.email.toLowerCase().includes(searchLower)
      ) ||
      (customer.tags && customer.tags.some(tag => tag.toLowerCase().includes(searchLower)))
    );
  });

  // Customer fields for mobile entity list
  const customerFields = [
    { 
      key: 'name', 
      label: 'Customer', 
      priority: 'high' as const,
    },
    { 
      key: 'industry', 
      label: 'Industry', 
      priority: 'medium' as const,
    },
    {
      key: 'status',
      label: 'Status',
      priority: 'medium' as const,
      badge: true,
      render: (value: CustomerStatus, customer: Customer) => (
        <Badge variant={getStatusBadgeVariant(value) as any}>
          {value.replace('_', ' ')}
        </Badge>
      )
    },
    {
      key: 'category',
      label: 'Category',
      badge: true,
      render: (value: CustomerCategory, customer: Customer) => (
        <Badge className={`bg-${getCategoryBadgeVariant(value)} hover:bg-${getCategoryBadgeVariant(value)}/80`}>
          {value.replace('_', ' ')}
        </Badge>
      )
    },
    {
      key: 'contacts',
      label: 'Primary Contact',
      render: (contacts: any[], customer: Customer) => {
        const primaryContact = contacts.find(c => c.isPrimary) || contacts[0];
        return primaryContact ? (
          <div>
            <div>{primaryContact.name}</div>
            <div className="text-xs text-muted-foreground">{primaryContact.email}</div>
          </div>
        ) : (
          <span className="text-muted-foreground">No contacts</span>
        );
      }
    },
    {
      key: 'healthScore',
      label: 'Health Score',
      render: (healthScore: any, customer: Customer) => (
        <div className="flex items-center space-x-2">
          <div 
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold
              ${healthScore.overall >= 75 ? 'bg-green-100 text-green-700' : 
                healthScore.overall >= 50 ? 'bg-yellow-100 text-yellow-700' : 
                'bg-red-100 text-red-700'}`}
          >
            {healthScore.overall}
          </div>
          <span className="text-xs">
            {healthScore.trend === 'improving' ? '↗️' : 
             healthScore.trend === 'declining' ? '↘️' : '→'}
          </span>
        </div>
      )
    },
    {
      key: 'lifetimeValue',
      label: 'Lifetime Value',
      format: 'currency' as const
    }
  ];

  // Customer actions for mobile entity list
  const customerActions = [
    {
      label: 'View',
      icon: <ExternalLink className="h-4 w-4" />,
      onClick: (customer: Customer) => handleViewCustomer(customer.id),
    },
    {
      label: 'Edit Status',
      icon: <Edit className="h-4 w-4" />,
      onClick: (customer: Customer) => {
        // Implementation would be similar to the dropdown menu in the desktop view
        // Could be implemented with a modal or a popover
      },
      showOnMobile: false // Hide on mobile to keep the interface clean
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive' as const,
      onClick: (customer: Customer) => handleDelete(customer.id),
    }
  ];

  // Function to get customer badge
  const getCustomerBadge = (customer: Customer) => {
    return (
      <Badge 
        variant={getStatusBadgeVariant(customer.status) as any}
      >
        {customer.status.replace('_', ' ')}
      </Badge>
    );
  };

  // Function to get customer avatar
  const getCustomerAvatar = (customer: Customer) => {
    return (
      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-primary/10 text-primary">
          {customer.name.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    );
  };

  return (
    <div className="container mx-auto p-4">
      {/* Stats Cards */}
      {customerStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">{customerStats.total}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Total Customers</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-green-500">{customerStats.active}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Active Customers</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-yellow-500">{customerStats.inactive}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Inactive Customers</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-red-500">{customerStats.atRisk}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">At-Risk Customers</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">
                ${Math.round(customerStats.averageLifetimeValue).toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Avg. Lifetime Value</p>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Action Bar */}
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:justify-between mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            className="pl-10 pr-4 w-full md:w-[300px]"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-muted' : ''}
          >
            <FilterIcon className="h-4 w-4 mr-2" />
            Filters
            {(filters.status?.length || 
              filters.category?.length || 
              filters.minLifetimeValue || 
              filters.maxLifetimeValue || 
              filters.minHealthScore || 
              filters.maxHealthScore || 
              (filters.industries && filters.industries.length > 0)
            ) && (
              <Badge className="ml-2 bg-primary text-primary-foreground">Active</Badge>
            )}
          </Button>
          
          <Dialog open={showConvertLeadForm} onOpenChange={setShowConvertLeadForm}>
            <DialogTrigger asChild>
              <Button variant="outline">Convert Lead</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Convert Lead to Customer</DialogTitle>
                <DialogDescription>
                  Select a lead to convert to a customer
                </DialogDescription>
              </DialogHeader>
              <ConvertLeadForm 
                tenantId={tenantId} 
                onSuccess={handleLeadConverted}
                onCancel={() => setShowConvertLeadForm(false)}
              />
            </DialogContent>
          </Dialog>
          
          <Dialog open={showNewCustomerForm} onOpenChange={setShowNewCustomerForm}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                New Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>
                  Create a new customer record
                </DialogDescription>
              </DialogHeader>
              <NewCustomerForm 
                tenantId={tenantId} 
                onSuccess={handleCustomerCreated}
                onCancel={() => setShowNewCustomerForm(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="mb-1">Status</Label>
                <Select 
                  value={filters.status?.length ? filters.status[0] : undefined}
                  onValueChange={(value) => handleFilterChange('status', value ? [value] : [])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="at_risk">At Risk</SelectItem>
                    <SelectItem value="churned">Churned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="mb-1">Category</Label>
                <Select 
                  value={filters.category?.length ? filters.category[0] : undefined}
                  onValueChange={(value) => handleFilterChange('category', value ? [value] : [])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any Category</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="mid_market">Mid Market</SelectItem>
                    <SelectItem value="small_business">Small Business</SelectItem>
                    <SelectItem value="startup">Startup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="mb-1">Min Health Score</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Minimum health score"
                  value={filters.minHealthScore || ''}
                  onChange={(e) => handleFilterChange('minHealthScore', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
              
              <div>
                <Label className="mb-1">Min Lifetime Value ($)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Minimum value"
                  value={filters.minLifetimeValue || ''}
                  onChange={(e) => handleFilterChange('minLifetimeValue', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
              
              <div>
                <Label className="mb-1">Industry</Label>
                <Input
                  placeholder="Filter by industry"
                  value={filters.industries?.[0] || ''}
                  onChange={(e) => handleFilterChange('industries', e.target.value ? [e.target.value] : [])}
                />
              </div>
              
              <div className="flex justify-end items-end">
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="mr-2"
                >
                  Clear Filters
                </Button>
                <Button 
                  onClick={() => setShowFilters(false)}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Customers List/Table */}
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading customers...</span>
        </div>
      ) : filteredCustomers.length > 0 ? (
        isMobile ? (
          // Mobile view using MobileEntityList
          <MobileEntityList
            entities={filteredCustomers}
            fields={customerFields}
            keyField="id"
            actions={customerActions}
            statusField="status"
            loading={isLoading}
            emptyMessage="No customers found matching your criteria"
            onRowClick={customer => handleViewCustomer(customer.id)}
            getEntityBadge={getCustomerBadge}
            getEntityAvatar={getCustomerAvatar}
          />
        ) : (
          // Desktop view using regular table
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Primary Contact</TableHead>
                  <TableHead>Health Score</TableHead>
                  <TableHead>Lifetime Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => {
                  const primaryContact = customer.contacts.find(c => c.isPrimary) || customer.contacts[0];
                  
                  return (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        <div>
                          <span 
                            className="cursor-pointer hover:text-primary"
                            onClick={() => handleViewCustomer(customer.id)}
                          >
                            {customer.name}
                          </span>
                          {customer.convertedFromLead && (
                            <Badge variant="outline" className="ml-2">Converted Lead</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {customer.industry || 'No industry'} • Created {new Date(customer.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(customer.status) as any}>
                          {customer.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`bg-${getCategoryBadgeVariant(customer.category)} hover:bg-${getCategoryBadgeVariant(customer.category)}/80`}>
                          {customer.category.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {primaryContact ? (
                          <div>
                            <div>{primaryContact.name}</div>
                            <div className="text-xs text-muted-foreground">{primaryContact.email}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No contacts</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div 
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold
                              ${customer.healthScore.overall >= 75 ? 'bg-green-100 text-green-700' : 
                                customer.healthScore.overall >= 50 ? 'bg-yellow-100 text-yellow-700' : 
                                'bg-red-100 text-red-700'}`}
                          >
                            {customer.healthScore.overall}
                          </div>
                          <span className="text-xs">
                            {customer.healthScore.trend === 'improving' ? '↗️' : 
                             customer.healthScore.trend === 'declining' ? '↘️' : '→'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>${customer.lifetimeValue.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <ChevronDownIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewCustomer(customer.id)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(customer.id, 'active')}>
                              Mark as Active
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(customer.id, 'inactive')}>
                              Mark as Inactive
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(customer.id, 'at_risk')}>
                              Mark as At Risk
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(customer.id, 'churned')}>
                              Mark as Churned
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(customer.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )
      ) : (
        <Card>
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="text-muted-foreground mb-2">
              No customers found matching your criteria
            </div>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </Card>
      )}
      
      {/* Customer Profile Dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          {selectedCustomerId && (
            <CustomerProfile 
              customerId={selectedCustomerId} 
              tenantId={tenantId}
              onCustomerUpdate={() => loadCustomers()}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 