import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Account Management | LeadLink',
  description: 'Manage your LeadLink CRM account settings, profile, and notification preferences.',
};

export default function AccountPage() {
  return (
    <AccountPageClient />
  );
}

'use client';

import React from 'react';
import { AccountManagement } from '@/components/account/AccountManagement';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/spinner';
import { FaUserCircle } from 'react-icons/fa';
import { redirect } from 'next/navigation';

function AccountPageClient() {
  const { user, loading } = useAuth();
  
  // If not authenticated and not loading, redirect to login
  if (!loading && !user) {
    redirect('/auth/login?returnUrl=/account');
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-b border-gray-200 pb-5 mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Account Management</h1>
            <p className="mt-2 text-sm text-gray-500">
              Manage your profile, security settings, and notification preferences.
            </p>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Spinner className="h-10 w-10 text-blue-600" />
              <p className="mt-4 text-gray-500">Loading your account details...</p>
            </div>
          ) : user ? (
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center mb-6">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'User avatar'} 
                      className="h-16 w-16 rounded-full"
                    />
                  ) : (
                    <FaUserCircle className="h-16 w-16 text-gray-400" />
                  )}
                  <div className="ml-4">
                    <h2 className="text-xl font-bold text-gray-900">
                      {user.displayName || 'User'}
                    </h2>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    {user.emailVerified ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                        Verification Pending
                      </span>
                    )}
                  </div>
                </div>
                
                <AccountManagement />
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-500">
                You need to be logged in to access your account settings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 