"use client";

import React, { useState, useEffect } from 'react';
import { HelpCircle, X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Define help content structure
interface HelpItem {
  title: string;
  content: React.ReactNode;
  link?: string;
}

interface HelpSection {
  id: string;
  title: string;
  items: HelpItem[];
}

// Help content mapped by path
const helpContent: Record<string, HelpSection[]> = {
  '/dashboard': [
    {
      id: 'dashboard-basics',
      title: 'Dashboard Basics',
      items: [
        {
          title: 'Overview',
          content: 'The dashboard provides a quick overview of your key metrics and recent activity.',
          link: '/help#dashboard',
        },
        {
          title: 'Key Performance Indicators',
          content: 'KPIs show your most important metrics at a glance, including lead count, conversion rates, and revenue.',
        },
        {
          title: 'Recent Activity',
          content: 'The activity timeline shows recent actions by you and your team members.',
        },
      ],
    },
    {
      id: 'dashboard-customization',
      title: 'Customization',
      items: [
        {
          title: 'Rearranging Widgets',
          content: 'You can drag and drop widgets to rearrange your dashboard layout.',
        },
        {
          title: 'Adding Widgets',
          content: 'Click the "Add Widget" button to add new widgets to your dashboard.',
        },
        {
          title: 'Filtering Data',
          content: 'Use the date range selector to filter dashboard data for specific time periods.',
        },
      ],
    },
  ],
  '/leads': [
    {
      id: 'leads-basics',
      title: 'Lead Management',
      items: [
        {
          title: 'What is a Lead?',
          content: 'A lead is a potential customer who has shown interest in your product or service.',
          link: '/help#lead-management',
        },
        {
          title: 'Creating Leads',
          content: 'Click the "Add Lead" button to create a new lead. Fill in the required information and click Save.',
        },
        {
          title: 'Lead Stages',
          content: 'Leads progress through various stages in your sales pipeline, from New to Qualified to Converted.',
        },
      ],
    },
  ],
  '/customers': [
    {
      id: 'customers-basics',
      title: 'Customer Management',
      items: [
        {
          title: 'Customer Records',
          content: 'Customer records contain all information about your customers, including contact details and purchase history.',
          link: '/help#customer-management',
        },
        {
          title: 'Customer Health',
          content: 'The health score indicates the status of your relationship with a customer, based on activity and engagement.',
        },
      ],
    },
  ],
};

// Default section for paths without specific help content
const defaultHelpContent: HelpSection[] = [
  {
    id: 'general-help',
    title: 'General Help',
    items: [
      {
        title: 'Getting Started',
        content: 'Need help getting started with LeadLink CRM? Check out our comprehensive documentation.',
        link: '/help#getting-started',
      },
      {
        title: 'Contact Support',
        content: 'Can\'t find what you\'re looking for? Our support team is available to help.',
        link: '/contact',
      },
    ],
  },
];

export const ContextHelp: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [currentItem, setCurrentItem] = useState(0);
  const pathname = usePathname();
  
  // Get context-specific help content based on the current path
  const getHelpContent = () => {
    // Match path with available help content
    for (const path in helpContent) {
      if (pathname.startsWith(path)) {
        return helpContent[path];
      }
    }
    return defaultHelpContent;
  };
  
  const sections = getHelpContent();
  const currentSectionData = sections[currentSection];
  const currentItemData = currentSectionData?.items[currentItem];
  
  // Reset to first section/item when path changes
  useEffect(() => {
    setCurrentSection(0);
    setCurrentItem(0);
  }, [pathname]);
  
  // Handle navigation
  const nextItem = () => {
    if (currentItem < currentSectionData.items.length - 1) {
      setCurrentItem(currentItem + 1);
    } else if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
      setCurrentItem(0);
    }
  };
  
  const prevItem = () => {
    if (currentItem > 0) {
      setCurrentItem(currentItem - 1);
    } else if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      setCurrentItem(sections[currentSection - 1].items.length - 1);
    }
  };
  
  return (
    <>
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-30 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
        aria-label="Help"
      >
        <HelpCircle size={20} />
      </button>
      
      {/* Help Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-40 overflow-hidden flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Help Content */}
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{currentSectionData?.title}</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4">
              <h3 className="text-lg font-medium mb-2">{currentItemData?.title}</h3>
              <div className="text-gray-600 mb-4">
                {currentItemData?.content}
              </div>
              
              {currentItemData?.link && (
                <Link 
                  href={currentItemData.link}
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
                >
                  Learn more
                  <ExternalLink size={14} className="ml-1" />
                </Link>
              )}
            </div>
            
            {/* Navigation */}
            <div className="flex items-center justify-between p-4 border-t bg-gray-50 rounded-b-lg">
              <button
                onClick={prevItem}
                disabled={currentSection === 0 && currentItem === 0}
                className={`p-2 rounded-md ${
                  currentSection === 0 && currentItem === 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
                aria-label="Previous tip"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="text-sm text-gray-500">
                {currentItem + 1} of {currentSectionData?.items.length}
              </div>
              
              <button
                onClick={nextItem}
                disabled={
                  currentSection === sections.length - 1 &&
                  currentItem === currentSectionData?.items.length - 1
                }
                className={`p-2 rounded-md ${
                  currentSection === sections.length - 1 &&
                  currentItem === currentSectionData?.items.length - 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
                aria-label="Next tip"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}; 