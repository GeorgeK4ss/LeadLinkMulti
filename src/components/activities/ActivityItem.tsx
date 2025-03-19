"use client";

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  UserCircle2, 
  CheckCircle, 
  Circle, 
  RefreshCw, 
  UserPlus, 
  FileEdit, 
  Trash2,
  MessageSquare,
  Star,
  DollarSign,
  ShieldAlert,
  Briefcase,
  Settings,
  LogIn,
  LogOut,
  AlertTriangle,
  User,
  Building,
  Lock
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Activity } from '@/lib/realtime/activities';
import { cn } from '@/lib/utils';

interface ActivityItemProps {
  activity: Activity;
  className?: string;
}

export function ActivityItem({ activity, className }: ActivityItemProps) {
  // Format the timestamp
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    
    // If it's a Firestore Timestamp, convert to JS Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Determine the icon to display based on the activity type
  const getActivityIcon = () => {
    const actionType = activity.action.split('_')[0]; // Get the entity type (lead, customer, etc.)
    const actionName = activity.action.split('_')[1]; // Get the action (created, updated, etc.)

    switch (actionType) {
      case 'lead':
        if (actionName === 'created') return <UserPlus className="h-5 w-5 text-green-500" />;
        if (actionName === 'updated') return <FileEdit className="h-5 w-5 text-blue-500" />;
        if (actionName === 'deleted') return <Trash2 className="h-5 w-5 text-red-500" />;
        if (actionName === 'status') return <RefreshCw className="h-5 w-5 text-purple-500" />;
        if (actionName === 'assigned') return <UserCircle2 className="h-5 w-5 text-yellow-500" />;
        if (actionName === 'converted') return <CheckCircle className="h-5 w-5 text-green-500" />;
        if (actionName === 'note') return <MessageSquare className="h-5 w-5 text-blue-500" />;
        return <Circle className="h-5 w-5 text-gray-500" />;
      
      case 'customer':
        if (actionName === 'created') return <UserPlus className="h-5 w-5 text-green-500" />;
        if (actionName === 'updated') return <FileEdit className="h-5 w-5 text-blue-500" />;
        if (actionName === 'deleted') return <Trash2 className="h-5 w-5 text-red-500" />;
        if (actionName === 'status') return <RefreshCw className="h-5 w-5 text-purple-500" />;
        if (actionName === 'assigned') return <UserCircle2 className="h-5 w-5 text-yellow-500" />;
        if (actionName === 'note') return <MessageSquare className="h-5 w-5 text-blue-500" />;
        return <Building className="h-5 w-5 text-blue-500" />;
      
      case 'task':
        if (actionName === 'created') return <Circle className="h-5 w-5 text-green-500" />;
        if (actionName === 'updated') return <FileEdit className="h-5 w-5 text-blue-500" />;
        if (actionName === 'deleted') return <Trash2 className="h-5 w-5 text-red-500" />;
        if (actionName === 'completed') return <CheckCircle className="h-5 w-5 text-green-500" />;
        if (actionName === 'status') return <RefreshCw className="h-5 w-5 text-purple-500" />;
        if (actionName === 'assigned') return <UserCircle2 className="h-5 w-5 text-yellow-500" />;
        if (actionName === 'comment') return <MessageSquare className="h-5 w-5 text-blue-500" />;
        return <Circle className="h-5 w-5 text-gray-500" />;
      
      case 'deal':
        if (actionName === 'created') return <Briefcase className="h-5 w-5 text-green-500" />;
        if (actionName === 'updated') return <FileEdit className="h-5 w-5 text-blue-500" />;
        if (actionName === 'deleted') return <Trash2 className="h-5 w-5 text-red-500" />;
        if (actionName === 'stage') return <RefreshCw className="h-5 w-5 text-purple-500" />;
        if (actionName === 'assigned') return <UserCircle2 className="h-5 w-5 text-yellow-500" />;
        if (actionName === 'won') return <Star className="h-5 w-5 text-yellow-500" />;
        if (actionName === 'lost') return <AlertTriangle className="h-5 w-5 text-red-500" />;
        if (actionName === 'note') return <MessageSquare className="h-5 w-5 text-blue-500" />;
        return <DollarSign className="h-5 w-5 text-green-500" />;
      
      case 'user':
        if (actionName === 'logged') {
          return activity.action === 'user_logged_in' 
            ? <LogIn className="h-5 w-5 text-green-500" /> 
            : <LogOut className="h-5 w-5 text-orange-500" />;
        }
        if (actionName === 'created') return <UserPlus className="h-5 w-5 text-green-500" />;
        if (actionName === 'updated') return <FileEdit className="h-5 w-5 text-blue-500" />;
        if (actionName === 'deleted') return <Trash2 className="h-5 w-5 text-red-500" />;
        if (actionName === 'role') return <Lock className="h-5 w-5 text-purple-500" />;
        if (actionName === 'settings') return <Settings className="h-5 w-5 text-gray-500" />;
        return <User className="h-5 w-5 text-blue-500" />;
      
      case 'system':
        if (actionName === 'tenant') return <Building className="h-5 w-5 text-blue-500" />;
        if (actionName === 'settings') return <Settings className="h-5 w-5 text-gray-500" />;
        if (actionName === 'integration') return <RefreshCw className="h-5 w-5 text-purple-500" />;
        if (actionName === 'error') return <AlertTriangle className="h-5 w-5 text-red-500" />;
        return <ShieldAlert className="h-5 w-5 text-gray-500" />;
      
      default:
        return <Circle className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className={cn("flex items-start space-x-4 py-3", className)}>
      <div className="relative mt-0.5">
        <Avatar className="h-9 w-9">
          {activity.userPhotoURL ? (
            <AvatarImage src={activity.userPhotoURL} alt={activity.userDisplayName || 'User'} />
          ) : null}
          <AvatarFallback>
            {activity.userDisplayName ? (
              activity.userDisplayName.charAt(0).toUpperCase()
            ) : (
              'U'
            )}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -right-1 -bottom-1 rounded-full bg-white p-0.5">
          {getActivityIcon()}
        </div>
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium">
          {activity.userDisplayName || 'User'}{' '}
          <span className="text-muted-foreground font-normal">
            {activity.description}
          </span>
        </p>
        <div className="flex items-center text-xs text-muted-foreground">
          <time dateTime={activity.timestamp.toString()}>
            {formatTimestamp(activity.timestamp)}
          </time>
          {activity.entityName && (
            <>
              <span className="mx-1">•</span>
              <span>
                {activity.entityType === 'lead' && 'Lead: '}
                {activity.entityType === 'customer' && 'Customer: '}
                {activity.entityType === 'task' && 'Task: '}
                {activity.entityType === 'deal' && 'Deal: '}
                {activity.entityType === 'user' && 'User: '}
                {activity.entityName}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 