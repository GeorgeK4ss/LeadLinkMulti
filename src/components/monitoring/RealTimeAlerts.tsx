"use client";

import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, Bell, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from "@/components/ui/button";

export type AlertLevel = 'critical' | 'warning' | 'info';

export interface Alert {
  id: string;
  level: AlertLevel;
  message: string;
  timestamp: number;
  source: string;
  acknowledged: boolean;
}

interface RealTimeAlertsProps {
  onAcknowledge?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
}

export const RealTimeAlerts: React.FC<RealTimeAlertsProps> = ({
  onAcknowledge,
  onDismiss,
}) => {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [expanded, setExpanded] = useState(false);
  
  // Create refs to access DOM elements directly
  const alertsPanelRef = React.useRef<HTMLDivElement>(null);
  
  // Toggle panel visibility without using React state
  const togglePanel = () => {
    if (!alertsPanelRef.current) return;
    
    const isCurrentlyVisible = alertsPanelRef.current.style.display !== 'none';
    
    // Toggle visibility using direct DOM manipulation
    if (isCurrentlyVisible) {
      alertsPanelRef.current.style.display = 'none';
    } else {
      alertsPanelRef.current.style.display = 'block';
      // Add a mock alert when opening
      addMockAlert();
    }
  };

  // Mock function to fetch alerts - would be replaced with real-time data
  const fetchAlerts = async (): Promise<Alert[]> => {
    // In a real implementation, this would connect to a WebSocket 
    // or use Firebase realtime database/Firestore with onSnapshot
    return [];
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let mounted = true;

    const loadAlerts = async () => {
      try {
        const fetchedAlerts = await fetchAlerts();
        if (mounted) {
          setAlerts(fetchedAlerts);
          
          // Show toasts for new critical alerts
          fetchedAlerts
            .filter(alert => alert.level === 'critical' && !alert.acknowledged)
            .forEach(alert => {
              toast({
                title: 'Critical Alert',
                description: alert.message,
                variant: 'destructive',
                duration: 10000,
              });
            });
        }
      } catch (error) {
        console.error('Error fetching alerts:', error);
      }
    };

    // Initial load
    loadAlerts();

    // Set up polling interval
    intervalId = setInterval(loadAlerts, 30000); // Poll every 30 seconds

    // Cleanup function
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [toast]);

  const handleAcknowledge = (alertId: string) => {
    setAlerts(prevAlerts => 
      prevAlerts.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
    onAcknowledge?.(alertId);
  };

  const handleDismiss = (alertId: string) => {
    setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== alertId));
    onDismiss?.(alertId);
  };

  const criticalCount = alerts.filter(a => a.level === 'critical' && !a.acknowledged).length;

  // Add mock alerts for demo purposes
  const addMockAlert = () => {
    const mockAlerts: Alert[] = [
      {
        id: `alert-${Date.now()}`,
        level: 'critical',
        message: 'Database connection failed. Unable to process customer data.',
        timestamp: Date.now(),
        source: 'Database Service',
        acknowledged: false
      },
      {
        id: `alert-${Date.now() + 1}`,
        level: 'warning',
        message: 'High CPU usage detected on application server.',
        timestamp: Date.now(),
        source: 'System Monitor',
        acknowledged: false
      },
      {
        id: `alert-${Date.now() + 2}`,
        level: 'info',
        message: 'Daily backup completed successfully.',
        timestamp: Date.now(),
        source: 'Backup Service',
        acknowledged: false
      }
    ];
    
    setAlerts(prev => [...prev, mockAlerts[Math.floor(Math.random() * mockAlerts.length)]]);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Floating button to show/hide alerts - bypass React state entirely */}
      <button
        onClick={togglePanel}
        className={`rounded-full shadow-lg p-3 relative z-[9999] pointer-events-auto w-12 h-12 flex items-center justify-center ${
          criticalCount > 0 
            ? 'bg-red-600 text-white animate-pulse' 
            : 'bg-gray-200 text-gray-700'
        }`}
      >
        <Bell size={20} />
        {criticalCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {criticalCount}
          </span>
        )}
      </button>

      {/* Alerts panel - initially hidden, manipulated by DOM directly */}
      <div 
        ref={alertsPanelRef} 
        className="absolute bottom-16 right-0 w-80 md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 max-h-[80vh] overflow-y-auto" 
        style={{ display: 'none' }}
      >
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">System Alerts</h3>
          <button 
            onClick={togglePanel}
            className="h-auto p-1 text-gray-500 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="divide-y">
          {alerts.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <CheckCircle className="mx-auto mb-2" size={24} />
              <p>No alerts at this time</p>
              <Button 
                onClick={addMockAlert}
                variant="link"
                size="sm"
                className="mt-2 text-sm text-blue-600 h-auto p-0"
              >
                Add test alert
              </Button>
            </div>
          ) : (
            alerts.map(alert => (
              <div 
                key={alert.id} 
                className={`p-3 ${
                  alert.acknowledged ? 'bg-gray-50' : 
                  alert.level === 'critical' ? 'bg-red-50' :
                  alert.level === 'warning' ? 'bg-yellow-50' : 'bg-blue-50'
                }`}
              >
                <div className="flex items-start">
                  <div className="mr-2 mt-0.5">
                    <AlertTriangle 
                      size={18} 
                      className={
                        alert.level === 'critical' ? 'text-red-600' :
                        alert.level === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                      } 
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <div className="mt-1 flex items-center text-xs text-gray-500">
                      <span>{alert.source}</span>
                      <span className="mx-1">•</span>
                      <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
                
                {!alert.acknowledged && (
                  <div className="mt-2 flex justify-end space-x-2">
                    <Button
                      onClick={() => handleAcknowledge(alert.id)}
                      variant="secondary"
                      size="sm"
                      className="text-xs"
                    >
                      Acknowledge
                    </Button>
                    <Button
                      onClick={() => handleDismiss(alert.id)}
                      variant="secondary"
                      size="sm"
                      className="text-xs"
                    >
                      Dismiss
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}; 