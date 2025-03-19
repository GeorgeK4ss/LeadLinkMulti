import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
} 