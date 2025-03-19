import React from 'react';
import { render, screen, fireEvent } from '@/tests/test-utils';
import { CollapsibleSection, CollapsibleGroup } from './collapsible-section';
import { setMobileViewport, setDesktopViewport } from '@/tests/test-utils';

// Mock the useIsMobile hook
jest.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false, // Default to desktop
}));

describe('CollapsibleSection', () => {
  it('renders with title', () => {
    render(<CollapsibleSection title="Test Title">Content</CollapsibleSection>);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders content when defaultOpen is true', () => {
    render(
      <CollapsibleSection title="Test Title" defaultOpen>
        Test Content
      </CollapsibleSection>
    );
    expect(screen.getByText('Test Content')).toBeVisible();
  });

  it('hides content by default', () => {
    render(
      <CollapsibleSection title="Test Title">
        <div data-testid="content">Test Content</div>
      </CollapsibleSection>
    );
    
    const content = screen.getByTestId('content');
    expect(content.parentElement?.parentElement).toHaveStyle('max-height: 0px');
  });

  it('toggles content visibility when clicked', () => {
    render(
      <CollapsibleSection title="Test Title">
        <div data-testid="content">Test Content</div>
      </CollapsibleSection>
    );
    
    // Initially hidden
    const content = screen.getByTestId('content');
    expect(content.parentElement?.parentElement).toHaveStyle('max-height: 0px');
    
    // Click to expand
    fireEvent.click(screen.getByText('Test Title'));
    
    // Content should now be visible with a height (we can't test the exact height easily)
    expect(content.parentElement?.parentElement).not.toHaveStyle('max-height: 0px');
    
    // Click again to collapse
    fireEvent.click(screen.getByText('Test Title'));
    
    // Should be hidden again
    expect(content.parentElement?.parentElement).toHaveStyle('max-height: 0px');
  });

  it('displays summary when provided and section is closed', () => {
    render(
      <CollapsibleSection title="Test Title" summary="Test Summary">
        Test Content
      </CollapsibleSection>
    );
    
    expect(screen.getByText('Test Summary')).toBeInTheDocument();
    
    // Open the section
    fireEvent.click(screen.getByText('Test Title'));
    
    // Summary should not be visible when open
    expect(screen.queryByText('Test Summary')).not.toBeVisible();
  });

  it('calls onToggle when toggled', () => {
    const onToggle = jest.fn();
    
    render(
      <CollapsibleSection title="Test Title" onToggle={onToggle}>
        Test Content
      </CollapsibleSection>
    );
    
    // Click to expand
    fireEvent.click(screen.getByText('Test Title'));
    expect(onToggle).toHaveBeenCalledWith(true);
    
    // Click to collapse
    fireEvent.click(screen.getByText('Test Title'));
    expect(onToggle).toHaveBeenCalledWith(false);
    
    // Should have been called twice
    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it('renders with custom icon when provided', () => {
    render(
      <CollapsibleSection 
        title="Test Title" 
        icon={<div data-testid="custom-icon">Icon</div>}
      >
        Test Content
      </CollapsibleSection>
    );
    
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});

describe('CollapsibleGroup', () => {
  it('allows only one section to be open at a time by default', () => {
    render(
      <CollapsibleGroup>
        <CollapsibleSection title="Section 1" data-testid="section-1">
          <div data-testid="content-1">Content 1</div>
        </CollapsibleSection>
        <CollapsibleSection title="Section 2" data-testid="section-2">
          <div data-testid="content-2">Content 2</div>
        </CollapsibleSection>
        <CollapsibleSection title="Section 3" data-testid="section-3">
          <div data-testid="content-3">Content 3</div>
        </CollapsibleSection>
      </CollapsibleGroup>
    );
    
    // All sections should be closed initially
    expect(screen.getByTestId('content-1').parentElement?.parentElement).toHaveStyle('max-height: 0px');
    expect(screen.getByTestId('content-2').parentElement?.parentElement).toHaveStyle('max-height: 0px');
    expect(screen.getByTestId('content-3').parentElement?.parentElement).toHaveStyle('max-height: 0px');
    
    // Open first section
    fireEvent.click(screen.getByText('Section 1'));
    
    // First section should be open, others closed
    expect(screen.getByTestId('content-1').parentElement?.parentElement).not.toHaveStyle('max-height: 0px');
    expect(screen.getByTestId('content-2').parentElement?.parentElement).toHaveStyle('max-height: 0px');
    expect(screen.getByTestId('content-3').parentElement?.parentElement).toHaveStyle('max-height: 0px');
    
    // Open second section
    fireEvent.click(screen.getByText('Section 2'));
    
    // Second section should be open, others closed
    expect(screen.getByTestId('content-1').parentElement?.parentElement).toHaveStyle('max-height: 0px');
    expect(screen.getByTestId('content-2').parentElement?.parentElement).not.toHaveStyle('max-height: 0px');
    expect(screen.getByTestId('content-3').parentElement?.parentElement).toHaveStyle('max-height: 0px');
  });

  it('opens the section at defaultOpenIndex by default', () => {
    render(
      <CollapsibleGroup defaultOpenIndex={1}>
        <CollapsibleSection title="Section 1">
          <div data-testid="content-1">Content 1</div>
        </CollapsibleSection>
        <CollapsibleSection title="Section 2">
          <div data-testid="content-2">Content 2</div>
        </CollapsibleSection>
        <CollapsibleSection title="Section 3">
          <div data-testid="content-3">Content 3</div>
        </CollapsibleSection>
      </CollapsibleGroup>
    );
    
    // Second section (index 1) should be open, others closed
    expect(screen.getByTestId('content-1').parentElement?.parentElement).toHaveStyle('max-height: 0px');
    expect(screen.getByTestId('content-2').parentElement?.parentElement).not.toHaveStyle('max-height: 0px');
    expect(screen.getByTestId('content-3').parentElement?.parentElement).toHaveStyle('max-height: 0px');
  });

  it('allows multiple sections open when allowMultiple is true', () => {
    render(
      <CollapsibleGroup allowMultiple>
        <CollapsibleSection title="Section 1">
          <div data-testid="content-1">Content 1</div>
        </CollapsibleSection>
        <CollapsibleSection title="Section 2">
          <div data-testid="content-2">Content 2</div>
        </CollapsibleSection>
      </CollapsibleGroup>
    );
    
    // Open first section
    fireEvent.click(screen.getByText('Section 1'));
    
    // Open second section
    fireEvent.click(screen.getByText('Section 2'));
    
    // Both sections should be open
    expect(screen.getByTestId('content-1').parentElement?.parentElement).not.toHaveStyle('max-height: 0px');
    expect(screen.getByTestId('content-2').parentElement?.parentElement).not.toHaveStyle('max-height: 0px');
  });
}); 