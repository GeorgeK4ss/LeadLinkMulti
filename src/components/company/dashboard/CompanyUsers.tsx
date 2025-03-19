import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface CompanyUser {
  id: string;
  name: string;
  email: string;
  role: 'company_admin' | 'company_manager' | 'company_user' | 'company_billing' | 'company_support';
  status: 'active' | 'inactive' | 'pending';
  lastActive: string;
}

interface CompanyUsersProps {
  companyId: string;
}

export function CompanyUsers({ companyId }: CompanyUsersProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<CompanyUser[]>([
    {
      id: '1',
      name: 'John Smith',
      email: 'john@company.com',
      role: 'company_admin',
      status: 'active',
      lastActive: '2024-03-14T10:30:00Z',
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah@company.com',
      role: 'company_manager',
      status: 'active',
      lastActive: '2024-03-13T15:45:00Z',
    },
    {
      id: '3',
      name: 'Michael Brown',
      email: 'michael@company.com',
      role: 'company_billing',
      status: 'active',
      lastActive: '2024-03-12T09:15:00Z',
    },
    {
      id: '4',
      name: 'Emily Davis',
      email: 'emily@company.com',
      role: 'company_support',
      status: 'pending',
      lastActive: '2024-03-10T14:20:00Z',
    },
  ]);

  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<CompanyUser['role']>('company_user');

  const handleInviteUser = async () => {
    try {
      // TODO: Implement actual user invitation logic
      toast({
        title: 'Invitation sent',
        description: `Invitation sent to ${newUserEmail}`,
      });
      setNewUserEmail('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send invitation',
        variant: 'destructive',
      });
    }
  };

  const handleRoleChange = async (userId: string, newRole: CompanyUser['role']) => {
    try {
      // TODO: Implement actual role change logic
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      toast({
        title: 'Role updated',
        description: 'User role has been updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      // TODO: Implement actual user deactivation logic
      setUsers(users.map(user =>
        user.id === userId ? { ...user, status: 'inactive' as const } : user
      ));
      toast({
        title: 'User deactivated',
        description: 'User has been deactivated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to deactivate user',
        variant: 'destructive',
      });
    }
  };

  const getRoleLabel = (role: CompanyUser['role']) => {
    switch (role) {
      case 'company_admin': return 'Admin';
      case 'company_manager': return 'Manager';
      case 'company_user': return 'User';
      case 'company_billing': return 'Billing';
      case 'company_support': return 'Support';
      default: return role;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Company User Management</h2>
        <div className="flex gap-4">
          <Input
            placeholder="Enter email address"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            className="w-64"
          />
          <Select value={newUserRole} onValueChange={(value: CompanyUser['role']) => setNewUserRole(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="company_admin">Admin</SelectItem>
              <SelectItem value="company_manager">Manager</SelectItem>
              <SelectItem value="company_user">User</SelectItem>
              <SelectItem value="company_billing">Billing</SelectItem>
              <SelectItem value="company_support">Support</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleInviteUser}>Invite User</Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Active</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Select
                  value={user.role}
                  onValueChange={(value: CompanyUser['role']) => handleRoleChange(user.id, value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue>{getRoleLabel(user.role)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company_admin">Admin</SelectItem>
                    <SelectItem value="company_manager">Manager</SelectItem>
                    <SelectItem value="company_user">User</SelectItem>
                    <SelectItem value="company_billing">Billing</SelectItem>
                    <SelectItem value="company_support">Support</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    user.status === 'active'
                      ? 'default'
                      : user.status === 'pending'
                      ? 'secondary'
                      : 'destructive'
                  }
                  className={
                    user.status === 'active'
                      ? 'bg-green-500 hover:bg-green-600'
                      : user.status === 'pending'
                      ? 'bg-yellow-500 hover:bg-yellow-600'
                      : ''
                  }
                >
                  {user.status}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(user.lastActive).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeactivateUser(user.id)}
                  disabled={user.status === 'inactive'}
                >
                  Deactivate
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 