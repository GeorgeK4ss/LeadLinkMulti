import React from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Tooltip,
  Link
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  CreditCard as CreditCardIcon,
  Sync as ProcessingIcon,
  Cancel as CancelIcon,
  Reply as RefundIcon,
  Gavel as DisputeIcon
} from '@mui/icons-material';

// Import PaymentStatus enum directly or redefine it here
enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  CANCELED = 'canceled',
  DISPUTED = 'disputed'
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description?: string;
  createdAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  refundedAt?: Date;
  receiptUrl?: string;
  refundAmount?: number;
}

interface PaymentHistoryTableProps {
  payments: Payment[];
}

const PaymentHistoryTable: React.FC<PaymentHistoryTableProps> = ({ payments }) => {
  // Format date to locale string
  const formatDate = (date: Date): string => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Get status icon based on payment status
  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return <SuccessIcon fontSize="small" color="success" />;
      case PaymentStatus.FAILED:
        return <ErrorIcon fontSize="small" color="error" />;
      case PaymentStatus.PENDING:
        return <PendingIcon fontSize="small" color="warning" />;
      case PaymentStatus.PROCESSING:
        return <ProcessingIcon fontSize="small" color="info" />;
      case PaymentStatus.REFUNDED:
      case PaymentStatus.PARTIALLY_REFUNDED:
        return <RefundIcon fontSize="small" color="warning" />;
      case PaymentStatus.CANCELED:
        return <CancelIcon fontSize="small" color="error" />;
      case PaymentStatus.DISPUTED:
        return <DisputeIcon fontSize="small" color="error" />;
      default:
        return <CreditCardIcon fontSize="small" />;
    }
  };

  // Get status color
  const getStatusColor = (status: PaymentStatus): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return 'success';
      case PaymentStatus.FAILED:
      case PaymentStatus.CANCELED:
      case PaymentStatus.DISPUTED:
        return 'error';
      case PaymentStatus.PENDING:
      case PaymentStatus.REFUNDED:
      case PaymentStatus.PARTIALLY_REFUNDED:
        return 'warning';
      case PaymentStatus.PROCESSING:
        return 'info';
      default:
        return 'default';
    }
  };

  // Format status label
  const formatStatusLabel = (status: PaymentStatus): string => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get relevant date based on status
  const getRelevantDate = (payment: Payment): Date => {
    if (payment.completedAt) return payment.completedAt;
    if (payment.failedAt) return payment.failedAt;
    if (payment.refundedAt) return payment.refundedAt;
    return payment.createdAt;
  };

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell><Typography variant="subtitle2">Date</Typography></TableCell>
            <TableCell><Typography variant="subtitle2">Description</Typography></TableCell>
            <TableCell><Typography variant="subtitle2">Amount</Typography></TableCell>
            <TableCell><Typography variant="subtitle2">Status</Typography></TableCell>
            <TableCell align="right"><Typography variant="subtitle2">Receipt</Typography></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>
                <Typography variant="body2">{formatDate(getRelevantDate(payment))}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{payment.description || 'Payment'}</Typography>
                <Typography variant="caption" color="text.secondary">ID: {payment.id.substring(0, 8)}...</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {payment.status === PaymentStatus.REFUNDED && '-'}
                  {formatCurrency(
                    payment.status === PaymentStatus.REFUNDED
                      ? payment.refundAmount || payment.amount
                      : payment.amount,
                    payment.currency
                  )}
                </Typography>
                {payment.status === PaymentStatus.PARTIALLY_REFUNDED && payment.refundAmount && (
                  <Typography variant="caption" color="text.secondary">
                    Refunded: {formatCurrency(payment.refundAmount, payment.currency)}
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                <Tooltip title={formatStatusLabel(payment.status)}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusIcon(payment.status)}
                    <Chip
                      size="small"
                      label={formatStatusLabel(payment.status)}
                      color={getStatusColor(payment.status)}
                      variant="outlined"
                    />
                  </Box>
                </Tooltip>
              </TableCell>
              <TableCell align="right">
                {payment.receiptUrl && payment.status === PaymentStatus.COMPLETED && (
                  <Link
                    href={payment.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                  >
                    View Receipt
                  </Link>
                )}
              </TableCell>
            </TableRow>
          ))}
          {payments.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center">
                <Typography variant="body2" sx={{ py: 2 }}>No payment history available.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PaymentHistoryTable; 