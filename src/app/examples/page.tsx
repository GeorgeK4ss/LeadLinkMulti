import { ExamplesNav } from "@/components/ExamplesNav";

export const metadata = {
  title: 'Firebase Implementation Examples | LeadLink',
  description: 'Examples of Firebase implementation features in LeadLink',
};

export default function ExamplesPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Firebase Implementation Examples
      </h1>
      
      <ExamplesNav />
      
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">About These Examples</h2>
        
        <p className="mb-4">
          This section demonstrates various Firebase implementation features that have been 
          integrated into the LeadLink application. Each example shows a different aspect of 
          the Firebase integration, from authentication and security to database access and 
          subscription management.
        </p>
        
        <p className="mb-4">
          These examples are designed to showcase best practices and provide a reference for 
          how to implement similar features in your own projects using Firebase.
        </p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
          <h3 className="font-medium text-yellow-800 mb-2">Implementation Status</h3>
          <p className="text-yellow-700">
            These examples represent work-in-progress implementations of the Firebase infrastructure. 
            Some features may still be under development or require additional configuration.
          </p>
        </div>
        
        <h3 className="font-medium mb-2">Available Examples:</h3>
        
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Role-Based Access Control</strong> - Using Firebase custom claims to implement 
            role-based security and permissions
          </li>
          <li>
            <strong>Feature Access Control</strong> - Controlling access to features based on 
            subscription plans and usage limits
          </li>
          <li>
            <strong>Company Plan Management</strong> - Admin interface for managing subscription 
            plans and company assignments
          </li>
        </ul>
      </div>
    </div>
  );
} 