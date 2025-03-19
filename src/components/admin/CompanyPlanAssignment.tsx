'use client';

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { AdminOnly } from '@/components/RbacWrapper';
import { 
  Company,
  CompanySubscription,
  SubscriptionPlan,
  SubscriptionStatus,
  BillingCycle
} from '@/lib/types/company';

class SubscriptionService {
  async getActivePlans(): Promise<SubscriptionPlan[]> {
    // Mock implementation
    return [
      {
        id: 'plan1',
        name: 'Basic Plan',
        description: 'Basic features for small businesses',
        price: 29,
        billingCycle: BillingCycle.MONTHLY,
        features: [
          { name: 'Feature 1', enabled: true },
          { name: 'Feature 2', enabled: true },
          { name: 'Feature 3', enabled: false }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'plan2',
        name: 'Premium Plan',
        description: 'Premium features for growing businesses',
        price: 99,
        billingCycle: BillingCycle.MONTHLY,
        features: [
          { name: 'Feature 1', enabled: true },
          { name: 'Feature 2', enabled: true },
          { name: 'Feature 3', enabled: true },
          { name: 'Feature 4', enabled: true }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  async assignPlanToCompany(
    companyId: string,
    planId: string,
    startDate: Date,
    endDate: Date
  ): Promise<string> {
    // Mock implementation
    console.log(`Assigning plan ${planId} to company ${companyId}`);
    return 'subscription-id-123';
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    // Mock implementation
    console.log(`Cancelling subscription ${subscriptionId}`);
  }
}

interface CompanyPlanAssignmentProps {
  initialCompanyId?: string;
  initialTenantId?: string;
}

export function CompanyPlanAssignment({ initialCompanyId, initialTenantId }: CompanyPlanAssignmentProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<Error | null>(null);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(initialCompanyId || '');
  const [selectedTenantId, setSelectedTenantId] = useState<string>(initialTenantId || '');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [companySubscriptions, setCompanySubscriptions] = useState<CompanySubscription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const subscriptionService = new SubscriptionService();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([
          loadCompanies(),
          loadPlans(),
          loadSubscriptions()
        ]);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err : new Error('Failed to load data. Please try again.'));
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [initialCompanyId, initialTenantId]);

  const loadCompanies = async () => {
    try {
      const mockCompanies: Company[] = [
        {
          id: 'company1',
          name: 'Acme Corporation',
          tenantId: 'tenant1',
          email: 'info@acme.example.com',
          phone: '555-123-4567',
          website: 'https://acme.example.com',
          address: {
            street: '123 Main Street',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94105',
            country: 'USA'
          },
          branding: {
            primaryColorHex: '#336699',
            secondaryColorHex: '#669933',
            logoUrl: 'https://acme.example.com/logo.png'
          },
          active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'company2',
          name: 'Globex Industries',
          tenantId: 'tenant1',
          email: 'info@globex.example.com',
          phone: '555-987-6543',
          website: 'https://globex.example.com',
          address: {
            street: '456 Broadway',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'USA'
          },
          branding: {
            primaryColorHex: '#993366',
            secondaryColorHex: '#339966',
            logoUrl: 'https://globex.example.com/logo.png'
          },
          active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      setCompanies(mockCompanies);
      
      if (!initialCompanyId && mockCompanies.length > 0) {
        setSelectedCompanyId(mockCompanies[0].id);
      }
    } catch (err) {
      console.error('Error loading companies:', err);
      setError(err instanceof Error ? err : new Error('Failed to load companies'));
    }
  };

  const loadPlans = async () => {
    try {
      setPlansLoading(true);
      const fetchedPlans = await subscriptionService.getActivePlans();
      setPlans(fetchedPlans);
      
      if (fetchedPlans.length > 0 && !selectedPlanId) {
        setSelectedPlanId(fetchedPlans[0].id);
      }
    } catch (err) {
      console.error('Error loading plans:', err);
      setPlansError(err instanceof Error ? err : new Error('Failed to load subscription plans.'));
      setPlans([]);
    } finally {
      setPlansLoading(false);
    }
  };

  const loadSubscriptions = async () => {
    try {
      // In a real scenario, we would fetch from the database
      // For now, using mock data
      const mockSubscriptions: CompanySubscription[] = [
        {
          id: 'sub1',
          companyId: 'company1',
          planId: 'plan1',
          status: SubscriptionStatus.ACTIVE,
          startDate: new Date(),
          endDate: new Date(Date.now() + 31536000000), // One year from now
          billingCycle: BillingCycle.ANNUAL,
          price: 999,
          currency: 'USD',
          autoRenew: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      setCompanySubscriptions(mockSubscriptions);
    } catch (err) {
      console.error('Error loading subscriptions:', err);
      setError(err instanceof Error ? err : new Error('Failed to load subscription data.'));
      setCompanySubscriptions([]);
    }
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const companyId = e.target.value;
    setSelectedCompanyId(companyId);
    
    if (companyId) {
      const company = companies.find(c => c.id === companyId);
      if (company) {
        setSelectedTenantId(company.tenantId);
      }
    } else {
      setSelectedTenantId('');
    }
    
    setSuccessMessage('');
  };

  const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPlanId(e.target.value);
    setSuccessMessage('');
  };

  const handleAssignPlan = async () => {
    if (!selectedCompanyId || !selectedPlanId) {
      setError(new Error('Please select a company and a plan'));
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);
      
      await subscriptionService.assignPlanToCompany(
        selectedCompanyId,
        selectedPlanId,
        startDate,
        endDate
      );
      
      await loadSubscriptions();
      
      setSuccessMessage('Subscription plan assigned successfully');
    } catch (err) {
      console.error('Error assigning plan:', err);
      setError(err instanceof Error ? err : new Error('Failed to assign plan'));
      setSuccessMessage('');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await subscriptionService.cancelSubscription(subscriptionId);
      
      await loadSubscriptions();
      
      setSuccessMessage('Subscription canceled successfully');
    } catch (err) {
      console.error('Error canceling subscription:', err);
      setError(err instanceof Error ? err : new Error('Failed to cancel subscription'));
      setSuccessMessage('');
    } finally {
      setLoading(false);
    }
  };

  const getCompanySubscriptions = (companyId: string) => {
    return companySubscriptions.filter(sub => sub.companyId === companyId);
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString();
  };

  const getPlanName = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    return plan ? plan.name : 'Unknown Plan';
  };

  if (loading && !companies.length) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (error && !companies.length) {
    return <div className="p-6 text-center text-red-500">Error: {error.message}</div>;
  }

  return (
    <AdminOnly fallback={<div>You need admin privileges to access this page.</div>}>
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-6">Assign Subscription Plans</h2>
        
        {successMessage && (
          <div className="bg-green-100 text-green-800 p-4 rounded mb-6">
            {successMessage}
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded mb-6">
            Error: {error.message}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Company
            </label>
            <select
              value={selectedCompanyId}
              onChange={handleCompanyChange}
              className="w-full p-2 border rounded"
              disabled={loading}
            >
              <option value="">-- Select a company --</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Subscription Plan
            </label>
            <select
              value={selectedPlanId}
              onChange={handlePlanChange}
              className="w-full p-2 border rounded"
              disabled={loading || plansLoading || !selectedCompanyId}
            >
              <option value="">-- Select a plan --</option>
              {plans.filter(plan => plan.isActive).map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - ${plan.price}/mo
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mb-8">
          <button
            onClick={handleAssignPlan}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            disabled={loading || !selectedCompanyId || !selectedPlanId}
          >
            {loading ? 'Processing...' : 'Assign Plan'}
          </button>
        </div>
        
        {selectedCompanyId && (
          <div className="border-t pt-6">
            <h3 className="text-xl font-medium mb-4">Current Subscriptions</h3>
            
            {getCompanySubscriptions(selectedCompanyId).length === 0 ? (
              <p className="text-gray-500 italic">No subscriptions found for this company.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Start Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        End Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Auto Renew
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getCompanySubscriptions(selectedCompanyId).map(subscription => (
                      <tr key={subscription.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPlanName(subscription.planId)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-block px-2 py-1 rounded text-xs ${
                            subscription.status === SubscriptionStatus.ACTIVE ? 'bg-green-100 text-green-800' :
                            subscription.status === SubscriptionStatus.TRIAL ? 'bg-blue-100 text-blue-800' :
                            subscription.status === SubscriptionStatus.CANCELLED ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatDate(subscription.startDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatDate(subscription.endDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {subscription.autoRenew ? 'Yes' : 'No'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {subscription.status === SubscriptionStatus.ACTIVE && (
                            <button
                              onClick={() => handleCancelSubscription(subscription.id)}
                              className="text-red-600 hover:text-red-800"
                              disabled={loading}
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminOnly>
  );
} 