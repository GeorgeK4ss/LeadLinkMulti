import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Role, RoleType, PermissionAction, PermissionResource } from '@/lib/types/auth';
import { UserRole } from '@/lib/types/auth';

interface PermissionViewerProps {
  roles: Record<RoleType, Role>;
  currentRole: UserRole;
}

export function PermissionViewer({ roles, currentRole }: PermissionViewerProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<RoleType>(currentRole.roleId);
  const selectedRole = roles[selectedRoleId];

  const resources: PermissionResource[] = [
    'users', 'companies', 'tenants', 'leads', 'customers',
    'activities', 'settings', 'billing', 'support'
  ];

  const actions: PermissionAction[] = ['create', 'read', 'update', 'delete', 'manage'];

  const hasPermission = (action: PermissionAction, resource: PermissionResource) => {
    return selectedRole.permissions.includes(`${action}:${resource}`);
  };

  const getPermissionBadge = (action: PermissionAction, resource: PermissionResource) => {
    const hasAccess = hasPermission(action, resource);
    return (
      <Badge variant={hasAccess ? "default" : "secondary"} className="w-20 justify-center">
        {hasAccess ? 'Yes' : 'No'}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Viewer</CardTitle>
        <CardDescription>
          View and understand role permissions and access levels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="role">Select Role</label>
          <Select value={selectedRoleId} onValueChange={(value: RoleType) => setSelectedRoleId(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(roles).map(([roleId, roleData]) => (
                <SelectItem key={roleId} value={roleId}>
                  {roleData.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Role Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Name</p>
              <p className="text-sm">{selectedRole.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Scope</p>
              <p className="text-sm capitalize">{selectedRole.scope}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">Description</p>
            <p className="text-sm">{selectedRole.description}</p>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Permission Matrix</h3>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  {actions.map(action => (
                    <TableHead key={action} className="text-center capitalize">
                      {action}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map(resource => (
                  <TableRow key={resource}>
                    <TableCell className="font-medium capitalize">
                      {resource}
                    </TableCell>
                    {actions.map(action => (
                      <TableCell key={`${action}-${resource}`} className="text-center">
                        {getPermissionBadge(action, resource)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 