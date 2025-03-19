"use client";

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { 
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table';
import { 
  Calendar, 
  MoreVertical, 
  Plus, 
  Search, 
  Phone, 
  Mail
} from 'lucide-react';
import { 
  OrderByDirection, 
  QueryConstraint, 
  collection, 
  doc, 
  orderBy, 
  updateDoc, 
  where 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRealtimeTenantCollection } from '@/hooks/useRealtimeTenantCollection';

// Lead type definitions
type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted';
type LeadSource = 'website' | 'referral' | 'marketing' | 'social_media' | 'event' | 'other';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  status: LeadStatus;
  source: LeadSource;
  notes?: string;
  tenantId: string;
  assignedTo?: string;
  estimatedValue?: number;
  lastContactDate?: string;
  nextContactDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface RealTimeLeadListProps {
  tenantId: string;
  userId?: string;
  onCreateLead?: () => void;
  onViewLead?: (leadId: string) => void;
  onEditLead?: (leadId: string) => void;
}

export function RealTimeLeadList({ 
  tenantId, 
  userId, 
  onCreateLead, 
  onViewLead, 
  onEditLead 
}: RealTimeLeadListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<LeadSource | 'all'>('all');
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<OrderByDirection>('desc');

  // Create query constraints based on filters
  const constraints: QueryConstraint[] = [
    orderBy(sortField, sortDirection)
  ];
  
  // Add assignment filter if userId is provided
  if (userId) {
    constraints.push(where('assignedTo', '==', userId));
  }
  
  // Get real-time data from Firestore
  const { data: leads, loading, error } = useRealtimeTenantCollection<Lead>(
    'leads',
    tenantId,
    constraints
  );

  // Filter leads client-side based on search and filters
  const filteredLeads = leads.filter(lead => {
    // Apply status filter
    if (statusFilter !== 'all' && lead.status !== statusFilter) {
      return false;
    }
    
    // Apply source filter
    if (sourceFilter !== 'all' && lead.source !== sourceFilter) {
      return false;
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return lead.firstName.toLowerCase().includes(query) || 
        lead.lastName.toLowerCase().includes(query) || 
        lead.email.toLowerCase().includes(query) ||
        (lead.company?.toLowerCase().includes(query) || false);
    }
    
    return true;
  });

  // Get status badge color
  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'new':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">New</Badge>;
      case 'contacted':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Contacted</Badge>;
      case 'qualified':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Qualified</Badge>;
      case 'unqualified':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Unqualified</Badge>;
      case 'converted':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Converted</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Get lead source badge
  const getSourceBadge = (source: LeadSource) => {
    switch (source) {
      case 'website':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Website</Badge>;
      case 'referral':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Referral</Badge>;
      case 'marketing':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Marketing</Badge>;
      case 'social_media':
        return <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">Social Media</Badge>;
      case 'event':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Event</Badge>;
      case 'other':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Other</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Format date to local string
  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString();
  };

  // Format currency
  const formatCurrency = (value?: number) => {
    if (value === undefined) return '—';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Update lead status
  const updateLeadStatus = async (leadId: string, newStatus: LeadStatus) => {
    try {
      const leadRef = doc(db, 'leads', leadId);
      await updateDoc(leadRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Lead Management</CardTitle>
            <CardDescription>View and manage your leads in real-time</CardDescription>
          </div>
          <Button onClick={onCreateLead}>
            <Plus className="mr-2 h-4 w-4" /> Add Lead
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
                placeholder="Search leads..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as LeadStatus | 'all')}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="unqualified">Unqualified</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={sourceFilter}
                onValueChange={(value) => setSourceFilter(value as LeadSource | 'all')}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Leads table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Est. Value</TableHead>
                  <TableHead>Next Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Loading leads...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-red-500">
                      Error loading leads: {error.message}
                    </TableCell>
                  </TableRow>
                ) : filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No leads found. Try adjusting your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">
                        {lead.firstName} {lead.lastName}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center">
                            <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{lead.email}</span>
                          </div>
                          {lead.phone && (
                            <div className="flex items-center">
                              <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{lead.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {lead.company && (
                          <div className="font-medium">{lead.company}</div>
                        )}
                        {lead.title && (
                          <div className="text-sm text-muted-foreground">{lead.title}</div>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(lead.status)}</TableCell>
                      <TableCell>{getSourceBadge(lead.source)}</TableCell>
                      <TableCell>{formatCurrency(lead.estimatedValue)}</TableCell>
                      <TableCell>
                        {lead.nextContactDate ? (
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                            {formatDate(lead.nextContactDate)}
                          </div>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onViewLead && onViewLead(lead.id)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEditLead && onEditLead(lead.id)}>
                              Edit Lead
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {lead.status !== 'contacted' && (
                              <DropdownMenuItem onClick={() => updateLeadStatus(lead.id, 'contacted')}>
                                Mark as Contacted
                              </DropdownMenuItem>
                            )}
                            {lead.status !== 'qualified' && (
                              <DropdownMenuItem onClick={() => updateLeadStatus(lead.id, 'qualified')}>
                                Mark as Qualified
                              </DropdownMenuItem>
                            )}
                            {lead.status !== 'unqualified' && (
                              <DropdownMenuItem onClick={() => updateLeadStatus(lead.id, 'unqualified')}>
                                Mark as Unqualified
                              </DropdownMenuItem>
                            )}
                            {lead.status !== 'converted' && (
                              <DropdownMenuItem onClick={() => updateLeadStatus(lead.id, 'converted')}>
                                Convert to Customer
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