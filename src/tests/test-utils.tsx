import React, { ReactElement } from 'react';
import { render as rtlRender, RenderOptions, fireEvent } from '@testing-library/react';
import { screen } from '@testing-library/dom';

// Define a test wrapper that includes any providers needed for testing
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}
    </>
  );
};

// Custom render function that includes the providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => rtlRender(ui, { wrapper: AllTheProviders, ...options });

// Helper function to simulate mobile viewport
const setMobileViewport = () => {
  window.resizeTo(375, 667); // iPhone 8 dimensions
};

// Helper function to simulate tablet viewport
const setTabletViewport = () => {
  window.resizeTo(768, 1024); // iPad dimensions
};

// Helper function to simulate desktop viewport
const setDesktopViewport = () => {
  window.resizeTo(1280, 800); // Common desktop dimensions
};

// Export everything from testing-library
export * from '@testing-library/react';

// Export our custom utilities
export { customRender as render, setMobileViewport, setTabletViewport, setDesktopViewport }; 