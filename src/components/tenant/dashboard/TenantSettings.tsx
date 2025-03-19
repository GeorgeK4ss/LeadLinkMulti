import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { TenantService } from '@/lib/services/TenantService';
import { TenantSettings as ITenantSettings } from '@/types/tenant';

export function TenantSettings({ tenantId }: { tenantId: string }) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<ITenantSettings>({
    general: {
      tenantName: '',
      timezone: 'UTC',
      language: 'en',
      notificationsEnabled: true,
    },
    branding: {
      primaryColor: '#007AFF',
      logo: '',
      customDomain: '',
    },
    workflow: {
      autoAssignLeads: true,
      leadFollowUpDays: 3,
      requireLeadApproval: false,
      allowDuplicateLeads: false,
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      notifyOnNewLead: true,
      notifyOnLeadUpdate: true,
      dailyDigest: true,
    },
  });

  const tenantService = new TenantService();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Get the tenant data
        const tenant = await tenantService.getTenant(tenantId);
        if (tenant && tenant.settings) {
          setSettings(tenant.settings);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load tenant settings.',
          variant: 'destructive',
        });
      }
    };

    loadSettings();
  }, [tenantId, toast]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update the tenant with the new settings
      await tenantService.updateTenant(tenantId, { settings });
      toast({
        title: 'Success',
        description: 'Tenant settings updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update tenant settings.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="branding">Branding</TabsTrigger>
        <TabsTrigger value="workflow">Workflow</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenantName">Tenant Name</Label>
            <Input
              id="tenantName"
              value={settings.general.tenantName}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, tenantName: e.target.value },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              value={settings.general.timezone}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, timezone: e.target.value },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Input
              id="language"
              value={settings.general.language}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, language: e.target.value },
                })
              }
            />
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="branding">
        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primary Color</Label>
            <Input
              id="primaryColor"
              type="color"
              value={settings.branding.primaryColor}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  branding: { ...settings.branding, primaryColor: e.target.value },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customDomain">Custom Domain</Label>
            <Input
              id="customDomain"
              value={settings.branding.customDomain}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  branding: { ...settings.branding, customDomain: e.target.value },
                })
              }
            />
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="workflow">
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="autoAssignLeads">Auto-assign Leads</Label>
            <Switch
              id="autoAssignLeads"
              checked={settings.workflow.autoAssignLeads}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  workflow: { ...settings.workflow, autoAssignLeads: checked },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="leadFollowUpDays">Lead Follow-up Days</Label>
            <Input
              id="leadFollowUpDays"
              type="number"
              min="1"
              value={settings.workflow.leadFollowUpDays}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  workflow: {
                    ...settings.workflow,
                    leadFollowUpDays: parseInt(e.target.value),
                  },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="requireLeadApproval">Require Lead Approval</Label>
            <Switch
              id="requireLeadApproval"
              checked={settings.workflow.requireLeadApproval}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  workflow: { ...settings.workflow, requireLeadApproval: checked },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="allowDuplicateLeads">Allow Duplicate Leads</Label>
            <Switch
              id="allowDuplicateLeads"
              checked={settings.workflow.allowDuplicateLeads}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  workflow: { ...settings.workflow, allowDuplicateLeads: checked },
                })
              }
            />
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="notifications">
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="emailNotifications">Email Notifications</Label>
            <Switch
              id="emailNotifications"
              checked={settings.notifications.emailNotifications}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  notifications: {
                    ...settings.notifications,
                    emailNotifications: checked,
                  },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="smsNotifications">SMS Notifications</Label>
            <Switch
              id="smsNotifications"
              checked={settings.notifications.smsNotifications}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  notifications: {
                    ...settings.notifications,
                    smsNotifications: checked,
                  },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="notifyOnNewLead">Notify on New Lead</Label>
            <Switch
              id="notifyOnNewLead"
              checked={settings.notifications.notifyOnNewLead}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  notifications: {
                    ...settings.notifications,
                    notifyOnNewLead: checked,
                  },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="notifyOnLeadUpdate">Notify on Lead Update</Label>
            <Switch
              id="notifyOnLeadUpdate"
              checked={settings.notifications.notifyOnLeadUpdate}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  notifications: {
                    ...settings.notifications,
                    notifyOnLeadUpdate: checked,
                  },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="dailyDigest">Daily Digest</Label>
            <Switch
              id="dailyDigest"
              checked={settings.notifications.dailyDigest}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  notifications: {
                    ...settings.notifications,
                    dailyDigest: checked,
                  },
                })
              }
            />
          </div>
        </Card>
      </TabsContent>

      <div className="mt-6">
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </Tabs>
  );
} 