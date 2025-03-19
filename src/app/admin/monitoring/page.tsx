import { Metadata } from "next";
import SystemHealthDashboard from "@/components/monitoring/system-health-dashboard";

export const metadata: Metadata = {
  title: "System Monitoring | LeadLink CRM",
  description: "System health monitoring dashboard for the LeadLink CRM platform",
};

export default function MonitoringPage() {
  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-6">System Health Monitoring</h1>
      <div className="mb-6">
        <p className="text-gray-600">
          Welcome to the LeadLink CRM monitoring dashboard. This dashboard provides real-time insights
          into system health, performance metrics, and resource utilization to help maintain optimal
          system operations.
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <SystemHealthDashboard />
      </div>
      
      <div className="mt-8 flex gap-4">
        <a 
          href="/admin/monitoring/performance" 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          View Performance Metrics
        </a>
        <a 
          href="/admin/monitoring/database" 
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          View Database Monitoring
        </a>
        <a 
          href="/admin/monitoring/logs" 
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          View System Logs
        </a>
      </div>
    </div>
  );
} 