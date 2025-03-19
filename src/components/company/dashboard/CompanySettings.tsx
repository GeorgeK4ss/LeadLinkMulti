import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface CompanySettings {
  general: {
    companyName: string;
    address: string;
    phone: string;
    website: string;
    taxId: string;
  };
  billing: {
    billingEmail: string;
    paymentMethod: string;
    billingAddress: string;
    billingCycle: 'monthly' | 'annually';
    autoRenew: boolean;
  };
  branding: {
    primaryColor: string;
    logo: string;
    customDomain: string;
  };
  preferences: {
    defaultTenantSettings: {
      maxUsers: number;
      maxLeads: number;
      enableUserRegistration: boolean;
    };
    notificationsEnabled: boolean;
    adminNotifications: boolean;
  };
}

interface CompanySettingsProps {
  companyId: string;
}

export function CompanySettings({ companyId }: CompanySettingsProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<CompanySettings>({
    general: {
      companyName: 'Acme Corporation',
      address: '123 Business Ave, Suite 100, San Francisco, CA 94107',
      phone: '+1 (555) 123-4567',
      website: 'https://acme-corp.com',
      taxId: 'US123456789',
    },
    billing: {
      billingEmail: 'billing@acme-corp.com',
      paymentMethod: 'Credit Card',
      billingAddress: '123 Business Ave, Suite 100, San Francisco, CA 94107',
      billingCycle: 'monthly',
      autoRenew: true,
    },
    branding: {
      primaryColor: '#007AFF',
      logo: '',
      customDomain: 'crm.acme-corp.com',
    },
    preferences: {
      defaultTenantSettings: {
        maxUsers: 10,
        maxLeads: 1000,
        enableUserRegistration: true,
      },
      notificationsEnabled: true,
      adminNotifications: true,
    },
  });

  useEffect(() => {
    // TODO: Load company settings from API/Firestore
    // This would be replaced with actual API call
    console.log('Loading settings for company:', companyId);
  }, [companyId]);

  const handleSave = async () => {
    try {
      // TODO: Implement actual settings update logic
      toast({
        title: 'Settings updated',
        description: 'Company settings have been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
        <TabsTrigger value="branding">Branding</TabsTrigger>
        <TabsTrigger value="preferences">Preferences</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={settings.general.companyName}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, companyName: e.target.value },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={settings.general.address}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, address: e.target.value },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={settings.general.phone}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, phone: e.target.value },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={settings.general.website}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, website: e.target.value },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxId">Tax ID</Label>
            <Input
              id="taxId"
              value={settings.general.taxId}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, taxId: e.target.value },
                })
              }
            />
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="billing">
        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="billingEmail">Billing Email</Label>
            <Input
              id="billingEmail"
              type="email"
              value={settings.billing.billingEmail}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  billing: { ...settings.billing, billingEmail: e.target.value },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Input
              id="paymentMethod"
              value={settings.billing.paymentMethod}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  billing: { ...settings.billing, paymentMethod: e.target.value },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billingAddress">Billing Address</Label>
            <Input
              id="billingAddress"
              value={settings.billing.billingAddress}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  billing: { ...settings.billing, billingAddress: e.target.value },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billingCycle">Billing Cycle</Label>
            <div className="flex space-x-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="monthly"
                  name="billingCycle"
                  value="monthly"
                  checked={settings.billing.billingCycle === 'monthly'}
                  onChange={() =>
                    setSettings({
                      ...settings,
                      billing: { ...settings.billing, billingCycle: 'monthly' },
                    })
                  }
                  className="mr-2"
                />
                <label htmlFor="monthly">Monthly</label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="annually"
                  name="billingCycle"
                  value="annually"
                  checked={settings.billing.billingCycle === 'annually'}
                  onChange={() =>
                    setSettings({
                      ...settings,
                      billing: { ...settings.billing, billingCycle: 'annually' },
                    })
                  }
                  className="mr-2"
                />
                <label htmlFor="annually">Annually</label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="autoRenew">Auto-renew Subscription</Label>
            <Switch
              id="autoRenew"
              checked={settings.billing.autoRenew}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  billing: { ...settings.billing, autoRenew: checked },
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
            <Label htmlFor="logo">Logo URL</Label>
            <Input
              id="logo"
              value={settings.branding.logo}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  branding: { ...settings.branding, logo: e.target.value },
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

      <TabsContent value="preferences">
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-medium">Default Tenant Settings</h3>
          <div className="space-y-2">
            <Label htmlFor="maxUsers">Max Users per Tenant</Label>
            <Input
              id="maxUsers"
              type="number"
              min="1"
              value={settings.preferences.defaultTenantSettings.maxUsers}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  preferences: {
                    ...settings.preferences,
                    defaultTenantSettings: {
                      ...settings.preferences.defaultTenantSettings,
                      maxUsers: parseInt(e.target.value),
                    },
                  },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxLeads">Max Leads per Tenant</Label>
            <Input
              id="maxLeads"
              type="number"
              min="1"
              value={settings.preferences.defaultTenantSettings.maxLeads}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  preferences: {
                    ...settings.preferences,
                    defaultTenantSettings: {
                      ...settings.preferences.defaultTenantSettings,
                      maxLeads: parseInt(e.target.value),
                    },
                  },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="enableUserRegistration">Enable User Registration</Label>
            <Switch
              id="enableUserRegistration"
              checked={settings.preferences.defaultTenantSettings.enableUserRegistration}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  preferences: {
                    ...settings.preferences,
                    defaultTenantSettings: {
                      ...settings.preferences.defaultTenantSettings,
                      enableUserRegistration: checked,
                    },
                  },
                })
              }
            />
          </div>

          <h3 className="text-lg font-medium mt-6">Notifications</h3>
          <div className="flex items-center justify-between">
            <Label htmlFor="notificationsEnabled">Enable Notifications</Label>
            <Switch
              id="notificationsEnabled"
              checked={settings.preferences.notificationsEnabled}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  preferences: {
                    ...settings.preferences,
                    notificationsEnabled: checked,
                  },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="adminNotifications">Admin Notifications</Label>
            <Switch
              id="adminNotifications"
              checked={settings.preferences.adminNotifications}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  preferences: {
                    ...settings.preferences,
                    adminNotifications: checked,
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