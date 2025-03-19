"use client";

import React, { useState } from 'react';
import { 
  Filter, 
  Clock, 
  User, 
  Building, 
  FileText, 
  CheckSquare 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useActivities } from '@/hooks/useActivities';
import { ActivityList } from '@/components/activities/ActivityList';
import { useRouter } from 'next/navigation';

export default function ActivityPage() {
  const { user, tenant } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'yours'>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string | 'all'>('all');

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

  // Get activities
  const { activities, loading, error } = useActivities(tenant.id, {
    maxResults: 100
  });

  // Filter activities based on tab and entity type
  const filteredActivities = activities.filter(activity => {
    // Filter by user if on "yours" tab
    if (activeTab === 'yours' && activity.userId !== user.uid) {
      return false;
    }
    
    // Filter by entity type
    if (entityTypeFilter !== 'all' && activity.entityType !== entityTypeFilter) {
      return false;
    }
    
    return true;
  });

  // Get the icon for entity type filter
  const getEntityTypeIcon = (type: string) => {
    switch (type) {
      case 'lead':
        return <User className="h-4 w-4 mr-2 text-blue-500" />;
      case 'customer':
        return <Building className="h-4 w-4 mr-2 text-green-500" />;
      case 'task':
        return <CheckSquare className="h-4 w-4 mr-2 text-purple-500" />;
      case 'deal':
        return <FileText className="h-4 w-4 mr-2 text-yellow-500" />;
      case 'user':
        return <User className="h-4 w-4 mr-2 text-indigo-500" />;
      case 'system':
        return <Building className="h-4 w-4 mr-2 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 mr-2" />;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground">
            Track all activities and changes in your workspace
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter: {entityTypeFilter === 'all' ? 'All Types' : entityTypeFilter.charAt(0).toUpperCase() + entityTypeFilter.slice(1) + 's'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEntityTypeFilter('all')}>
                <Clock className="h-4 w-4 mr-2" />
                All Types
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEntityTypeFilter('lead')}>
                {getEntityTypeIcon('lead')}
                Leads
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEntityTypeFilter('customer')}>
                {getEntityTypeIcon('customer')}
                Customers
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEntityTypeFilter('task')}>
                {getEntityTypeIcon('task')}
                Tasks
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEntityTypeFilter('deal')}>
                {getEntityTypeIcon('deal')}
                Deals
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEntityTypeFilter('user')}>
                {getEntityTypeIcon('user')}
                Users
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEntityTypeFilter('system')}>
                {getEntityTypeIcon('system')}
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs 
        defaultValue="all" 
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'all' | 'yours')}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="all">All Activities</TabsTrigger>
          <TabsTrigger value="yours">Your Activities</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                {activeTab === 'all' ? 'All Activities' : 'Your Activities'}
                {entityTypeFilter !== 'all' && ` - ${entityTypeFilter.charAt(0).toUpperCase() + entityTypeFilter.slice(1)}s`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityList 
                activities={filteredActivities}
                loading={loading}
                error={error}
                maxHeight="600px"
                emptyMessage={
                  activeTab === 'yours' 
                    ? "You don't have any activities yet" 
                    : "No activities found"
                }
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 