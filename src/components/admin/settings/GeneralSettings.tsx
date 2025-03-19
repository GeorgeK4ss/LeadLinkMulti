import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { SystemService } from '@/lib/services/SystemService';

interface GeneralSettings {
  systemName: string;
  supportEmail: string;
  maxUsersPerTenant: number;
  maxTenantsPerCompany: number;
  enableUserRegistration: boolean;
  enableCompanyRegistration: boolean;
  maintenanceMode: boolean;
}

export function GeneralSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<GeneralSettings>({
    systemName: '',
    supportEmail: '',
    maxUsersPerTenant: 10,
    maxTenantsPerCompany: 5,
    enableUserRegistration: true,
    enableCompanyRegistration: true,
    maintenanceMode: false,
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const systemService = SystemService.getInstance();
      await systemService.updateGeneralSettings(settings);
      toast({
        title: 'Settings updated',
        description: 'General settings have been successfully updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="systemName">System Name</Label>
          <Input
            id="systemName"
            value={settings.systemName}
            onChange={(e) =>
              setSettings({ ...settings, systemName: e.target.value })
            }
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="supportEmail">Support Email</Label>
          <Input
            id="supportEmail"
            type="email"
            value={settings.supportEmail}
            onChange={(e) =>
              setSettings({ ...settings, supportEmail: e.target.value })
            }
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="maxUsersPerTenant">Max Users per Tenant</Label>
          <Input
            id="maxUsersPerTenant"
            type="number"
            min="1"
            value={settings.maxUsersPerTenant}
            onChange={(e) =>
              setSettings({
                ...settings,
                maxUsersPerTenant: parseInt(e.target.value),
              })
            }
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="maxTenantsPerCompany">Max Tenants per Company</Label>
          <Input
            id="maxTenantsPerCompany"
            type="number"
            min="1"
            value={settings.maxTenantsPerCompany}
            onChange={(e) =>
              setSettings({
                ...settings,
                maxTenantsPerCompany: parseInt(e.target.value),
              })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="enableUserRegistration">Enable User Registration</Label>
          <Switch
            id="enableUserRegistration"
            checked={settings.enableUserRegistration}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, enableUserRegistration: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="enableCompanyRegistration">
            Enable Company Registration
          </Label>
          <Switch
            id="enableCompanyRegistration"
            checked={settings.enableCompanyRegistration}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, enableCompanyRegistration: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
          <Switch
            id="maintenanceMode"
            checked={settings.maintenanceMode}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, maintenanceMode: checked })
            }
          />
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  );
} 