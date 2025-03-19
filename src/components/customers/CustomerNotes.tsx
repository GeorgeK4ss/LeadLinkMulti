"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CustomerNotesProps {
  customerId: string;
  tenantId: string;
  onUpdate?: () => void;
}

export const CustomerNotes: React.FC<CustomerNotesProps> = ({ 
  customerId,
  tenantId,
  onUpdate
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Notes</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Notes for customer ID: {customerId}</p>
        {/* Placeholder for actual notes */}
      </CardContent>
    </Card>
  );
};

export default CustomerNotes; 