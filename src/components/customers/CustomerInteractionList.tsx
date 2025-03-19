"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CustomerInteractionListProps {
  customerId: string;
  tenantId: string;
  onUpdate?: () => void;
}

export const CustomerInteractionList: React.FC<CustomerInteractionListProps> = ({ 
  customerId,
  tenantId,
  onUpdate
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Interactions</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Interactions for customer ID: {customerId}</p>
        {/* Placeholder for actual interaction list */}
      </CardContent>
    </Card>
  );
};

export default CustomerInteractionList; 