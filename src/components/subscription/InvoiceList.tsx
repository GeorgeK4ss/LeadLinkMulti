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
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  GetApp as DownloadIcon,
  Visibility as ViewIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'void' | 'overdue';
  dueDate: Date;
  createdAt: Date;
  paidAt?: Date;
  pdfUrl?: string;
}

interface InvoiceListProps {
  invoices: Invoice[];
}

const InvoiceList: React.FC<InvoiceListProps> = ({ invoices }) => {
  // Format date to locale string
  const formatDate = (date: Date): string => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Get status chip color based on invoice status
  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' | 'info' => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'sent':
        return 'info';
      case 'draft':
        return 'default';
      case 'overdue':
        return 'error';
      case 'void':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Handle view invoice
  const handleViewInvoice = (invoice: Invoice) => {
    if (invoice.pdfUrl) {
      window.open(invoice.pdfUrl, '_blank');
    }
  };

  // Handle download invoice
  const handleDownloadInvoice = (invoice: Invoice) => {
    if (invoice.pdfUrl) {
      const link = document.createElement('a');
      link.href = invoice.pdfUrl;
      link.download = `Invoice-${invoice.invoiceNumber}.pdf`;
      link.click();
    }
  };

  // Handle pay invoice
  const handlePayInvoice = (invoice: Invoice) => {
    // Implement payment logic or redirect to payment page
    console.log('Pay invoice:', invoice.id);
  };

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell><Typography variant="subtitle2">Invoice #</Typography></TableCell>
            <TableCell><Typography variant="subtitle2">Date</Typography></TableCell>
            <TableCell><Typography variant="subtitle2">Due Date</Typography></TableCell>
            <TableCell><Typography variant="subtitle2">Amount</Typography></TableCell>
            <TableCell><Typography variant="subtitle2">Status</Typography></TableCell>
            <TableCell align="right"><Typography variant="subtitle2">Actions</Typography></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ReceiptIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">{invoice.invoiceNumber}</Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{formatDate(invoice.createdAt)}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{formatDate(invoice.dueDate)}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{formatCurrency(invoice.amount, invoice.currency)}</Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={invoice.status.toUpperCase()}
                  size="small"
                  color={getStatusColor(invoice.status)}
                />
              </TableCell>
              <TableCell align="right">
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {invoice.pdfUrl && (
                    <>
                      <Tooltip title="View Invoice">
                        <IconButton size="small" onClick={() => handleViewInvoice(invoice)}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download Invoice">
                        <IconButton size="small" onClick={() => handleDownloadInvoice(invoice)}>
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                  {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                    <Tooltip title="Pay Now">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handlePayInvoice(invoice)}
                      >
                        <PaymentIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ))}
          {invoices.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center">
                <Typography variant="body2" sx={{ py: 2 }}>No invoices found.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default InvoiceList; 