# LeadLink CRM Testing Framework Documentation

## Overview

This document provides comprehensive documentation for the testing framework implemented in the LeadLink CRM project. It covers the testing architecture, tools used, test types, best practices, and guides for extending the test suite.

## Testing Architecture

The LeadLink CRM testing framework is built on several key principles:

1. **Comprehensive Coverage**: Tests cover all critical components, services, and utilities
2. **Isolation**: Tests run in isolation to prevent cross-test interference
3. **Mock-Based Testing**: External dependencies are properly mocked
4. **Performance Monitoring**: Performance testing is integrated into the framework
5. **Multi-tenant Validation**: Specific focus on tenant data isolation testing

### Directory Structure

```
src/
├── __tests__/                    # Main test directory
│   ├── components/               # Component tests
│   │   ├── auth/                 # Authentication component tests
│   │   ├── dashboard/            # Dashboard component tests
│   │   ├── customers/            # Customer component tests
│   │   └── leads/                # Lead component tests
│   ├── services/                 # Service tests
│   │   ├── CustomerService.test.ts
│   │   ├── LeadService.test.ts
│   │   ├── UserService.test.ts
│   │   ├── TenantService.test.ts
│   │   └── CompanyService.test.ts
│   ├── utils/                    # Utility function tests
│   │   ├── testMultiTenantIsolation.test.ts
│   │   └── performanceTester.test.ts
│   └── security/                 # Security-focused tests
│       ├── FirebaseSecurityRules.test.ts
│       ├── AuthenticationFlows.test.ts
│       └── VulnerabilityTests.test.tsx
├── scripts/                      # Test scripts
│   ├── validateMultiTenantWithRealData.ts
│   ├── verifyDataSegregationAtScale.ts
│   ├── performanceTest.ts
│   └── optimizeResponseTimes.ts
└── utils/                        # Test utilities
    ├── testMultiTenantIsolation.ts
    └── testHelpers.ts
```

## Tools and Libraries

### Core Testing Tools

- **Jest**: Primary test runner and assertion library
- **React Testing Library**: For testing React components
- **Firebase Testing**: Firebase emulator and rules testing utilities
- **Mock Service Worker**: For intercepting and mocking API requests

### Configuration Files

- **jest.config.js**: Main Jest configuration
- **jest.setup.js**: Test setup file for global configurations
- **tsconfig.test.json**: TypeScript configuration specific to tests

## Test Types

### 1. Component Tests

Component tests validate the proper rendering and behavior of React components. They focus on:

- Proper rendering of UI elements
- User interactions (clicks, input changes)
- Component state management
- Integration with services through mocks

Example component test:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { SignInForm } from '@/components/auth/SignInForm';

describe('SignInForm', () => {
  it('submits the form with user credentials', async () => {
    render(<SignInForm />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Assert expected behavior
    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
  });
});
```

### 2. Service Tests

Service tests validate the functionality of service modules that interact with Firebase or other external systems:

- CRUD operations
- Error handling
- Data validation
- Special query methods

Example service test:

```typescript
import { LeadService } from '@/lib/services/LeadService';

describe('LeadService', () => {
  let leadService: LeadService;
  
  beforeEach(() => {
    // Setup mocks and service instance
    leadService = new LeadService();
  });
  
  it('creates a new lead', async () => {
    const newLead = { /* lead data */ };
    const result = await leadService.createLead(newLead);
    
    expect(result).toHaveProperty('id');
    expect(mockFirestore.collection).toHaveBeenCalledWith('tenants/tenant-id/leads');
  });
});
```

### 3. Security Tests

Security tests focus on validating security rules, authentication flows, and vulnerability prevention:

- Firebase security rules testing
- Authentication and authorization validation
- Input validation and sanitization
- Protection against common vulnerabilities

Example security test:

```typescript
import { RulesTestEnvironment } from '@firebase/rules-unit-testing';

describe('Firebase Security Rules', () => {
  let testEnv: RulesTestEnvironment;
  
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      // Test environment configuration
    });
  });
  
  it('prevents cross-tenant data access', async () => {
    const userAContext = testEnv.authenticatedContext('user-a', { tenantId: 'tenant-a' });
    const leadsRef = userAContext.firestore().collection('tenants/tenant-b/leads');
    
    await expect(leadsRef.get()).toBeRejectedWith(/permission_denied/);
  });
});
```

### 4. Multi-tenant Isolation Tests

These tests focus specifically on validating data isolation between tenants:

- Cross-tenant access prevention
- Tenant-specific data retrieval
- Data integrity across tenants

Example multi-tenant test:

```typescript
import { MultiTenantIsolationTest } from '@/utils/testMultiTenantIsolation';

describe('Multi-tenant Isolation', () => {
  let isolationTest: MultiTenantIsolationTest;
  
  beforeEach(() => {
    isolationTest = new MultiTenantIsolationTest();
  });
  
  it('prevents access to data from another tenant', async () => {
    const result = await isolationTest.testCrossTenantAccessPrevention(
      'tenant-a', 
      'tenant-b',
      'leads'
    );
    
    expect(result.blocked).toEqual(result.attempts);
  });
});
```

### 5. Performance Tests

Performance tests measure and optimize system performance:

- Response time measurement
- Load testing
- Memory usage monitoring
- Optimization of slow operations

Example performance test:

```typescript
import { PerformanceTester } from '@/utils/performanceTester';

describe('API Performance', () => {
  let perfTester: PerformanceTester;
  
  beforeEach(() => {
    perfTester = new PerformanceTester();
  });
  
  it('retrieves leads within acceptable time', async () => {
    const result = await perfTester.measureResponseTime(
      () => leadService.getLeads('tenant-id')
    );
    
    expect(result.averageTime).toBeLessThan(200); // 200ms threshold
  });
});
```

## Mocking Strategy

The testing framework uses several mocking approaches:

### 1. Service Mocks

Services are mocked using Jest's mock functionality:

```typescript
jest.mock('@/lib/services/LeadService');

// In the test:
(LeadService.prototype.getLeads as jest.Mock).mockResolvedValue([/* mock data */]);
```

### 2. Firebase Mocks

Firebase services are mocked using specialized mocking utilities:

```typescript
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  // Other Firestore methods
}));
```

### 3. React Component Mocks

For testing components that use other components:

```typescript
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick }) => (
    <button onClick={onClick} data-testid="mocked-button">{children}</button>
  )
}));
```

## Test Scripts

Several specialized scripts are available for comprehensive testing:

### 1. Multi-tenant Validation Script

`validateMultiTenantWithRealData.ts` validates tenant isolation with real data:

```bash
npm run test:multi-tenant
```

### 2. Data Segregation Script

`verifyDataSegregationAtScale.ts` tests data segregation with large datasets:

```bash
npm run test:data-segregation
```

### 3. Performance Testing Script

`performanceTest.ts` runs performance tests on critical endpoints:

```bash
npm run test:performance
```

### 4. Response Time Optimization Script

`optimizeResponseTimes.ts` measures and optimizes API response times:

```bash
npm run test:optimize-response
```

## Best Practices

### Component Testing

1. **Test user interactions**, not implementation details
2. **Use data-testid attributes** for stable selection
3. **Mock external dependencies** like services
4. **Test edge cases** like loading states and error handling

### Service Testing

1. **Mock Firebase interactions** for predictable tests
2. **Test both success and error paths**
3. **Validate proper data transformation**
4. **Test special query methods** with different parameters

### Security Testing

1. **Test both positive and negative cases** (allowed and denied access)
2. **Validate all security rules** across collections
3. **Test with different user roles** and authentication states
4. **Include cross-tenant access prevention tests**

## Adding New Tests

### Adding a Component Test

1. Create a new file in `src/__tests__/components/{category}/{ComponentName}.test.tsx`
2. Import the component and testing utilities
3. Mock necessary dependencies
4. Write tests for rendering, interactions, and state changes

### Adding a Service Test

1. Create a new file in `src/__tests__/services/{ServiceName}.test.ts`
2. Import the service and mock Firebase or other dependencies
3. Create tests for each method in the service
4. Include tests for error handling and edge cases

## Continuous Integration

Tests are run automatically on:
- Pull requests to the main branch
- Nightly builds
- Release preparation

The CI pipeline runs:
1. Unit tests
2. Component tests
3. Service tests
4. Security validation
5. Performance benchmarks

## Troubleshooting

### Common Issues

1. **Mocks not working**
   - Ensure mocks are defined before imports
   - Check the mock implementation matches expected usage

2. **Async test timeouts**
   - Use proper async/await patterns
   - Increase timeout for complex tests: `jest.setTimeout(10000)`

3. **Test environment issues**
   - Ensure `.env.test` has required configuration
   - Reset mocks between tests with `jest.clearAllMocks()`

## Conclusion

The testing framework provides a comprehensive approach to ensuring the quality, security, and performance of the LeadLink CRM system. By following the patterns and practices established in this documentation, developers can maintain and extend the test suite to cover new features and components as the system evolves.

---

Last Updated: April 1, 2024 