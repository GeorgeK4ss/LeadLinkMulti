"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CustomerOpportunitiesProps {
  customerId: string;
  tenantId: string;
  onUpdate?: () => void;
}

export const CustomerOpportunities: React.FC<CustomerOpportunitiesProps> = ({ 
  customerId,
  tenantId,
  onUpdate
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Opportunities</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Opportunities for customer ID: {customerId}</p>
        {/* Placeholder for actual opportunities list */}
      </CardContent>
    </Card>
  );
};

export default CustomerOpportunities; 