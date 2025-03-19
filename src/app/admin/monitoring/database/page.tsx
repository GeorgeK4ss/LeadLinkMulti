import { Metadata } from "next";
import { DatabaseMonitor } from "@/components/ui/database-monitor";

export const metadata: Metadata = {
  title: "Database Monitoring | LeadLink CRM",
  description: "Monitor database performance, queries, and storage for the LeadLink CRM system",
};

export default function DatabaseMonitoringPage() {
  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <DatabaseMonitor />
    </div>
  );
} 