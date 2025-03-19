import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

export default function BillingPage() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Billing History</Typography>
      <Alert severity="info" sx={{ my: 2 }}>
        This page is under development. Billing history will be available soon.
      </Alert>
    </Box>
  );
} 