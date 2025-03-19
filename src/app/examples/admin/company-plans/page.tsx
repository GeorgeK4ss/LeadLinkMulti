import { CompanyPlanAssignment } from "@/components/admin/CompanyPlanAssignment";
import { ExamplesNav } from "@/components/ExamplesNav";
import { AdminOnly } from "@/components/RbacWrapper";

export const metadata = {
  title: 'Company Plan Management | LeadLink Admin',
  description: 'Admin interface for managing company subscription plans',
};

export default function CompanyPlansAdminPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Company Plan Management
      </h1>
      
      <ExamplesNav />
      
      <div className="mb-8 mx-auto max-w-3xl">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">
            About Company Plan Management
          </h2>
          <p className="mb-4">
            This admin interface demonstrates how to manage subscription plans and assign them to companies. 
            It provides a practical example of how to implement subscription-based access control in your 
            Firebase application.
          </p>
          <p>
            <strong>Note:</strong> This page is restricted to admin users only. If you're not logged in with 
            an admin account, you'll see an access denied message.
          </p>
        </div>
      </div>
      
      <AdminOnly fallback={
        <div className="p-8 bg-red-50 border border-red-200 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-2 text-red-700">Admin Access Required</h2>
          <p className="text-red-600">
            You need administrator privileges to access this page. Please sign in with an admin account.
          </p>
        </div>
      }>
        <CompanyPlanAssignment />
      </AdminOnly>
      
      <div className="mt-12 mx-auto max-w-3xl">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Implementation Details</h2>
          <p className="mb-4">
            The subscription management system includes:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>
              <strong>Plan Management</strong> - Create and manage subscription plans with features and limits
            </li>
            <li>
              <strong>Company Assignment</strong> - Assign plans to companies with start/end dates
            </li>
            <li>
              <strong>Subscription Status</strong> - Track active, cancelled, and expired subscriptions
            </li>
            <li>
              <strong>Feature Access</strong> - Control access to features based on subscription plans
            </li>
          </ul>
          <p>
            This implementation uses Firestore to store subscription data, with relationships between 
            companies and subscription plans. The UI demonstrates how to manage these relationships and 
            enforce access control based on subscriptions.
          </p>
        </div>
      </div>
    </div>
  );
} 