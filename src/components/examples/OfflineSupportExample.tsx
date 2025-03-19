import React, { useState, useEffect } from 'react';
import { OfflineStatus, OfflineCache, OfflineData } from '@/components/ui/offline-support';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { WifiOff, Wifi, RotateCcw, CloudOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

// Sample data for demonstration
interface SampleData {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
}

const sampleData: SampleData[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'active' },
  { id: 3, name: 'Mike Johnson', email: 'mike@example.com', status: 'inactive' },
  { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', status: 'pending' },
  { id: 5, name: 'David Brown', email: 'david@example.com', status: 'active' },
];

export function OfflineSupportExample() {
  const { toast } = useToast();
  const [isOfflineSimulated, setIsOfflineSimulated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentData, setCurrentData] = useState<SampleData[]>(sampleData);
  const [activeTab, setActiveTab] = useState('status');

  // Force Network status simulation
  useEffect(() => {
    const originalOnlineStatus = window.navigator.onLine;
    
    // Create custom online/offline events for simulation
    const createNetworkStatusEvent = (type: 'online' | 'offline') => {
      const event = new Event(type);
      window.dispatchEvent(event);
    };

    // If simulating offline, dispatch offline event
    if (isOfflineSimulated) {
      // @ts-ignore - using Object.defineProperty to modify read-only property for simulation
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      createNetworkStatusEvent('offline');
      
      toast({
        title: "Offline Mode Simulated",
        description: "The app is now in simulated offline mode. Real network connectivity is not affected.",
      });
    } else {
      // Restore original online status
      // @ts-ignore - using Object.defineProperty to modify read-only property for simulation
      Object.defineProperty(navigator, 'onLine', { value: originalOnlineStatus, configurable: true });
      createNetworkStatusEvent('online');
      
      if (isOfflineSimulated) { // Only show when changing from offline to online
        toast({
          title: "Online Mode Restored",
          description: "The app is back to normal online mode.",
        });
      }
    }

    // Clean up
    return () => {
      // @ts-ignore - using Object.defineProperty to modify read-only property for simulation
      Object.defineProperty(navigator, 'onLine', { value: originalOnlineStatus, configurable: true });
    };
  }, [isOfflineSimulated, toast]);

  // Simulated data fetch
  const fetchData = async (): Promise<SampleData[]> => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, this would be an API call
      // Return a fresh copy of data with a new timestamp
      return [...sampleData];
    } finally {
      setIsLoading(false);
    }
  };

  // Handle retry connection
  const handleRetry = () => {
    toast({
      title: "Connection Retry",
      description: "Attempting to reconnect to the network...",
    });
    
    // In a real app, this might include additional logic to check connectivity
    setTimeout(() => {
      if (isOfflineSimulated) {
        toast({
          title: "Connection Failed",
          description: "Still in simulated offline mode. Toggle offline mode to connect.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connection Successful",
          description: "You are now online.",
        });
      }
    }, 1000);
  };

  // Render an item in the offline data list
  const renderDataItem = (item: SampleData) => (
    <Card key={item.id}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-medium">{item.name}</h4>
            <p className="text-sm text-muted-foreground">{item.email}</p>
          </div>
          <Badge variant={
            item.status === 'active' ? 'default' : 
            item.status === 'inactive' ? 'secondary' : 
            'outline'
          }>
            {item.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 p-4 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Offline Support Demo</CardTitle>
            <div className="flex items-center space-x-2">
              <Label htmlFor="airplane-mode" className="cursor-pointer">
                Simulate Offline Mode
              </Label>
              <Switch
                id="airplane-mode"
                checked={isOfflineSimulated}
                onCheckedChange={setIsOfflineSimulated}
              />
            </div>
          </div>
          <CardDescription>
            This demo showcases components designed for offline-first experiences. 
            Toggle the switch to simulate offline mode and see how the components behave.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="status">Offline Status</TabsTrigger>
              <TabsTrigger value="cache">Cache Management</TabsTrigger>
              <TabsTrigger value="data">Offline Data</TabsTrigger>
            </TabsList>
            
            <TabsContent value="status" className="space-y-4">
              <OfflineStatus onRetry={handleRetry}>
                <Card>
                  <CardHeader>
                    <CardTitle>Connection Status</CardTitle>
                    <CardDescription>
                      This component displays different content based on your connection status.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      {isOfflineSimulated ? (
                        <>
                          <WifiOff className="h-6 w-6 text-yellow-500 mr-2" />
                          <div>
                            <h3 className="font-medium">Currently Offline</h3>
                            <p className="text-sm text-muted-foreground">
                              The app will use cached data and functionality will be limited.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <Wifi className="h-6 w-6 text-green-500 mr-2" />
                          <div>
                            <h3 className="font-medium">Connected</h3>
                            <p className="text-sm text-muted-foreground">
                              You have full access to all features and real-time data.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="ml-auto"
                      onClick={() => setIsOfflineSimulated(!isOfflineSimulated)}
                    >
                      {isOfflineSimulated ? 'Go Online' : 'Simulate Offline'}
                    </Button>
                  </CardFooter>
                </Card>
              </OfflineStatus>
              
              <div className="bg-muted p-4 rounded-md">
                <h3 className="font-medium mb-2">How it works:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>The <code>OfflineStatus</code> component detects network status changes</li>
                  <li>When offline, it displays a prominent notification</li>
                  <li>It provides a retry connection button</li>
                  <li>Can render children with offline-aware behavior</li>
                </ul>
              </div>
            </TabsContent>
            
            <TabsContent value="cache" className="space-y-4">
              <OfflineCache 
                cacheName="example-cache" 
                showWhenOnline={true}
              />
              
              <div className="bg-muted p-4 rounded-md">
                <h3 className="font-medium mb-2">How it works:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>The <code>OfflineCache</code> component manages browser cache for offline use</li>
                  <li>It displays cache statistics (size, last updated)</li>
                  <li>Provides controls to refresh or clear cache</li>
                  <li>Integrates with the Cache API for offline resource storage</li>
                  <li>Can automatically hide when online (showWhenOnline prop controls this)</li>
                </ul>
              </div>
            </TabsContent>
            
            <TabsContent value="data" className="space-y-4">
              <OfflineData
                data={currentData}
                storageKey="example-offline-data"
                renderItem={renderDataItem}
                fetchData={fetchData}
                isLoading={isLoading}
                emptyMessage="No user data available"
              />
              
              <div className="bg-muted p-4 rounded-md">
                <h3 className="font-medium mb-2">How it works:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>The <code>OfflineData</code> component automatically stores data in localStorage</li>
                  <li>When offline, it uses the cached data instead of trying to fetch</li>
                  <li>Provides UI for data freshness (last updated timestamp)</li>
                  <li>Handles loading states and empty data scenarios</li>
                  <li>Allows manual refresh when online</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Implementing Offline Support</CardTitle>
          <CardDescription>
            Key strategies for building offline-first applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Client-Side Storage Options</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>localStorage:</strong> Simple key-value storage</li>
                <li><strong>Cache API:</strong> For HTTP requests and responses</li>
                <li><strong>IndexedDB:</strong> For structured data with indexes</li>
                <li><strong>Web SQL:</strong> Database storage (deprecated)</li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Service Worker Capabilities</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Caching strategies:</strong> Cache-first, network-first, stale-while-revalidate</li>
                <li><strong>Background sync:</strong> Defer actions until connection</li>
                <li><strong>Push notifications:</strong> Alert users even when offline</li>
                <li><strong>Offline fallbacks:</strong> Custom offline pages</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950 rounded-md">
            <div className="flex items-start">
              <CloudOff className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-300">Best Practices</h4>
                <ul className="list-disc pl-5 mt-2 text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                  <li>Always provide feedback about the offline state</li>
                  <li>Be clear about which features work offline</li>
                  <li>Implement data synchronization when coming back online</li>
                  <li>Use optimistic UI updates for better user experience</li>
                  <li>Consider conflict resolution strategies for data syncing</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 