import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Tabs, Tab, Box, Typography, Button, Paper, Divider, Chip, CircularProgress, Alert, AlertTitle } from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  CreditCard as CreditCardIcon,
  Receipt as ReceiptIcon,
  History as HistoryIcon,
  CompareArrows as CompareArrowsIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

import { useAuth } from '@/lib/hooks/useAuth';
import { useCompany } from '@/lib/hooks/useCompany';
import { SubscriptionService } from '@/lib/services/SubscriptionService';
import { SubscriptionPlanService } from '@/lib/services/SubscriptionPlanService';
import { PaymentGatewayService } from '@/lib/services/PaymentGatewayService';
import { formatCurrency, formatDate } from '@/lib/utils';
import PaymentMethodForm from './PaymentMethodForm';
import SubscriptionPlanCard from './SubscriptionPlanCard';
import InvoiceList from './InvoiceList';
import PaymentHistoryTable from './PaymentHistoryTable';
import ConfirmationDialog from '../common/ConfirmationDialog';

enum TabValues {
  OVERVIEW = 'overview',
  PLANS = 'plans',
  PAYMENT_METHODS = 'payment-methods',
  BILLING_HISTORY = 'billing-history'
}

const SubscriptionManagementUI: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { company } = useCompany();
  const [activeTab, setActiveTab] = useState<TabValues>(TabValues.OVERVIEW);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Services
  const subscriptionService = new SubscriptionService();
  const planService = new SubscriptionPlanService();
  const paymentService = new PaymentGatewayService();
  
  // State
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [customerProfile, setCustomerProfile] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  
  // Dialog state
  const [showCancelDialog, setShowCancelDialog] = useState<boolean>(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState<boolean>(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<boolean>(false);
  
  // Load subscription data
  useEffect(() => {
    if (!company?.id) return;
    
    const loadSubscriptionData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load current subscription
        const subscription = await subscriptionService.getCompanySubscription(company.id);
        setCurrentSubscription(subscription);
        
        // Load subscription plan details
        if (subscription?.planId) {
          const plan = await planService.getPlanById(subscription.planId);
          setCurrentPlan(plan);
        }
        
        // Load available plans
        const plans = await planService.getActivePlans();
        setAvailablePlans(plans);
        
        // Load payment customer profile
        const customer = await paymentService.getCustomerByCompanyId(company.id);
        setCustomerProfile(customer);
        
        if (customer) {
          // Load payment methods
          setPaymentMethods(customer.paymentMethods || []);
          
          // Load invoices
          const companyInvoices = await paymentService.getCompanyInvoices(company.id);
          setInvoices(companyInvoices);
          
          // Load payment history
          const payments = await paymentService.getPaymentHistory(company.id);
          setPaymentHistory(payments);
        }
      } catch (err) {
        console.error('Error loading subscription data:', err);
        setError('Failed to load subscription information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadSubscriptionData();
  }, [company?.id]);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: TabValues) => {
    setActiveTab(newValue);
  };
  
  // Handle add payment method
  const handleAddPaymentMethod = async (paymentMethodToken: string, makeDefault: boolean) => {
    if (!customerProfile) {
      // Create a customer profile first
      try {
        setProcessingAction(true);
        const newCustomer = await paymentService.createCustomer(
          company.id,
          company.email || user?.email || '',
          company.name
        );
        
        const newMethod = await paymentService.addPaymentMethod(
          newCustomer.id,
          paymentMethodToken,
          makeDefault
        );
        
        setCustomerProfile(newCustomer);
        setPaymentMethods([newMethod]);
        
        return true;
      } catch (err) {
        console.error('Error adding payment method:', err);
        setError('Failed to add payment method. Please try again.');
        return false;
      } finally {
        setProcessingAction(false);
      }
    } else {
      // Add to existing customer
      try {
        setProcessingAction(true);
        const newMethod = await paymentService.addPaymentMethod(
          customerProfile.id,
          paymentMethodToken,
          makeDefault
        );
        
        setPaymentMethods(prevMethods => {
          const updatedMethods = makeDefault 
            ? prevMethods.map(m => ({ ...m, default: false }))
            : [...prevMethods];
          
          return [...updatedMethods, newMethod];
        });
        
        return true;
      } catch (err) {
        console.error('Error adding payment method:', err);
        setError('Failed to add payment method. Please try again.');
        return false;
      } finally {
        setProcessingAction(false);
      }
    }
  };
  
  // Handle set default payment method
  const handleSetDefaultPaymentMethod = async (paymentMethodId: string) => {
    try {
      setProcessingAction(true);
      await paymentService.setDefaultPaymentMethod(customerProfile.id, paymentMethodId);
      
      setPaymentMethods(prevMethods => {
        return prevMethods.map(method => ({
          ...method,
          default: method.id === paymentMethodId
        }));
      });
      
      return true;
    } catch (err) {
      console.error('Error setting default payment method:', err);
      setError('Failed to update default payment method. Please try again.');
      return false;
    } finally {
      setProcessingAction(false);
    }
  };
  
  // Handle remove payment method
  const handleRemovePaymentMethod = async (paymentMethodId: string) => {
    try {
      setProcessingAction(true);
      await paymentService.removePaymentMethod(customerProfile.id, paymentMethodId);
      
      // Update local state
      setPaymentMethods(prevMethods => prevMethods.filter(method => method.id !== paymentMethodId));
      
      return true;
    } catch (err) {
      console.error('Error removing payment method:', err);
      setError('Failed to remove payment method. Please try again.');
      return false;
    } finally {
      setProcessingAction(false);
    }
  };
  
  // Handle subscription plan selection for upgrade/downgrade
  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);
    setShowUpgradeDialog(true);
  };
  
  // Handle subscription upgrade/downgrade confirmation
  const handleSubscriptionChange = async () => {
    if (!selectedPlanId || !customerProfile) return;
    
    try {
      setProcessingAction(true);
      
      // Get the default payment method
      const defaultMethod = paymentMethods.find(method => method.default);
      
      if (!defaultMethod) {
        setError('Please add a payment method before changing your subscription.');
        setShowUpgradeDialog(false);
        setActiveTab(TabValues.PAYMENT_METHODS);
        return;
      }
      
      // Change subscription plan
      await subscriptionService.changePlan(company.id, selectedPlanId);
      
      // Update subscription info
      const updatedSubscription = await subscriptionService.getCompanySubscription(company.id);
      setCurrentSubscription(updatedSubscription);
      
      if (updatedSubscription?.planId) {
        const plan = await planService.getPlanById(updatedSubscription.planId);
        setCurrentPlan(plan);
      }
      
      setShowUpgradeDialog(false);
      setSelectedPlanId(null);
      
      // Show success message
      setError(null);
      
      return true;
    } catch (err) {
      console.error('Error changing subscription:', err);
      setError('Failed to change subscription plan. Please try again later.');
      return false;
    } finally {
      setProcessingAction(false);
    }
  };
  
  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;
    
    try {
      setProcessingAction(true);
      
      // Cancel subscription
      await subscriptionService.cancelSubscription(currentSubscription.id);
      
      // Update subscription info
      const updatedSubscription = await subscriptionService.getCompanySubscription(company.id);
      setCurrentSubscription(updatedSubscription);
      
      setShowCancelDialog(false);
      
      return true;
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      setError('Failed to cancel subscription. Please try again later.');
      return false;
    } finally {
      setProcessingAction(false);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Overview" value={TabValues.OVERVIEW} icon={<CheckCircleIcon />} iconPosition="start" />
          <Tab label="Plans" value={TabValues.PLANS} icon={<CompareArrowsIcon />} iconPosition="start" />
          <Tab label="Payment Methods" value={TabValues.PAYMENT_METHODS} icon={<CreditCardIcon />} iconPosition="start" />
          <Tab label="Billing History" value={TabValues.BILLING_HISTORY} icon={<ReceiptIcon />} iconPosition="start" />
        </Tabs>
      </Paper>
      
      {/* Overview Tab */}
      {activeTab === TabValues.OVERVIEW && (
        <Box>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>Current Subscription</Typography>
            <Divider sx={{ mb: 2 }} />
            
            {currentSubscription ? (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">{currentPlan?.name || 'Unknown Plan'}</Typography>
                  <Chip 
                    label={currentSubscription.status.toUpperCase()} 
                    color={currentSubscription.status === 'active' ? 'success' : 
                          currentSubscription.status === 'trialing' ? 'info' : 'error'} 
                  />
                </Box>
                
                <Typography variant="body1" gutterBottom>
                  <strong>Billing Cycle:</strong> {currentSubscription.billingCycle || 'Monthly'}
                </Typography>
                
                <Typography variant="body1" gutterBottom>
                  <strong>Price:</strong> {formatCurrency(currentSubscription.price || 0, currentSubscription.currency || 'USD')}
                </Typography>
                
                <Typography variant="body1" gutterBottom>
                  <strong>Started:</strong> {formatDate(currentSubscription.startDate)}
                </Typography>
                
                {currentSubscription.endDate && (
                  <Typography variant="body1" gutterBottom>
                    <strong>Renewal Date:</strong> {formatDate(currentSubscription.endDate)}
                  </Typography>
                )}
                
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    onClick={() => setActiveTab(TabValues.PLANS)}
                  >
                    Change Plan
                  </Button>
                  
                  <Button 
                    variant="outlined" 
                    color="error" 
                    onClick={() => setShowCancelDialog(true)}
                    disabled={currentSubscription.status === 'canceled'}
                  >
                    {currentSubscription.status === 'canceled' ? 'Subscription Canceled' : 'Cancel Subscription'}
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body1" gutterBottom>
                  You don't have an active subscription.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  sx={{ mt: 2 }}
                  onClick={() => setActiveTab(TabValues.PLANS)}
                >
                  Choose a Plan
                </Button>
              </Box>
            )}
          </Paper>
          
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>Payment Methods</Typography>
            <Divider sx={{ mb: 2 }} />
            
            {paymentMethods.length > 0 ? (
              <Box>
                {paymentMethods.map(method => (
                  <Box 
                    key={method.id} 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      p: 2,
                      bgcolor: method.default ? 'action.hover' : 'transparent',
                      borderRadius: 1,
                      mb: 1
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CreditCardIcon sx={{ mr: 2 }} />
                      <Box>
                        <Typography variant="body1">
                          {method.card?.brand} •••• {method.card?.last4}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Expires {method.card?.expiryMonth}/{method.card?.expiryYear}
                        </Typography>
                      </Box>
                    </Box>
                    {method.default && <Chip label="Default" size="small" color="primary" />}
                  </Box>
                ))}
                
                <Button 
                  variant="outlined" 
                  sx={{ mt: 2 }}
                  onClick={() => setActiveTab(TabValues.PAYMENT_METHODS)}
                >
                  Manage Payment Methods
                </Button>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body1" gutterBottom>
                  No payment methods added yet.
                </Typography>
                <Button 
                  variant="outlined" 
                  sx={{ mt: 2 }}
                  onClick={() => setActiveTab(TabValues.PAYMENT_METHODS)}
                >
                  Add Payment Method
                </Button>
              </Box>
            )}
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Recent Invoices</Typography>
            <Divider sx={{ mb: 2 }} />
            
            {invoices.length > 0 ? (
              <Box>
                <InvoiceList invoices={invoices.slice(0, 3)} />
                
                <Button 
                  variant="text" 
                  endIcon={<HistoryIcon />}
                  sx={{ mt: 2 }}
                  onClick={() => setActiveTab(TabValues.BILLING_HISTORY)}
                >
                  View All Invoices
                </Button>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body1">
                  No invoices available.
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      )}
      
      {/* Plans Tab */}
      {activeTab === TabValues.PLANS && (
        <Box>
          <Typography variant="h5" gutterBottom>Subscription Plans</Typography>
          <Typography variant="body1" paragraph>
            Choose the best plan for your business needs.
          </Typography>
          
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: 3,
            my: 3
          }}>
            {availablePlans.map(plan => (
              <SubscriptionPlanCard 
                key={plan.id}
                plan={plan}
                isCurrentPlan={currentSubscription?.planId === plan.id}
                onSelect={handlePlanSelect}
              />
            ))}
          </Box>
        </Box>
      )}
      
      {/* Payment Methods Tab */}
      {activeTab === TabValues.PAYMENT_METHODS && (
        <Box>
          <Typography variant="h5" gutterBottom>Payment Methods</Typography>
          <Typography variant="body1" paragraph>
            Manage your payment methods for subscription billing.
          </Typography>
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>Add New Payment Method</Typography>
            <Paper sx={{ p: 3 }}>
              <PaymentMethodForm 
                onSubmit={handleAddPaymentMethod}
                processing={processingAction} 
              />
            </Paper>
          </Box>
          
          {paymentMethods.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>Your Payment Methods</Typography>
              
              {paymentMethods.map(method => (
                <Paper key={method.id} sx={{ p: 3, mb: 2 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CreditCardIcon sx={{ mr: 2 }} />
                      <Box>
                        <Typography variant="body1">
                          {method.card?.brand} •••• {method.card?.last4}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Expires {method.card?.expiryMonth}/{method.card?.expiryYear}
                        </Typography>
                        {method.card?.cardholderName && (
                          <Typography variant="body2" color="textSecondary">
                            {method.card.cardholderName}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    
                    <Box>
                      {method.default ? (
                        <Chip label="Default" color="primary" />
                      ) : (
                        <Button 
                          variant="outlined" 
                          size="small"
                          disabled={processingAction}
                          onClick={() => handleSetDefaultPaymentMethod(method.id)}
                        >
                          Set as Default
                        </Button>
                      )}
                      
                      <Button 
                        variant="text" 
                        color="error" 
                        size="small"
                        disabled={processingAction || method.default}
                        onClick={() => handleRemovePaymentMethod(method.id)}
                        sx={{ ml: 1 }}
                      >
                        Remove
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      )}
      
      {/* Billing History Tab */}
      {activeTab === TabValues.BILLING_HISTORY && (
        <Box>
          <Typography variant="h5" gutterBottom>Billing History</Typography>
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>Invoices</Typography>
            {invoices.length > 0 ? (
              <InvoiceList invoices={invoices} />
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1">No invoices available.</Typography>
              </Paper>
            )}
          </Box>
          
          <Box>
            <Typography variant="h6" gutterBottom>Payment History</Typography>
            {paymentHistory.length > 0 ? (
              <PaymentHistoryTable payments={paymentHistory} />
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1">No payment history available.</Typography>
              </Paper>
            )}
          </Box>
        </Box>
      )}
      
      {/* Cancel Subscription Dialog */}
      <ConfirmationDialog
        open={showCancelDialog}
        title="Cancel Subscription"
        content="Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing cycle."
        confirmText="Yes, Cancel Subscription"
        cancelText="No, Keep Subscription"
        isProcessing={processingAction}
        onConfirm={handleCancelSubscription}
        onCancel={() => setShowCancelDialog(false)}
      />
      
      {/* Change Plan Dialog */}
      <ConfirmationDialog
        open={showUpgradeDialog}
        title="Change Subscription Plan"
        content={
          selectedPlanId ? 
          `Are you sure you want to change your subscription to the ${availablePlans.find(p => p.id === selectedPlanId)?.name || 'new'} plan? Your billing will be updated immediately.` :
          "Are you sure you want to change your subscription plan?"
        }
        confirmText="Yes, Change Plan"
        cancelText="Cancel"
        isProcessing={processingAction}
        onConfirm={handleSubscriptionChange}
        onCancel={() => {
          setShowUpgradeDialog(false);
          setSelectedPlanId(null);
        }}
      />
    </Box>
  );
};

export default SubscriptionManagementUI; 