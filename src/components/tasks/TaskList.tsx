"use client";

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Filter, 
  MoreVertical, 
  Plus, 
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock1
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
  relatedTo?: {
    type: 'lead' | 'customer' | 'deal';
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface TaskListProps {
  tenantId: string;
  userId?: string;
  onCreateTask?: () => void;
  onViewTask?: (taskId: string) => void;
}

export function TaskList({ tenantId, userId, onCreateTask, onViewTask }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - would be replaced with real data fetching
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockTasks: Task[] = [
        {
          id: '1',
          title: 'Follow up with John Smith',
          description: 'Send product information and pricing',
          status: 'pending',
          priority: 'high',
          dueDate: '2024-04-20',
          assignedTo: 'Sarah Connor',
          relatedTo: {
            type: 'lead',
            id: '101',
            name: 'John Smith - Acme Inc.'
          },
          createdAt: '2024-04-15T10:00:00Z',
          updatedAt: '2024-04-15T10:00:00Z'
        },
        {
          id: '2',
          title: 'Prepare proposal for TechCorp',
          description: 'Create custom proposal based on initial meeting',
          status: 'in_progress',
          priority: 'urgent',
          dueDate: '2024-04-18',
          assignedTo: 'Mike Johnson',
          relatedTo: {
            type: 'lead',
            id: '102',
            name: 'Sarah Johnson - TechCorp'
          },
          createdAt: '2024-04-14T09:30:00Z',
          updatedAt: '2024-04-16T11:20:00Z'
        },
        {
          id: '3',
          title: 'Schedule demo with Startup LLC',
          description: 'Demo of premium features',
          status: 'completed',
          priority: 'medium',
          dueDate: '2024-04-12',
          assignedTo: 'Sarah Connor',
          relatedTo: {
            type: 'customer',
            id: '201',
            name: 'Michael Chen - Startup LLC'
          },
          createdAt: '2024-04-10T14:00:00Z',
          updatedAt: '2024-04-12T16:30:00Z'
        },
        {
          id: '4',
          title: 'Send monthly newsletter',
          description: 'April newsletter to all customers',
          status: 'pending',
          priority: 'low',
          dueDate: '2024-04-25',
          assignedTo: 'Mike Johnson',
          createdAt: '2024-04-16T08:45:00Z',
          updatedAt: '2024-04-16T08:45:00Z'
        },
        {
          id: '5',
          title: 'Contract renewal discussion',
          description: 'Discuss renewal options and pricing',
          status: 'pending',
          priority: 'medium',
          dueDate: '2024-04-22',
          assignedTo: 'Sarah Connor',
          relatedTo: {
            type: 'customer',
            id: '202',
            name: 'Jessica Williams - Growth Partners'
          },
          createdAt: '2024-04-15T16:20:00Z',
          updatedAt: '2024-04-15T16:20:00Z'
        },
      ];
      
      setTasks(mockTasks);
      setFilteredTasks(mockTasks);
      setIsLoading(false);
    }, 1000);
  }, [tenantId]);

  // Filter tasks when search or filters change
  useEffect(() => {
    let result = tasks;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(task => 
        task.title.toLowerCase().includes(query) || 
        task.description.toLowerCase().includes(query) ||
        (task.relatedTo?.name.toLowerCase().includes(query) || false)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(task => task.status === statusFilter);
    }
    
    // Apply priority filter
    if (priorityFilter !== 'all') {
      result = result.filter(task => task.priority === priorityFilter);
    }
    
    setFilteredTasks(result);
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

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
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Low</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Medium</Badge>;
      case 'high':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">High</Badge>;
      case 'urgent':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Urgent</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Format date to local string
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Mark task as complete
  const markAsComplete = (taskId: string) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'completed', updatedAt: new Date().toISOString() } 
          : task
      )
    );
  };

  // Update task status
  const updateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus, updatedAt: new Date().toISOString() } 
          : task
      )
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Task Management</CardTitle>
            <CardDescription>Manage and track your team's tasks</CardDescription>
          </div>
          <Button onClick={onCreateTask}>
            <Plus className="mr-2 h-4 w-4" /> Add Task
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters and search */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search tasks..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as TaskStatus | 'all')}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={priorityFilter}
                onValueChange={(value) => setPriorityFilter(value as TaskPriority | 'all')}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tasks table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30px]"></TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading tasks...
                    </TableCell>
                  </TableRow>
                ) : filteredTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No tasks found. Try adjusting your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <Checkbox 
                          checked={task.status === 'completed'}
                          onCheckedChange={() => {
                            if (task.status !== 'completed') {
                              markAsComplete(task.id);
                            } else {
                              updateTaskStatus(task.id, 'in_progress');
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{task.title}</div>
                        {task.relatedTo && (
                          <div className="text-sm text-muted-foreground">
                            {task.relatedTo.type === 'lead' ? 'Lead: ' : 'Customer: '}
                            {task.relatedTo.name}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                      <TableCell>{getStatusBadge(task.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          {formatDate(task.dueDate)}
                        </div>
                      </TableCell>
                      <TableCell>{task.assignedTo}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onViewTask && onViewTask(task.id)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {task.status !== 'completed' && (
                              <DropdownMenuItem onClick={() => updateTaskStatus(task.id, 'completed')}>
                                Mark as Completed
                              </DropdownMenuItem>
                            )}
                            {task.status !== 'in_progress' && task.status !== 'completed' && (
                              <DropdownMenuItem onClick={() => updateTaskStatus(task.id, 'in_progress')}>
                                Mark as In Progress
                              </DropdownMenuItem>
                            )}
                            {task.status !== 'cancelled' && (
                              <DropdownMenuItem onClick={() => updateTaskStatus(task.id, 'cancelled')}>
                                Cancel Task
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 