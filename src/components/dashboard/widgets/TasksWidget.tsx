import React, { useEffect, useState } from 'react';
import { DashboardWidget } from '@/components/ui/responsive-dashboard';
import { Button } from '@/components/ui/button';
import { collection, limit as firestoreLimit, orderBy, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Task, TaskPriority, TaskStatus } from '@/types/task';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, ArrowRightIcon } from '@radix-ui/react-icons';
import { format, isBefore, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';

interface TasksWidgetProps {
  tenantId: string;
  limit?: number;
  desktopWidth?: "full" | "half" | "third" | "two-thirds" | "quarter";
  showAddButton?: boolean;
}

export function TasksWidget({ 
  tenantId, 
  limit = 5, 
  desktopWidth = "half",
  showAddButton = true
}: TasksWidgetProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // Get tasks directly using Firebase queries
        const tasksCollection = collection(db, `tenants/${tenantId}/tasks`);
        
        // Get non-completed tasks first ordered by due date (closest first)
        const nonCompletedQuery = query(
          tasksCollection,
          where('status', '!=', 'completed'),
          orderBy('status'),
          orderBy('dueDate'),
          firestoreLimit(limit)
        );
        
        const querySnapshot = await getDocs(nonCompletedQuery);
        const tasksData: Task[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<Task, 'id'>;
          tasksData.push({
            id: doc.id,
            ...data
          } as Task);
        });
        
        setTasks(tasksData);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [tenantId, limit]);

  const handleAddTask = () => {
    router.push('/tasks/new');
  };

  const handleViewAllTasks = () => {
    router.push('/tasks');
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadge = (task: Task) => {
    if (task.status === 'completed') {
      return <Badge variant="outline" className="bg-green-50">Completed</Badge>;
    }
    
    if (task.dueDate) {
      const dueDate = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate;
      const now = new Date();
      
      if (task.status === 'in_progress') {
        return <Badge variant="outline" className="bg-blue-50">In Progress</Badge>;
      } else if (isBefore(dueDate, now)) {
        return <Badge variant="destructive">Overdue</Badge>;
      } else {
        return <Badge variant="outline" className="bg-gray-50">Upcoming</Badge>;
      }
    }
    
    return <Badge variant="outline">Open</Badge>;
  };

  const renderAddButton = showAddButton ? (
    <Button size="sm" onClick={handleAddTask}>
      <PlusIcon className="mr-1 h-4 w-4" />
      Add Task
    </Button>
  ) : null;

  return (
    <DashboardWidget
      title="Tasks"
      description="Your upcoming and recent tasks"
      desktopWidth={desktopWidth}
      loading={loading}
      actionButton={renderAddButton}
    >
      {tasks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No tasks found</p>
          {showAddButton && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={handleAddTask}
            >
              Create your first task
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div 
              key={task.id} 
              className="p-3 border rounded-md hover:bg-muted/50 transition-colors"
              onClick={() => router.push(`/tasks/${task.id}`)}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <div 
                      className={`${getPriorityColor(task.priority)} h-2 w-2 rounded-full mr-2`} 
                      aria-hidden="true" 
                    />
                    <h4 className="font-medium truncate">{task.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-1">
                    {task.description?.substring(0, 60) || "No description"}
                    {(task.description?.length || 0) > 60 ? '...' : ''}
                  </p>
                </div>
                <div className="ml-2">
                  {getStatusBadge(task)}
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>
                  {task.dueDate ? (
                    <>Due: {format(
                      typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate, 
                      'MMM d, yyyy'
                    )}</>
                  ) : (
                    'No due date'
                  )}
                </span>
                {task.assignedTo && (
                  <span>Assigned to: {task.assignedTo}</span>
                )}
              </div>
            </div>
          ))}
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full mt-2 text-muted-foreground" 
            onClick={handleViewAllTasks}
          >
            View all tasks <ArrowRightIcon className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </DashboardWidget>
  );
}