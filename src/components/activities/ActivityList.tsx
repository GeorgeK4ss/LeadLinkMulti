"use client";

import React from 'react';
import { ClockIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ActivityItem } from './ActivityItem';
import { Activity } from '@/lib/realtime/activities';
import { cn } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';

interface ActivityListProps {
  activities: Activity[];
  loading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
  maxHeight?: string;
  className?: string;
  showDividers?: boolean;
  title?: string;
}

export function ActivityList({
  activities,
  loading = false,
  error = null,
  emptyMessage = "No activities found",
  maxHeight = "400px",
  className,
  showDividers = true,
  title
}: ActivityListProps) {
  // Group activities by date
  const groupActivitiesByDate = () => {
    const grouped = activities.reduce<Record<string, Activity[]>>((acc, activity) => {
      // Handle different timestamp types
      let date: Date;
      
      if (activity.timestamp) {
        // If it's a Firestore Timestamp
        if (activity.timestamp instanceof Timestamp) {
          date = activity.timestamp.toDate();
        } 
        // If it's a server timestamp that hasn't been set yet (null)
        else if (activity.timestamp === null) {
          date = new Date();
        }
        // If it's a Date object or timestamp in milliseconds
        else {
          date = new Date(activity.timestamp as any);
        }
      } else {
        // Default to current date if no timestamp
        date = new Date();
      }
      
      // Format date as "YYYY-MM-DD"
      const dateKey = date.toISOString().split('T')[0];
      
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      
      acc[dateKey].push(activity);
      return acc;
    }, {});
    
    // Convert to array of [date, activities] entries, sorted by date (newest first)
    return Object.entries(grouped)
      .sort(([dateA], [dateB]) => dateB.localeCompare(dateA));
  };
  
  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Display loading state
  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        {title && <h3 className="text-lg font-semibold">{title}</h3>}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-full max-w-[250px]" />
                <Skeleton className="h-3 w-full max-w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Display error
  if (error) {
    return (
      <div className={cn("p-4 text-center text-red-500", className)}>
        Error loading activities: {error.message}
      </div>
    );
  }
  
  // Display empty state
  if (activities.length === 0) {
    return (
      <div className={cn("p-4 text-center text-muted-foreground", className)}>
        {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
        <div className="flex flex-col items-center justify-center py-8">
          <ClockIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }
  
  // Display activities
  const groupedActivities = groupActivitiesByDate();
  
  return (
    <div className={className}>
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ScrollArea className={`h-[${maxHeight}]`}>
        <div className="space-y-6">
          {groupedActivities.map(([dateKey, dateActivities]) => (
            <div key={dateKey} className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground sticky top-0 bg-background py-1">
                {formatDate(dateKey)}
              </h4>
              <div className={showDividers ? "divide-y" : ""}>
                {dateActivities.map((activity) => (
                  <ActivityItem 
                    key={activity.id} 
                    activity={activity} 
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
} 