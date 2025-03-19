import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { SystemService } from '@/lib/services/SystemService';
import type { FeatureFlag } from '@/lib/types/settings';

export function FeatureFlags() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([
    {
      name: 'advanced_reporting',
      description: 'Enable advanced reporting features',
      enabled: false,
      scope: 'system'
    },
    {
      name: 'ai_suggestions',
      description: 'Enable AI-powered suggestions and insights',
      enabled: false,
      scope: 'tenant'
    },
    {
      name: 'bulk_operations',
      description: 'Enable bulk operations for leads and customers',
      enabled: true,
      scope: 'company'
    },
    {
      name: 'custom_fields',
      description: 'Allow creation of custom fields for entities',
      enabled: true,
      scope: 'tenant'
    },
    {
      name: 'api_access',
      description: 'Enable API access for integrations',
      enabled: false,
      scope: 'company'
    }
  ]);

  const handleToggleFeature = (index: number) => {
    const updatedFlags = [...featureFlags];
    updatedFlags[index].enabled = !updatedFlags[index].enabled;
    setFeatureFlags(updatedFlags);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const systemService = SystemService.getInstance();
      await systemService.updateFeatureFlags(featureFlags);
      toast({
        title: 'Features updated',
        description: 'Feature flags have been successfully updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update feature flags. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>
            Enable or disable system features and functionality.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {featureFlags.map((feature, index) => (
            <div key={feature.name} className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor={`feature-${feature.name}`}>{feature.description}</Label>
                <p className="text-sm text-muted-foreground">
                  Scope: {feature.scope.charAt(0).toUpperCase() + feature.scope.slice(1)}
                </p>
              </div>
              <Switch
                id={`feature-${feature.name}`}
                checked={feature.enabled}
                onCheckedChange={() => handleToggleFeature(index)}
              />
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
} 