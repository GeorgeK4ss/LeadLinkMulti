"use client";

import React, { useState } from 'react';
import { TaskList } from './TaskList';
import { TaskForm } from './TaskForm';
import { TaskDetail } from './TaskDetail';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";

interface TaskManagerProps {
  tenantId: string;
  userId?: string;
}

// Define the different views the task manager can have
type TaskManagerView = 'list' | 'detail' | 'create' | 'edit';

export function TaskManager({ tenantId, userId }: TaskManagerProps) {
  // Track current view and selected task
  const [currentView, setCurrentView] = useState<TaskManagerView>('list');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Mock team members
  const mockTeamMembers = [
    { id: '101', name: 'Sarah Connor' },
    { id: '102', name: 'Mike Johnson' },
    { id: '103', name: 'Alex Rodriguez' },
  ];

  // Mock related entities
  const mockRelatedEntities = [
    { id: '201', name: 'John Smith - Acme Inc.', type: 'lead' as const },
    { id: '202', name: 'Sarah Johnson - TechCorp', type: 'lead' as const },
    { id: '203', name: 'Michael Chen - Startup LLC', type: 'customer' as const },
    { id: '204', name: 'Jessica Williams - Growth Partners', type: 'customer' as const },
  ];

  // Handle task creation
  const handleCreateTask = () => {
    setIsFormOpen(true);
    setCurrentView('create');
  };

  // Handle task edit
  const handleEditTask = () => {
    setIsFormOpen(true);
    setCurrentView('edit');
  };

  // Handle task view
  const handleViewTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setCurrentView('detail');
  };

  // Handle cancel form
  const handleCancelForm = () => {
    setIsFormOpen(false);
    // Return to list if canceling from create, or detail if canceling from edit
    setCurrentView(currentView === 'create' ? 'list' : 'detail');
  };

  // Handle form submission
  const handleSubmitForm = (data: any) => {
    console.log('Form submitted with data:', data);
    setIsFormOpen(false);
    
    // Return to list view after creating, or detail view after editing
    setCurrentView(currentView === 'create' ? 'list' : 'detail');
    
    // Show a success notification (implementation would depend on your notification system)
    alert(currentView === 'create' ? 'Task created successfully!' : 'Task updated successfully!');
  };

  // Handle back button in detail view
  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedTaskId(null);
  };

  // Handle task status update
  const handleUpdateTaskStatus = (taskId: string, newStatus: string) => {
    console.log(`Updating task ${taskId} status to ${newStatus}`);
    // In a real app, you would make an API call here
  };

  // Render the appropriate view
  const renderContent = () => {
    switch (currentView) {
      case 'detail':
        return (
          <TaskDetail
            taskId={selectedTaskId || ''}
            tenantId={tenantId}
            onEdit={handleEditTask}
            onBack={handleBackToList}
            onUpdateStatus={handleUpdateTaskStatus}
          />
        );
      case 'list':
      default:
        return (
          <TaskList
            tenantId={tenantId}
            userId={userId}
            onCreateTask={handleCreateTask}
            onViewTask={handleViewTask}
          />
        );
    }
  };

  // Dialog title based on current form mode
  const getDialogTitle = () => {
    return currentView === 'create' ? 'Create New Task' : 'Edit Task';
  };

  return (
    <div>
      {renderContent()}

      {/* Task Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            <DialogDescription>
              {currentView === 'create' 
                ? 'Fill in the details to create a new task.'
                : 'Update the task details below.'
              }
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            tenantId={tenantId}
            taskId={currentView === 'edit' ? selectedTaskId || undefined : undefined}
            onSubmit={handleSubmitForm}
            onCancel={handleCancelForm}
            teamMembers={mockTeamMembers}
            relatedEntities={mockRelatedEntities}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 