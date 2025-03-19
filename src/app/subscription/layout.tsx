import React, { ReactNode } from 'react';
import { Box, Container, Typography, Paper, Button, Stack } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SubscriptionLayoutProps {
  children: ReactNode;
}

export default function SubscriptionLayout({ children }: SubscriptionLayoutProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Subscription Management
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage your subscription plans, payment methods, usage, and billing.
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', pb: 1, mb: 2 }}>
          <Stack direction="row" spacing={2}>
            <Link href="/subscription" passHref style={{ textDecoration: 'none' }}>
              <Button 
                color={isActive('/subscription') ? 'primary' : 'inherit'}
                variant={isActive('/subscription') ? 'contained' : 'text'}
              >
                Overview
              </Button>
            </Link>
            <Link href="/subscription/metering" passHref style={{ textDecoration: 'none' }}>
              <Button 
                color={isActive('/subscription/metering') ? 'primary' : 'inherit'}
                variant={isActive('/subscription/metering') ? 'contained' : 'text'}
              >
                Usage Metering
              </Button>
            </Link>
            <Link href="/subscription/billing" passHref style={{ textDecoration: 'none' }}>
              <Button 
                color={isActive('/subscription/billing') ? 'primary' : 'inherit'}
                variant={isActive('/subscription/billing') ? 'contained' : 'text'}
              >
                Billing History
              </Button>
            </Link>
            <Link href="/subscription/payment" passHref style={{ textDecoration: 'none' }}>
              <Button 
                color={isActive('/subscription/payment') ? 'primary' : 'inherit'}
                variant={isActive('/subscription/payment') ? 'contained' : 'text'}
              >
                Payment Methods
              </Button>
            </Link>
          </Stack>
        </Box>
      </Paper>

      {children}
    </Container>
  );
} 