import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import type { DateRange } from '@/lib/types/date';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'closed' | 'lost';
  assignedTo: string;
  createdAt: string;
  lastUpdated: string;
}

interface TenantLeadsProps {
  dateRange: DateRange;
}

export function TenantLeads({ dateRange }: TenantLeadsProps) {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([
    {
      id: '1',
      name: 'Acme Corp',
      email: 'contact@acme.com',
      phone: '+1 234 567 8900',
      status: 'new',
      assignedTo: 'John Doe',
      createdAt: '2024-03-14T10:30:00Z',
      lastUpdated: '2024-03-14T10:30:00Z',
    },
    // Add more mock leads here
  ]);

  const [filterStatus, setFilterStatus] = useState<Lead['status'] | 'all'>('all');

  const handleStatusChange = async (leadId: string, newStatus: Lead['status']) => {
    try {
      // TODO: Implement actual status change logic
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

  const filteredLeads = filterStatus === 'all'
    ? leads
    : leads.filter(lead => lead.status === filterStatus);

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'new': return 'default';
      case 'contacted': return 'secondary';
      case 'qualified': return 'info';
      case 'proposal': return 'warning';
      case 'closed': return 'success';
      case 'lost': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Lead Management</h2>
        <div className="flex gap-4">
          <Select value={filterStatus} onValueChange={(value: Lead['status'] | 'all') => setFilterStatus(value)}>
            <SelectTrigger className="w-40">
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
          <Button>Add New Lead</Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredLeads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="font-medium">{lead.name}</TableCell>
              <TableCell>
                <div className="text-sm">
                  <div>{lead.email}</div>
                  <div className="text-gray-500">{lead.phone}</div>
                </div>
              </TableCell>
              <TableCell>
                <Select
                  value={lead.status}
                  onValueChange={(value: Lead['status']) => handleStatusChange(lead.id, value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
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
              <TableCell>{lead.assignedTo}</TableCell>
              <TableCell>{new Date(lead.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>{new Date(lead.lastUpdated).toLocaleDateString()}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm">View Details</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 