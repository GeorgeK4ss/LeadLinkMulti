'use client';

import { useState, useEffect } from 'react';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { type SubscriptionPlan, type PlanFeature, type PlanPricing } from '@/lib/services/SubscriptionPlanService';

export function SubscriptionPlanManager() {
  const {
    plans,
    loading,
    error,
    createPlan,
    updatePlan,
    deletePlan,
    refreshPlans
  } = useSubscriptionPlans();

  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<SubscriptionPlan>>({
    name: '',
    description: '',
    features: [],
    pricing: {
      monthly: 0,
      yearly: 0,
      currency: 'USD',
      trialDays: 14
    },
    active: true,
    order: 0,
    tier: 'basic'
  });
  const [formFeature, setFormFeature] = useState<Partial<PlanFeature>>({
    id: '',
    name: '',
    description: '',
    included: true,
    limit: undefined
  });

  // Reset form data when editing a plan
  useEffect(() => {
    if (isEditing) {
      const plan = plans.find(p => p.id === isEditing);
      if (plan) {
        setFormData({
          name: plan.name,
          description: plan.description,
          features: [...plan.features],
          pricing: { ...plan.pricing },
          active: plan.active,
          order: plan.order,
          maxUsers: plan.maxUsers,
          maxStorage: plan.maxStorage,
          isDefault: plan.isDefault,
          tier: plan.tier
        });
      }
    }
  }, [isEditing, plans]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('pricing.')) {
      const pricingField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        pricing: {
          ...prev.pricing as PlanPricing,
          [pricingField]: type === 'number' ? parseFloat(value) : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : 
                type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
  };

  // Handle feature form changes
  const handleFeatureChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormFeature(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : 
              type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Add a feature to the plan
  const addFeature = () => {
    if (!formFeature.id || !formFeature.name) return;
    
    setFormData(prev => ({
      ...prev,
      features: [
        ...(prev.features || []),
        {
          id: formFeature.id,
          name: formFeature.name,
          description: formFeature.description || '',
          included: formFeature.included || true,
          limit: formFeature.limit
        } as PlanFeature
      ]
    }));
    
    // Reset feature form
    setFormFeature({
      id: '',
      name: '',
      description: '',
      included: true,
      limit: undefined
    });
  };

  // Remove a feature from the plan
  const removeFeature = (featureId: string) => {
    setFormData(prev => ({
      ...prev,
      features: (prev.features || []).filter(f => f.id !== featureId)
    }));
  };

  // Save the plan (create or update)
  const savePlan = async () => {
    try {
      if (isEditing) {
        await updatePlan(isEditing, formData);
        setIsEditing(null);
      } else {
        await createPlan(formData as Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>);
        setIsCreating(false);
      }
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        features: [],
        pricing: {
          monthly: 0,
          yearly: 0,
          currency: 'USD',
          trialDays: 14
        },
        active: true,
        order: 0,
        tier: 'basic'
      });
      
      // Refresh plans list
      await refreshPlans();
    } catch (err) {
      console.error('Error saving plan:', err);
    }
  };

  // Cancel form
  const cancelForm = () => {
    setIsCreating(false);
    setIsEditing(null);
    setFormData({
      name: '',
      description: '',
      features: [],
      pricing: {
        monthly: 0,
        yearly: 0,
        currency: 'USD',
        trialDays: 14
      },
      active: true,
      order: 0,
      tier: 'basic'
    });
  };

  // Handle plan deletion
  const handleDeletePlan = async (planId: string) => {
    if (confirm('Are you sure you want to delete this plan?')) {
      try {
        await deletePlan(planId);
        await refreshPlans();
      } catch (err) {
        console.error('Error deleting plan:', err);
      }
    }
  };

  // Render loading state
  if (loading) {
    return <div className="p-6 text-center">Loading subscription plans...</div>;
  }

  // Render error state
  if (error) {
    return <div className="p-6 text-center text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-6">Subscription Plan Management</h2>
      
      {/* Plans List */}
      {!isCreating && !isEditing && (
        <>
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-xl font-medium">Available Plans</h3>
            <button 
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Create New Plan
            </button>
          </div>
          
          {plans.length === 0 ? (
            <p className="text-gray-500 italic">No subscription plans available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map(plan => (
                <div 
                  key={plan.id} 
                  className="border rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-medium">{plan.name}</h4>
                      <span className={`inline-block px-2 py-1 rounded text-xs ${plan.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {plan.active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="inline-block ml-2 px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                        {plan.tier.charAt(0).toUpperCase() + plan.tier.slice(1)}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setIsEditing(plan.id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeletePlan(plan.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mt-2">{plan.description}</p>
                  
                  <div className="mt-3">
                    <div className="text-lg font-semibold">
                      ${plan.pricing.monthly}/mo
                      {plan.pricing.discount && (
                        <span className="text-sm text-green-600 ml-2">
                          {plan.pricing.discount}% off yearly
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      ${plan.pricing.yearly}/year
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h5 className="font-medium">Features</h5>
                    <ul className="mt-2 space-y-1">
                      {plan.features.map(feature => (
                        <li key={feature.id} className="flex items-start">
                          <span className={`mr-2 ${feature.included ? 'text-green-500' : 'text-red-500'}`}>
                            {feature.included ? '✓' : '✗'}
                          </span>
                          <div>
                            <div className="font-medium">{feature.name}</div>
                            {feature.description && (
                              <div className="text-sm text-gray-600">{feature.description}</div>
                            )}
                            {feature.limit !== undefined && (
                              <div className="text-sm text-gray-600">Limit: {feature.limit}</div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      
      {/* Plan Form (Create or Edit) */}
      {(isCreating || isEditing) && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-medium mb-4">
            {isEditing ? 'Edit Plan' : 'Create New Plan'}
          </h3>
          
          <div className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tier
                </label>
                <select
                  name="tier"
                  value={formData.tier || 'basic'}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                rows={3}
              />
            </div>
            
            {/* Pricing */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Pricing</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Price
                  </label>
                  <input
                    type="number"
                    name="pricing.monthly"
                    value={formData.pricing?.monthly || 0}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yearly Price
                  </label>
                  <input
                    type="number"
                    name="pricing.yearly"
                    value={formData.pricing?.yearly || 0}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    name="pricing.currency"
                    value={formData.pricing?.currency || 'USD'}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CAD">CAD</option>
                    <option value="AUD">AUD</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    name="pricing.discount"
                    value={formData.pricing?.discount || 0}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    min="0"
                    max="100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trial Period (days)
                  </label>
                  <input
                    type="number"
                    name="pricing.trialDays"
                    value={formData.pricing?.trialDays || 0}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    min="0"
                  />
                </div>
              </div>
            </div>
            
            {/* Features */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Features</h4>
              
              {/* Feature List */}
              <div className="mb-4">
                {formData.features && formData.features.length > 0 ? (
                  <ul className="border rounded divide-y">
                    {formData.features.map(feature => (
                      <li key={feature.id} className="p-3 flex justify-between items-center">
                        <div>
                          <div className="font-medium">{feature.name}</div>
                          {feature.description && (
                            <div className="text-sm text-gray-600">{feature.description}</div>
                          )}
                          <div className="text-sm">
                            <span className={feature.included ? 'text-green-600' : 'text-red-600'}>
                              {feature.included ? 'Included' : 'Not included'}
                            </span>
                            {feature.limit !== undefined && (
                              <span className="ml-2 text-gray-600">
                                Limit: {feature.limit}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFeature(feature.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">No features added yet.</p>
                )}
              </div>
              
              {/* Add Feature Form */}
              <div className="bg-gray-100 p-4 rounded">
                <h5 className="font-medium mb-2">Add Feature</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Feature ID
                    </label>
                    <input
                      type="text"
                      name="id"
                      value={formFeature.id || ''}
                      onChange={handleFeatureChange}
                      className="w-full p-2 border rounded"
                      placeholder="e.g., file_storage"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Feature Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formFeature.name || ''}
                      onChange={handleFeatureChange}
                      className="w-full p-2 border rounded"
                      placeholder="e.g., File Storage"
                    />
                  </div>
                </div>
                
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formFeature.description || ''}
                    onChange={handleFeatureChange}
                    className="w-full p-2 border rounded"
                    placeholder="Describe the feature"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="included"
                      checked={formFeature.included || false}
                      onChange={handleFeatureChange}
                      className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Included in plan
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Limit (if applicable)
                    </label>
                    <input
                      type="number"
                      name="limit"
                      value={formFeature.limit || ''}
                      onChange={handleFeatureChange}
                      className="w-full p-2 border rounded"
                      placeholder="e.g., 10"
                    />
                  </div>
                </div>
                
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={addFeature}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                    disabled={!formFeature.id || !formFeature.name}
                  >
                    Add Feature
                  </button>
                </div>
              </div>
            </div>
            
            {/* Additional Settings */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Additional Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    name="order"
                    value={formData.order || 0}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Users
                  </label>
                  <input
                    type="number"
                    name="maxUsers"
                    value={formData.maxUsers || ''}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    min="0"
                    placeholder="Unlimited"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Storage (MB)
                  </label>
                  <input
                    type="number"
                    name="maxStorage"
                    value={formData.maxStorage || ''}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    min="0"
                    placeholder="Unlimited"
                  />
                </div>
              </div>
              
              <div className="mt-4 flex items-center">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">
                  Plan is active and available for purchase
                </label>
              </div>
              
              <div className="mt-2 flex items-center">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">
                  Set as default plan for new customers
                </label>
              </div>
            </div>
            
            {/* Form Actions */}
            <div className="border-t pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelForm}
                className="px-4 py-2 border rounded hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={savePlan}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                disabled={!formData.name}
              >
                {isEditing ? 'Update Plan' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 