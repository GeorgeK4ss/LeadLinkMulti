# LeadLink CRM Testing Guidelines

This directory contains test utilities and configuration for automated testing of the LeadLink CRM application.

## Running Tests

To run all tests:

```bash
npm test
```

To run tests in watch mode (helpful during development):

```bash
npm run test:watch
```

To generate a coverage report:

```bash
npm run test:coverage
```

## Testing Mobile Responsiveness

The testing suite includes utilities for testing components across different viewport sizes:

```typescript
import { render, setMobileViewport, setTabletViewport, setDesktopViewport } from '@/tests/test-utils';

// In your test
describe('YourComponent', () => {
  it('renders properly on mobile', () => {
    setMobileViewport(); // Sets viewport to mobile dimensions
    const { getByTestId } = render(<YourComponent />);
    // Add your expectations
  });

  it('renders properly on desktop', () => {
    setDesktopViewport(); // Sets viewport to desktop dimensions
    const { getByTestId } = render(<YourComponent />);
    // Add your expectations
  });
});
```

## Manual Testing Checklist for Mobile Responsiveness

In addition to automated tests, please test responsive components manually across different devices:

1. **Desktop Browsers**
   - [ ] Chrome (latest)
   - [ ] Firefox (latest)
   - [ ] Safari (latest)
   - [ ] Edge (latest)

2. **Tablet Devices**
   - [ ] iPad (portrait and landscape)
   - [ ] Android tablet (portrait and landscape)

3. **Mobile Devices**
   - [ ] iPhone (latest models, portrait and landscape)
   - [ ] Android phones (various screen sizes, portrait and landscape)
   
4. **Browser DevTools**
   - [ ] Chrome DevTools device emulation
   - [ ] Firefox Responsive Design Mode

## Key Components to Test for Responsiveness

These components have specific responsive behaviors that should be tested thoroughly:

1. **CollapsibleSection & CollapsibleGroup**
   - Verify sections collapse/expand correctly on all devices
   - Check that nested sections work properly
   - Ensure touch targets are appropriate size on mobile
   
2. **ResponsiveContainer**
   - Confirm layout switches between row (desktop) and column (mobile)
   - Validate padding and spacing changes based on viewport
   
3. **MobileReportViewer**
   - Test that tabbed navigation works on mobile
   - Verify charts and tables adapt to screen size
   - Ensure report content is readable on small screens
   
4. **Responsive Table**
   - Check that tables convert to card view on mobile
   - Verify all table data is accessible on mobile
   
## Test Mocks

The testing environment includes mocks for:

1. The `useIsMobile` hook
2. Various responsive components to simplify testing
3. Window resize events and media queries

When writing tests for mobile responsive components, use these mocks as needed. 