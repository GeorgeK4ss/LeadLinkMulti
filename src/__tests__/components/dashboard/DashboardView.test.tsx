/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { CustomerService } from '@/lib/services/CustomerService';
import { LeadService } from '@/lib/services/LeadService';
import '@testing-library/jest-dom';

// Mock the customer and lead services
jest.mock('@/lib/services/CustomerService', () => ({
  CustomerService: jest.fn().mockImplementation(() => ({
    getCustomerStats: jest.fn().mockResolvedValue({
      total: 120,
      active: 85,
      inactive: 15,
      atRisk: 10,
      churned: 10,
      customersByCategory: {
        enterprise: 20,
        mid_market: 40,
        small_business: 60,
        vip: 5,
        startup: 15
      },
      averageLifetimeValue: 12500,
    }),
    getCustomers: jest.fn().mockResolvedValue([
      {
        id: 'customer-1',
        name: 'Acme Inc',
        status: 'active',
        category: 'enterprise',
        createdAt: '2023-03-01T00:00:00.000Z',
        lastUpdated: '2023-04-15T00:00:00.000Z',
      },
      {
        id: 'customer-2',
        name: 'Beta Corp',
        status: 'active',
        category: 'mid_market',
        createdAt: '2023-02-15T00:00:00.000Z',
        lastUpdated: '2023-03-20T00:00:00.000Z',
      },
      {
        id: 'customer-3',
        name: 'Gamma LLC',
        status: 'inactive',
        category: 'small_business',
        createdAt: '2023-01-10T00:00:00.000Z',
        lastUpdated: '2023-02-05T00:00:00.000Z',
      }
    ])
  }))
}));

jest.mock('@/lib/services/LeadService', () => ({
  LeadService: jest.fn().mockImplementation(() => ({
    getLeads: jest.fn().mockResolvedValue([
      {
        id: 'lead-1',
        contact: { name: 'John Doe', email: 'john@example.com' },
        company: { name: 'Delta Corp' },
        status: 'new',
        createdAt: '2023-03-01T00:00:00.000Z',
        lastUpdated: '2023-03-01T00:00:00.000Z',
      },
      {
        id: 'lead-2',
        contact: { name: 'Jane Smith', email: 'jane@example.com' },
        company: { name: 'Echo Inc' },
        status: 'contacted',
        createdAt: '2023-02-15T00:00:00.000Z',
        lastUpdated: '2023-02-20T00:00:00.000Z',
      },
      {
        id: 'lead-3',
        contact: { name: 'Bob Johnson', email: 'bob@example.com' },
        company: { name: 'Fox LLC' },
        status: 'qualified',
        createdAt: '2023-02-01T00:00:00.000Z',
        lastUpdated: '2023-02-10T00:00:00.000Z',
      },
      {
        id: 'lead-4',
        contact: { name: 'Alice Brown', email: 'alice@example.com' },
        company: { name: 'Golf Corp' },
        status: 'proposal',
        createdAt: '2023-01-15T00:00:00.000Z',
        lastUpdated: '2023-01-25T00:00:00.000Z',
      },
      {
        id: 'lead-5',
        contact: { name: 'Charlie Wilson', email: 'charlie@example.com' },
        company: { name: 'Hotel Inc' },
        status: 'closed',
        createdAt: '2023-01-05T00:00:00.000Z',
        lastUpdated: '2023-01-20T00:00:00.000Z',
      },
      {
        id: 'lead-6',
        contact: { name: 'Diana Miller', email: 'diana@example.com' },
        company: { name: 'India Corp' },
        status: 'lost',
        createdAt: '2022-12-20T00:00:00.000Z',
        lastUpdated: '2023-01-10T00:00:00.000Z',
      }
    ])
  }))
}));

// Mock the chart components
jest.mock('@/components/charts', () => ({
  PieChart: jest.fn().mockImplementation(({ data }) => (
    <div data-testid="pie-chart">
      <div data-testid="pie-chart-data">{JSON.stringify(data)}</div>
    </div>
  )),
  LineChart: jest.fn().mockImplementation(({ data, xKey, yKey, name }) => (
    <div data-testid="line-chart">
      <div data-testid="line-chart-data">{JSON.stringify({ data, xKey, yKey, name })}</div>
    </div>
  )),
  BarChart: jest.fn().mockImplementation(({ data, xKey, yKey, name }) => (
    <div data-testid="bar-chart">
      <div data-testid="bar-chart-data">{JSON.stringify({ data, xKey, yKey, name })}</div>
    </div>
  )),
}));

describe('DashboardView', () => {
  const mockTenantId = 'tenant-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders the dashboard with KPI cards', async () => {
    render(<DashboardView tenantId={mockTenantId} />);
    
    // Check if the dashboard title is rendered
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    
    // Wait for the data to load and KPI cards to render
    await waitFor(() => {
      // Check KPI cards
      expect(screen.getByText('Total Leads')).toBeInTheDocument();
      expect(screen.getByText('Total Customers')).toBeInTheDocument();
      expect(screen.getByText('Lead Conversion Rate')).toBeInTheDocument();
      expect(screen.getByText('Avg. Customer Value')).toBeInTheDocument();
      
      // Check KPI values
      expect(screen.getByText('6')).toBeInTheDocument(); // Total Leads
      expect(screen.getByText('120')).toBeInTheDocument(); // Total Customers
      expect(screen.getByText('25.0%')).toBeInTheDocument(); // Conversion Rate (1 closed out of 4 qualified or higher)
      expect(screen.getByText('$12,500')).toBeInTheDocument(); // Avg Customer Value
    });
  });
  
  it('renders tabs for different dashboard sections', async () => {
    render(<DashboardView tenantId={mockTenantId} />);
    
    // Check if tabs are rendered
    expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Leads' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Customers' })).toBeInTheDocument();
    
    // Overview tab should be selected by default
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
    
    // Check if overview tab content is rendered
    await waitFor(() => {
      expect(screen.getByText('New Leads Over Time')).toBeInTheDocument();
      expect(screen.getByText('New Customers Over Time')).toBeInTheDocument();
      expect(screen.getByText('Lead Status Distribution')).toBeInTheDocument();
      expect(screen.getByText('Customer Categories')).toBeInTheDocument();
    });
    
    // Click on Leads tab
    fireEvent.click(screen.getByRole('tab', { name: 'Leads' }));
    
    // Check if leads tab content is rendered
    await waitFor(() => {
      expect(screen.getByText('Lead Conversion Rate')).toBeInTheDocument();
      expect(screen.getByText('Lead Generation Trend')).toBeInTheDocument();
    });
    
    // Click on Customers tab
    fireEvent.click(screen.getByRole('tab', { name: 'Customers' }));
    
    // Check if customers tab content is rendered
    await waitFor(() => {
      expect(screen.getByText('Customer Categories')).toBeInTheDocument();
      expect(screen.getByText('Customer Status')).toBeInTheDocument();
      expect(screen.getByText('Customer Acquisition Trend')).toBeInTheDocument();
    });
  });
  
  it('switches between different timeframes', async () => {
    // Create spies for the service methods
    const customerServiceSpy = jest.spyOn(CustomerService.prototype, 'getCustomerStats');
    const customersSpy = jest.spyOn(CustomerService.prototype, 'getCustomers');
    const leadsSpy = jest.spyOn(LeadService.prototype, 'getLeads');
    
    render(<DashboardView tenantId={mockTenantId} />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
    
    // Check that data was loaded for the default 30 days view
    expect(customerServiceSpy).toHaveBeenCalledWith(mockTenantId);
    expect(customersSpy).toHaveBeenCalledWith(mockTenantId, 1000);
    expect(leadsSpy).toHaveBeenCalledWith(mockTenantId);
    
    // Reset spy call counts
    customerServiceSpy.mockClear();
    customersSpy.mockClear();
    leadsSpy.mockClear();
    
    // Click on 90 Days button
    fireEvent.click(screen.getByRole('button', { name: '90 Days' }));
    
    // Check that data is reloaded
    await waitFor(() => {
      expect(customerServiceSpy).toHaveBeenCalledWith(mockTenantId);
      expect(customersSpy).toHaveBeenCalledWith(mockTenantId, 1000);
      expect(leadsSpy).toHaveBeenCalledWith(mockTenantId);
    });
    
    // Reset spy call counts
    customerServiceSpy.mockClear();
    customersSpy.mockClear();
    leadsSpy.mockClear();
    
    // Click on 12 Months button
    fireEvent.click(screen.getByRole('button', { name: '12 Months' }));
    
    // Check that data is reloaded
    await waitFor(() => {
      expect(customerServiceSpy).toHaveBeenCalledWith(mockTenantId);
      expect(customersSpy).toHaveBeenCalledWith(mockTenantId, 1000);
      expect(leadsSpy).toHaveBeenCalledWith(mockTenantId);
    });
  });
  
  it('renders charts with the correct data', async () => {
    render(<DashboardView tenantId={mockTenantId} />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
    
    // Check if charts are rendered
    const pieCharts = await screen.findAllByTestId('pie-chart');
    expect(pieCharts.length).toBeGreaterThan(0);
    
    const lineCharts = await screen.findAllByTestId('line-chart');
    expect(lineCharts.length).toBeGreaterThan(0);
    
    // Check specific chart data
    const pieChartDataElements = await screen.findAllByTestId('pie-chart-data');
    const leadStatusChartData = pieChartDataElements.find(element => 
      element.textContent?.includes('New') && 
      element.textContent?.includes('Contacted')
    );
    
    const customerCategoryChartData = pieChartDataElements.find(element => 
      element.textContent?.includes('enterprise') && 
      element.textContent?.includes('mid market')
    );
    
    // Verify lead status chart data
    expect(leadStatusChartData).toBeTruthy();
    const leadStatusData = JSON.parse(leadStatusChartData?.textContent || '[]');
    expect(leadStatusData).toContainEqual(expect.objectContaining({ name: 'New', value: 1 }));
    expect(leadStatusData).toContainEqual(expect.objectContaining({ name: 'Contacted', value: 1 }));
    expect(leadStatusData).toContainEqual(expect.objectContaining({ name: 'Qualified', value: 1 }));
    
    // Verify customer category chart data
    expect(customerCategoryChartData).toBeTruthy();
    const customerCategoryData = JSON.parse(customerCategoryChartData?.textContent || '[]');
    expect(customerCategoryData).toContainEqual(expect.objectContaining({ name: 'enterprise', value: 20 }));
    expect(customerCategoryData).toContainEqual(expect.objectContaining({ name: 'mid market', value: 40 }));
    expect(customerCategoryData).toContainEqual(expect.objectContaining({ name: 'small business', value: 60 }));
  });
  
  it('shows loading state initially', () => {
    // Mock implementation to delay API responses
    jest.spyOn(CustomerService.prototype, 'getCustomerStats').mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        total: 120,
        active: 85,
        inactive: 15,
        atRisk: 10,
        churned: 10,
        customersByCategory: {
          enterprise: 20,
          mid_market: 40,
          small_business: 60,
          vip: 5,
          startup: 15
        },
        averageLifetimeValue: 12500,
      }), 100))
    );
    
    jest.spyOn(LeadService.prototype, 'getLeads').mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 100))
    );
    
    render(<DashboardView tenantId={mockTenantId} />);
    
    // No specific loading indicator in the component, but we can check that
    // KPI values aren't available initially
    expect(screen.queryByText('120')).not.toBeInTheDocument(); // Total Customers
  });
}); 