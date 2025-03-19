import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { LeadService } from '@/lib/services/LeadService';
import { Lead, LeadStatus, LeadSource, LeadPriority, LeadCompany } from '@/types/lead';

interface LeadFormProps {
  tenantId: string;
  leadId?: string;
  onSuccess?: (leadId: string) => void;
  onCancel?: () => void;
}

export function LeadForm({ tenantId, leadId, onSuccess, onCancel }: LeadFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Lead>>({
    contact: {
      name: '',
      email: '',
      phone: '',
      jobTitle: '',
      department: '',
    },
    company: {
      name: '',
      website: '',
      industry: '',
      size: '',
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      },
    },
    status: 'new',
    source: 'website',
    priority: 'medium',
    value: 0,
    tags: [],
  });

  const leadService = new LeadService(tenantId);

  // Load lead data if editing existing lead
  useEffect(() => {
    const fetchLead = async () => {
      if (!leadId) return;

      setIsLoading(true);
      try {
        const lead = await leadService.getLead(leadId);
        if (lead) {
          // Ensure company and address are properly initialized
          const updatedLead: Partial<Lead> = {
            ...lead,
            company: lead.company || {
              name: '',
              address: {}
            }
          };
          setFormData(updatedLead);
        }
      } catch (error) {
        console.error('Error fetching lead:', error);
        toast({
          title: 'Error',
          description: 'Failed to load lead data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLead();
  }, [leadId, tenantId, toast]);

  const handleContactChange = (
    field: string,
    value: string
  ) => {
    setFormData((prev) => {
      // Create a deep copy to avoid type issues
      const updatedData = { ...prev };
      
      // Ensure contact exists
      if (!updatedData.contact) {
        updatedData.contact = { name: '', email: '' };
      }
      
      // Set the field value
      (updatedData.contact as any)[field] = value;
      
      return updatedData;
    });
  };

  const handleCompanyChange = (
    field: string,
    value: string
  ) => {
    setFormData((prev) => {
      // Create a deep copy to avoid type issues
      const updatedData = { ...prev };
      
      // Ensure company exists
      if (!updatedData.company) {
        updatedData.company = { name: '' };
      }
      
      // Set the field value
      (updatedData.company as any)[field] = value;
      
      return updatedData;
    });
  };

  const handleCompanyAddressChange = (
    field: string,
    value: string
  ) => {
    setFormData((prev) => {
      // Create a deep copy to avoid type issues
      const updatedData = { ...prev };
      
      // Ensure company exists
      if (!updatedData.company) {
        updatedData.company = { name: '' };
      }
      
      // Ensure address exists
      if (!updatedData.company.address) {
        updatedData.company.address = {};
      }
      
      // Set the field value
      (updatedData.company.address as any)[field] = value;
      
      return updatedData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (leadId) {
        // Update existing lead
        await leadService.updateLead(leadId, formData);
        toast({
          title: 'Lead updated',
          description: 'Lead has been updated successfully.',
        });
        onSuccess?.(leadId);
      } else {
        // Create new lead
        const id = await leadService.createLead(formData as Omit<Lead, 'id' | 'createdAt' | 'lastUpdated'>);
        toast({
          title: 'Lead created',
          description: 'New lead has been created successfully.',
        });
        onSuccess?.(id);
      }
    } catch (error) {
      console.error('Error saving lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to save lead. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Tabs defaultValue="contact" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="contact">Contact Information</TabsTrigger>
            <TabsTrigger value="company">Company Information</TabsTrigger>
            <TabsTrigger value="details">Lead Details</TabsTrigger>
          </TabsList>

          <TabsContent value="contact">
            <Card className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Name *</Label>
                <Input
                  id="contactName"
                  required
                  value={formData.contact?.name || ''}
                  onChange={(e) => handleContactChange('name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  required
                  value={formData.contact?.email || ''}
                  onChange={(e) => handleContactChange('email', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Phone</Label>
                <Input
                  id="contactPhone"
                  value={formData.contact?.phone || ''}
                  onChange={(e) => handleContactChange('phone', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactJobTitle">Job Title</Label>
                <Input
                  id="contactJobTitle"
                  value={formData.contact?.jobTitle || ''}
                  onChange={(e) => handleContactChange('jobTitle', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactDepartment">Department</Label>
                <Input
                  id="contactDepartment"
                  value={formData.contact?.department || ''}
                  onChange={(e) => handleContactChange('department', e.target.value)}
                />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="company">
            <Card className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={formData.company?.name || ''}
                  onChange={(e) => handleCompanyChange('name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyWebsite">Website</Label>
                <Input
                  id="companyWebsite"
                  type="url"
                  value={formData.company?.website || ''}
                  onChange={(e) => handleCompanyChange('website', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyIndustry">Industry</Label>
                <Input
                  id="companyIndustry"
                  value={formData.company?.industry || ''}
                  onChange={(e) => handleCompanyChange('industry', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companySize">Company Size</Label>
                <Input
                  id="companySize"
                  value={formData.company?.size || ''}
                  onChange={(e) => handleCompanyChange('size', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={formData.company?.address?.street || ''}
                  onChange={(e) => handleCompanyAddressChange('street', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.company?.address?.city || ''}
                    onChange={(e) => handleCompanyAddressChange('city', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={formData.company?.address?.state || ''}
                    onChange={(e) => handleCompanyAddressChange('state', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.company?.address?.postalCode || ''}
                    onChange={(e) => handleCompanyAddressChange('postalCode', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.company?.address?.country || ''}
                    onChange={(e) => handleCompanyAddressChange('country', e.target.value)}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="details">
            <Card className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: LeadStatus) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Source *</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value: LeadSource) =>
                    setFormData({ ...formData, source: value })
                  }
                >
                  <SelectTrigger id="source">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="cold_call">Cold Call</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="email_campaign">Email Campaign</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: LeadPriority) =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">Estimated Value</Label>
                <Input
                  id="value"
                  type="number"
                  min="0"
                  value={formData.value || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags?.join(', ') || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tags: e.target.value
                        .split(',')
                        .map((tag) => tag.trim())
                        .filter((tag) => tag.length > 0),
                    })
                  }
                />
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : leadId ? 'Update Lead' : 'Create Lead'}
          </Button>
        </div>
      </div>
    </form>
  );
} 