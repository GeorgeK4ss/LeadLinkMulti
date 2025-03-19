import React, { useState, useEffect } from 'react';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult,
  DroppableProvided,
  DraggableProvided
} from 'react-beautiful-dnd';
import { ResponsiveDashboard } from '@/components/ui/responsive-dashboard';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PlusIcon, Cross2Icon, MixerHorizontalIcon } from '@radix-ui/react-icons';
import { TasksWidget, LeadMetricsWidget, ActivityTimelineWidget } from './widgets';

// Widget types available for adding to dashboard
export enum WidgetType {
  TASKS = 'tasks',
  LEAD_METRICS = 'lead_metrics',
  ACTIVITY_TIMELINE = 'activity_timeline',
}

// Widget configuration interface
export interface WidgetConfig {
  id: string;
  type: WidgetType;
  desktopWidth: "full" | "half" | "third" | "two-thirds" | "quarter";
  settings?: Record<string, any>;
}

// Props for the CustomizableDashboard component
interface CustomizableDashboardProps {
  tenantId: string;
  defaultWidgets?: WidgetConfig[];
  onSaveConfiguration?: (widgets: WidgetConfig[]) => void;
  savedWidgets?: WidgetConfig[];
}

export function CustomizableDashboard({
  tenantId,
  defaultWidgets = [
    { id: 'tasks-widget', type: WidgetType.TASKS, desktopWidth: 'half' },
    { id: 'leads-widget', type: WidgetType.LEAD_METRICS, desktopWidth: 'half' },
    { id: 'activity-widget', type: WidgetType.ACTIVITY_TIMELINE, desktopWidth: 'third' },
  ],
  onSaveConfiguration,
  savedWidgets,
}: CustomizableDashboardProps) {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddWidgetDialogOpen, setIsAddWidgetDialogOpen] = useState(false);

  // Load widgets from saved configuration or use defaults
  useEffect(() => {
    if (savedWidgets && savedWidgets.length > 0) {
      setWidgets(savedWidgets);
    } else {
      setWidgets(defaultWidgets);
    }
  }, [defaultWidgets, savedWidgets]);

  // Handle drag and drop reordering
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setWidgets(items);
    if (onSaveConfiguration) {
      onSaveConfiguration(items);
    }
  };

  // Add a new widget to the dashboard
  const handleAddWidget = (type: WidgetType) => {
    const newWidget: WidgetConfig = {
      id: `${type}-${Date.now()}`,
      type,
      desktopWidth: 'half',
    };
    
    const updatedWidgets = [...widgets, newWidget];
    setWidgets(updatedWidgets);
    
    if (onSaveConfiguration) {
      onSaveConfiguration(updatedWidgets);
    }
    
    setIsAddWidgetDialogOpen(false);
  };

  // Remove a widget from the dashboard
  const handleRemoveWidget = (id: string) => {
    const updatedWidgets = widgets.filter(widget => widget.id !== id);
    setWidgets(updatedWidgets);
    
    if (onSaveConfiguration) {
      onSaveConfiguration(updatedWidgets);
    }
  };

  // Change widget width
  const handleChangeWidgetWidth = (id: string, width: "full" | "half" | "third" | "two-thirds" | "quarter") => {
    const updatedWidgets = widgets.map(widget => {
      if (widget.id === id) {
        return { ...widget, desktopWidth: width };
      }
      return widget;
    });
    
    setWidgets(updatedWidgets);
    
    if (onSaveConfiguration) {
      onSaveConfiguration(updatedWidgets);
    }
  };

  // Render a specific widget based on its type and configuration
  const renderWidget = (widget: WidgetConfig) => {
    switch (widget.type) {
      case WidgetType.TASKS:
        return (
          <TasksWidget 
            tenantId={tenantId} 
            desktopWidth={widget.desktopWidth}
            limit={widget.settings?.limit || 5}
          />
        );
      case WidgetType.LEAD_METRICS:
        return (
          <LeadMetricsWidget 
            tenantId={tenantId} 
            desktopWidth={widget.desktopWidth}
            period={widget.settings?.period || '30days'}
          />
        );
      case WidgetType.ACTIVITY_TIMELINE:
        return (
          <ActivityTimelineWidget 
            tenantId={tenantId} 
            desktopWidth={widget.desktopWidth}
            limit={widget.settings?.limit || 10}
          />
        );
      default:
        return <div>Unknown widget type</div>;
    }
  };

  // Get friendly name for a widget type
  const getWidgetName = (type: WidgetType) => {
    switch (type) {
      case WidgetType.TASKS:
        return 'Tasks';
      case WidgetType.LEAD_METRICS:
        return 'Lead Metrics';
      case WidgetType.ACTIVITY_TIMELINE:
        return 'Activity Timeline';
      default:
        return 'Unknown Widget';
    }
  };

  return (
    <div className="space-y-4">
      {/* Dashboard controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsEditMode(!isEditMode)}
          >
            {isEditMode ? 'Done' : 'Customize'}
          </Button>
          
          {isEditMode && (
            <Dialog open={isAddWidgetDialogOpen} onOpenChange={setIsAddWidgetDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <PlusIcon className="mr-1 h-4 w-4" />
                  Add Widget
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Widget</DialogTitle>
                  <DialogDescription>
                    Select a widget to add to your dashboard.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Button 
                    variant="outline" 
                    onClick={() => handleAddWidget(WidgetType.TASKS)}
                    className="justify-start"
                  >
                    Tasks
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleAddWidget(WidgetType.LEAD_METRICS)}
                    className="justify-start"
                  >
                    Lead Metrics
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleAddWidget(WidgetType.ACTIVITY_TIMELINE)}
                    className="justify-start"
                  >
                    Activity Timeline
                  </Button>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddWidgetDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Draggable dashboard */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="dashboard" direction="horizontal">
          {(provided: DroppableProvided) => (
            <ResponsiveDashboard>
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="col-span-12 grid grid-cols-12 gap-3 md:gap-4"
              >
                {widgets.map((widget, index) => (
                  <Draggable
                    key={widget.id}
                    draggableId={widget.id}
                    index={index}
                    isDragDisabled={!isEditMode}
                  >
                    {(provided: DraggableProvided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`relative ${isEditMode ? 'border-2 border-dashed border-primary/30 rounded-md p-1' : ''}`}
                      >
                        {isEditMode && (
                          <div className="absolute top-2 right-2 z-10 flex gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="h-7 w-7 bg-background">
                                  <MixerHorizontalIcon className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleChangeWidgetWidth(widget.id, 'full')}>
                                  Full Width
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleChangeWidgetWidth(widget.id, 'half')}>
                                  Half Width
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleChangeWidgetWidth(widget.id, 'third')}>
                                  One Third
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleChangeWidgetWidth(widget.id, 'two-thirds')}>
                                  Two Thirds
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleChangeWidgetWidth(widget.id, 'quarter')}>
                                  Quarter Width
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 bg-background"
                              onClick={() => handleRemoveWidget(widget.id)}
                            >
                              <Cross2Icon className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        
                        {isEditMode && (
                          <div className="absolute top-2 left-2 z-10 bg-background/80 text-xs px-2 py-1 rounded">
                            {getWidgetName(widget.type)}
                          </div>
                        )}
                        
                        {renderWidget(widget)}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            </ResponsiveDashboard>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
} 