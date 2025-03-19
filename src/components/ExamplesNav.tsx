'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface ExampleLink {
  href: string;
  label: string;
  description: string;
}

export function ExamplesNav() {
  const pathname = usePathname();
  
  const examples: ExampleLink[] = [
    {
      href: '/examples/rbac',
      label: 'Role-Based Access Control',
      description: 'Demonstrates custom claims for role-based permissions'
    },
    {
      href: '/examples/feature-access',
      label: 'Feature Access Control',
      description: 'Demonstrates subscription-based feature access'
    },
    {
      href: '/examples/unified-access',
      label: 'Unified Access Control',
      description: 'Combines RBAC and subscription-based access'
    },
    {
      href: '/examples/admin/company-plans',
      label: 'Company Plan Management',
      description: 'Admin panel for managing company subscriptions'
    },
    {
      href: '/examples/multi-step-wizard',
      label: 'Multi-Step Wizard',
      description: 'Demonstrates a multi-step form workflow'
    }
  ];
  
  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-8">
      <h2 className="text-lg font-semibold mb-4">Firebase Implementation Examples</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {examples.map(example => (
          <Link 
            key={example.href} 
            href={example.href}
            className={`
              p-4 rounded-lg transition
              ${pathname === example.href 
                ? 'bg-blue-100 border-blue-200 border shadow-sm' 
                : 'bg-white border-gray-100 border hover:bg-blue-50'
              }
            `}
          >
            <div className="font-medium mb-1">{example.label}</div>
            <div className="text-sm text-gray-600">{example.description}</div>
          </Link>
        ))}
      </div>
    </div>
  );
} 