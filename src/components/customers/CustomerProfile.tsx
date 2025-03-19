"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Customer, CustomerContact, CustomerCategory, CustomerStatus } from '@/types/customer';
import { CustomerService } from '@/lib/services/CustomerService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { CustomerInteractionList } from './CustomerInteractionList';
import { CustomerContractList } from './CustomerContractList';
import { CustomerNotes } from './CustomerNotes';
import { CustomerHealthScore } from './CustomerHealthScore';
import { CustomerOpportunities } from './CustomerOpportunities';

interface CustomerProfileProps {
  customerId: string;
  tenantId: string;
  onCustomerUpdate?: (customer: Customer) => void;
}

export function CustomerProfile({ customerId, tenantId, onCustomerUpdate }: CustomerProfileProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedCustomer, setEditedCustomer] = useState<Partial<Customer>>({});
  const router = useRouter();
  const customerService = new CustomerService();
  const { toast } = useToast();

  useEffect(() => {
    const loadCustomer = async () => {
      setIsLoading(true);
      try {
        const customerData = await customerService.getCustomer(tenantId, customerId);
        setCustomer(customerData);
        setEditedCustomer(customerData || {});
      } catch (error) {
        console.error('Error loading customer:', error);
        toast({
          title: 'Error',
          description: 'Failed to load customer information',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomer();
  }, [customerId, tenantId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedCustomer({
      ...editedCustomer,
      [name]: value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setEditedCustomer({
      ...editedCustomer,
      [name]: value,
    });
  };

  const handleSave = async () => {
    if (!customer) return;
    
    setIsLoading(true);
    try {
      await customerService.updateCustomer(tenantId, customerId, editedCustomer);
      
      // Refresh customer data
      const updatedCustomer = await customerService.getCustomer(tenantId, customerId);
      setCustomer(updatedCustomer);
      
      if (onCustomerUpdate && updatedCustomer) {
        onCustomerUpdate(updatedCustomer);
      }
      
      setIsEditMode(false);
      toast({
        title: 'Success',
        description: 'Customer information updated',
      });
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to update customer information',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedCustomer(customer || {});
    setIsEditMode(false);
  };

  const getCategoryBadge = (category: CustomerCategory) => {
    const variants: Record<CustomerCategory, string> = {
      vip: 'purple',
      enterprise: 'blue',
      mid_market: 'green',
      small_business: 'yellow',
      startup: 'orange',
    };
    
    return (
      <Badge className={`bg-${variants[category]} hover:bg-${variants[category]}/80`}>
        {category.replace('_', ' ')}
      </Badge>
    );
  };

  const getStatusBadge = (status: CustomerStatus) => {
    const variants: Record<CustomerStatus, string> = {
      active: 'green',
      inactive: 'gray',
      at_risk: 'red',
      churned: 'destructive',
    };
    
    return (
      <Badge variant={variants[status] as any}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  if (isLoading && !customer) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading customer information...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Customer Not Found</CardTitle>
            <CardDescription>The requested customer could not be found.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/customers')}>
              Back to Customers
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex flex-col space-y-1.5">
            {isEditMode ? (
              <Input
                name="name"
                value={editedCustomer.name || ''}
                onChange={handleInputChange}
                className="font-semibold text-xl"
              />
            ) : (
              <>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {customer.name}
                  {customer.convertedFromLead && (
                    <Badge variant="outline" className="ml-2">
                      Converted Lead
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {getCategoryBadge(customer.category)}
                  <span className="mx-2">•</span>
                  {getStatusBadge(customer.status)}
                  {customer.industry && (
                    <>
                      <span className="mx-2">•</span>
                      <span className="text-muted-foreground">{customer.industry}</span>
                    </>
                  )}
                </CardDescription>
              </>
            )}
          </div>
          <div className="flex gap-2">
            {isEditMode ? (
              <>
                <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditMode(true)}>
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="health">Health Score</TabsTrigger>
              <TabsTrigger value="contracts">Contracts</TabsTrigger>
              <TabsTrigger value="interactions">Interactions</TabsTrigger>
              <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Company Information</h3>
                  
                  <div className="space-y-4">
                    {isEditMode ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            name="website"
                            value={editedCustomer.website || ''}
                            onChange={handleInputChange}
                            placeholder="https://example.com"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="industry">Industry</Label>
                          <Input
                            id="industry"
                            name="industry"
                            value={editedCustomer.industry || ''}
                            onChange={handleInputChange}
                            placeholder="Technology, Healthcare, etc."
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="size">Company Size</Label>
                          <Input
                            id="size"
                            name="size"
                            value={editedCustomer.size || ''}
                            onChange={handleInputChange}
                            placeholder="Number of employees"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={editedCustomer.status}
                            onValueChange={(value) => handleSelectChange('status', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="at_risk">At Risk</SelectItem>
                              <SelectItem value="churned">Churned</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="category">Category</Label>
                          <Select
                            value={editedCustomer.category}
                            onValueChange={(value) => handleSelectChange('category', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="vip">VIP</SelectItem>
                              <SelectItem value="enterprise">Enterprise</SelectItem>
                              <SelectItem value="mid_market">Mid Market</SelectItem>
                              <SelectItem value="small_business">Small Business</SelectItem>
                              <SelectItem value="startup">Startup</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="font-medium">Website:</div>
                          <div className="col-span-2">
                            {customer.website ? (
                              <a 
                                href={customer.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {customer.website}
                              </a>
                            ) : (
                              <span className="text-muted-foreground">Not provided</span>
                            )}
                          </div>
                          
                          <div className="font-medium">Industry:</div>
                          <div className="col-span-2">
                            {customer.industry || <span className="text-muted-foreground">Not provided</span>}
                          </div>
                          
                          <div className="font-medium">Company Size:</div>
                          <div className="col-span-2">
                            {customer.size || <span className="text-muted-foreground">Not provided</span>}
                          </div>
                          
                          <div className="font-medium">Created On:</div>
                          <div className="col-span-2">
                            {new Date(customer.createdAt).toLocaleDateString()}
                          </div>
                          
                          <div className="font-medium">Last Updated:</div>
                          <div className="col-span-2">
                            {new Date(customer.lastUpdated).toLocaleDateString()}
                          </div>
                          
                          {customer.conversionDate && (
                            <>
                              <div className="font-medium">Converted On:</div>
                              <div className="col-span-2">
                                {new Date(customer.conversionDate).toLocaleDateString()}
                              </div>
                            </>
                          )}
                          
                          <div className="font-medium">Lifetime Value:</div>
                          <div className="col-span-2">
                            ${customer.lifetimeValue.toLocaleString()}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {customer.tags && customer.tags.length > 0 ? (
                      customer.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">No tags</span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-medium mb-4 mt-6">Address</h3>
                  <div className="space-y-2">
                    {customer.addresses && customer.addresses.length > 0 ? (
                      customer.addresses.map((address, index) => (
                        <div key={index} className="p-3 border rounded-md">
                          <div className="flex justify-between mb-2">
                            <span className="font-semibold">
                              {address.type.charAt(0).toUpperCase() + address.type.slice(1)} Address
                            </span>
                            {address.isPrimary && (
                              <Badge variant="outline">Primary</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {address.street}<br />
                            {address.city}, {address.state} {address.postalCode}<br />
                            {address.country}
                          </p>
                        </div>
                      ))
                    ) : (
                      <span className="text-muted-foreground">No addresses on record</span>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="contacts">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Contacts</h3>
                  <Button size="sm">Add Contact</Button>
                </div>
                
                {customer.contacts && customer.contacts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customer.contacts.map((contact) => (
                      <Card key={contact.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>
                                  {contact.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-base">{contact.name}</CardTitle>
                                <CardDescription>{contact.title || 'No title'}</CardDescription>
                              </div>
                            </div>
                            <div className="flex gap-1 flex-wrap justify-end">
                              {contact.isPrimary && <Badge variant="outline">Primary</Badge>}
                              {contact.isDecisionMaker && <Badge>Decision Maker</Badge>}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Email:</span>
                              <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                                {contact.email}
                              </a>
                            </div>
                            {contact.phone && (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Phone:</span>
                                <a href={`tel:${contact.phone}`} className="hover:underline">
                                  {contact.phone}
                                </a>
                              </div>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="pt-0">
                          <div className="flex gap-2 w-full justify-end">
                            <Button size="sm" variant="outline">Edit</Button>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <p className="text-muted-foreground mb-4">No contacts available for this customer</p>
                    <Button>Add First Contact</Button>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="health">
              <CustomerHealthScore 
                customer={customer} 
                tenantId={tenantId}
                onUpdate={() => {
                  // Refresh customer data after health score update
                  customerService.getCustomer(tenantId, customerId).then(data => {
                    if (data) setCustomer(data);
                  });
                }}
              />
            </TabsContent>
            
            <TabsContent value="contracts">
              <CustomerContractList 
                customerId={customer?.id || customerId}
                tenantId={tenantId}
                onUpdate={() => {
                  // Refresh customer data after contract update
                  customerService.getCustomer(tenantId, customerId).then(data => {
                    if (data) setCustomer(data);
                  });
                }}
              />
            </TabsContent>
            
            <TabsContent value="interactions">
              <CustomerInteractionList
                customerId={customer?.id || customerId}
                tenantId={tenantId}
                onUpdate={() => {
                  // Refresh customer data after interaction update
                  customerService.getCustomer(tenantId, customerId).then(data => {
                    if (data) setCustomer(data);
                  });
                }}
              />
            </TabsContent>
            
            <TabsContent value="opportunities">
              <CustomerOpportunities
                customerId={customer?.id || customerId}
                tenantId={tenantId}
                onUpdate={() => {
                  // Refresh customer data after opportunities update
                  customerService.getCustomer(tenantId, customerId).then(data => {
                    if (data) setCustomer(data);
                  });
                }}
              />
            </TabsContent>
            
            <TabsContent value="notes">
              <CustomerNotes
                customerId={customer?.id || customerId}
                tenantId={tenantId}
                onUpdate={() => {
                  // Refresh customer data after notes update
                  customerService.getCustomer(tenantId, customerId).then(data => {
                    if (data) setCustomer(data);
                  });
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 