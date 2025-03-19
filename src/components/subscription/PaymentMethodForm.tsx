import React, { useState } from 'react';
import { TextField, Button, Box, FormControlLabel, Checkbox, Typography, CircularProgress } from '@mui/material';
import { CreditCard as CreditCardIcon } from '@mui/icons-material';

// Mock payment token generation - in a real app, this would use Stripe/Braintree/etc
const generatePaymentToken = async (cardData: any): Promise<string> => {
  // Simulate API call to payment provider
  await new Promise(resolve => setTimeout(resolve, 1000));
  return `pm_${Math.random().toString(36).substring(2, 15)}`;
};

interface PaymentMethodFormProps {
  onSubmit: (paymentToken: string, makeDefault: boolean) => Promise<boolean>;
  processing: boolean;
}

const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({ onSubmit, processing }) => {
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardholderName, setCardholderName] = useState<string>('');
  const [expiryMonth, setExpiryMonth] = useState<string>('');
  const [expiryYear, setExpiryYear] = useState<string>('');
  const [cvc, setCvc] = useState<string>('');
  const [makeDefault, setMakeDefault] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!cardNumber.trim()) {
      newErrors.cardNumber = 'Card number is required';
    } else if (!/^\d{16}$/.test(cardNumber.replace(/\s/g, ''))) {
      newErrors.cardNumber = 'Please enter a valid 16-digit card number';
    }
    
    if (!cardholderName.trim()) {
      newErrors.cardholderName = 'Cardholder name is required';
    }
    
    if (!expiryMonth.trim()) {
      newErrors.expiryMonth = 'Required';
    } else if (!/^(0[1-9]|1[0-2])$/.test(expiryMonth)) {
      newErrors.expiryMonth = 'Invalid month (01-12)';
    }
    
    if (!expiryYear.trim()) {
      newErrors.expiryYear = 'Required';
    } else if (!/^\d{4}$/.test(expiryYear)) {
      newErrors.expiryYear = 'Invalid year (YYYY)';
    } else {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const year = parseInt(expiryYear, 10);
      const month = parseInt(expiryMonth, 10);
      
      if (year < currentYear || (year === currentYear && month < currentMonth)) {
        newErrors.expiryYear = 'Card has expired';
      }
    }
    
    if (!cvc.trim()) {
      newErrors.cvc = 'Required';
    } else if (!/^\d{3,4}$/.test(cvc)) {
      newErrors.cvc = 'Invalid CVC';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || submitting || processing) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Format card data
      const cardData = {
        number: cardNumber.replace(/\s/g, ''),
        name: cardholderName,
        expMonth: expiryMonth,
        expYear: expiryYear,
        cvc
      };
      
      // Generate payment token (in real app, this would be done by payment provider SDK)
      const paymentToken = await generatePaymentToken(cardData);
      
      // Submit to parent component
      const success = await onSubmit(paymentToken, makeDefault);
      
      if (success) {
        // Reset form
        setCardNumber('');
        setCardholderName('');
        setExpiryMonth('');
        setExpiryYear('');
        setCvc('');
      }
    } catch (error) {
      console.error('Error processing payment method:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Format card number with spaces
  const formatCardNumber = (value: string): string => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };
  
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCardNumber(e.target.value);
    setCardNumber(formattedValue);
  };
  
  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <CreditCardIcon sx={{ mr: 1 }} />
        <Typography variant="h6">Add Payment Method</Typography>
      </Box>
      
      <TextField
        label="Cardholder Name"
        variant="outlined"
        fullWidth
        margin="normal"
        value={cardholderName}
        onChange={(e) => setCardholderName(e.target.value)}
        error={!!errors.cardholderName}
        helperText={errors.cardholderName}
        disabled={submitting || processing}
        required
      />
      
      <TextField
        label="Card Number"
        variant="outlined"
        fullWidth
        margin="normal"
        value={cardNumber}
        onChange={handleCardNumberChange}
        error={!!errors.cardNumber}
        helperText={errors.cardNumber}
        disabled={submitting || processing}
        required
        inputProps={{ maxLength: 19 }} // 16 digits + 3 spaces
        placeholder="1234 5678 9012 3456"
      />
      
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Month (MM)"
          variant="outlined"
          margin="normal"
          value={expiryMonth}
          onChange={(e) => setExpiryMonth(e.target.value)}
          error={!!errors.expiryMonth}
          helperText={errors.expiryMonth}
          disabled={submitting || processing}
          required
          inputProps={{ maxLength: 2 }}
          placeholder="MM"
          sx={{ width: '110px' }}
        />
        
        <TextField
          label="Year (YYYY)"
          variant="outlined"
          margin="normal"
          value={expiryYear}
          onChange={(e) => setExpiryYear(e.target.value)}
          error={!!errors.expiryYear}
          helperText={errors.expiryYear}
          disabled={submitting || processing}
          required
          inputProps={{ maxLength: 4 }}
          placeholder="YYYY"
          sx={{ width: '120px' }}
        />
        
        <TextField
          label="CVC"
          variant="outlined"
          margin="normal"
          value={cvc}
          onChange={(e) => setCvc(e.target.value)}
          error={!!errors.cvc}
          helperText={errors.cvc}
          disabled={submitting || processing}
          required
          inputProps={{ maxLength: 4 }}
          type="password"
          sx={{ width: '100px' }}
        />
      </Box>
      
      <FormControlLabel
        control={
          <Checkbox
            checked={makeDefault}
            onChange={(e) => setMakeDefault(e.target.checked)}
            disabled={submitting || processing}
          />
        }
        label="Make default payment method"
      />
      
      <Box sx={{ mt: 2 }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={submitting || processing}
          startIcon={submitting || processing ? <CircularProgress size={20} /> : null}
        >
          {submitting || processing ? 'Processing...' : 'Add Payment Method'}
        </Button>
      </Box>
    </Box>
  );
};

export default PaymentMethodForm; 