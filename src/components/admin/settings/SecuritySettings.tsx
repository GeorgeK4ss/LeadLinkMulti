import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { SystemService } from '@/lib/services/SystemService';
import type { SecuritySettings as SecuritySettingsType } from '@/lib/types/settings';

export function SecuritySettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SecuritySettingsType>({
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
    },
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    mfaEnabled: false,
    allowedIPs: [],
  });

  const [loading, setLoading] = useState(false);
  const [newIP, setNewIP] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const systemService = SystemService.getInstance();
      await systemService.updateSecuritySettings(settings);
      toast({
        title: 'Settings updated',
        description: 'Security settings have been successfully updated.',
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

  const addIP = () => {
    if (newIP && !settings.allowedIPs.includes(newIP)) {
      setSettings({
        ...settings,
        allowedIPs: [...settings.allowedIPs, newIP],
      });
      setNewIP('');
    }
  };

  const removeIP = (ip: string) => {
    setSettings({
      ...settings,
      allowedIPs: settings.allowedIPs.filter((item) => item !== ip),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Password Policy</h3>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="minLength">Minimum Length</Label>
            <Input
              id="minLength"
              type="number"
              min="6"
              value={settings.passwordPolicy.minLength}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  passwordPolicy: {
                    ...settings.passwordPolicy,
                    minLength: parseInt(e.target.value),
                  },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="requireUppercase">Require Uppercase</Label>
            <Switch
              id="requireUppercase"
              checked={settings.passwordPolicy.requireUppercase}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  passwordPolicy: {
                    ...settings.passwordPolicy,
                    requireUppercase: checked,
                  },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="requireLowercase">Require Lowercase</Label>
            <Switch
              id="requireLowercase"
              checked={settings.passwordPolicy.requireLowercase}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  passwordPolicy: {
                    ...settings.passwordPolicy,
                    requireLowercase: checked,
                  },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="requireNumbers">Require Numbers</Label>
            <Switch
              id="requireNumbers"
              checked={settings.passwordPolicy.requireNumbers}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  passwordPolicy: {
                    ...settings.passwordPolicy,
                    requireNumbers: checked,
                  },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="requireSpecialChars">Require Special Characters</Label>
            <Switch
              id="requireSpecialChars"
              checked={settings.passwordPolicy.requireSpecialChars}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  passwordPolicy: {
                    ...settings.passwordPolicy,
                    requireSpecialChars: checked,
                  },
                })
              }
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Session Settings</h3>
          <div className="grid gap-2">
            <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
            <Input
              id="sessionTimeout"
              type="number"
              min="5"
              value={settings.sessionTimeout}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  sessionTimeout: parseInt(e.target.value),
                })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
            <Input
              id="maxLoginAttempts"
              type="number"
              min="1"
              value={settings.maxLoginAttempts}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxLoginAttempts: parseInt(e.target.value),
                })
              }
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Security Features</h3>
          <div className="flex items-center justify-between">
            <Label htmlFor="mfaEnabled">Enable MFA</Label>
            <Switch
              id="mfaEnabled"
              checked={settings.mfaEnabled}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  mfaEnabled: checked,
                })
              }
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">IP Whitelist</h3>
          <div className="grid gap-2">
            <div className="flex gap-2">
              <Input
                placeholder="Enter IP address"
                value={newIP}
                onChange={(e) => setNewIP(e.target.value)}
              />
              <Button type="button" onClick={addIP}>
                Add IP
              </Button>
            </div>
            <div className="space-y-2">
              {settings.allowedIPs.map((ip) => (
                <div
                  key={ip}
                  className="flex items-center justify-between bg-secondary p-2 rounded"
                >
                  <span>{ip}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeIP(ip)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  );
} 