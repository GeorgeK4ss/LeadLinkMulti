import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { SystemService } from '@/lib/services/SystemService';
import type { IntegrationSettings } from '@/lib/types/settings';

const EMAIL_PROVIDERS = ['SendGrid', 'Mailgun', 'AWS SES', 'SMTP'] as const;
const SMS_PROVIDERS = ['Twilio', 'MessageBird', 'AWS SNS'] as const;
const ANALYTICS_PROVIDERS = ['Google Analytics', 'Mixpanel', 'Segment'] as const;

export function IntegrationSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<IntegrationSettings>({
    emailService: {
      provider: 'none',
      apiKey: '',
      fromEmail: '',
    },
    smsService: {
      provider: 'none',
      apiKey: '',
      fromNumber: '',
    },
    analytics: {
      provider: 'google-analytics',
      trackingId: '',
    },
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const systemService = SystemService.getInstance();
      await systemService.updateIntegrationSettings(settings);
      toast({
        title: 'Settings updated',
        description: 'Integration settings have been successfully updated.',
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
        <h3 className="text-lg font-medium">Email Integration</h3>
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="emailEnabled">Enable Email Integration</Label>
            <Switch
              id="emailEnabled"
              checked={settings.emailService.provider !== 'none'}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  emailService: { 
                    ...settings.emailService, 
                    provider: checked ? 'sendgrid' : 'none' 
                  },
                })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="emailProvider">Email Provider</Label>
            <Select
              value={settings.emailService.provider}
              onValueChange={(value) =>
                setSettings({
                  ...settings,
                  emailService: { 
                    ...settings.emailService, 
                    provider: value as 'none' | 'sendgrid' | 'mailchimp' | 'custom'
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select email provider" />
              </SelectTrigger>
              <SelectContent>
                {EMAIL_PROVIDERS.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="emailApiKey">API Key</Label>
            <Input
              id="emailApiKey"
              type="password"
              value={settings.emailService.apiKey}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  emailService: { ...settings.emailService, apiKey: e.target.value },
                })
              }
            />
          </div>
        </div>

        <h3 className="text-lg font-medium">SMS Integration</h3>
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="smsEnabled">Enable SMS Integration</Label>
            <Switch
              id="smsEnabled"
              checked={settings.smsService.provider !== 'none'}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  smsService: { 
                    ...settings.smsService, 
                    provider: checked ? 'twilio' : 'none' 
                  },
                })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="smsProvider">SMS Provider</Label>
            <Select
              value={settings.smsService.provider}
              onValueChange={(value) =>
                setSettings({
                  ...settings,
                  smsService: { 
                    ...settings.smsService, 
                    provider: value as 'none' | 'twilio' | 'custom'
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select SMS provider" />
              </SelectTrigger>
              <SelectContent>
                {SMS_PROVIDERS.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="smsApiKey">API Key</Label>
            <Input
              id="smsApiKey"
              type="password"
              value={settings.smsService.apiKey}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  smsService: { ...settings.smsService, apiKey: e.target.value },
                })
              }
            />
          </div>
        </div>

        <h3 className="text-lg font-medium">Analytics Integration</h3>
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="analyticsEnabled">Enable Analytics</Label>
            <Switch
              id="analyticsEnabled"
              checked={settings.analytics.provider !== 'none'}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  analytics: { 
                    ...settings.analytics, 
                    provider: checked ? 'google-analytics' : 'none' 
                  },
                })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="analyticsProvider">Analytics Provider</Label>
            <Select
              value={settings.analytics.provider}
              onValueChange={(value) =>
                setSettings({
                  ...settings,
                  analytics: { 
                    ...settings.analytics, 
                    provider: value as 'none' | 'google-analytics' | 'mixpanel' | 'custom'
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select analytics provider" />
              </SelectTrigger>
              <SelectContent>
                {ANALYTICS_PROVIDERS.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="analyticsTrackingId">Tracking ID</Label>
            <Input
              id="analyticsTrackingId"
              type="password"
              value={settings.analytics.trackingId}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  analytics: {
                    ...settings.analytics,
                    trackingId: e.target.value,
                  },
                })
              }
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  );
} 