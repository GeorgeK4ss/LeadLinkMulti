"use client";

import React from 'react';
import { CollapsibleSectionExample } from '@/components/examples/CollapsibleSectionExample';

export default function CollapsibleExamplePage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Collapsible Sections Example</h1>
      <p className="text-muted-foreground mb-6">
        This page demonstrates our collapsible section components. These components are designed to save space by hiding detailed information until needed, especially useful on mobile devices.
      </p>
      <CollapsibleSectionExample />
    </div>
  );
} 