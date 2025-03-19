import { RbacExample } from "@/components/examples/RbacExample";
import { ExamplesNav } from "@/components/ExamplesNav";

export const metadata = {
  title: 'Role-Based Access Control | LeadLink',
  description: 'Example of role-based access controls in LeadLink using Firebase custom claims',
};

export default function RbacPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Role-Based Access Control
      </h1>
      
      <ExamplesNav />
      
      <div className="mb-8 mx-auto max-w-3xl">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">
            About RBAC Implementation
          </h2>
          <p className="mb-4">
            This example demonstrates how to implement role-based access control (RBAC) 
            in your application using Firebase Authentication with custom claims.
          </p>
          <p className="mb-4">
            The <code className="bg-blue-100 px-2 py-1 rounded">RbacWrapper</code> component 
            checks the current user's role and permissions, allowing you to conditionally 
            render UI elements based on the user's access level.
          </p>
          <p>
            This implementation supports roles like Admin, Tenant Admin, Manager, and User, 
            each with customizable permissions.
          </p>
        </div>
      </div>
      
      <RbacExample />
      
      <div className="mt-12 mx-auto max-w-3xl">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Implementation Details</h2>
          <p className="mb-4">
            The RBAC system is built on these components:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>
              <strong>Firebase Custom Claims</strong> - Stores user roles and permissions securely
            </li>
            <li>
              <strong>CustomClaimsService</strong> - Manages setting and retrieving custom claims
            </li>
            <li>
              <strong>useAuth Hook</strong> - React hook that provides authentication state with claims
            </li>
            <li>
              <strong>RbacWrapper Components</strong> - UI wrappers that conditionally render based on permissions
            </li>
          </ul>
          <p>
            This system provides a secure and flexible way to implement access controls in your 
            application, with the security enforced both client-side for UI and server-side in 
            Firestore security rules and Cloud Functions.
          </p>
        </div>
      </div>
    </div>
  );
} 