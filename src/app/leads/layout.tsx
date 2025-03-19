import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { ReactNode } from "react";

export default function LeadsLayout({ children }: { children: ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
} 