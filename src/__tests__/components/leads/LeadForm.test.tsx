/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LeadForm } from '@/components/leads/LeadForm';
import { LeadService } from '@/lib/services/LeadService';
import '@testing-library/jest-dom';

// Mock the LeadService
jest.mock('@/lib/services/LeadService', () => ({
  LeadService: jest.fn().mockImplementation(() => ({
    getLead: jest.fn().mockResolvedValue({
      id: 'lead-123',
      contact: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '555-123-4567',
        jobTitle: 'CTO',
        department: 'Engineering',
      },
      company: {
        name: 'Acme Inc',
        website: 'https://acme.example.com',
        industry: 'Technology',
        size: '100-500',
        address: {
          street: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94105',
          country: 'USA',
        },
      },
      status: 'qualified',
      source: 'referral',
      priority: 'high',
      value: 50000,
      tags: ['enterprise', 'tech'],
      createdAt: '2023-01-01T00:00:00.000Z',
      lastUpdated: '2023-01-15T00:00:00.000Z',
    }),
    createLead: jest.fn().mockResolvedValue('new-lead-123'),
    updateLead: jest.fn().mockResolvedValue(undefined),
  }))
}));

// Mock useToast
jest.mock('@/components/ui/use-toast', () => ({
  useToast: jest.fn().mockReturnValue({
    toast: jest.fn(),
  }),
}));

describe('LeadForm', () => {
  const mockTenantId = 'tenant-123';
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders the form with tabs for different sections', () => {
    render(<LeadForm tenantId={mockTenantId} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    // Check if tabs are present
    expect(screen.getByRole('tab', { name: 'Contact Information' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Company Information' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Lead Details' })).toBeInTheDocument();
    
    // Contact tab should be active by default
    expect(screen.getByRole('tab', { name: 'Contact Information' })).toHaveAttribute('aria-selected', 'true');
    
    // Check if required fields are present in the contact tab
    expect(screen.getByLabelText(/name \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email \*/i)).toBeInTheDocument();
  });
  
  it('loads existing lead data when editing', async () => {
    render(<LeadForm tenantId={mockTenantId} leadId="lead-123" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    // Wait for lead data to load
    await waitFor(() => {
      expect(LeadService.prototype.getLead).toHaveBeenCalledWith('lead-123');
    });
    
    // Check if contact fields are populated with the mock data
    expect(screen.getByLabelText(/name \*/i)).toHaveValue('John Doe');
    expect(screen.getByLabelText(/email \*/i)).toHaveValue('john.doe@example.com');
    
    // Switch to company tab and check fields
    fireEvent.click(screen.getByRole('tab', { name: 'Company Information' }));
    
    await waitFor(() => {
      expect(screen.getByLabelText(/company name/i)).toHaveValue('Acme Inc');
      expect(screen.getByLabelText(/website/i)).toHaveValue('https://acme.example.com');
    });
    
    // Switch to lead details tab and check fields
    fireEvent.click(screen.getByRole('tab', { name: 'Lead Details' }));
    
    await waitFor(() => {
      expect(screen.getByLabelText(/status/i)).toHaveValue('qualified');
      expect(screen.getByLabelText(/source/i)).toHaveValue('referral');
      expect(screen.getByLabelText(/priority/i)).toHaveValue('high');
      expect(screen.getByLabelText(/estimated value/i)).toHaveValue('50000');
      expect(screen.getByLabelText(/tags/i)).toHaveValue('enterprise, tech');
    });
  });
  
  it('validates required fields before submission', async () => {
    const { container } = render(<LeadForm tenantId={mockTenantId} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    // Clear the required fields
    const nameInput = screen.getByLabelText(/name \*/i);
    fireEvent.change(nameInput, { target: { value: '' } });
    
    const emailInput = screen.getByLabelText(/email \*/i);
    fireEvent.change(emailInput, { target: { value: '' } });
    
    // Try to submit the form
    const submitButton = screen.getByRole('button', { name: /create lead/i });
    fireEvent.click(submitButton);
    
    // Check if form validation prevented submission
    await waitFor(() => {
      expect(LeadService.prototype.createLead).not.toHaveBeenCalled();
    });
    
    // Browser validation should prevent submission, but we can also check
    // if there are validation messages (this depends on the browser, so it may not be reliable in tests)
    // We can use the checkValidity method on the form element
    expect(container.querySelector('form')?.checkValidity()).toBe(false);
  });
  
  it('submits form data for a new lead successfully', async () => {
    render(<LeadForm tenantId={mockTenantId} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    // Fill in required fields
    const nameInput = screen.getByLabelText(/name \*/i);
    fireEvent.change(nameInput, { target: { value: 'Jane Smith' } });
    
    const emailInput = screen.getByLabelText(/email \*/i);
    fireEvent.change(emailInput, { target: { value: 'jane.smith@example.com' } });
    
    // Switch to company tab and fill in some fields
    fireEvent.click(screen.getByRole('tab', { name: 'Company Information' }));
    
    await waitFor(() => {
      const companyNameInput = screen.getByLabelText(/company name/i);
      fireEvent.change(companyNameInput, { target: { value: 'XYZ Corp' } });
    });
    
    // Switch to lead details tab and fill in some fields
    fireEvent.click(screen.getByRole('tab', { name: 'Lead Details' }));
    
    await waitFor(() => {
      const sourceSelect = screen.getByLabelText(/source/i);
      fireEvent.change(sourceSelect, { target: { value: 'website' } });
      
      const valueInput = screen.getByLabelText(/estimated value/i);
      fireEvent.change(valueInput, { target: { value: '25000' } });
    });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create lead/i });
    fireEvent.click(submitButton);
    
    // Check if the form was submitted with the correct data
    await waitFor(() => {
      expect(LeadService.prototype.createLead).toHaveBeenCalledWith(
        expect.objectContaining({
          contact: expect.objectContaining({
            name: 'Jane Smith',
            email: 'jane.smith@example.com'
          }),
          company: expect.objectContaining({
            name: 'XYZ Corp'
          }),
          value: 25000,
          status: 'new',
          source: 'website'
        })
      );
      expect(mockOnSuccess).toHaveBeenCalledWith('new-lead-123');
    });
  });
  
  it('updates an existing lead successfully', async () => {
    render(<LeadForm tenantId={mockTenantId} leadId="lead-123" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    // Wait for lead data to load
    await waitFor(() => {
      expect(LeadService.prototype.getLead).toHaveBeenCalledWith('lead-123');
    });
    
    // Modify some fields
    const nameInput = screen.getByLabelText(/name \*/i);
    fireEvent.change(nameInput, { target: { value: 'John Smith' } });
    
    // Switch to company tab and modify fields
    fireEvent.click(screen.getByRole('tab', { name: 'Company Information' }));
    
    await waitFor(() => {
      const companyNameInput = screen.getByLabelText(/company name/i);
      fireEvent.change(companyNameInput, { target: { value: 'Acme Corporation' } });
    });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /update lead/i });
    fireEvent.click(submitButton);
    
    // Check if the lead was updated with the correct data
    await waitFor(() => {
      expect(LeadService.prototype.updateLead).toHaveBeenCalledWith(
        'lead-123',
        expect.objectContaining({
          contact: expect.objectContaining({
            name: 'John Smith'
          }),
          company: expect.objectContaining({
            name: 'Acme Corporation'
          })
        })
      );
      expect(mockOnSuccess).toHaveBeenCalledWith('lead-123');
    });
  });
  
  it('handles form cancellation', () => {
    render(<LeadForm tenantId={mockTenantId} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    // Click the cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    // Check if onCancel was called
    expect(mockOnCancel).toHaveBeenCalled();
  });
  
  it('handles API errors gracefully', async () => {
    // Mock the createLead method to throw an error
    const mockCreateLeadError = new Error('Failed to create lead');
    LeadService.prototype.createLead = jest.fn().mockRejectedValue(mockCreateLeadError);
    
    const { toast } = require('@/components/ui/use-toast').useToast();
    
    render(<LeadForm tenantId={mockTenantId} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    // Fill in required fields
    const nameInput = screen.getByLabelText(/name \*/i);
    fireEvent.change(nameInput, { target: { value: 'Jane Smith' } });
    
    const emailInput = screen.getByLabelText(/email \*/i);
    fireEvent.change(emailInput, { target: { value: 'jane.smith@example.com' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create lead/i });
    fireEvent.click(submitButton);
    
    // Check if error toast was shown
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          description: 'Failed to save lead. Please try again.',
          variant: 'destructive'
        })
      );
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });
  
  it('disables form controls during submission', async () => {
    // Mock a slow API response
    LeadService.prototype.createLead = jest.fn().mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve('new-lead-123'), 100);
      });
    });
    
    render(<LeadForm tenantId={mockTenantId} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    // Fill in required fields
    const nameInput = screen.getByLabelText(/name \*/i);
    fireEvent.change(nameInput, { target: { value: 'Jane Smith' } });
    
    const emailInput = screen.getByLabelText(/email \*/i);
    fireEvent.change(emailInput, { target: { value: 'jane.smith@example.com' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create lead/i });
    fireEvent.click(submitButton);
    
    // Check if the form controls are disabled during submission
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Saving...');
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeDisabled();
    
    // Wait for submission to complete
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
      expect(submitButton).not.toHaveTextContent('Saving...');
    });
  });
}); 