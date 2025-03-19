import { CustomerManagement } from "@/components/customers/CustomerManagement";

export const metadata = {
  title: "Customers - LeadLink CRM",
  description: "Manage your customers in LeadLink CRM",
};

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Customers</h1>
      <CustomerManagement tenantId="default" />
    </div>
  );
} 