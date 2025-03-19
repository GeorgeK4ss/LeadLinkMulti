"use client";

import React from 'react';
import { MobileReportExample } from '@/components/examples/MobileReportExample';

export default function ReportsExamplePage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Mobile-Optimized Reports Example</h1>
      <p className="text-muted-foreground mb-6">
        This page demonstrates our mobile-optimized report viewer component. Test on different screen sizes to see how it adapts.
      </p>
      <MobileReportExample />
    </div>
  );
} 