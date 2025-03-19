import { CustomerProfile } from "@/components/customers/CustomerProfile";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customer Details - LeadLink CRM",
  description: "View and manage customer details",
};

// Using any as a temporary workaround for the type issue
export default function CustomerDetailPage({ 
  params 
}: any) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Customer Details</h1>
      <CustomerProfile customerId={params.id} tenantId="default" />
    </div>
  );
} 