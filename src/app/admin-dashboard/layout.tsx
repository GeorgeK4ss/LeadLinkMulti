import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { ReactNode } from "react";

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
} 