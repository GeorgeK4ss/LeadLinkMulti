import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

export default function PaymentMethodsPage() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Payment Methods</Typography>
      <Alert severity="info" sx={{ my: 2 }}>
        This page is under development. Payment method management will be available soon.
      </Alert>
    </Box>
  );
} 