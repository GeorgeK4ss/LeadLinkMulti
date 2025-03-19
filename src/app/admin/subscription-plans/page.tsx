import { SubscriptionPlanManager } from '@/components/admin/SubscriptionPlanManager';

export const metadata = {
  title: 'Subscription Plan Management | LeadLink Admin',
  description: 'Manage subscription plans and features for customers',
};

export default function SubscriptionPlansPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Subscription Plan Management</h1>
        <p className="text-gray-600 mt-2">
          Create and manage subscription plans that define the features and pricing available to customers.
        </p>
      </div>

      <SubscriptionPlanManager />
    </div>
  );
} 