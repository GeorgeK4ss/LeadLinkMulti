"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ActivityList } from './ActivityList';
import { useEntityActivities } from '@/hooks/useActivities';
import { useRouter } from 'next/navigation';
import { Clock, ChevronRight } from 'lucide-react';

interface EntityActivityProps {
  tenantId: string;
  entityId: string;
  entityType: string;
  entityName?: string;
  maxItems?: number;
  className?: string;
  showViewAll?: boolean;
  cardStyle?: boolean;
  maxHeight?: string;
}

export function EntityActivity({
  tenantId,
  entityId,
  entityType,
  entityName,
  maxItems = 5,
  className,
  showViewAll = true,
  cardStyle = true,
  maxHeight = "300px"
}: EntityActivityProps) {
  const router = useRouter();
  const { activities, loading, error } = useEntityActivities(
    tenantId,
    entityType,
    entityId,
    maxItems
  );

  // If showing limited number of activities, slice the array
  const displayedActivities = activities.slice(0, maxItems);

  // Handle click on "View All" button
  const handleViewAllClick = () => {
    router.push(`/dashboard/activity?entityType=${entityType}&entityId=${entityId}`);
  };

  // Return the appropriate content based on styling preference
  const content = (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {entityName ? `${entityName} - Activity` : 'Activity History'}
        </h3>
        {showViewAll && activities.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleViewAllClick}
            className="text-xs"
          >
            View All <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
      
      {activities.length === 0 && !loading && !error ? (
        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
          <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p>No activity recorded yet</p>
        </div>
      ) : (
        <ActivityList 
          activities={displayedActivities}
          loading={loading}
          error={error}
          maxHeight={maxHeight}
          emptyMessage={`No activity recorded for this ${entityType}`}
        />
      )}
    </>
  );

  // If card style is enabled, wrap in a Card component
  if (cardStyle) {
    return (
      <Card className={className}>
        <CardHeader className="pb-0">
          <CardTitle className="text-lg font-semibold">
            {entityName ? `${entityName} - Activity` : 'Activity History'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 && !loading && !error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p>No activity recorded yet</p>
            </div>
          ) : (
            <>
              <ActivityList 
                activities={displayedActivities}
                loading={loading}
                error={error}
                maxHeight={maxHeight}
                emptyMessage={`No activity recorded for this ${entityType}`}
              />
              
              {showViewAll && activities.length > 0 && (
                <div className="flex justify-center mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleViewAllClick}
                  >
                    View All Activity <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // Otherwise, return the content directly
  return <div className={className}>{content}</div>;
} 