import { UnifiedAccessExample } from "@/components/examples/UnifiedAccessExample";
import { ExamplesNav } from "@/components/ExamplesNav";

export const metadata = {
  title: 'Unified Access Control | LeadLink',
  description: 'Example of unified access controls combining RBAC and subscription features',
};

export default function UnifiedAccessPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Unified Access Control
      </h1>
      
      <ExamplesNav />
      
      <div className="mb-8 mx-auto max-w-3xl">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">
            About Unified Access Control
          </h2>
          <p className="mb-4">
            This example demonstrates a powerful unified access control approach that combines
            role-based access control (RBAC) with subscription-based feature access.
          </p>
          <p className="mb-4">
            The <code className="bg-blue-100 px-2 py-1 rounded">AccessControl</code> component
            checks both the user's role/permissions AND the company's subscription plan to
            determine access rights. This allows for complex access patterns like:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Admin can access all features regardless of subscription</li>
            <li>Regular users can only access features included in their company's plan</li>
            <li>Premium features can require both the right role AND the right subscription</li>
            <li>Feature usage can be tracked with warnings when approaching limits</li>
          </ul>
        </div>
      </div>
      
      <UnifiedAccessExample />
      
      <div className="mt-12 mx-auto max-w-3xl">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Implementation Details</h2>
          <p className="mb-4">
            The unified access control system combines:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>
              <strong>RBAC System:</strong> Role-based access with custom claims from Firebase Auth
            </li>
            <li>
              <strong>Feature Access:</strong> Subscription-based feature control with usage limits
            </li>
            <li>
              <strong>Unified Component:</strong> Combined checks for both permission and subscription status
            </li>
            <li>
              <strong>Helper Components:</strong> Simplified components for common access patterns
            </li>
          </ul>
          <p>
            This creates a flexible and powerful security model that can accommodate complex
            business requirements while maintaining clean, readable code.
          </p>
        </div>
      </div>
    </div>
  );
} 