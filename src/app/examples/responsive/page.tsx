"use client";

import React from 'react';
import { ResponsiveComponentsTest } from '@/components/testing/ResponsiveComponentsTest';

export default function ResponsiveExamplePage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Mobile Responsive Components Test</h1>
      <p className="text-muted-foreground mb-6">
        This page demonstrates all of our mobile-optimized components. Test on different screen sizes to see how they adapt.
      </p>
      <ResponsiveComponentsTest />
    </div>
  );
} 