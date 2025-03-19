"use client";

import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar, 
  Clock, 
  Edit3, 
  ExternalLink, 
  CheckSquare,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';

// Task type definitions
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assignedTo: string;
  assignedToUser?: {
    id: string;
    name: string;
    avatar?: string;
  };
  relatedTo?: {
    type: 'lead' | 'customer' | 'deal';
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    name: string;
  };
  comments?: Array<{
    id: string;
    text: string;
    createdAt: string;
    createdBy: {
      id: string;
      name: string;
      avatar?: string;
    };
  }>;
  history?: Array<{
    id: string;
    action: string;
    timestamp: string;
    user: {
      id: string;
      name: string;
    };
  }>;
}

interface TaskDetailProps {
  taskId: string;
  tenantId: string;
  onEdit?: () => void;
  onBack?: () => void;
  onUpdateStatus?: (taskId: string, status: TaskStatus) => void;
}

export function TaskDetail({ taskId, tenantId, onEdit, onBack, onUpdateStatus }: TaskDetailProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - would be replaced with real data fetching
  React.useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      // Mock task data
      const mockTask: Task = {
        id: '1',
        title: 'Follow up with John Smith',
        description: 'Send product information and pricing details. Follow up regarding the previous demo and answer any questions they might have. Discuss potential implementation timeline.',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2024-04-20',
        assignedTo: '101',
        assignedToUser: {
          id: '101',
          name: 'Sarah Connor',
          avatar: '/avatars/sarah.jpg'
        },
        relatedTo: {
          type: 'lead',
          id: '201',
          name: 'John Smith - Acme Inc.'
        },
        createdAt: '2024-04-15T10:00:00Z',
        updatedAt: '2024-04-16T14:30:00Z',
        createdBy: {
          id: '102',
          name: 'Mike Johnson'
        },
        comments: [
          {
            id: 'c1',
            text: 'I spoke with John yesterday. He is interested in our premium plan.',
            createdAt: '2024-04-15T14:25:00Z',
            createdBy: {
              id: '101',
              name: 'Sarah Connor',
              avatar: '/avatars/sarah.jpg'
            }
          },
          {
            id: 'c2',
            text: 'Great. Let\'s schedule a follow-up call next week.',
            createdAt: '2024-04-15T15:10:00Z',
            createdBy: {
              id: '102',
              name: 'Mike Johnson',
              avatar: '/avatars/mike.jpg'
            }
          }
        ],
        history: [
          {
            id: 'h1',
            action: 'Task created',
            timestamp: '2024-04-15T10:00:00Z',
            user: {
              id: '102',
              name: 'Mike Johnson'
            }
          },
          {
            id: 'h2',
            action: 'Status changed from Pending to In Progress',
            timestamp: '2024-04-16T09:15:00Z',
            user: {
              id: '101',
              name: 'Sarah Connor'
            }
          },
          {
            id: 'h3',
            action: 'Due date updated',
            timestamp: '2024-04-16T14:30:00Z',
            user: {
              id: '101',
              name: 'Sarah Connor'
            }
          }
        ]
      };
      
      setTask(mockTask);
      setIsLoading(false);
    }, 1000);
  }, [taskId, tenantId]);

  // Get status badge color
  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Pending</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'low':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Low Priority</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Medium Priority</Badge>;
      case 'high':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">High Priority</Badge>;
      case 'urgent':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Urgent Priority</Badge>;
      default:
        return <Badge variant="outline">Unknown Priority</Badge>;
    }
  };

  // Format date to local string
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      return dateString;
    }
  };

  // Format datetime to local string
  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP p');
    } catch (error) {
      return dateString;
    }
  };

  // Handle status update
  const handleStatusUpdate = (newStatus: TaskStatus) => {
    if (onUpdateStatus && task) {
      onUpdateStatus(task.id, newStatus);
      // In a real app, we'd wait for the API response before updating the UI
      setTask(prev => prev ? { ...prev, status: newStatus, updatedAt: new Date().toISOString() } : null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">Loading task...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!task) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">Task not found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-2">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack} className="mt-0.5">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <CardTitle className="text-xl">{task.title}</CardTitle>
              <CardDescription>
                Created by {task.createdBy?.name} on {formatDateTime(task.createdAt)}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit3 className="mr-2 h-4 w-4" />
                Edit Task
              </Button>
            )}
            {task.status !== 'completed' && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => handleStatusUpdate('completed')}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckSquare className="mr-2 h-4 w-4" />
                Mark Complete
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main content - left side */}
          <div className="col-span-2 space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
              <p className="text-sm leading-relaxed">
                {task.description || 'No description provided.'}
              </p>
            </div>
            
            <Separator />

            {/* Comments */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Comments</h3>
              {task.comments && task.comments.length > 0 ? (
                <div className="space-y-4">
                  {task.comments.map(comment => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        {comment.createdBy.avatar && <AvatarImage src={comment.createdBy.avatar} alt={comment.createdBy.name} />}
                        <AvatarFallback>{comment.createdBy.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{comment.createdBy.name}</p>
                          <span className="text-xs text-muted-foreground">{formatDateTime(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No comments yet.</p>
              )}
            </div>

            <Separator />

            {/* Activity History */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Activity History</h3>
              {task.history && task.history.length > 0 ? (
                <div className="space-y-2">
                  {task.history.map(entry => (
                    <div key={entry.id} className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm">{entry.action} by {entry.user.name}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(entry.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
              )}
            </div>
          </div>

          {/* Sidebar - right side */}
          <div className="space-y-6">
            {/* Status and Priority */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Status</h3>
                {getStatusBadge(task.status)}
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Priority</h3>
                {getPriorityBadge(task.priority)}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Due Date</h3>
              <div className="flex items-center text-sm">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                {formatDate(task.dueDate)}
              </div>
            </div>

            {/* Assigned To */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Assigned To</h3>
              {task.assignedToUser ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    {task.assignedToUser.avatar && <AvatarImage src={task.assignedToUser.avatar} alt={task.assignedToUser.name} />}
                    <AvatarFallback>{task.assignedToUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{task.assignedToUser.name}</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Unassigned</span>
              )}
            </div>

            {/* Related To */}
            {task.relatedTo && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Related To
                </h3>
                <div className="flex items-center">
                  <Button variant="ghost" size="sm" className="p-0 h-auto text-sm font-normal hover:bg-transparent">
                    <span className="capitalize">{task.relatedTo.type}:</span>&nbsp;
                    {task.relatedTo.name}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-4">
              {task.status === 'pending' && (
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => handleStatusUpdate('in_progress')}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Start Working on Task
                </Button>
              )}
              
              {task.status !== 'cancelled' && task.status !== 'completed' && (
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => handleStatusUpdate('cancelled')}
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Cancel Task
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 