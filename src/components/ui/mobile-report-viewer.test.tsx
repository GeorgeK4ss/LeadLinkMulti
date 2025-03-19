import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MobileReportViewer, ReportData } from './mobile-report-viewer';

// Mock the useIsMobile hook
jest.mock('@/hooks/use-is-mobile', () => ({
  useIsMobile: () => false, // Default to desktop
}));

// Sample report data for testing
const mockReport: ReportData = {
  title: "Test Report",
  date: "April 23, 2024",
  summary: "Test report summary",
  sections: [
    {
      title: "Test Section",
      content: "Test content"
    }
  ],
  metrics: [
    {
      label: "Test Metric",
      value: "100",
      change: 10,
      status: "positive"
    }
  ],
  tables: [
    {
      title: "Test Table",
      headers: ["Header 1", "Header 2"],
      rows: [
        ["Cell 1", "Cell 2"],
        ["Cell 3", "Cell 4"]
      ],
      summary: "Test table summary"
    }
  ],
  charts: [
    {
      title: "Test Chart",
      type: "bar",
      description: "Test chart description",
      component: <div data-testid="chart">Chart content</div>
    }
  ]
};

describe('MobileReportViewer', () => {
  it('renders the report title', () => {
    const { getByText } = render(<MobileReportViewer report={mockReport} />);
    expect(getByText('Test Report')).toBeInTheDocument();
  });

  it('renders the report summary', () => {
    const { getByText } = render(<MobileReportViewer report={mockReport} />);
    expect(getByText('Test report summary')).toBeInTheDocument();
  });

  it('renders metrics', () => {
    const { getByText } = render(<MobileReportViewer report={mockReport} />);
    expect(getByText('Test Metric')).toBeInTheDocument();
    expect(getByText('100')).toBeInTheDocument();
    expect(getByText('+10%')).toBeInTheDocument();
  });

  it('renders export, share, and print buttons when callbacks are provided', () => {
    const onExport = jest.fn();
    const onShare = jest.fn();
    const onPrint = jest.fn();
    
    const { container } = render(
      <MobileReportViewer 
        report={mockReport}
        onExport={onExport}
        onShare={onShare}
        onPrint={onPrint}
      />
    );
    
    expect(container.querySelectorAll('button')).toHaveLength(4); // 3 action buttons + 1 tab
  });

  it('does not render action buttons when callbacks are not provided', () => {
    const { container } = render(<MobileReportViewer report={mockReport} />);
    
    // Should only have the 1 content tab button
    expect(container.querySelectorAll('button')).toHaveLength(1);
  });
}); 