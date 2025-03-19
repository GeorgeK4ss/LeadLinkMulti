'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  AccessControl, 
  AdminOnly, 
  FeatureOnly, 
  PermissionRequired 
} from '@/components/AccessControl';

export function UnifiedAccessExample() {
  const { user, tenant } = useAuth();
  const [usageCount, setUsageCount] = useState(80);
  const companyId = tenant?.id || 'demo-company-id';
  
  const incrementUsage = () => setUsageCount(prev => Math.min(prev + 10, 120));
  const decrementUsage = () => setUsageCount(prev => Math.max(prev - 10, 0));
  
  // Define some example features and permissions for the demo
  const demoFeatures = [
    { name: 'basic_analytics', label: 'Basic Analytics', description: 'View basic analytics dashboards' },
    { name: 'advanced_analytics', label: 'Advanced Analytics', description: 'Access advanced analytics and reporting' },
    { name: 'ai_insights', label: 'AI Insights', description: 'Get AI-powered data insights' },
    { name: 'lead_scoring', label: 'Lead Scoring', description: 'Automatic lead scoring and prioritization' },
    { name: 'bulk_import', label: 'Bulk Import', description: 'Import leads in bulk from CSV' }
  ];
  
  const demoPermissions = [
    { name: 'leads:read', label: 'Read Leads', description: 'View lead information' },
    { name: 'leads:write', label: 'Edit Leads', description: 'Create and modify leads' },
    { name: 'contacts:read', label: 'Read Contacts', description: 'View contact information' },
    { name: 'contacts:write', label: 'Edit Contacts', description: 'Create and modify contacts' },
    { name: 'admin:settings', label: 'Admin Settings', description: 'Modify system settings' }
  ];
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        {/* User info section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Current User</h2>
          {user ? (
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 text-blue-800 p-3 rounded-full">
                {user.displayName?.[0] || user.email?.[0] || '?'}
              </div>
              <div>
                <p className="font-medium">{user.displayName || user.email}</p>
                <p className="text-sm text-gray-600">
                  Role: <span className="font-medium">{tenant?.role || 'User'}</span>
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">
              Not logged in. Some examples will show fallback content.
            </p>
          )}
        </div>
        
        {/* Usage simulator */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Usage Simulator</h3>
          <p className="text-sm text-gray-600 mb-3">
            Adjust the simulated usage count to see how the components react to usage limits.
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={decrementUsage}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
            >
              -10
            </button>
            <div className="flex-1 bg-gray-200 h-4 rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  usageCount > 100 ? 'bg-red-500' : 
                  usageCount > 80 ? 'bg-yellow-500' : 
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(usageCount, 100)}%` }}
              />
            </div>
            <button
              onClick={incrementUsage}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
            >
              +10
            </button>
            <span className="font-mono w-12 text-center">{usageCount}</span>
          </div>
        </div>
        
        {/* RBAC Examples */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Role-Based Access Examples</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <AdminOnly fallback={
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">Admin Only Content</p>
                <p className="text-sm text-red-600">You need admin privileges to view this content.</p>
              </div>
            }>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">Admin Only Content</p>
                <p className="text-sm text-green-600">You have admin privileges to view this content.</p>
              </div>
            </AdminOnly>
            
            <PermissionRequired 
              permission="leads:write"
              fallback={
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-medium">Edit Leads Permission Required</p>
                  <p className="text-sm text-red-600">You need permission to edit leads.</p>
                </div>
              }
            >
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">Edit Leads Permission</p>
                <p className="text-sm text-green-600">You have permission to edit leads.</p>
              </div>
            </PermissionRequired>
          </div>
        </section>
        
        {/* Feature Access Examples */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Feature Access Examples</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <FeatureOnly
              feature="basic_analytics"
              companyId={companyId}
            >
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">Basic Analytics</p>
                <p className="text-sm text-green-600">Your plan includes access to basic analytics.</p>
              </div>
            </FeatureOnly>
            
            <FeatureOnly
              feature="ai_insights"
              companyId={companyId}
              checkUsage={{
                currentUsage: usageCount,
                showWarningAt: 80
              }}
            >
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">AI Insights</p>
                <p className="text-sm text-green-600">
                  You have access to AI insights with usage tracking.
                </p>
              </div>
            </FeatureOnly>
          </div>
        </section>
        
        {/* Combined Access Examples */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Combined Access Control Examples</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <AccessControl
              role="manager"
              feature="advanced_analytics"
              companyId={companyId}
              fallback={
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-medium">Advanced Analytics for Managers</p>
                  <p className="text-sm text-red-600">
                    You need to be a manager AND have the advanced analytics feature.
                  </p>
                </div>
              }
            >
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">Advanced Analytics for Managers</p>
                <p className="text-sm text-green-600">
                  You have manager role AND advanced analytics access.
                </p>
              </div>
            </AccessControl>
            
            <AccessControl
              permission="leads:write"
              feature="bulk_import"
              companyId={companyId}
              checkUsage={{
                currentUsage: usageCount,
                showWarningAt: 80
              }}
              fallback={
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-medium">Bulk Import with Usage Limits</p>
                  <p className="text-sm text-red-600">
                    You need leads:write permission AND bulk import feature.
                  </p>
                </div>
              }
            >
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">Bulk Import with Usage Limits</p>
                <p className="text-sm text-green-600">
                  You have leads:write permission AND bulk import access.
                </p>
              </div>
            </AccessControl>
          </div>
        </section>
        
        {/* Demo permission table */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Available Permissions & Features</h2>
          
          <div className="mb-6">
            <h3 className="font-medium mb-2">Permissions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-2">Permission</th>
                    <th className="text-left p-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {demoPermissions.map(permission => (
                    <tr key={permission.name} className="border-t border-gray-200">
                      <td className="p-2">
                        <code className="bg-gray-100 px-2 py-0.5 rounded">{permission.name}</code>
                      </td>
                      <td className="p-2">{permission.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Features</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-2">Feature</th>
                    <th className="text-left p-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {demoFeatures.map(feature => (
                    <tr key={feature.name} className="border-t border-gray-200">
                      <td className="p-2">
                        <code className="bg-gray-100 px-2 py-0.5 rounded">{feature.name}</code>
                      </td>
                      <td className="p-2">{feature.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
} 