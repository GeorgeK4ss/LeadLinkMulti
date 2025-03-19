/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomerHealthScore } from '@/components/customers/CustomerHealthScore';
import { CustomerService } from '@/lib/services/CustomerService';
import { Customer } from '@/types/customer';

// Mock the CustomerService
jest.mock('@/lib/services/CustomerService', () => {
  return {
    CustomerService: jest.fn().mockImplementation(() => {
      return {
        updateHealthScore: jest.fn().mockResolvedValue(undefined),
        addNote: jest.fn().mockResolvedValue(undefined)
      };
    })
  };
});

// Mock the toast component
jest.mock('@/components/ui/use-toast', () => {
  return {
    useToast: jest.fn().mockReturnValue({
      toast: jest.fn()
    })
  };
});

describe('CustomerHealthScore Component', () => {
  const mockCustomer = {
    id: 'customer-123',
    tenantId: 'tenant-123',
    name: 'Test Customer',
    healthScore: {
      overall: 75,
      engagement: 70,
      support: 80,
      growth: 75,
      satisfaction: 85,
      financials: 65,
      lastAssessmentDate: '2024-03-15T00:00:00.000Z',
      trend: 'stable'
    }
  } as Customer;
  
  const mockTenantId = 'tenant-123';
  const mockOnUpdate = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders the current health score correctly', () => {
    render(<CustomerHealthScore 
      customer={mockCustomer} 
      tenantId={mockTenantId} 
      onUpdate={mockOnUpdate} 
    />);
    
    // Check if the current overall score is displayed
    expect(screen.getByText('75')).toBeInTheDocument();
    
    // Check if category scores are displayed
    expect(screen.getByText('70')).toBeInTheDocument(); // Engagement
    expect(screen.getByText('80')).toBeInTheDocument(); // Support
    expect(screen.getByText('75')).toBeInTheDocument(); // Growth
    expect(screen.getByText('85')).toBeInTheDocument(); // Satisfaction
    expect(screen.getByText('65')).toBeInTheDocument(); // Financials
    
    // Check if the score description is displayed
    expect(screen.getByText('Good')).toBeInTheDocument();
  });
  
  it('allows updating health scores', async () => {
    render(<CustomerHealthScore 
      customer={mockCustomer} 
      tenantId={mockTenantId} 
      onUpdate={mockOnUpdate} 
    />);
    
    // Get the sliders (this is a simplified approach, in reality you might need to target more specifically)
    const sliders = screen.getAllByRole('slider');
    
    // Update the first slider (engagement)
    fireEvent.change(sliders[0], { target: { value: 90 } });
    
    // Find and click the update button
    const updateButton = screen.getByRole('button', { name: /update health score/i });
    fireEvent.click(updateButton);
    
    // Wait for the service call to complete
    await waitFor(() => {
      expect(CustomerService.prototype.updateHealthScore).toHaveBeenCalled();
    });
    
    // Check that onUpdate was called
    expect(mockOnUpdate).toHaveBeenCalled();
  });
  
  it('shows the correct score description based on score value', () => {
    // Create a lower health score to test different descriptions
    const lowScoreCustomer = {
      ...mockCustomer,
      healthScore: {
        ...mockCustomer.healthScore,
        overall: 35,
        engagement: 30,
        support: 40,
        growth: 35,
        satisfaction: 30,
        financials: 40
      }
    };
    
    render(<CustomerHealthScore 
      customer={lowScoreCustomer} 
      tenantId={mockTenantId} 
      onUpdate={mockOnUpdate} 
    />);
    
    // Check if the lower score description is displayed
    expect(screen.getByText('Needs Attention')).toBeInTheDocument();
  });
  
  it('calculates overall score correctly from individual scores', () => {
    render(<CustomerHealthScore 
      customer={mockCustomer} 
      tenantId={mockTenantId} 
      onUpdate={mockOnUpdate} 
    />);
    
    // Find the update section with the calculated overall score (75)
    // The average of 70, 80, 75, 85, 65 is 75
    const updateSection = screen.getAllByText('75')[1]; // Get the second occurrence
    expect(updateSection).toBeInTheDocument();
  });
  
  it('handles error during health score update', async () => {
    // Mock the service to throw an error
    CustomerService.prototype.updateHealthScore = jest.fn().mockRejectedValue(new Error('Update failed'));
    
    render(<CustomerHealthScore 
      customer={mockCustomer} 
      tenantId={mockTenantId} 
      onUpdate={mockOnUpdate} 
    />);
    
    // Find and click the update button
    const updateButton = screen.getByRole('button', { name: /update health score/i });
    fireEvent.click(updateButton);
    
    // Wait for the service call to complete
    await waitFor(() => {
      expect(CustomerService.prototype.updateHealthScore).toHaveBeenCalled();
    });
    
    // The toast should be called with an error message
    const { useToast } = require('@/components/ui/use-toast');
    expect(useToast().toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error',
        variant: 'destructive'
      })
    );
    
    // onUpdate should not have been called
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });
  
  it('adds a note when provided during health score update', async () => {
    render(<CustomerHealthScore 
      customer={mockCustomer} 
      tenantId={mockTenantId} 
      onUpdate={mockOnUpdate} 
    />);
    
    // Get the notes textarea and add a note
    const notesTextarea = screen.getByPlaceholderText(/add notes about this update/i);
    fireEvent.change(notesTextarea, { target: { value: 'Test note for health score update' } });
    
    // Find and click the update button
    const updateButton = screen.getByRole('button', { name: /update health score/i });
    fireEvent.click(updateButton);
    
    // Wait for the service calls to complete
    await waitFor(() => {
      expect(CustomerService.prototype.updateHealthScore).toHaveBeenCalled();
      expect(CustomerService.prototype.addNote).toHaveBeenCalled();
    });
    
    // Check that the note was added with the correct content
    expect(CustomerService.prototype.addNote).toHaveBeenCalledWith(
      mockTenantId,
      mockCustomer.id,
      expect.objectContaining({
        content: expect.stringContaining('Test note for health score update')
      })
    );
  });
}); 