"use client";

import React from 'react';
import { CollapsibleSection, CollapsibleGroup } from '@/components/ui/collapsible-section';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Info, 
  FileCog, 
  ShieldCheck, 
  User, 
  Settings, 
  FileText, 
  Bell, 
  ChevronRight,
  CreditCard
} from 'lucide-react';

/**
 * Example component showcasing various uses of the CollapsibleSection component
 */
export function CollapsibleSectionExample() {
  return (
    <div className="space-y-8">
      {/* Basic usage */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Basic Collapsible Sections</h2>
        <CollapsibleSection 
          title="Account Information" 
          summary="View and edit your personal details"
          defaultOpen
        >
          <div className="space-y-4">
            <div>
              <p className="font-medium text-sm">Email Address</p>
              <p className="text-muted-foreground">john.doe@example.com</p>
            </div>
            <div>
              <p className="font-medium text-sm">Full Name</p>
              <p className="text-muted-foreground">John Doe</p>
            </div>
            <div>
              <p className="font-medium text-sm">Phone Number</p>
              <p className="text-muted-foreground">+1 (555) 123-4567</p>
            </div>
            <Button variant="outline" size="sm">Edit Information</Button>
          </div>
        </CollapsibleSection>

        <CollapsibleSection 
          title="Billing Details" 
          summary="Manage your payment methods and billing history"
        >
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="border rounded p-2 mr-4">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">Credit Card</p>
                <p className="text-muted-foreground">**** **** **** 1234</p>
                <p className="text-xs text-muted-foreground">Expires 12/25</p>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span>Current Plan:</span>
              <Badge>Premium</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span>Next Billing Date:</span>
              <span>June 1, 2024</span>
            </div>
            <Button variant="outline" size="sm">Manage Billing</Button>
          </div>
        </CollapsibleSection>
      </div>

      {/* With custom icons */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">With Custom Icons</h2>
        <CollapsibleSection 
          title="Security Settings" 
          icon={<ShieldCheck className="h-5 w-5 text-green-500" />}
          iconPosition="left"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Two-Factor Authentication</span>
              <Badge variant="outline" className="bg-green-50 text-green-700">Enabled</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Password Last Changed</span>
              <span className="text-sm text-muted-foreground">30 days ago</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Login Notifications</span>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Email Only</Badge>
            </div>
            <Button size="sm">Manage Security</Button>
          </div>
        </CollapsibleSection>

        <CollapsibleSection 
          title="System Information" 
          icon={<FileCog className="h-5 w-5 text-blue-500" />}
          iconPosition="left"
        >
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span>2.4.1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated</span>
              <span>April 15, 2024</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Server Region</span>
              <span>US-West</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Database</span>
              <span>v12.3</span>
            </div>
          </div>
        </CollapsibleSection>
      </div>

      {/* Accordion group */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Accordion Behavior (Only one open at a time)</h2>
        <Card>
          <CollapsibleGroup defaultOpenIndex={0}>
            <CollapsibleSection 
              title="Personal Information" 
              icon={<User className="h-4 w-4" />}
              showBorder={false}
              headerClassName="hover:bg-accent"
            >
              <p className="text-sm text-muted-foreground">
                Manage your personal information including your name, email address, and profile photo.
              </p>
              <Button size="sm" className="mt-4" variant="outline">
                Edit Profile
              </Button>
            </CollapsibleSection>

            <CollapsibleSection 
              title="Account Settings" 
              icon={<Settings className="h-4 w-4" />}
              showBorder={false}
              headerClassName="hover:bg-accent"
            >
              <p className="text-sm text-muted-foreground">
                Configure your account settings, language preferences, and timezone.
              </p>
              <Button size="sm" className="mt-4" variant="outline">
                Manage Settings
              </Button>
            </CollapsibleSection>

            <CollapsibleSection 
              title="Documents" 
              icon={<FileText className="h-4 w-4" />}
              showBorder={false}
              headerClassName="hover:bg-accent"
            >
              <p className="text-sm text-muted-foreground">
                Access and manage your documents, contracts, and other important files.
              </p>
              <Button size="sm" className="mt-4" variant="outline">
                View Documents
              </Button>
            </CollapsibleSection>

            <CollapsibleSection 
              title="Notifications" 
              icon={<Bell className="h-4 w-4" />}
              showBorder={false}
              headerClassName="hover:bg-accent"
            >
              <p className="text-sm text-muted-foreground">
                Configure how and when you receive notifications from the system.
              </p>
              <Button size="sm" className="mt-4" variant="outline">
                Notification Settings
              </Button>
            </CollapsibleSection>
          </CollapsibleGroup>
        </Card>
      </div>

      {/* Mobile-optimized FAQ example */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Mobile-optimized FAQ</h2>
        <p className="text-muted-foreground">Perfect for dense information that needs to be accessible on mobile devices.</p>
        
        <CollapsibleGroup>
          <CollapsibleSection 
            title="How do I reset my password?"
            icon={<Info className="h-4 w-4 text-blue-500" />}
            iconPosition="left"
          >
            <p className="text-sm">
              To reset your password, go to the login page and click on "Forgot Password". 
              Enter your email address and follow the instructions sent to your inbox.
            </p>
          </CollapsibleSection>
          
          <CollapsibleSection 
            title="What payment methods do you accept?"
            icon={<Info className="h-4 w-4 text-blue-500" />}
            iconPosition="left"
          >
            <p className="text-sm">
              We accept all major credit cards (Visa, Mastercard, American Express), 
              PayPal, and bank transfers. For enterprise customers, we also offer invoicing options.
            </p>
          </CollapsibleSection>
          
          <CollapsibleSection 
            title="How can I cancel my subscription?"
            icon={<Info className="h-4 w-4 text-blue-500" />}
            iconPosition="left"
          >
            <p className="text-sm">
              You can cancel your subscription at any time from your account settings. 
              Go to "Billing" and click "Cancel Subscription". Your service will continue until the end of your current billing period.
            </p>
          </CollapsibleSection>
          
          <CollapsibleSection 
            title="Is my data secure?"
            icon={<Info className="h-4 w-4 text-blue-500" />}
            iconPosition="left"
          >
            <p className="text-sm">
              Yes, we take data security very seriously. All data is encrypted both in transit and at rest. 
              We use industry-standard security practices and regular security audits to ensure your data remains protected.
            </p>
          </CollapsibleSection>
        </CollapsibleGroup>
      </div>

      {/* Multi-level collapsible for document structure */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Multi-level Structure Example</h2>
        <CollapsibleSection 
          title="Company Handbook" 
          headerClassName="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <div className="space-y-2">
            <CollapsibleSection 
              title="1. Introduction"
              iconPosition="left"
              icon={<ChevronRight className="h-4 w-4" />}
              showBorder={false}
              headerClassName="hover:bg-accent rounded-md px-2 py-2"
              contentClassName="pl-6"
            >
              <CollapsibleGroup>
                <CollapsibleSection 
                  title="1.1 Company Mission"
                  showBorder={false}
                  headerClassName="text-sm hover:bg-accent/50 rounded-md px-2 py-1"
                  contentClassName="pl-4"
                >
                  <p className="text-sm text-muted-foreground">
                    Our mission is to provide innovative solutions that help businesses grow and thrive in the digital age.
                  </p>
                </CollapsibleSection>
                
                <CollapsibleSection 
                  title="1.2 Company Values"
                  showBorder={false}
                  headerClassName="text-sm hover:bg-accent/50 rounded-md px-2 py-1"
                  contentClassName="pl-4"
                >
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li>Integrity in all actions</li>
                    <li>Customer-first approach</li>
                    <li>Innovation and creativity</li>
                    <li>Teamwork and collaboration</li>
                  </ul>
                </CollapsibleSection>
              </CollapsibleGroup>
            </CollapsibleSection>
            
            <CollapsibleSection 
              title="2. Employment Policies"
              iconPosition="left"
              icon={<ChevronRight className="h-4 w-4" />}
              showBorder={false}
              headerClassName="hover:bg-accent rounded-md px-2 py-2"
              contentClassName="pl-6"
            >
              <CollapsibleGroup>
                <CollapsibleSection 
                  title="2.1 Working Hours"
                  showBorder={false}
                  headerClassName="text-sm hover:bg-accent/50 rounded-md px-2 py-1"
                  contentClassName="pl-4"
                >
                  <p className="text-sm text-muted-foreground">
                    Standard working hours are 9:00 AM to 5:00 PM, Monday through Friday. 
                    Flexible working arrangements are available upon approval from your manager.
                  </p>
                </CollapsibleSection>
                
                <CollapsibleSection 
                  title="2.2 Remote Work Policy"
                  showBorder={false}
                  headerClassName="text-sm hover:bg-accent/50 rounded-md px-2 py-1"
                  contentClassName="pl-4"
                >
                  <p className="text-sm text-muted-foreground">
                    Employees may work remotely up to 3 days per week. 
                    All remote work must be coordinated with your team and approved by your manager.
                  </p>
                </CollapsibleSection>
              </CollapsibleGroup>
            </CollapsibleSection>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
} 