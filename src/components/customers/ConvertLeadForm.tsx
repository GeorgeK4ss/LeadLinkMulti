import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { CustomerService } from '@/lib/services/CustomerService';
import { LeadService } from '@/lib/services/LeadService';
import { Lead, LeadStatus } from '@/types/lead';
import { CustomerCategory } from '@/types/customer';

interface ConvertLeadFormProps {
  tenantId: string;
  onSuccess: (customerId: string) => void;
  onCancel: () => void;
}

export function ConvertLeadForm({ tenantId, onSuccess, onCancel }: ConvertLeadFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<CustomerCategory>('small_business');
  
  const customerService = new CustomerService();
  const leadService = new LeadService(tenantId);
  
  useEffect(() => {
    async function loadLeads() {
      setIsLoading(true);
      try {
        // Get leads that haven't been converted yet
        const allLeads = await leadService.getLeads();
        const unconvertedLeads = allLeads.filter(lead => 
          !lead.convertedToCustomerId && 
          lead.status !== 'lost'
        );
        setLeads(unconvertedLeads);
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
    }
    
    loadLeads();
  }, [leadService, toast]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLeadId) {
      toast({
        title: 'Error',
        description: 'Please select a lead to convert',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const customerId = await customerService.convertLeadToCustomer(tenantId, selectedLeadId, {
        category: selectedCategory
      });
      
      toast({
        title: 'Lead Converted',
        description: 'Successfully converted lead to customer',
      });
      
      onSuccess(customerId);
    } catch (error) {
      console.error('Error converting lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to convert lead to customer',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getStatusDisplay = (status: LeadStatus) => {
    const statusMap: Record<LeadStatus, string> = {
      new: 'New',
      contacted: 'Contacted',
      qualified: 'Qualified',
      proposal: 'Proposal',
      closed: 'Closed',
      lost: 'Lost'
    };
    
    return statusMap[status] || 'Unknown';
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isLoading ? (
        <div className="py-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading leads...</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-muted-foreground">No leads available for conversion</p>
          <p className="text-sm text-muted-foreground mt-1">
            All leads have either been converted or marked as lost/disqualified
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="leadId">Select Lead</Label>
            <Select
              value={selectedLeadId}
              onValueChange={setSelectedLeadId}
            >
              <SelectTrigger id="leadId">
                <SelectValue placeholder="Select a lead to convert" />
              </SelectTrigger>
              <SelectContent>
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.contact.name} - {lead.company?.name ? `${lead.company.name} - ` : ''}
                    {getStatusDisplay(lead.status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Customer Category</Label>
            <Select
              value={selectedCategory}
              onValueChange={(value) => setSelectedCategory(value as CustomerCategory)}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
                <SelectItem value="mid_market">Mid Market</SelectItem>
                <SelectItem value="small_business">Small Business</SelectItem>
                <SelectItem value="startup">Startup</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedLeadId}>
              {isSubmitting ? 'Converting...' : 'Convert to Customer'}
            </Button>
          </div>
        </>
      )}
    </form>
  );
} 