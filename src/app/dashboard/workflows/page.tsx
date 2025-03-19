"use client";

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  PlusCircle, 
  Settings, 
  AlarmClock, 
  Mail, 
  MessageSquare, 
  Activity, 
  AlertTriangle,
  Check,
  Clock,
  Delete,
  ChevronRight,
  Play,
  Pause,
  Edit,
  ArrowRight,
  MoreHorizontal,
  Tag,
  Users,
  User
} from 'lucide-react';

// Sample workflow templates
const workflowTemplates = [
  {
    id: 'lead-nurture',
    title: 'Lead Nurturing Sequence',
    description: 'Automatically nurture leads with a series of emails',
    category: 'leads',
    icon: Mail,
  },
  {
    id: 'lead-assignment',
    title: 'Lead Assignment',
    description: 'Automatically assign new leads to team members',
    category: 'leads',
    icon: Users,
  },
  {
    id: 'deal-update',
    title: 'Deal Stage Notifications',
    description: 'Send notifications when deals change stages',
    category: 'deals',
    icon: MessageSquare,
  },
  {
    id: 'follow-up',
    title: 'Task Follow-up Reminder',
    description: 'Create follow-up tasks when deals are inactive',
    category: 'tasks',
    icon: AlarmClock,
  },
  {
    id: 'welcome-message',
    title: 'New Customer Welcome',
    description: 'Send welcome messages to new customers',
    category: 'customers',
    icon: User,
  },
  {
    id: 'activity-alert',
    title: 'Activity Threshold Alert',
    description: 'Alert when a lead has high or low activity',
    category: 'leads',
    icon: Activity,
  },
];

// Sample active workflows
const activeWorkflows = [
  {
    id: 'wf-001',
    name: 'High-Value Lead Assignment',
    description: 'Automatically assigns high-value leads to senior sales reps',
    isActive: true,
    trigger: 'New lead created with value > $10,000',
    action: 'Assign to Senior Sales Team',
    runsCount: 24,
    lastRun: '2 hours ago'
  },
  {
    id: 'wf-002',
    name: 'Follow-up Reminder',
    description: 'Creates tasks for leads without activity in 7 days',
    isActive: true,
    trigger: 'No activity for 7 days',
    action: 'Create follow-up task',
    runsCount: 156,
    lastRun: '30 minutes ago'
  },
  {
    id: 'wf-003',
    name: 'Deal Stage Notification',
    description: 'Notifies team when deals move to negotiation',
    isActive: false,
    trigger: 'Deal stage changes to "Negotiation"',
    action: 'Send notification to sales manager',
    runsCount: 42,
    lastRun: '3 days ago'
  }
];

// Trigger types for workflow creation
const triggerTypes = [
  { id: 'new-lead', name: 'New Lead Created' },
  { id: 'lead-updated', name: 'Lead Updated' },
  { id: 'deal-stage-change', name: 'Deal Stage Changed' },
  { id: 'task-completed', name: 'Task Completed' },
  { id: 'email-opened', name: 'Email Opened' },
  { id: 'form-submitted', name: 'Form Submitted' },
  { id: 'time-based', name: 'Time-Based Trigger' },
  { id: 'no-activity', name: 'No Activity For Period' }
];

// Action types for workflow creation
const actionTypes = [
  { id: 'send-email', name: 'Send Email' },
  { id: 'create-task', name: 'Create Task' },
  { id: 'assign-lead', name: 'Assign Lead' },
  { id: 'update-field', name: 'Update Field' },
  { id: 'send-notification', name: 'Send Notification' },
  { id: 'add-tag', name: 'Add Tag' },
  { id: 'remove-tag', name: 'Remove Tag' },
  { id: 'create-activity', name: 'Log Activity' }
];

export default function WorkflowsPage() {
  const { user, tenant } = useAuth();
  const [selectedTab, setSelectedTab] = useState('active');
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    trigger: '',
    action: '',
    isActive: true
  });
  
  if (!user || !tenant) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please log in to view this page.</p>
      </div>
    );
  }
  
  const handleCreateWorkflow = () => {
    // In a real implementation, this would save the workflow to the database
    console.log('Creating workflow:', newWorkflow);
    
    // Reset form and exit creation mode
    setNewWorkflow({
      name: '',
      description: '',
      trigger: '',
      action: '',
      isActive: true
    });
    setIsCreating(false);
    
    // Show success message
    alert('Workflow created successfully!');
  };
  
  const toggleWorkflowStatus = (id: string, currentStatus: boolean) => {
    // In a real implementation, this would update the workflow status in the database
    console.log(`Toggling workflow ${id} from ${currentStatus ? 'active' : 'inactive'} to ${!currentStatus ? 'active' : 'inactive'}`);
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Workflow Automation</h2>
            <p className="text-muted-foreground">
              Create automated workflows triggered by events and actions.
            </p>
          </div>
          {!isCreating && (
            <Button onClick={() => setIsCreating(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Workflow
            </Button>
          )}
        </div>
        
        {isCreating ? (
          <Card>
            <CardHeader>
              <CardTitle>Create New Workflow</CardTitle>
              <CardDescription>
                Define triggers and actions for your automated workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Workflow Name</Label>
                <Input 
                  id="name" 
                  placeholder="Enter a name for your workflow" 
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow({...newWorkflow, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  placeholder="Briefly describe what this workflow does" 
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow({...newWorkflow, description: e.target.value})}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="trigger">Trigger</Label>
                <Select 
                  value={newWorkflow.trigger}
                  onValueChange={(value) => setNewWorkflow({...newWorkflow, trigger: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select what triggers this workflow" />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerTypes.map((trigger) => (
                      <SelectItem key={trigger.id} value={trigger.id}>
                        {trigger.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {newWorkflow.trigger && (
                <div className="p-4 bg-muted rounded-md">
                  <h4 className="font-medium mb-2">Trigger Conditions</h4>
                  <div className="space-y-4">
                    {newWorkflow.trigger === 'new-lead' && (
                      <>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="lead-source">Lead Source</Label>
                          <Select>
                            <SelectTrigger id="lead-source" className="w-[180px]">
                              <SelectValue placeholder="Any" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">Any</SelectItem>
                              <SelectItem value="website">Website</SelectItem>
                              <SelectItem value="referral">Referral</SelectItem>
                              <SelectItem value="email">Email Campaign</SelectItem>
                              <SelectItem value="social">Social Media</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                    
                    {newWorkflow.trigger === 'deal-stage-change' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="from-stage">From Stage</Label>
                            <Select>
                              <SelectTrigger id="from-stage">
                                <SelectValue placeholder="Any Stage" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="any">Any Stage</SelectItem>
                                <SelectItem value="lead">Lead</SelectItem>
                                <SelectItem value="qualified">Qualified</SelectItem>
                                <SelectItem value="proposal">Proposal</SelectItem>
                                <SelectItem value="negotiation">Negotiation</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="to-stage">To Stage</Label>
                            <Select>
                              <SelectTrigger id="to-stage">
                                <SelectValue placeholder="Select Stage" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="qualified">Qualified</SelectItem>
                                <SelectItem value="proposal">Proposal</SelectItem>
                                <SelectItem value="negotiation">Negotiation</SelectItem>
                                <SelectItem value="closed-won">Closed Won</SelectItem>
                                <SelectItem value="closed-lost">Closed Lost</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {newWorkflow.trigger === 'no-activity' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="time-period">Time Period</Label>
                          <div className="flex space-x-4">
                            <Input type="number" id="time-period" defaultValue="7" className="w-24" />
                            <Select defaultValue="days">
                              <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hours">Hours</SelectItem>
                                <SelectItem value="days">Days</SelectItem>
                                <SelectItem value="weeks">Weeks</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="action">Action</Label>
                <Select 
                  value={newWorkflow.action}
                  onValueChange={(value) => setNewWorkflow({...newWorkflow, action: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select what happens when triggered" />
                  </SelectTrigger>
                  <SelectContent>
                    {actionTypes.map((action) => (
                      <SelectItem key={action.id} value={action.id}>
                        {action.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {newWorkflow.action && (
                <div className="p-4 bg-muted rounded-md">
                  <h4 className="font-medium mb-2">Action Details</h4>
                  <div className="space-y-4">
                    {newWorkflow.action === 'send-email' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="email-template">Email Template</Label>
                          <Select>
                            <SelectTrigger id="email-template">
                              <SelectValue placeholder="Select template" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="welcome">Welcome Email</SelectItem>
                              <SelectItem value="follow-up">Follow-up</SelectItem>
                              <SelectItem value="meeting-request">Meeting Request</SelectItem>
                              <SelectItem value="thank-you">Thank You</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                    
                    {newWorkflow.action === 'create-task' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="task-name">Task Name</Label>
                          <Input id="task-name" placeholder="Follow up with lead" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="assignee">Assignee</Label>
                          <Select>
                            <SelectTrigger id="assignee">
                              <SelectValue placeholder="Select assignee" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="current-user">Current User</SelectItem>
                              <SelectItem value="lead-owner">Lead Owner</SelectItem>
                              <SelectItem value="team-lead">Team Lead</SelectItem>
                              <SelectItem value="sales-manager">Sales Manager</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="due-date">Due Date</Label>
                          <div className="flex space-x-4">
                            <Input type="number" id="due-date" defaultValue="2" className="w-24" />
                            <Select defaultValue="days">
                              <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hours">Hours</SelectItem>
                                <SelectItem value="days">Days</SelectItem>
                                <SelectItem value="weeks">Weeks</SelectItem>
                              </SelectContent>
                            </Select>
                            <span className="flex items-center">after trigger</span>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {newWorkflow.action === 'add-tag' && (
                      <div className="space-y-2">
                        <Label htmlFor="tag">Tag</Label>
                        <div className="flex space-x-2">
                          <Select>
                            <SelectTrigger id="tag">
                              <SelectValue placeholder="Select tag" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hot-lead">Hot Lead</SelectItem>
                              <SelectItem value="follow-up">Needs Follow-up</SelectItem>
                              <SelectItem value="vip">VIP</SelectItem>
                              <SelectItem value="churned">Churned</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="icon">
                            <PlusCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="workflow-active" 
                  checked={newWorkflow.isActive}
                  onCheckedChange={(checked) => setNewWorkflow({...newWorkflow, isActive: checked})}
                />
                <Label htmlFor="workflow-active">Activate workflow immediately</Label>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateWorkflow}>
                Create Workflow
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Tabs 
            defaultValue="active" 
            value={selectedTab}
            onValueChange={setSelectedTab}
            className="space-y-4"
          >
            <TabsList className="grid w-[400px] grid-cols-3">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="space-y-4">
              {activeWorkflows.map((workflow) => (
                <Card key={workflow.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl flex items-center">
                          {workflow.name}
                          {workflow.isActive ? (
                            <Badge className="ml-2 bg-green-600">Active</Badge>
                          ) : (
                            <Badge className="ml-2 bg-gray-400">Inactive</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{workflow.description}</CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant={workflow.isActive ? "destructive" : "default"} 
                          size="icon"
                          onClick={() => toggleWorkflowStatus(workflow.id, workflow.isActive)}
                        >
                          {workflow.isActive ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex flex-col space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start space-x-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <AlertTriangle className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Trigger</p>
                            <p className="text-sm text-muted-foreground">{workflow.trigger}</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Action</p>
                            <p className="text-sm text-muted-foreground">{workflow.action}</p>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Last run: {workflow.lastRun}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Total runs: {workflow.runsCount}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="ghost" size="sm" className="text-xs">
                      View Run History
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </TabsContent>
            
            <TabsContent value="templates" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {workflowTemplates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{template.title}</CardTitle>
                        <template.icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-between">
                      <Badge variant="outline">{template.category}</Badge>
                      <Button size="sm">
                        Use Template
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Workflow Run History</CardTitle>
                  <CardDescription>
                    View the execution history of your workflows
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center space-x-4">
                        <Check className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">High-Value Lead Assignment</p>
                          <p className="text-sm text-muted-foreground">Today at 2:45 PM</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-500">Success</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center space-x-4">
                        <Check className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">Follow-up Reminder</p>
                          <p className="text-sm text-muted-foreground">Today at 12:30 PM</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-500">Success</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center space-x-4">
                        <Check className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">Follow-up Reminder</p>
                          <p className="text-sm text-muted-foreground">Today at 10:15 AM</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-500">Success</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center space-x-4">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        <div>
                          <p className="font-medium">High-Value Lead Assignment</p>
                          <p className="text-sm text-muted-foreground">Yesterday at 4:12 PM</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-yellow-500">Warning</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-4">
                        <Check className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">Deal Stage Notification</p>
                          <p className="text-sm text-muted-foreground">April 24, 2024</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-500">Success</Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm">
                    View Full History
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
} 