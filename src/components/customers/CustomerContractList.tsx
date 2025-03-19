"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CustomerContractListProps {
  customerId: string;
  tenantId: string;
  onUpdate?: () => void;
}

export const CustomerContractList: React.FC<CustomerContractListProps> = ({ 
  customerId,
  tenantId,
  onUpdate
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Contracts</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Contracts for customer ID: {customerId}</p>
        {/* Placeholder for actual contract list */}
      </CardContent>
    </Card>
  );
};

export default CustomerContractList; 