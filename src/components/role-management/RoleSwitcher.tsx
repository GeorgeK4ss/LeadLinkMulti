import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Role, RoleType } from '@/lib/types/auth';
import { useRBAC } from '@/lib/context/rbac-context';

interface RoleSwitcherProps {
  availableRoles: Record<string, Role>;
}

export function RoleSwitcher({ availableRoles }: RoleSwitcherProps) {
  const { role: currentRole, refreshPermissions } = useRBAC();
  const [selectedRole, setSelectedRole] = useState<RoleType>(
    currentRole?.roleId || 'tenant_admin' as RoleType
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSwitch = async () => {
    if (!selectedRole || !currentRole || selectedRole === currentRole.roleId) return;

    setIsLoading(true);
    try {
      // Store current context
      const context = {
        companyId: currentRole.companyId,
        tenantId: currentRole.tenantId
      };

      // Call API to switch role
      await refreshPermissions();
      
      // Success message
      console.log(`Switched to role: ${selectedRole}`);
    } catch (error) {
      console.error('Error switching role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter roles based on current context
  const filteredRoles = Object.entries(availableRoles).filter(([_, role]) => {
    if (!currentRole) return false;
    
    // System admin can access all roles
    if (currentRole.roleId === 'system_admin') return true;
    
    // Company roles require company context
    if (role.scope === 'company' && !currentRole.companyId) return false;
    
    // Tenant roles require tenant context
    if (role.scope === 'tenant' && !currentRole.tenantId) return false;
    
    return true;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Switch Role</CardTitle>
        <CardDescription>
          Change your current role to access different permissions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
              {filteredRoles.map(([id, role]) => (
                <SelectItem key={id} value={id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Current role: <span className="font-medium">{currentRole?.roleId ? availableRoles[currentRole.roleId]?.name : 'None'}</span>
          </div>
          <Button 
            onClick={handleRoleSwitch} 
            disabled={isLoading || !currentRole || selectedRole === currentRole.roleId}
          >
            {isLoading ? 'Switching...' : 'Switch Role'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 