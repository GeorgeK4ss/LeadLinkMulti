import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'agent';
  status: 'active' | 'inactive' | 'pending';
  lastActive: string;
}

export function TenantUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<TenantUser[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
      status: 'active',
      lastActive: '2024-03-14T10:30:00Z',
    },
    // Add more mock users here
  ]);

  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<TenantUser['role']>('agent');

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

  const handleRoleChange = async (userId: string, newRole: TenantUser['role']) => {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="flex gap-4">
          <Input
            placeholder="Enter email address"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            className="w-64"
          />
          <Select value={newUserRole} onValueChange={(value: TenantUser['role']) => setNewUserRole(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
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
                  onValueChange={(value: TenantUser['role']) => handleRoleChange(user.id, value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
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
                      ? 'bg-green-500'
                      : user.status === 'pending'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
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