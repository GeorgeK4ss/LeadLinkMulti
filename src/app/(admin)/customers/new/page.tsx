"use client";

import { NewCustomerForm } from "@/components/customers/NewCustomerForm";
import { useRouter } from "next/navigation";

export default function NewCustomerPage() {
  const router = useRouter();

  const handleSuccess = (customerId: string) => {
    router.push(`/customers/${customerId}`);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Add New Customer</h1>
      <NewCustomerForm 
        tenantId="default" 
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
} 