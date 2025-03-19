'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/spinner';

type NotificationSetting = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
};

type NotificationCategory = {
  id: string;
  title: string;
  description: string;
  settings: NotificationSetting[];
};

export function NotificationSettings() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // Mock notification categories and settings
  // In a real application, these would be loaded from the user's profile in Firestore
  const [categories, setCategories] = useState<NotificationCategory[]>([
    {
      id: 'account',
      title: 'Account Notifications',
      description: 'Notifications related to your account activity and security',
      settings: [
        {
          id: 'account-login',
          title: 'Login Activity',
          description: 'Get notified when there is a new login to your account',
          enabled: true
        },
        {
          id: 'account-changes',
          title: 'Account Changes',
          description: 'Get notified when important changes are made to your account',
          enabled: true
        },
        {
          id: 'password-expiry',
          title: 'Password Expiry',
          description: 'Get notified when your password is about to expire',
          enabled: false
        }
      ]
    },
    {
      id: 'leads',
      title: 'Lead Notifications',
      description: 'Notifications for new leads and lead activity',
      settings: [
        {
          id: 'new-lead',
          title: 'New Leads',
          description: 'Get notified when a new lead is added to your account',
          enabled: true
        },
        {
          id: 'lead-status',
          title: 'Lead Status Updates',
          description: 'Get notified when a lead status changes',
          enabled: true
        },
        {
          id: 'lead-assignment',
          title: 'Lead Assignments',
          description: 'Get notified when leads are assigned to you',
          enabled: true
        }
      ]
    },
    {
      id: 'marketing',
      title: 'Marketing Notifications',
      description: 'Notifications related to marketing campaigns and events',
      settings: [
        {
          id: 'campaign-updates',
          title: 'Campaign Updates',
          description: 'Get notified about the performance of your marketing campaigns',
          enabled: false
        },
        {
          id: 'scheduled-events',
          title: 'Scheduled Events',
          description: 'Get reminders about upcoming marketing events',
          enabled: false
        },
        {
          id: 'marketing-tips',
          title: 'Marketing Tips',
          description: 'Receive tips and best practices for more effective marketing',
          enabled: false
        }
      ]
    }
  ]);
  
  // Handle toggle for notification settings
  const handleToggleNotification = (categoryId: string, settingId: string) => {
    const updatedCategories = categories.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          settings: category.settings.map(setting => {
            if (setting.id === settingId) {
              return { ...setting, enabled: !setting.enabled };
            }
            return setting;
          })
        };
      }
      return category;
    });
    
    setCategories(updatedCategories);
  };
  
  // Save notification preferences
  const handleSavePreferences = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      setSaveMessage(null);
      
      // In a real application, you would save these preferences to Firestore
      // Example:
      // const userRef = doc(firestore, 'users', user.uid);
      // await updateDoc(userRef, { notificationPreferences: categories });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaveMessage({
        text: 'Notification preferences saved successfully!',
        type: 'success'
      });
    } catch (err) {
      setSaveMessage({
        text: err instanceof Error ? err.message : 'Failed to save notification preferences',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Bulk actions for categories
  const enableAllInCategory = (categoryId: string) => {
    const updatedCategories = categories.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          settings: category.settings.map(setting => ({
            ...setting,
            enabled: true
          }))
        };
      }
      return category;
    });
    
    setCategories(updatedCategories);
  };
  
  const disableAllInCategory = (categoryId: string) => {
    const updatedCategories = categories.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          settings: category.settings.map(setting => ({
            ...setting,
            enabled: false
          }))
        };
      }
      return category;
    });
    
    setCategories(updatedCategories);
  };
  
  if (!user) {
    return <p>Loading notification settings...</p>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Notification Settings</h2>
        <button
          type="button"
          onClick={handleSavePreferences}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          disabled={saving}
        >
          {saving ? <Spinner className="h-4 w-4 mr-2" /> : null}
          Save Preferences
        </button>
      </div>
      
      {/* Status Message */}
      {saveMessage && (
        <div className={`p-4 rounded-md ${
          saveMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
          'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {saveMessage.text}
        </div>
      )}
      
      <div className="text-sm text-gray-500">
        Manage how you receive notifications and the frequency of updates.
      </div>
      
      {/* Notification Categories */}
      <div className="space-y-8">
        {categories.map(category => (
          <div key={category.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{category.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{category.description}</p>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => enableAllInCategory(category.id)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Enable All
                </button>
                <button
                  type="button"
                  onClick={() => disableAllInCategory(category.id)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Disable All
                </button>
              </div>
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {category.settings.map(setting => (
                  <li key={setting.id} className="px-4 py-4 sm:px-6 flex items-center justify-between">
                    <div className="pr-4">
                      <p className="text-sm font-medium text-gray-900">{setting.title}</p>
                      <p className="text-sm text-gray-500">{setting.description}</p>
                    </div>
                    <div className="ml-auto">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          value=""
                          className="sr-only peer"
                          checked={setting.enabled}
                          onChange={() => handleToggleNotification(category.id, setting.id)}
                          disabled={saving}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
      
      {/* Communication Channels */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Communication Channels</h3>
          <p className="mt-1 text-sm text-gray-500">
            Choose how you want to receive notifications.
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="email-notifications"
                  name="email-notifications"
                  type="checkbox"
                  checked={true}
                  disabled
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="email-notifications" className="font-medium text-gray-700">Email</label>
                <p className="text-gray-500">Receive notifications via email (required)</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="in-app-notifications"
                  name="in-app-notifications"
                  type="checkbox"
                  checked={true}
                  onChange={() => {}} // Would implement toggle logic in real app
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="in-app-notifications" className="font-medium text-gray-700">In-app</label>
                <p className="text-gray-500">Receive notifications while using the app</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="push-notifications"
                  name="push-notifications"
                  type="checkbox"
                  checked={false}
                  onChange={() => {}} // Would implement toggle logic in real app
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="push-notifications" className="font-medium text-gray-700">Push Notifications</label>
                <p className="text-gray-500">
                  <span className="text-gray-800 font-medium">Coming Soon: </span>
                  Receive push notifications on your devices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 