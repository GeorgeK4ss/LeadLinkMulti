"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings as SettingsIcon,
  Bell,
  Lock,
  LogOut,
  Mail,
  Trash2,
  Shield,
  HelpCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';

export default function SettingsPage() {
  const { user, tenant, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('account');
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    appNotifications: true,
    taskReminders: true,
    leadUpdates: true,
    dealUpdates: true,
    systemUpdates: true,
  });
  const [accountDeletionDialogOpen, setAccountDeletionDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  // Redirect if not authenticated
  if (!user || !tenant) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
        <p className="mb-8">Please sign in to access your settings.</p>
        <Button onClick={() => router.push('/auth/login')}>
          Go to Login
        </Button>
      </div>
    );
  }

  const handleNotificationChange = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));

    toast({
      title: 'Settings Updated',
      description: `${key.replace(/([A-Z])/g, ' $1').toLowerCase()} ${notificationSettings[key] ? 'disabled' : 'enabled'}`,
    });
  };

  const handleChangePassword = () => {
    // Send password reset email
    // This would typically use the password reset functionality from Firebase Auth
    toast({
      title: 'Password Reset Email Sent',
      description: 'Check your email for a link to reset your password',
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Logout Error',
        description: 'There was a problem signing out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmation !== 'delete my account') {
      toast({
        title: 'Verification Failed',
        description: 'Please type "delete my account" to confirm.',
        variant: 'destructive',
      });
      return;
    }

    // This would typically call an API to delete the user's account
    toast({
      title: 'Coming Soon',
      description: 'Account deletion will be implemented in a future update.',
    });
    
    setAccountDeletionDialogOpen(false);
    setDeleteConfirmation('');
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and settings
          </p>
        </div>

        <Tabs 
          defaultValue="account" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <SettingsIcon className="h-5 w-5 mr-2" />
                  Account Information
                </CardTitle>
                <CardDescription>
                  View and update your basic account settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label>Email Address</Label>
                  <div className="text-sm font-medium">{user.email}</div>
                </div>
                <div className="space-y-1">
                  <Label>Account Type</Label>
                  <div className="text-sm font-medium">Standard User</div>
                </div>
                <div className="space-y-1">
                  <Label>Account Created</Label>
                  <div className="text-sm font-medium">
                    {user.metadata?.creationTime 
                      ? new Date(user.metadata.creationTime).toLocaleDateString() 
                      : 'Unknown'}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/dashboard/profile')}
                >
                  Edit Profile
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-red-500">
                  <Trash2 className="h-5 w-5 mr-2" />
                  Delete Account
                </CardTitle>
                <CardDescription>
                  Permanently delete your account and all associated data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone. Once you delete your account, all of your
                  data will be permanently removed and you will lose access to all resources.
                </p>
              </CardContent>
              <CardFooter>
                <Dialog 
                  open={accountDeletionDialogOpen} 
                  onOpenChange={setAccountDeletionDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="destructive">Delete Account</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Account</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. Are you sure you want to permanently delete your account?
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        To confirm, please type <span className="font-bold">delete my account</span> below:
                      </p>
                      <Input 
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        placeholder="delete my account"
                        className="w-full"
                      />
                    </div>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setAccountDeletionDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleDeleteAccount}
                      >
                        Delete Permanently
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Control how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch 
                    id="emailNotifications"
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={() => handleNotificationChange('emailNotifications')}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="appNotifications">In-App Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications within the application
                    </p>
                  </div>
                  <Switch 
                    id="appNotifications"
                    checked={notificationSettings.appNotifications}
                    onCheckedChange={() => handleNotificationChange('appNotifications')}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="taskReminders">Task Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminders about upcoming and overdue tasks
                    </p>
                  </div>
                  <Switch 
                    id="taskReminders"
                    checked={notificationSettings.taskReminders}
                    onCheckedChange={() => handleNotificationChange('taskReminders')}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="leadUpdates">Lead Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Be notified when leads are updated or assigned to you
                    </p>
                  </div>
                  <Switch 
                    id="leadUpdates"
                    checked={notificationSettings.leadUpdates}
                    onCheckedChange={() => handleNotificationChange('leadUpdates')}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dealUpdates">Deal Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about deal progress and status changes
                    </p>
                  </div>
                  <Switch 
                    id="dealUpdates"
                    checked={notificationSettings.dealUpdates}
                    onCheckedChange={() => handleNotificationChange('dealUpdates')}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="systemUpdates">System Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about system maintenance and new features
                    </p>
                  </div>
                  <Switch 
                    id="systemUpdates"
                    checked={notificationSettings.systemUpdates}
                    onCheckedChange={() => handleNotificationChange('systemUpdates')}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setNotificationSettings({
                      emailNotifications: true,
                      appNotifications: true,
                      taskReminders: true,
                      leadUpdates: true,
                      dealUpdates: true,
                      systemUpdates: true,
                    });
                    toast({
                      title: 'Notifications Reset',
                      description: 'All notification settings have been reset to default',
                    });
                  }}
                >
                  Reset to Default
                </Button>
                <Button onClick={() => {
                  toast({
                    title: 'Settings Saved',
                    description: 'Your notification preferences have been updated',
                  });
                }}>
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="h-5 w-5 mr-2" />
                  Password &amp; Security
                </CardTitle>
                <CardDescription>
                  Manage your password and secure your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-medium">Password</h4>
                      <p className="text-sm text-muted-foreground">
                        Last changed: Unknown
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleChangePassword}
                    >
                      Change Password
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-medium">Two-Factor Authentication</h4>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: 'Coming Soon',
                          description: 'Two-factor authentication will be available in a future update',
                        });
                      }}
                    >
                      Set Up 2FA
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium mb-2">Active Sessions</h4>
                  <div className="rounded-md border p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Current Session</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Now</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {navigator.userAgent}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out of All Devices
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Account Verification
                </CardTitle>
                <CardDescription>
                  Verify your identity for enhanced security
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email Verification</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  
                  {user.emailVerified ? (
                    <div className="flex items-center text-green-500 text-sm">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Verified
                    </div>
                  ) : (
                    <div className="flex items-center text-amber-500 text-sm">
                      <XCircle className="h-4 w-4 mr-1" />
                      Unverified
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                {!user.emailVerified && (
                  <Button 
                    variant="default"
                    onClick={() => {
                      toast({
                        title: 'Verification Email Sent',
                        description: 'Please check your inbox for a verification link',
                      });
                    }}
                  >
                    Send Verification Email
                  </Button>
                )}
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HelpCircle className="h-5 w-5 mr-2" />
                  Need Help?
                </CardTitle>
                <CardDescription>
                  Get assistance with account security issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  If you're experiencing issues with your account or notice any suspicious activity,
                  our support team is here to help.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push('/support')}
                >
                  Contact Support
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 