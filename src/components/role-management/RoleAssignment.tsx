import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRBAC } from '@/lib/context/rbac-context';
import { Role, RoleType } from '@/lib/types/auth';
import { RBACService } from '@/lib/services/rbac';

interface RoleAssignmentProps {
  availableRoles: Record<string, Role>;
}

export function RoleAssignment({ availableRoles }: RoleAssignmentProps) {
  const { role: currentRole } = useRBAC();
  const [userId, setUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleType | ''>('');
  const [companyId, setCompanyId] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAssignRole = async () => {
    if (!userId || !selectedRole) return;

    setIsLoading(true);
    try {
      const rbacService = RBACService.getInstance();
      await rbacService.assignRole(userId, selectedRole, companyId || undefined, tenantId || undefined);
      // Reset form
      setUserId('');
      setSelectedRole('');
      setCompanyId('');
      setTenantId('');
    } catch (error) {
      console.error('Error assigning role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showCompanyField = selectedRole && availableRoles[selectedRole]?.scope === 'company';
  const showTenantField = selectedRole && availableRoles[selectedRole]?.scope === 'tenant';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Role to User</CardTitle>
        <CardDescription>
          Assign or modify user roles within your scope
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="userId">User ID</label>
          <Input
            id="userId"
            placeholder="Enter user ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="role">Role</label>
          <Select 
            value={selectedRole} 
            onValueChange={(value) => setSelectedRole(value as RoleType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(availableRoles).map(([roleId, roleData]) => (
                <SelectItem key={roleId} value={roleId}>
                  {roleData.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showCompanyField && (
          <div className="space-y-2">
            <label htmlFor="companyId">Company ID</label>
            <Input
              id="companyId"
              placeholder="Enter company ID"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
            />
          </div>
        )}

        {showTenantField && (
          <div className="space-y-2">
            <label htmlFor="tenantId">Tenant ID</label>
            <Input
              id="tenantId"
              placeholder="Enter tenant ID"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
            />
          </div>
        )}

        <Button 
          onClick={handleAssignRole} 
          disabled={!userId || !selectedRole || isLoading}
          className="w-full"
        >
          {isLoading ? 'Assigning...' : 'Assign Role'}
        </Button>
      </CardContent>
    </Card>
  );
} 