import React from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { 
  RbacWrapper, 
  AdminOnly, 
  TenantAdminOnly, 
  PermissionRequired 
} from '@/components/RbacWrapper';

export const RbacExample: React.FC = () => {
  const { 
    user, 
    userRole, 
    claims, 
    isAuthenticated, 
    isLoading, 
    error,
    signIn,
    signOut
  } = useAuth();

  if (isLoading) {
    return <div className="p-4">Loading authentication state...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="p-4 border rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
        <p className="mb-4">Please sign in to see RBAC examples.</p>
        
        <div className="mb-4">
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => signIn('admin@example.com', 'password')}
          >
            Sign In as Admin
          </button>
        </div>
        
        <div className="mb-4">
          <button 
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            onClick={() => signIn('tenant-admin@example.com', 'password')}
          >
            Sign In as Tenant Admin
          </button>
        </div>
        
        <div className="mb-4">
          <button 
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            onClick={() => signIn('user@example.com', 'password')}
          >
            Sign In as Regular User
          </button>
        </div>
        
        {error && (
          <div className="text-red-600 font-medium mt-2">{error}</div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 border rounded shadow">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">RBAC Example</h2>
          <p className="text-gray-600">
            Signed in as: {user?.email || 'Unknown'}
          </p>
          <p className="text-gray-600">
            Role: {claims?.role || 'No role assigned'}
          </p>
        </div>
        
        <button 
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          onClick={() => signOut()}
        >
          Sign Out
        </button>
      </div>
      
      <h3 className="text-lg font-semibold mb-2">Role-Based Content</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Admin Content */}
        <div className="border rounded p-4 bg-gray-100">
          <h4 className="font-medium mb-2">Admin Only Content</h4>
          <AdminOnly fallback={<p className="text-red-500">You need admin privileges</p>}>
            <p className="text-green-600">You have admin privileges</p>
            <ul className="list-disc list-inside mt-2">
              <li>Manage all users</li>
              <li>Configure system settings</li>
              <li>Access billing information</li>
            </ul>
          </AdminOnly>
        </div>
        
        {/* Tenant Admin Content */}
        <div className="border rounded p-4 bg-gray-100">
          <h4 className="font-medium mb-2">Tenant Admin Content</h4>
          <TenantAdminOnly 
            tenantId="tenant-123" 
            fallback={<p className="text-red-500">You need tenant admin privileges</p>}
          >
            <p className="text-green-600">You have tenant admin privileges</p>
            <ul className="list-disc list-inside mt-2">
              <li>Manage tenant users</li>
              <li>Configure tenant settings</li>
              <li>View tenant analytics</li>
            </ul>
          </TenantAdminOnly>
        </div>
        
        {/* User Content with Permissions */}
        <div className="border rounded p-4 bg-gray-100">
          <h4 className="font-medium mb-2">User with Lead Permissions</h4>
          <PermissionRequired 
            permission="create" 
            resource="leads"
            fallback={<p className="text-red-500">You need lead creation permission</p>}
          >
            <p className="text-green-600">You can create leads</p>
            <div className="mt-2">
              <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                Create New Lead
              </button>
            </div>
          </PermissionRequired>
        </div>
      </div>
      
      <h3 className="text-lg font-semibold mb-2">Permission Details</h3>
      
      <div className="bg-gray-100 p-4 rounded">
        <h4 className="font-medium mb-2">Your Permissions:</h4>
        {claims?.permissions ? (
          <ul className="list-disc list-inside">
            {claims.permissions.map((permission, index) => (
              <li key={index}>{permission}</li>
            ))}
          </ul>
        ) : (
          <p>No permissions assigned</p>
        )}
      </div>
      
      <div className="mt-6 bg-gray-100 p-4 rounded">
        <h4 className="font-medium mb-2">Full User Role Data:</h4>
        <pre className="text-xs overflow-auto max-h-64">
          {JSON.stringify(userRole, null, 2)}
        </pre>
      </div>
    </div>
  );
}; 