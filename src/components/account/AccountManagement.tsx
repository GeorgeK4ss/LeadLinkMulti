'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/spinner';
import { FaUser, FaLock, FaBell, FaCog } from 'react-icons/fa';
import { ProfileSettings } from './ProfileSettings';
import { SecuritySettings } from './SecuritySettings';
import { NotificationSettings } from './NotificationSettings';

type TabType = 'profile' | 'security' | 'notifications' | 'preferences';

interface AccountManagementProps {
  defaultTab?: TabType;
}

export function AccountManagement({ defaultTab = 'profile' }: AccountManagementProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  
  if (!user) {
    return (
      <div className="flex justify-center py-8">
        <Spinner className="h-8 w-8 text-blue-600" />
      </div>
    );
  }
  
  const tabs = [
    { id: 'profile' as TabType, label: 'Profile', icon: FaUser },
    { id: 'security' as TabType, label: 'Security', icon: FaLock },
    { id: 'notifications' as TabType, label: 'Notifications', icon: FaBell },
    { id: 'preferences' as TabType, label: 'Preferences', icon: FaCog }
  ];
  
  return (
    <div>
      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px space-x-8" aria-label="Account Settings Tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm flex items-center
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
                transition duration-150 ease-in-out
              `}
            >
              <tab.icon className={`mr-2 h-5 w-5 ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400'}`} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'profile' && <ProfileSettings />}
        {activeTab === 'security' && <SecuritySettings />}
        {activeTab === 'notifications' && <NotificationSettings />}
        {activeTab === 'preferences' && (
          <div className="py-10 text-center">
            <FaCog className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Preferences</h3>
            <p className="mt-1 text-sm text-gray-500">
              This feature is coming soon. You'll be able to customize the look and feel of your dashboard.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 