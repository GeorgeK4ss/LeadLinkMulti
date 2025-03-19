import { CompanyPlanAssignment } from '@/components/admin/CompanyPlanAssignment';

export const metadata = {
  title: 'Company Plan Assignment | LeadLink Admin',
  description: 'Assign subscription plans to companies',
};

export default function CompanyPlansPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Company Plan Management</h1>
        <p className="text-gray-600 mt-2">
          Assign subscription plans to companies and manage their subscriptions.
        </p>
      </div>

      <CompanyPlanAssignment />
    </div>
  );
} 