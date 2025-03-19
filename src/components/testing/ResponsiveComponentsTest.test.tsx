import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResponsiveComponentsTest } from './ResponsiveComponentsTest';
import { setMobileViewport, setDesktopViewport } from '@/tests/test-utils';

// Mock the hooks
const mockIsMobile = jest.fn().mockReturnValue(false);
jest.mock('@/hooks/use-is-mobile', () => ({
  useIsMobile: () => mockIsMobile()
}));

// Mock the child components to avoid complex rendering
jest.mock('@/components/ui/responsive-container', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-responsive-container">{children}</div>
  )
}));

jest.mock('@/components/ui/collapsible-section', () => ({
  CollapsibleSection: ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div data-testid="mock-collapsible-section">
      <h4>{title}</h4>
      <div>{children}</div>
    </div>
  ),
  CollapsibleGroup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-collapsible-group">{children}</div>
  )
}));

jest.mock('@/components/ui/mobile-report-viewer', () => ({
  MobileReportViewer: ({ report }: { report: any }) => (
    <div data-testid="mock-report-viewer">
      <h3>{report.title}</h3>
      <p>{report.summary}</p>
    </div>
  )
}));

describe('ResponsiveComponentsTest', () => {
  beforeEach(() => {
    mockIsMobile.mockReturnValue(false); // Default to desktop
  });

  it('renders in desktop mode', () => {
    const { getByText, getByTestId, getAllByTestId } = render(<ResponsiveComponentsTest />);
    
    // Should render the desktop indicator
    expect(getByText('Desktop')).toBeInTheDocument();
    
    // Should render all three main component sections
    expect(getByText('ResponsiveContainer Test')).toBeInTheDocument();
    expect(getByText('CollapsibleSection Test')).toBeInTheDocument();
    expect(getByText('MobileReportViewer Test')).toBeInTheDocument();
    
    // Should render the mocked components
    expect(getAllByTestId('mock-responsive-container')).toHaveLength(1);
    expect(getAllByTestId('mock-collapsible-group')).toHaveLength(1);
    expect(getByTestId('mock-report-viewer')).toBeInTheDocument();
  });
  
  it('renders in mobile mode', () => {
    // Set the mock to return true for mobile
    mockIsMobile.mockReturnValue(true);
    
    const { getByText } = render(<ResponsiveComponentsTest />);
    
    // Should render the mobile indicator
    expect(getByText('Mobile')).toBeInTheDocument();
  });
  
  it('renders test report data', () => {
    const { getByText } = render(<ResponsiveComponentsTest />);
    
    // Should render the test report title
    expect(getByText('Mobile Responsive Test Report')).toBeInTheDocument();
    expect(getByText('This report tests the responsive layout capabilities of our reporting system.')).toBeInTheDocument();
  });
}); 