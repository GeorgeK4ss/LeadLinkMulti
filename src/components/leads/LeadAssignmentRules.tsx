import React, { useState, useEffect } from 'react';
import { useToast } from '../../components/ui/use-toast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '../../components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell,
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '../../components/ui/card';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '../../components/ui/form';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { Checkbox } from '../../components/ui/checkbox';
import { Textarea } from '../../components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { LeadAssignmentService, AssignmentRule } from '../../lib/services/LeadAssignmentService';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface LeadAssignmentRulesProps {
  tenantId: string;
}

// Lead sources options
const leadSourceOptions = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'event', label: 'Event' },
  { value: 'email_campaign', label: 'Email Campaign' },
  { value: 'partner', label: 'Partner' },
  { value: 'other', label: 'Other' },
];

// Lead status options
const leadStatusOptions = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'closed', label: 'Closed' },
  { value: 'lost', label: 'Lost' },
];

// Role options
const roleOptions = [
  { value: 'tenant_admin', label: 'Tenant Admin' },
  { value: 'tenant_manager', label: 'Tenant Manager' },
  { value: 'tenant_agent', label: 'Tenant Agent' },
];

// Form schema
const formSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  criteria: z.object({
    leadSources: z.array(z.string()).optional(),
    leadStatus: z.array(z.string()).optional(),
    minLeadScore: z.number().min(0).max(100).optional(),
    territory: z.array(z.string()).optional(),
    industry: z.array(z.string()).optional(),
    companySize: z.array(z.string()).optional(),
  }),
  assignTo: z.object({
    userIds: z.array(z.string()).optional(),
    roles: z.array(z.string()).optional(),
    roundRobin: z.boolean().default(true),
    maxLeadsPerUser: z.number().min(0).optional(),
  }),
  priority: z.number().min(1).default(10),
});

type FormValues = z.infer<typeof formSchema>;

export function LeadAssignmentRules({ tenantId }: LeadAssignmentRulesProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<AssignmentRule[]>([]);
  const [open, setOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AssignmentRule | null>(null);
  const [assignmentInProgress, setAssignmentInProgress] = useState(false);
  
  const leadAssignmentService = new LeadAssignmentService();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      isActive: true,
      criteria: {
        leadSources: [],
        leadStatus: [],
        minLeadScore: 0,
        territory: [],
        industry: [],
        companySize: [],
      },
      assignTo: {
        userIds: [],
        roles: [],
        roundRobin: true,
        maxLeadsPerUser: 0,
      },
      priority: 10,
    },
  });
  
  useEffect(() => {
    loadRules();
  }, [tenantId]);
  
  const loadRules = async () => {
    setLoading(true);
    try {
      const rulesData = await leadAssignmentService.getAssignmentRules(tenantId);
      setRules(rulesData);
    } catch (error) {
      console.error('Error loading assignment rules:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assignment rules. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = (rule: AssignmentRule) => {
    setEditingRule(rule);
    form.reset({
      name: rule.name,
      description: rule.description || '',
      isActive: rule.isActive,
      criteria: {
        leadSources: rule.criteria.leadSources || [],
        leadStatus: rule.criteria.leadStatus || [],
        minLeadScore: rule.criteria.minLeadScore || 0,
        territory: rule.criteria.territory || [],
        industry: rule.criteria.industry || [],
        companySize: rule.criteria.companySize || [],
      },
      assignTo: {
        userIds: rule.assignTo.userIds || [],
        roles: rule.assignTo.roles || [],
        roundRobin: rule.assignTo.roundRobin,
        maxLeadsPerUser: rule.assignTo.maxLeadsPerUser || 0,
      },
      priority: rule.priority,
    });
    setOpen(true);
  };
  
  const handleCreate = () => {
    setEditingRule(null);
    form.reset({
      name: '',
      description: '',
      isActive: true,
      criteria: {
        leadSources: [],
        leadStatus: [],
        minLeadScore: 0,
        territory: [],
        industry: [],
        companySize: [],
      },
      assignTo: {
        userIds: [],
        roles: [],
        roundRobin: true,
        maxLeadsPerUser: 0,
      },
      priority: 10,
    });
    setOpen(true);
  };
  
  const handleDelete = async (ruleId: string) => {
    try {
      await leadAssignmentService.deleteAssignmentRule(tenantId, ruleId);
      
      // Update local state
      setRules(prevRules => prevRules.map(rule => 
        rule.id === ruleId 
          ? { ...rule, isActive: false } 
          : rule
      ));
      
      toast({
        title: 'Success',
        description: 'Assignment rule deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting assignment rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete assignment rule. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const handleToggleActive = async (rule: AssignmentRule) => {
    try {
      await leadAssignmentService.updateAssignmentRule(tenantId, rule.id, { 
        isActive: !rule.isActive 
      });
      
      // Update local state
      setRules(prevRules => prevRules.map(r => 
        r.id === rule.id 
          ? { ...r, isActive: !r.isActive } 
          : r
      ));
      
      toast({
        title: 'Success',
        description: `Rule ${!rule.isActive ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (error) {
      console.error('Error updating rule status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update rule status. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const onSubmit = async (data: FormValues) => {
    try {
      if (editingRule) {
        // Update existing rule
        await leadAssignmentService.updateAssignmentRule(tenantId, editingRule.id, data);
        
        // Update local state
        setRules(prevRules => prevRules.map(rule => 
          rule.id === editingRule.id 
            ? { ...rule, ...data, lastUpdated: new Date().toISOString() } 
            : rule
        ));
        
        toast({
          title: 'Success',
          description: 'Assignment rule updated successfully.',
        });
      } else {
        // Create new rule
        const newRuleId = await leadAssignmentService.createAssignmentRule(tenantId, data as any);
        
        // Update local state
        const newRule: AssignmentRule = {
          id: newRuleId,
          ...data,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        } as AssignmentRule;
        
        setRules(prevRules => [...prevRules, newRule]);
        
        toast({
          title: 'Success',
          description: 'Assignment rule created successfully.',
        });
      }
      
      setOpen(false);
    } catch (error) {
      console.error('Error saving assignment rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to save assignment rule. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const handleRunAssignment = async () => {
    setAssignmentInProgress(true);
    try {
      const results = await leadAssignmentService.autoAssignAllLeads(tenantId);
      
      const successCount = results.filter(r => r.success).length;
      
      toast({
        title: 'Assignment Complete',
        description: `Successfully assigned ${successCount} of ${results.length} leads.`,
      });
    } catch (error) {
      console.error('Error assigning leads:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign leads. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setAssignmentInProgress(false);
    }
  };
  
  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading assignment rules...</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Lead Assignment Rules</h2>
          <p className="text-muted-foreground">Configure how leads are automatically assigned to users in your system.</p>
        </div>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            onClick={handleRunAssignment} 
            disabled={assignmentInProgress}
          >
            {assignmentInProgress ? 'Assigning...' : 'Run Assignment'}
          </Button>
          <Button onClick={handleCreate}>Create Rule</Button>
        </div>
      </div>
      
      {rules.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="mb-2">No assignment rules found.</p>
            <p className="text-muted-foreground mb-4">
              Create your first rule to start automatically assigning leads to your team.
            </p>
            <Button onClick={handleCreate}>Create Rule</Button>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Name</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Criteria</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell className="font-medium">
                  {rule.name}
                  {rule.description && (
                    <div className="text-xs text-muted-foreground mt-1">{rule.description}</div>
                  )}
                </TableCell>
                <TableCell>{rule.priority}</TableCell>
                <TableCell>
                  {rule.criteria.leadSources && rule.criteria.leadSources.length > 0 && (
                    <div className="text-xs mb-1">
                      <span className="font-medium">Sources:</span> {rule.criteria.leadSources.join(', ')}
                    </div>
                  )}
                  {rule.criteria.leadStatus && rule.criteria.leadStatus.length > 0 && (
                    <div className="text-xs mb-1">
                      <span className="font-medium">Status:</span> {rule.criteria.leadStatus.join(', ')}
                    </div>
                  )}
                  {rule.criteria.minLeadScore !== undefined && rule.criteria.minLeadScore > 0 && (
                    <div className="text-xs mb-1">
                      <span className="font-medium">Min Score:</span> {rule.criteria.minLeadScore}
                    </div>
                  )}
                  {rule.criteria.industry && rule.criteria.industry.length > 0 && (
                    <div className="text-xs mb-1">
                      <span className="font-medium">Industry:</span> {rule.criteria.industry.join(', ')}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {rule.assignTo.roles && rule.assignTo.roles.length > 0 && (
                    <div className="text-xs mb-1">
                      <span className="font-medium">Roles:</span> {rule.assignTo.roles.join(', ')}
                    </div>
                  )}
                  {rule.assignTo.userIds && rule.assignTo.userIds.length > 0 && (
                    <div className="text-xs mb-1">
                      <span className="font-medium">Specific Users:</span> {rule.assignTo.userIds.length} users
                    </div>
                  )}
                  <div className="text-xs mb-1">
                    <span className="font-medium">Method:</span> {rule.assignTo.roundRobin ? 'Round Robin' : 'First Available'}
                  </div>
                  {rule.assignTo.maxLeadsPerUser !== undefined && rule.assignTo.maxLeadsPerUser > 0 && (
                    <div className="text-xs">
                      <span className="font-medium">Max per User:</span> {rule.assignTo.maxLeadsPerUser}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleToggleActive(rule)}
                  >
                    {rule.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleEdit(rule)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDelete(rule.id)}
                    className="text-destructive"
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit Assignment Rule' : 'Create Assignment Rule'}</DialogTitle>
            <DialogDescription>
              Configure how leads are automatically assigned to users based on specific criteria.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  {/* Basic Information */}
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rule Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter rule name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority (lower number = higher priority)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              {...field} 
                              onChange={e => field.onChange(parseInt(e.target.value))} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Optional description of this rule" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Rule Status</FormLabel>
                        <FormDescription>
                          This rule will only be applied if active.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {/* Assignment Criteria Section */}
                <div className="border rounded-md p-4 space-y-4">
                  <h3 className="text-lg font-medium">Criteria</h3>
                  <p className="text-sm text-muted-foreground">
                    Define criteria that leads must match to be assigned using this rule.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="criteria.leadSources"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lead Sources</FormLabel>
                          <FormControl>
                            <Select 
                              value={field.value ? field.value[0] : undefined}
                              onValueChange={(value) => {
                                field.onChange(value ? [value] : []);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select sources" />
                              </SelectTrigger>
                              <SelectContent>
                                {leadSourceOptions.map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription>
                            Leave empty to match all sources.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="criteria.leadStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lead Status</FormLabel>
                          <FormControl>
                            <Select 
                              value={field.value ? field.value[0] : undefined}
                              onValueChange={(value) => {
                                field.onChange(value ? [value] : []);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                {leadStatusOptions.map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription>
                            Leave empty to match all statuses.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="criteria.minLeadScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Lead Score</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0} 
                            max={100} 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value))} 
                          />
                        </FormControl>
                        <FormDescription>
                          Only assign leads with at least this score. Set to 0 to ignore.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Assignment Target Section */}
                <div className="border rounded-md p-4 space-y-4">
                  <h3 className="text-lg font-medium">Assignment Target</h3>
                  <p className="text-sm text-muted-foreground">
                    Define which users should receive leads that match the criteria.
                  </p>
                  
                  <FormField
                    control={form.control}
                    name="assignTo.roles"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign to Roles</FormLabel>
                        <FormControl>
                          <Select 
                            value={field.value ? field.value[0] : undefined}
                            onValueChange={(value) => {
                              field.onChange(value ? [value] : []);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select roles" />
                            </SelectTrigger>
                            <SelectContent>
                              {roleOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          Assign leads to users with these roles.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="assignTo.roundRobin"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Round Robin Assignment</FormLabel>
                          <FormDescription>
                            Distribute leads evenly among eligible users.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="assignTo.maxLeadsPerUser"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Leads Per User</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0} 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value))} 
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum number of active leads a user can have. Set to 0 for no limit.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 