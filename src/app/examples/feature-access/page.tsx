import { FeatureAccessExample } from "@/components/examples/FeatureAccessExample";

export const metadata = {
  title: 'Feature Access Controls | LeadLink',
  description: 'Example of subscription-based feature access controls in LeadLink',
};

export default function FeatureAccessPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Subscription-Based Feature Access
      </h1>
      
      <div className="mb-8 mx-auto max-w-3xl">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">
            About Feature Access Control
          </h2>
          <p className="mb-4">
            This example demonstrates how to implement subscription-based feature access 
            in your application using Firebase and custom components.
          </p>
          <p className="mb-4">
            The <code className="bg-blue-100 px-2 py-1 rounded">FeatureAccessWrapper</code> component 
            checks if the current user's company has access to a specific feature based on their 
            subscription plan, and conditionally renders content.
          </p>
          <p>
            It also supports usage limits, showing warnings when approaching limits and 
            blocking access when limits are exceeded.
          </p>
        </div>
      </div>
      
      <FeatureAccessExample />
      
      <div className="mt-12 mx-auto max-w-3xl">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Implementation Details</h2>
          <p className="mb-4">
            The feature access system is built on these components:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>
              <strong>CompanySubscription</strong> - Links companies to subscription plans
            </li>
            <li>
              <strong>SubscriptionPlan</strong> - Defines available features and their limits
            </li>
            <li>
              <strong>SubscriptionService</strong> - Handles feature access checks and limit validation
            </li>
            <li>
              <strong>FeatureAccessWrapper</strong> - React component that wraps UI elements with feature checks
            </li>
          </ul>
          <p>
            This system allows for flexible permission models where features can be enabled or 
            disabled based on subscription plans, with usage limits that can be tracked and enforced.
          </p>
        </div>
      </div>
    </div>
  );
} 