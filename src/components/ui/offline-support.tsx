import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, Download, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export interface OfflineStatusProps {
  /**
   * Function to call when the user requests to retry a connection
   */
  onRetry?: () => void;
  /**
   * Additional CSS classes to apply to the component
   */
  className?: string;
  /**
   * Children to render when offline
   */
  children?: React.ReactNode;
}

/**
 * OfflineStatus - A component to display the current online/offline status
 * and provide a retry button when offline
 */
export function OfflineStatus({
  onRetry,
  className,
  children
}: OfflineStatusProps) {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // If online, don't render anything unless children are provided
  if (isOnline && !children) {
    return null;
  }

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {!isOnline && (
        <Alert variant="destructive" className="mb-4">
          <WifiOff className="h-4 w-4 mr-2" />
          <AlertTitle>You are offline</AlertTitle>
          <AlertDescription>
            You are currently offline. Some features may be limited.
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={handleRetry}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Retry Connection
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Render children if provided */}
      {children}
    </div>
  );
}

export interface OfflineCacheProps {
  /**
   * Name of the cache
   */
  cacheName: string;
  /**
   * Whether to show the cache UI even when online
   */
  showWhenOnline?: boolean;
  /**
   * Additional CSS classes to apply to the component
   */
  className?: string;
}

/**
 * OfflineCache - A component to manage and display cached resources for offline use
 */
export function OfflineCache({
  cacheName,
  showWhenOnline = false,
  className
}: OfflineCacheProps) {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [cacheSize, setCacheSize] = useState<number>(0);
  const [cacheLastUpdated, setCacheLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get cache information
    updateCacheInfo();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [cacheName]);

  const updateCacheInfo = async () => {
    if ('caches' in window) {
      try {
        const cache = await window.caches.open(cacheName);
        const keys = await cache.keys();
        setCacheSize(keys.length);
        
        if (keys.length > 0) {
          // Get last updated time from the most recent request
          const requests = await Promise.all(keys.map(key => cache.match(key)));
          const dates = requests
            .filter(Boolean)
            .map(response => response?.headers.get('date'))
            .filter(Boolean)
            .map(dateStr => new Date(dateStr || ''));
          
          if (dates.length > 0) {
            const maxDate = new Date(Math.max(...dates.map(date => date.getTime())));
            setCacheLastUpdated(maxDate);
          }
        }
      } catch (error) {
        console.error('Error accessing cache:', error);
      }
    }
  };

  const clearCache = async () => {
    if ('caches' in window) {
      try {
        await window.caches.delete(cacheName);
        setCacheSize(0);
        setCacheLastUpdated(null);
      } catch (error) {
        console.error('Error clearing cache:', error);
      }
    }
  };

  // If online and not showing when online, don't render anything
  if (isOnline && !showWhenOnline) {
    return null;
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Offline Cache</h3>
          <Badge variant={isOnline ? "outline" : "secondary"}>
            {isOnline ? (
              <>
                <Wifi className="h-3 w-3 mr-1" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </>
            )}
          </Badge>
        </div>

        <div className="space-y-4">
          <div className="text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-muted-foreground">Cached Items:</span>
              <span className="font-medium">{cacheSize}</span>
            </div>
            {cacheLastUpdated && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="font-medium">
                  {cacheLastUpdated.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={updateCacheInfo}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={clearCache}
            >
              Clear Cache
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export interface OfflineDataProps<T> {
  /**
   * Data to display
   */
  data: T[];
  /**
   * Key to use for offline storage
   */
  storageKey: string;
  /**
   * Function to render an item
   */
  renderItem: (item: T) => React.ReactNode;
  /**
   * Function to fetch fresh data
   */
  fetchData?: () => Promise<T[]>;
  /**
   * Whether the data is loading
   */
  isLoading?: boolean;
  /**
   * Message to display when there is no data
   */
  emptyMessage?: string;
  /**
   * Additional CSS classes to apply to the component
   */
  className?: string;
}

/**
 * OfflineData - A component to manage and display data that works offline
 * Automatically stores data in localStorage for offline use
 */
export function OfflineData<T>({
  data,
  storageKey,
  renderItem,
  fetchData,
  isLoading = false,
  emptyMessage = "No data available",
  className
}: OfflineDataProps<T>) {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [localData, setLocalData] = useState<T[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load data from localStorage on mount
    const storedData = localStorage.getItem(storageKey);
    const storedTimestamp = localStorage.getItem(`${storageKey}_timestamp`);
    
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setLocalData(parsedData);
        
        if (storedTimestamp) {
          setLastUpdated(new Date(storedTimestamp));
        }
      } catch (error) {
        console.error('Error parsing stored data:', error);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [storageKey]);

  // Update localStorage when data changes
  useEffect(() => {
    if (typeof window === 'undefined' || data.length === 0) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
      const now = new Date();
      localStorage.setItem(`${storageKey}_timestamp`, now.toISOString());
      setLastUpdated(now);
    } catch (error) {
      console.error('Error storing data in localStorage:', error);
    }
  }, [data, storageKey]);

  const handleRefresh = async () => {
    if (!fetchData || !isOnline) return;

    try {
      const freshData = await fetchData();
      localStorage.setItem(storageKey, JSON.stringify(freshData));
      const now = new Date();
      localStorage.setItem(`${storageKey}_timestamp`, now.toISOString());
      setLocalData(freshData);
      setLastUpdated(now);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  // Use local data when offline, otherwise use provided data
  const displayData = isOnline ? data : localData;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h3 className="text-lg font-medium mr-2">Data</h3>
          {!isOnline && (
            <Badge variant="secondary">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline Mode
            </Badge>
          )}
        </div>
        
        {lastUpdated && (
          <div className="text-xs text-muted-foreground">
            Last updated: {lastUpdated.toLocaleString()}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      ) : displayData.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-4">
          {displayData.map((item, index) => (
            <div key={index}>{renderItem(item)}</div>
          ))}
        </div>
      )}

      {fetchData && isOnline && (
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      )}

      {!isOnline && data.length === 0 && localData.length === 0 && (
        <Alert className="mt-4">
          <Download className="h-4 w-4 mr-2" />
          <AlertTitle>No offline data available</AlertTitle>
          <AlertDescription>
            You are currently offline and no cached data is available.
            Please connect to the internet to download data for offline use.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 