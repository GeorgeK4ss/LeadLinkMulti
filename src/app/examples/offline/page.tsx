"use client";

import React from 'react';
import { OfflineSupportExample } from '@/components/examples/OfflineSupportExample';

export default function OfflineSupportPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Offline Support</h1>
      <p className="text-muted-foreground mb-6">
        This page demonstrates our offline-first components that provide a seamless experience
        even when users have limited or no connectivity. These components are designed to handle
        network disruptions gracefully and maintain functionality offline.
      </p>
      <OfflineSupportExample />
    </div>
  );
} 