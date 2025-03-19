import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RoleAssignment } from './RoleAssignment';
import { PermissionViewer } from './PermissionViewer';
import { RoleSwitcher } from './RoleSwitcher';
import { useRBAC } from '@/lib/context/rbac-context';
import { DEFAULT_ROLES, Role, RoleType } from '@/lib/types/auth';

export function RoleManagement() {
  const { role, permissions, isLoading } = useRBAC();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Only system admins and company admins can access role management
  if (!role || (role.roleId !== 'system_admin' && !role.roleId.startsWith('company_admin'))) {
    return <div>Access Denied</div>;
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>Role Management</CardTitle>
        <CardDescription>
          Manage user roles, permissions, and access control settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="assignment" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="assignment">Role Assignment</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="switcher">Role Switcher</TabsTrigger>
          </TabsList>

          <TabsContent value="assignment" className="space-y-4">
            <RoleAssignment 
              availableRoles={
                role.roleId === 'system_admin' 
                  ? DEFAULT_ROLES 
                  : Object.fromEntries(
                      Object.entries(DEFAULT_ROLES).filter(
                        ([_, r]) => r.scope !== 'system' && 
                                  (role.companyId ? r.scope === 'company' || r.scope === 'tenant' : false)
                      )
                    ) as Record<RoleType, Role>
              }
            />
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <PermissionViewer 
              roles={DEFAULT_ROLES}
              currentRole={role}
            />
          </TabsContent>

          <TabsContent value="switcher" className="space-y-4">
            <RoleSwitcher 
              availableRoles={
                role.roleId === 'system_admin'
                  ? DEFAULT_ROLES
                  : Object.fromEntries(
                      Object.entries(DEFAULT_ROLES).filter(
                        ([_, r]) => {
                          // Determine scope based on roleId
                          const userRoleScope = role.roleId.startsWith('tenant_') 
                            ? 'tenant' 
                            : role.roleId.startsWith('company_') 
                              ? 'company' 
                              : 'system';
                          
                          return r.scope === userRoleScope;
                        }
                      )
                    )
              }
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 