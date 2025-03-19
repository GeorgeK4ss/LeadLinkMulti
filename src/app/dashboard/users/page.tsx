"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { UserPermission, UserRole, AuthUser } from '@/types/auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  UserPlus, 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  ShieldAlert, 
  ShieldCheck,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash,
  Mail
} from 'lucide-react';
import { collection, getDocs, doc, updateDoc, query, where, getFirestore } from 'firebase/firestore';

// Sample user data - in a real app, this would come from Firestore
const sampleUsers = [
  {
    id: 'user1',
    displayName: 'John Smith',
    email: 'john@example.com',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
    role: 'admin',
    lastActive: '2 hours ago',
    status: 'active'
  },
  {
    id: 'user2',
    displayName: 'Sarah Johnson',
    email: 'sarah@example.com',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    role: 'manager',
    lastActive: '1 day ago',
    status: 'active'
  },
  {
    id: 'user3',
    displayName: 'Michael Brown',
    email: 'michael@example.com',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=michael',
    role: 'user',
    lastActive: '3 days ago',
    status: 'inactive'
  },
  {
    id: 'user4',
    displayName: 'Emily Davis',
    email: 'emily@example.com',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily',
    role: 'user',
    lastActive: '5 hours ago',
    status: 'active'
  },
  {
    id: 'user5',
    displayName: 'David Wilson',
    email: 'david@example.com',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david',
    role: 'guest',
    lastActive: '2 weeks ago',
    status: 'inactive'
  }
];

export default function UsersPage() {
  const { user, tenant } = useAuth();
  const [users, setUsers] = useState(sampleUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  
  // In a real app, fetch users from Firestore
  useEffect(() => {
    // This would be replaced with actual Firestore fetching
    const fetchUsers = async () => {
      // const db = getFirestore();
      // const usersRef = collection(db, 'users');
      // const q = query(usersRef, where('tenantId', '==', tenant?.id));
      // const snapshot = await getDocs(q);
      // const fetchedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // setUsers(fetchedUsers);
      
      // For now, just use sample data
      setUsers(sampleUsers);
    };
    
    if (tenant) {
      fetchUsers();
    }
  }, [tenant]);
  
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });
  
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    // In a real app, update the user's role in Firestore
    // const db = getFirestore();
    // const userRef = doc(db, 'users', userId);
    // await updateDoc(userRef, { role: newRole });
    
    // For now, just update the local state
    setUsers(users.map(user => 
      user.id === userId ? { ...user, role: newRole } : user
    ));
    
    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser({ ...selectedUser, role: newRole });
    }
  };
  
  const handleStatusChange = async (userId: string, newStatus: string) => {
    // In a real app, update the user's status in Firestore
    // const db = getFirestore();
    // const userRef = doc(db, 'users', userId);
    // await updateDoc(userRef, { status: newStatus });
    
    // For now, just update the local state
    setUsers(users.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ));
    
    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser({ ...selectedUser, status: newStatus });
    }
  };
  
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'manager': return 'bg-blue-500';
      case 'user': return 'bg-green-500';
      case 'guest': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'suspended': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <ProtectedRoute requiredPermissions={[UserPermission.VIEW_USERS]}>
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
              <p className="text-muted-foreground">
                Manage users, roles, and permissions for your organization.
              </p>
            </div>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle>Users</CardTitle>
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Search users..."
                          className="pl-8 w-[200px]"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger className="w-[130px]">
                          <SelectValue placeholder="Filter by role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Roles</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="guest">Guest</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="w-[130px]">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">No users found matching your filters.</p>
                      </div>
                    ) : (
                      filteredUsers.map((user) => (
                        <div 
                          key={user.id} 
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                          onClick={() => setSelectedUser(user)}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <img 
                                src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                                alt={user.displayName || 'User'} 
                                className="h-10 w-10 rounded-full"
                              />
                              <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${user.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            </div>
                            <div>
                              <p className="font-medium">{user.displayName}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                            <p className="text-sm text-muted-foreground">Last active: {user.lastActive}</p>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <p className="text-sm text-muted-foreground">Showing {filteredUsers.length} of {users.length} users</p>
                </CardFooter>
              </Card>
            </div>
            
            <div>
              {selectedUser ? (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle>User Details</CardTitle>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="icon" onClick={() => setIsEditingUser(!isEditingUser)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center mb-6">
                      <img 
                        src={selectedUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.email}`} 
                        alt={selectedUser.displayName || 'User'} 
                        className="h-24 w-24 rounded-full mb-4"
                      />
                      <h3 className="text-xl font-bold">{selectedUser.displayName}</h3>
                      <p className="text-muted-foreground">{selectedUser.email}</p>
                      <div className="flex space-x-2 mt-2">
                        <Badge className={getRoleBadgeColor(selectedUser.role)}>{selectedUser.role}</Badge>
                        <Badge className={getStatusBadgeColor(selectedUser.status)}>{selectedUser.status}</Badge>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    {isEditingUser ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="user-role">Role</Label>
                          <Select 
                            value={selectedUser.role} 
                            onValueChange={(value) => handleRoleChange(selectedUser.id, value as UserRole)}
                          >
                            <SelectTrigger id="user-role">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="guest">Guest</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="user-status">Status</Label>
                          <Select 
                            value={selectedUser.status} 
                            onValueChange={(value) => handleStatusChange(selectedUser.id, value)}
                          >
                            <SelectTrigger id="user-status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="suspended">Suspended</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium">Last Active</p>
                          <p className="text-sm text-muted-foreground">{selectedUser.lastActive}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium">Role Permissions</p>
                          <div className="mt-2 space-y-2">
                            {selectedUser.role === 'admin' && (
                              <>
                                <Badge variant="outline" className="mr-2">All Permissions</Badge>
                              </>
                            )}
                            
                            {selectedUser.role === 'manager' && (
                              <>
                                <Badge variant="outline" className="mr-2 mb-2">Manage Users</Badge>
                                <Badge variant="outline" className="mr-2 mb-2">Manage Customers</Badge>
                                <Badge variant="outline" className="mr-2 mb-2">Manage Leads</Badge>
                                <Badge variant="outline" className="mr-2 mb-2">Manage Tasks</Badge>
                                <Badge variant="outline" className="mr-2 mb-2">View Analytics</Badge>
                              </>
                            )}
                            
                            {selectedUser.role === 'user' && (
                              <>
                                <Badge variant="outline" className="mr-2 mb-2">View Customers</Badge>
                                <Badge variant="outline" className="mr-2 mb-2">View Leads</Badge>
                                <Badge variant="outline" className="mr-2 mb-2">Manage Tasks</Badge>
                              </>
                            )}
                            
                            {selectedUser.role === 'guest' && (
                              <>
                                <Badge variant="outline" className="mr-2 mb-2">View Customers</Badge>
                                <Badge variant="outline" className="mr-2 mb-2">View Leads</Badge>
                                <Badge variant="outline" className="mr-2 mb-2">View Tasks</Badge>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm" className="w-full">
                      <Mail className="mr-2 h-4 w-4" />
                      Send Message
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>User Details</CardTitle>
                    <CardDescription>Select a user to view details</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <Users className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-center text-muted-foreground">
                      Select a user from the list to view their details and manage their role.
                    </p>
                  </CardContent>
                </Card>
              )}
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Role Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                        <ShieldAlert className="h-4 w-4 text-red-500" />
                      </div>
                      <div>
                        <p className="font-medium">Admin</p>
                        <p className="text-sm text-muted-foreground">Full access to all features</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                        <ShieldCheck className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium">Manager</p>
                        <p className="text-sm text-muted-foreground">Can manage most resources</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                        <UserCheck className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium">User</p>
                        <p className="text-sm text-muted-foreground">Standard access to core features</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                        <UserX className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium">Guest</p>
                        <p className="text-sm text-muted-foreground">Limited view-only access</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 