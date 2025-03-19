import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneralSettings } from './GeneralSettings';
import { SecuritySettings } from './SecuritySettings';
import { IntegrationSettings } from './IntegrationSettings';

export function SettingsLayout() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-3xl font-bold mb-8">System Settings</h2>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <div className="p-6 bg-card rounded-lg border">
            <GeneralSettings />
          </div>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-4">
          <div className="p-6 bg-card rounded-lg border">
            <SecuritySettings />
          </div>
        </TabsContent>
        
        <TabsContent value="integrations" className="space-y-4">
          <div className="p-6 bg-card rounded-lg border">
            <IntegrationSettings />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 