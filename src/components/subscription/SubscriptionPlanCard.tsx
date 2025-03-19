import React from 'react';
import { 
  Card, 
  CardContent, 
  CardActions, 
  Typography, 
  Button, 
  Box, 
  Divider, 
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Star as StarIcon 
} from '@mui/icons-material';

interface SubscriptionPlanCardProps {
  plan: {
    id: string;
    name: string;
    description: string;
    features: {
      id: string;
      name: string;
      description: string;
      included: boolean;
      limit?: number;
    }[];
    pricing: {
      monthly: number;
      yearly: number;
      discount?: number;
      currency: string;
      trialDays?: number;
    };
    tier: string;
    isDefault?: boolean;
    maxUsers?: number;
    maxStorage?: number;
  };
  isCurrentPlan: boolean;
  onSelect: (planId: string) => void;
}

const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({
  plan,
  isCurrentPlan,
  onSelect
}) => {
  // Format currency based on locale
  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  const handleSelect = () => {
    if (!isCurrentPlan) {
      onSelect(plan.id);
    }
  };
  
  // Calculate per-month cost for yearly billing
  const monthlyEquivalent = plan.pricing.yearly / 12;
  const discount = plan.pricing.discount || 
    Math.round(((plan.pricing.monthly * 12) - plan.pricing.yearly) / (plan.pricing.monthly * 12) * 100);
  
  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        border: theme => isCurrentPlan ? `2px solid ${theme.palette.primary.main}` : 'none',
        position: 'relative'
      }}
      raised={isCurrentPlan}
    >
      {isCurrentPlan && (
        <Chip 
          label="Current Plan" 
          color="primary" 
          size="small" 
          sx={{ 
            position: 'absolute', 
            top: 10, 
            right: 10,
            zIndex: 1
          }}
        />
      )}
      
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          {plan.name}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          {plan.description}
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
            {formatCurrency(plan.pricing.monthly, plan.pricing.currency)}
            <Typography component="span" variant="body2" color="text.secondary">
              /month
            </Typography>
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            or {formatCurrency(plan.pricing.yearly, plan.pricing.currency)}/year 
            {discount > 0 && (
              <Chip 
                label={`Save ${discount}%`} 
                color="success" 
                size="small" 
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
          
          {plan.pricing.trialDays && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Includes {plan.pricing.trialDays}-day free trial
            </Typography>
          )}
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        {plan.maxUsers && (
          <Typography variant="body2" sx={{ mb: 1 }}>
            <b>Users:</b> Up to {plan.maxUsers} users
          </Typography>
        )}
        
        {plan.maxStorage && (
          <Typography variant="body2" sx={{ mb: 1 }}>
            <b>Storage:</b> {plan.maxStorage} GB
          </Typography>
        )}
        
        <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
          Features
        </Typography>
        
        <List dense disablePadding>
          {plan.features.map(feature => (
            <ListItem key={feature.id} disablePadding sx={{ mb: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                {feature.included ? (
                  <CheckIcon color="success" fontSize="small" />
                ) : (
                  <CancelIcon color="disabled" fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText 
                primary={feature.name}
                secondary={feature.limit ? `Up to ${feature.limit}` : undefined}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
      
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button 
          fullWidth 
          variant={isCurrentPlan ? "outlined" : "contained"} 
          color="primary"
          onClick={handleSelect}
          disabled={isCurrentPlan}
        >
          {isCurrentPlan ? "Current Plan" : "Select Plan"}
        </Button>
      </CardActions>
    </Card>
  );
};

export default SubscriptionPlanCard; 