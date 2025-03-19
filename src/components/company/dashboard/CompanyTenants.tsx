import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useToast } from '../../../components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';

interface Tenant {
  id: string;
  name: string;
  createdAt: string;
  status: 'active' | 'inactive' | 'suspended';
  userCount: number;
  leadCount: number;
  plan: 'free' | 'basic' | 'professional' | 'enterprise';
}

interface CompanyTenantsProps {
  companyId: string;
}

export function CompanyTenants({ companyId }: CompanyTenantsProps) {
  const { toast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([
    {
      id: '1',
      name: 'Sales Department',
      createdAt: '2024-01-10T09:00:00Z',
      status: 'active',
      userCount: 12,
      leadCount: 256,
      plan: 'professional',
    },
    {
      id: '2',
      name: 'Marketing Team',
      createdAt: '2024-01-15T11:30:00Z',
      status: 'active',
      userCount: 8,
      leadCount: 178,
      plan: 'basic',
    },
    {
      id: '3',
      name: 'Customer Support',
      createdAt: '2024-02-01T14:45:00Z',
      status: 'active',
      userCount: 5,
      leadCount: 153,
      plan: 'professional',
    },
    {
      id: '4',
      name: 'Development Team',
      createdAt: '2024-02-10T08:15:00Z',
      status: 'inactive',
      userCount: 0,
      leadCount: 0,
      plan: 'basic',
    },
  ]);

  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantPlan, setNewTenantPlan] = useState<Tenant['plan']>('basic');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateTenant = async () => {
    try {
      // TODO: Implement actual tenant creation logic
      const newTenant: Tenant = {
        id: (tenants.length + 1).toString(),
        name: newTenantName,
        createdAt: new Date().toISOString(),
        status: 'active',
        userCount: 0,
        leadCount: 0,
        plan: newTenantPlan,
      };

      setTenants([...tenants, newTenant]);
      setNewTenantName('');
      setNewTenantPlan('basic');
      setIsDialogOpen(false);

      toast({
        title: 'Tenant created',
        description: `${newTenantName} has been created successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create tenant. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (tenantId: string, newStatus: Tenant['status']) => {
    try {
      // TODO: Implement actual status change logic
      setTenants(tenants.map(tenant => 
        tenant.id === tenantId ? { ...tenant, status: newStatus } : tenant
      ));
      
      toast({
        title: 'Status updated',
        description: 'Tenant status has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update tenant status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePlanChange = async (tenantId: string, newPlan: Tenant['plan']) => {
    try {
      // TODO: Implement actual plan change logic
      setTenants(tenants.map(tenant => 
        tenant.id === tenantId ? { ...tenant, plan: newPlan } : tenant
      ));
      
      toast({
        title: 'Plan updated',
        description: 'Tenant plan has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update tenant plan. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getPlanLabel = (plan: Tenant['plan']) => {
    switch (plan) {
      case 'free': return 'Free';
      case 'basic': return 'Basic';
      case 'professional': return 'Professional';
      case 'enterprise': return 'Enterprise';
      default: return plan;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tenant Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Tenant</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tenant</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="tenantName" className="text-sm font-medium">
                  Tenant Name
                </label>
                <Input
                  id="tenantName"
                  placeholder="Enter tenant name"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="tenantPlan" className="text-sm font-medium">
                  Subscription Plan
                </label>
                <Select value={newTenantPlan} onValueChange={(value: Tenant['plan']) => setNewTenantPlan(value)}>
                  <SelectTrigger id="tenantPlan">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleCreateTenant}>Create Tenant</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Users</TableHead>
            <TableHead>Leads</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenants.map((tenant) => (
            <TableRow key={tenant.id}>
              <TableCell className="font-medium">{tenant.name}</TableCell>
              <TableCell>
                <Select
                  value={tenant.status}
                  onValueChange={(value: Tenant['status']) => handleStatusChange(tenant.id, value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue>
                      <Badge
                        variant={
                          tenant.status === 'active'
                            ? 'default'
                            : tenant.status === 'suspended'
                            ? 'secondary'
                            : 'destructive'
                        }
                        className={
                          tenant.status === 'active'
                            ? 'bg-green-500 hover:bg-green-600'
                            : tenant.status === 'suspended'
                            ? 'bg-yellow-500 hover:bg-yellow-600'
                            : ''
                        }
                      >
                        {tenant.status}
                      </Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Select
                  value={tenant.plan}
                  onValueChange={(value: Tenant['plan']) => handlePlanChange(tenant.id, value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue>{getPlanLabel(tenant.plan)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>{tenant.userCount}</TableCell>
              <TableCell>{tenant.leadCount}</TableCell>
              <TableCell>{new Date(tenant.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm">Manage</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 