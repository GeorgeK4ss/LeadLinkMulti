import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { StructuredData } from '@/components/seo/StructuredData';

export const metadata: Metadata = {
  title: 'Help & Documentation | LeadLink CRM',
  description: 'Comprehensive help and documentation for using LeadLink CRM',
};

export default function HelpPage() {
  return (
    <div className="bg-white min-h-screen">
      <header className="bg-indigo-600 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">LeadLink CRM Documentation</h1>
          <p className="text-xl opacity-90">
            Everything you need to know to get the most out of LeadLink CRM
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="md:w-1/4">
            <nav className="sticky top-4 bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-bold mb-4 pb-2 border-b">Documentation</h2>
              <ul className="space-y-2">
                <li>
                  <Link href="#getting-started" className="text-indigo-600 hover:underline">
                    Getting Started
                  </Link>
                </li>
                <li>
                  <Link href="#dashboard" className="text-indigo-600 hover:underline">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="#lead-management" className="text-indigo-600 hover:underline">
                    Lead Management
                  </Link>
                </li>
                <li>
                  <Link href="#customer-management" className="text-indigo-600 hover:underline">
                    Customer Management
                  </Link>
                </li>
                <li>
                  <Link href="#document-management" className="text-indigo-600 hover:underline">
                    Document Management
                  </Link>
                </li>
                <li>
                  <Link href="#reporting" className="text-indigo-600 hover:underline">
                    Reporting
                  </Link>
                </li>
                <li>
                  <Link href="#settings" className="text-indigo-600 hover:underline">
                    Settings
                  </Link>
                </li>
                <li>
                  <Link href="#mobile-app" className="text-indigo-600 hover:underline">
                    Mobile App
                  </Link>
                </li>
                <li>
                  <Link href="#integrations" className="text-indigo-600 hover:underline">
                    Integrations
                  </Link>
                </li>
                <li>
                  <Link href="#faqs" className="text-indigo-600 hover:underline">
                    FAQs
                  </Link>
                </li>
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <div className="md:w-3/4">
            <section id="getting-started" className="mb-12">
              <h2 className="text-2xl font-bold mb-4 pb-2 border-b">Getting Started</h2>
              <div className="prose max-w-none">
                <h3>Welcome to LeadLink CRM</h3>
                <p>
                  LeadLink CRM is a powerful tool for managing your leads, customers, and sales pipeline. 
                  This documentation will help you get started with LeadLink CRM and make the most of its features.
                </p>
                
                <h3>Creating Your Account</h3>
                <p>
                  To create an account, click the "Register" button on the login page. You'll need to enter your email address, 
                  create a password, and provide some basic information about your company.
                </p>
                
                <h3>Setting Up Your Profile</h3>
                <p>
                  After logging in for the first time, you should complete your profile information. This will help personalize your experience
                  and ensure that you get the most out of LeadLink CRM.
                </p>
                
                <h3>Navigating the Interface</h3>
                <p>
                  The main navigation menu is located on the left side of the screen, which provides access to all major sections of LeadLink CRM.
                  These sections include Dashboard, Leads, Customers, Documents, Reports, and Settings.
                </p>
              </div>
            </section>

            <section id="dashboard" className="mb-12">
              <h2 className="text-2xl font-bold mb-4 pb-2 border-b">Dashboard</h2>
              <div className="prose max-w-none">
                <p>
                  The dashboard provides an overview of your sales performance, recent activities, and key metrics.
                  It's designed to give you a quick snapshot of what's happening in your business.
                </p>
                
                <h3>Key Performance Indicators (KPIs)</h3>
                <p>
                  The top section of the dashboard displays key performance indicators, including:
                </p>
                <ul>
                  <li>Total leads</li>
                  <li>Qualified leads</li>
                  <li>Lead conversion rate</li>
                  <li>Active customers</li>
                  <li>Revenue metrics</li>
                </ul>
                
                <h3>Recent Activity</h3>
                <p>
                  The activity timeline shows recent actions taken by you and your team, such as new leads added,
                  customer status changes, and document updates.
                </p>
                
                <h3>Quick Actions</h3>
                <p>
                  The quick action buttons allow you to quickly perform common tasks, such as adding a new lead,
                  creating a customer record, or scheduling a follow-up.
                </p>
              </div>
            </section>

            {/* Additional sections would continue here */}
            <section id="lead-management" className="mb-12">
              <h2 className="text-2xl font-bold mb-4 pb-2 border-b">Lead Management</h2>
              <div className="prose max-w-none">
                <p>
                  The Leads section allows you to track and manage all your sales leads throughout the sales process.
                </p>
                {/* Lead management documentation content would go here */}
              </div>
            </section>

            <div className="mt-12 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Need more help?</h3>
              <p className="mb-4">If you couldn't find what you're looking for, please reach out to our support team.</p>
              <Link
                href="/contact"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </main>

      <StructuredData
        type="breadcrumbs"
        data={[
          { name: 'Home', url: 'https://leadlink-crm.com/' },
          { name: 'Help & Documentation', url: 'https://leadlink-crm.com/help' },
        ]}
      />
    </div>
  );
} 