"use client";

import React from 'react';
import { 
  Bell, 
  CheckCircle, 
  Info, 
  AlertTriangle, 
  XCircle, 
  X, 
  ExternalLink, 
  CheckCheck 
} from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Notification } from '@/lib/realtime/notifications';
import { NotificationBadge } from './NotificationBadge';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

interface NotificationCenterProps {
  userId: string;
  tenantId: string;
}

export function NotificationCenter({ userId, tenantId }: NotificationCenterProps) {
  const [open, setOpen] = React.useState(false);
  
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications(userId, tenantId, true);

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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div>
          <NotificationBadge count={unreadCount} />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end">
        <Card className="border-0">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
            {unreadCount > 0 && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-xs h-8"
                onClick={() => markAllAsRead()}
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Mark all as read
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[350px]">
              {loading ? (
                <div className="py-6 text-center text-muted-foreground">
                  Loading notifications...
                </div>
              ) : error ? (
                <div className="py-6 text-center text-red-500">
                  Error: {error.message}
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground">
                  No notifications
                </div>
              ) : (
                <div>
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`border-b last:border-0 py-3 px-4 flex items-start 
                        ${!notification.read ? 'bg-slate-50' : ''}`}
                    >
                      <div className="mr-3 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium mb-0.5">{notification.title}</div>
                        <div className="text-sm text-slate-600 mb-1.5">
                          {notification.message}
                        </div>
                        <div className="flex items-center text-xs text-slate-500">
                          <span>{formatTimestamp(notification.createdAt)}</span>
                          {!notification.read && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 text-xs ml-auto"
                              onClick={() => markAsRead(notification.id)}
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                        {notification.linkUrl && (
                          <a 
                            href={notification.linkUrl}
                            className="text-sm mt-2 inline-flex items-center text-blue-600 hover:text-blue-800"
                          >
                            {notification.linkText || 'View details'}
                            <ExternalLink className="h-3.5 w-3.5 ml-1" />
                          </a>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 w-6 p-0 ml-2"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
          <CardFooter className="py-2 px-4 border-t flex justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
            <Button 
              variant="outline" 
              size="sm"  
              className="text-xs"
              onClick={() => {
                // Handle view all button
                setOpen(false);
                // This would typically navigate to a notifications page
                // router.push('/notifications');
              }}
            >
              View all
            </Button>
          </CardFooter>
        </Card>
      </PopoverContent>
    </Popover>
  );
} 