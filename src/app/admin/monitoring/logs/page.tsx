import { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Logs | LeadLink CRM",
  description: "View and manage system logs for the LeadLink CRM system",
};

export default function LogsPage() {
  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-6">System Logs</h1>
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 text-amber-500">
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-amber-700">
              Logs module is currently under development. Check back soon for complete functionality.
            </p>
          </div>
        </div>
      </div>
      <div className="bg-white shadow-md rounded-lg p-6">
        <p className="text-gray-600 mb-4">
          The logs module will provide the following features:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>Real-time log streaming from all system components</li>
          <li>Advanced filtering and search capabilities</li>
          <li>Log level selection (INFO, WARNING, ERROR, DEBUG)</li>
          <li>Component-specific log views</li>
          <li>Log export and download functionality</li>
          <li>Log retention configuration</li>
          <li>Automated log analysis for system issues</li>
        </ul>
      </div>
    </div>
  );
} 