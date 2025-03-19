"use client";

import React, { useState } from 'react';
import { 
  CheckCircle, 
  Info, 
  AlertTriangle, 
  XCircle, 
  Bell, 
  CheckCheck,
  Trash2,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Notification } from '@/lib/realtime/notifications';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const { user, tenant } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<Notification['type'] | 'all'>('all');

  // Redirect if not authenticated or tenant not selected
  if (!user || !tenant) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
        <p className="mb-8">Please sign in and select a tenant to access this page.</p>
        <Button onClick={() => router.push('/auth/login')}>
          Go to Login
        </Button>
      </div>
    );
  }

  // Get notifications
  const { 
    notifications, 
    loading, 
    error, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications(user.uid, tenant.id, true, 100);

  // Get the icon for a notification type
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-slate-500" />;
    }
  };

  // Format the timestamp
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    
    // If it's a Firestore Timestamp, convert to JS Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Filter notifications based on tab and type filter
  const filteredNotifications = notifications.filter(notification => {
    // Filter by read status based on active tab
    if (activeTab === 'unread' && notification.read) {
      return false;
    }
    
    // Filter by notification type
    if (typeFilter !== 'all' && notification.type !== typeFilter) {
      return false;
    }
    
    return true;
  });

  // Get unread count
  const unreadCount = notifications.filter(notification => !notification.read).length;

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            View and manage your notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => markAllAsRead()}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter: {typeFilter === 'all' ? 'All Types' : `${typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by type</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setTypeFilter('all')}>
                All Types
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter('info')}>
                <Info className="h-4 w-4 mr-2 text-blue-500" />
                Info
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter('success')}>
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                Success
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter('warning')}>
                <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                Warning
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter('error')}>
                <XCircle className="h-4 w-4 mr-2 text-red-500" />
                Error
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs 
        defaultValue="all" 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as 'all' | 'unread')}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread {unreadCount > 0 && <span className="ml-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium">{unreadCount}</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                {activeTab === 'all' ? 'All Notifications' : 'Unread Notifications'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-12 text-center text-muted-foreground">
                  Loading notifications...
                </div>
              ) : error ? (
                <div className="py-12 text-center text-red-500">
                  Error: {error.message}
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  No notifications found
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredNotifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`py-4 px-4 rounded-lg flex items-start hover:bg-slate-50
                        ${!notification.read ? 'bg-slate-50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'}`}
                    >
                      <div className="mr-4 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{notification.title}</div>
                        <div className="text-sm text-slate-600 mt-1">
                          {notification.message}
                        </div>
                        <div className="flex items-center text-xs text-slate-500 mt-2">
                          <span>{formatTimestamp(notification.createdAt)}</span>
                          {notification.linkUrl && (
                            <a 
                              href={notification.linkUrl}
                              className="ml-4 inline-flex items-center text-blue-600 hover:text-blue-800"
                            >
                              {notification.linkText || 'View details'}
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex items-start space-x-2">
                        {!notification.read && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 text-red-500 hover:text-red-700"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}