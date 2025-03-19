import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, Button } from '@mui/material';
import Link from 'next/link';
import { 
  Assessment as MeteringIcon,
  Receipt as BillingIcon,
  CreditCard as PaymentIcon
} from '@mui/icons-material';
import SubscriptionManagementUI from '@/components/subscription/SubscriptionManagementUI';

export default function SubscriptionPage() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Subscription Overview</Typography>
      
      <SubscriptionManagementUI />
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>Quick Links</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <MeteringIcon sx={{ fontSize: 48, mb: 2, color: 'primary.main' }} />
                <Typography variant="h6" gutterBottom>Usage Metering</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Monitor your resource usage, check limits, and view usage history.
                </Typography>
                <Link href="/subscription/metering" passHref style={{ textDecoration: 'none' }}>
                  <Button variant="outlined" color="primary">View Usage</Button>
                </Link>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <BillingIcon sx={{ fontSize: 48, mb: 2, color: 'primary.main' }} />
                <Typography variant="h6" gutterBottom>Billing History</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  View your invoices, payment history, and billing information.
                </Typography>
                <Link href="/subscription/billing" passHref style={{ textDecoration: 'none' }}>
                  <Button variant="outlined" color="primary">View Billing</Button>
                </Link>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <PaymentIcon sx={{ fontSize: 48, mb: 2, color: 'primary.main' }} />
                <Typography variant="h6" gutterBottom>Payment Methods</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Manage your payment methods, add new cards, or update details.
                </Typography>
                <Link href="/subscription/payment" passHref style={{ textDecoration: 'none' }}>
                  <Button variant="outlined" color="primary">Manage Payments</Button>
                </Link>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
} 