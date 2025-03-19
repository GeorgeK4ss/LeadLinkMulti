"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RealTimeTaskList } from '@/components/tasks/RealTimeTaskList';
import { RealTimeLeadList } from '@/components/leads/RealTimeLeadList';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function RealTimeDemo() {
  const { user, tenant } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('tasks');

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

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Real-Time Data Demo</h1>
        <p className="text-muted-foreground">
          This page demonstrates real-time data fetching from Firestore using custom hooks.
        </p>
      </div>

      <Tabs
        defaultValue="tasks"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks" className="mt-6">
          <RealTimeTaskList 
            tenantId={tenant.id} 
            userId={user.uid}
            onCreateTask={() => router.push('/dashboard/tasks/create')}
            onViewTask={(taskId) => router.push(`/dashboard/tasks/${taskId}`)}
          />
        </TabsContent>
        <TabsContent value="leads" className="mt-6">
          <RealTimeLeadList 
            tenantId={tenant.id}
            userId={user.uid}
            onCreateLead={() => router.push('/dashboard/leads/create')}
            onViewLead={(leadId) => router.push(`/dashboard/leads/${leadId}`)}
            onEditLead={(leadId) => router.push(`/dashboard/leads/${leadId}/edit`)}
          />
        </TabsContent>
      </Tabs>

      <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
        <h2 className="text-xl font-semibold mb-4">Real-Time Updates Guide</h2>
        <div className="space-y-4">
          <p>
            This demo showcases real-time data capabilities. To test the real-time updates:
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Open this page in multiple browser windows</li>
            <li>Make changes to tasks or leads in one window</li>
            <li>Watch the updates appear instantly in the other window</li>
            <li>Use the status dropdown in the actions menu to change status</li>
          </ol>
          <p className="text-sm text-muted-foreground mt-4">
            Note: For this demo to work properly, you need to have tasks and leads data in your Firestore database.
          </p>
        </div>
      </div>
    </div>
  );
}