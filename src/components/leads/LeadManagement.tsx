import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { LeadService } from '@/lib/services/LeadService';
import { Lead, LeadStatus } from '@/types/lead';
import { LeadForm } from './LeadForm';
import type { DateRange } from '@/lib/types/date';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileEntityList } from '@/components/ui/mobile-entity-list';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Edit, Trash2, Phone, Mail, Building } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface LeadManagementProps {
  tenantId: string;
  dateRange?: DateRange;
}

export function LeadManagement({ tenantId, dateRange }: LeadManagementProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const isMobile = useIsMobile();

  const leadService = new LeadService(tenantId);

  const loadLeads = async () => {
    setIsLoading(true);
    try {
      let fetchedLeads: Lead[];

      if (dateRange && dateRange.from && dateRange.to) {
        fetchedLeads = await leadService.getLeadsByDateRange(dateRange.from, dateRange.to);
      } else if (filterStatus !== 'all') {
        fetchedLeads = await leadService.getLeadsByStatus(filterStatus);
      } else {
        fetchedLeads = await leadService.getLeads();
      }

      setLeads(fetchedLeads);
    } catch (error) {
      console.error('Error loading leads:', error);
      toast({
        title: 'Error',
        description: 'Failed to load leads. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [tenantId, filterStatus, dateRange]);

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await leadService.updateLeadStatus(leadId, newStatus);
      
      // Update the lead in the local state
      setLeads(leads.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus, lastUpdated: new Date().toISOString() } : lead
      ));
      
      toast({
        title: 'Status updated',
        description: 'Lead status has been updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update lead status',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;

    try {
      await leadService.deleteLead(leadId);
      
      // Remove the lead from the local state
      setLeads(leads.filter(lead => lead.id !== leadId));
      
      toast({
        title: 'Lead deleted',
        description: 'Lead has been deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete lead',
        variant: 'destructive',
      });
    }
  };

  const handleEditLead = (leadId: string) => {
    setSelectedLead(leadId);
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleAddNewLead = () => {
    setSelectedLead(null);
    setIsEditMode(false);
    setIsFormOpen(true);
  };

  const handleFormSuccess = (leadId: string) => {
    setIsFormOpen(false);
    loadLeads();
    toast({
      title: isEditMode ? 'Lead updated' : 'Lead created',
      description: isEditMode
        ? 'Lead has been updated successfully'
        : 'New lead has been created successfully',
    });
  };

  const getStatusBadgeVariant = (status: LeadStatus) => {
    switch (status) {
      case 'new': return 'default';
      case 'contacted': return 'secondary';
      case 'qualified': return 'secondary';
      case 'proposal': return 'outline';
      case 'closed': return 'default';
      case 'lost': return 'destructive';
      default: return 'default';
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = searchTerm === '' || 
      lead.contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Lead fields for mobile entity list
  const leadFields = [
    { 
      key: 'contact.name', 
      label: 'Name', 
      priority: 'high' as const,
    },
    { 
      key: 'contact.email', 
      label: 'Email', 
      priority: 'medium' as const,
    },
    {
      key: 'company.name',
      label: 'Company',
      priority: 'medium' as const,
      render: (value: string | undefined, lead: Lead) => (
        <span>{value || '-'}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      badge: true,
      render: (value: LeadStatus, lead: Lead) => (
        <Badge variant={getStatusBadgeVariant(value)}>
          {value}
        </Badge>
      )
    },
    {
      key: 'source',
      label: 'Source',
      render: (value: string, lead: Lead) => (
        <span className="capitalize">{value.replace('_', ' ')}</span>
      )
    },
    {
      key: 'value',
      label: 'Value',
      format: 'currency' as const,
      render: (value: number | undefined, lead: Lead) => (
        <span>{value ? `$${value.toLocaleString()}` : '-'}</span>
      )
    },
    {
      key: 'createdAt',
      label: 'Created',
      format: 'date' as const
    }
  ];

  // Lead actions for mobile entity list
  const leadActions = [
    {
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: (lead: Lead) => handleEditLead(lead.id),
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive' as const,
      onClick: (lead: Lead) => handleDeleteLead(lead.id),
    }
  ];

  // Function to get lead avatar
  const getLeadAvatar = (lead: Lead) => {
    return (
      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-primary/10 text-primary">
          {lead.contact.name.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    );
  };

  // Function to get lead badge
  const getLeadBadge = (lead: Lead) => {
    const variant = getStatusBadgeVariant(lead.status);
    return (
      <Badge variant={variant}>
        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Lead Management</h2>
        <Button onClick={handleAddNewLead}>Add New Lead</Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="w-full md:w-auto">
          <Input
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select 
          value={filterStatus} 
          onValueChange={(value: LeadStatus | 'all') => setFilterStatus(value)}
        >
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="proposal">Proposal</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Loading leads...</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-muted-foreground mb-4">No leads found.</p>
            <Button onClick={handleAddNewLead}>Add New Lead</Button>
          </CardContent>
        </Card>
      ) : isMobile ? (
        // Mobile view
        <MobileEntityList
          entities={filteredLeads}
          fields={leadFields}
          keyField="id"
          actions={leadActions}
          statusField="status"
          loading={isLoading}
          emptyMessage="No leads found matching your criteria"
          onRowClick={lead => handleEditLead(lead.id)}
          getEntityAvatar={getLeadAvatar}
          getEntityBadge={getLeadBadge}
        />
      ) : (
        // Desktop table view
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{lead.contact.name}</div>
                    <div className="text-sm text-muted-foreground">{lead.contact.email}</div>
                  </div>
                </TableCell>
                <TableCell>{lead.company?.name || '-'}</TableCell>
                <TableCell>
                  <Select
                    value={lead.status}
                    onValueChange={(value: LeadStatus) => handleStatusChange(lead.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue>
                        <Badge variant={getStatusBadgeVariant(lead.status)}>
                          {lead.status}
                        </Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="capitalize">{lead.source.replace('_', ' ')}</TableCell>
                <TableCell>{lead.value ? `$${lead.value.toLocaleString()}` : '-'}</TableCell>
                <TableCell>{new Date(lead.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditLead(lead.id)}>
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteLead(lead.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
          </DialogHeader>
          <LeadForm
            tenantId={tenantId}
            leadId={selectedLead || undefined}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 