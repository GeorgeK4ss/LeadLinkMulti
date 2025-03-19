'use client';

import React, { useState } from 'react';
import { FeatureAccessWrapper, RequireFeature } from '../FeatureAccessWrapper';
import { useAuth } from '@/hooks/useAuth';

export function FeatureAccessExample() {
  const { user, tenant } = useAuth();
  const [fileCount, setFileCount] = useState(0);
  const [documentCount, setDocumentCount] = useState(0);
  
  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg">Please sign in to access features.</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Subscription Features Access Example</h2>
      
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Basic Feature Access</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border rounded">
            <h4 className="font-medium mb-2">Document Management</h4>
            <FeatureAccessWrapper 
              featureKey="document_management"
              fallback={
                <div className="p-4 bg-gray-100 rounded">
                  <p>Document management is only available in the Business and Enterprise plans.</p>
                  <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded">
                    Upgrade Now
                  </button>
                </div>
              }
            >
              <div className="space-y-4">
                <p>You have access to document management features!</p>
                <div className="flex items-center space-x-2">
                  <button 
                    className="px-3 py-1 bg-green-600 text-white rounded"
                    onClick={() => setDocumentCount(count => count + 1)}
                  >
                    Create Document
                  </button>
                  <span>Documents: {documentCount}</span>
                </div>
              </div>
            </FeatureAccessWrapper>
          </div>
          
          <div className="p-4 border rounded">
            <h4 className="font-medium mb-2">File Storage</h4>
            <FeatureAccessWrapper 
              featureKey="file_storage"
              usageCheck={{
                currentUsage: fileCount,
                showWarningAt: 80 // show warning at 80% usage
              }}
            >
              <div className="space-y-4">
                <p>You have access to file storage features!</p>
                <div className="flex items-center space-x-2">
                  <button 
                    className="px-3 py-1 bg-green-600 text-white rounded"
                    onClick={() => setFileCount(count => count + 1)}
                  >
                    Upload File
                  </button>
                  <span>Files: {fileCount}</span>
                </div>
              </div>
            </FeatureAccessWrapper>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Conditional UI Elements</h3>
        
        <div className="p-4 border rounded">
          <p className="mb-4">This UI conditionally shows components based on feature access:</p>
          
          <div className="flex flex-wrap gap-2">
            {/* Base button always shown */}
            <button className="px-3 py-1 bg-gray-600 text-white rounded">
              Basic Feature
            </button>
            
            {/* Only shown if analytics feature is available */}
            <RequireFeature featureKey="analytics">
              <button className="px-3 py-1 bg-purple-600 text-white rounded">
                Analytics
              </button>
            </RequireFeature>
            
            {/* Only shown if advanced_reporting feature is available */}
            <RequireFeature featureKey="advanced_reporting">
              <button className="px-3 py-1 bg-indigo-600 text-white rounded">
                Advanced Reports
              </button>
            </RequireFeature>
            
            {/* Only shown if ai_assistant feature is available */}
            <RequireFeature featureKey="ai_assistant">
              <button className="px-3 py-1 bg-blue-600 text-white rounded">
                AI Assistant
              </button>
            </RequireFeature>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-xl font-semibold mb-4">Current Subscription Info</h3>
        
        <div className="p-4 border rounded bg-gray-50">
          <p><strong>Tenant:</strong> {tenant ? tenant.name : 'None selected'}</p>
          <p><strong>Plan:</strong> {tenant ? tenant.plan : 'No plan'}</p>
          <p className="mt-4 text-sm text-gray-600">
            Features are shown/hidden based on the subscription plan features. 
            Try upgrading your plan to see more features.
          </p>
        </div>
      </div>
    </div>
  );
} 