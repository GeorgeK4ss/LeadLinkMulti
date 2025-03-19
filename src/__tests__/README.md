# LeadLink CRM Testing Framework

This directory contains the comprehensive testing framework for the LeadLink CRM application, including unit tests, integration tests, and utilities for multi-tenant validation and performance testing.

## Test Structure

```
src/__tests__/
├── components/     # Tests for UI components
├── lib/            # Tests for library code
├── services/       # Tests for service classes
│   └── CustomerService.test.ts
├── utils/          # Tests for utility functions
│   └── MultiTenantIsolationTest.test.ts
└── README.md       # This file
```

## Getting Started

To run the tests, use one of the following commands:

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode with coverage
npm run test:ci
```

## Multi-Tenant Validation

LeadLink CRM is a multi-tenant system, and it's critical that data is properly isolated between tenants. We've created a dedicated utility for testing tenant isolation:

```bash
# Run multi-tenant validation tests
npm run validate:multitenant
```

This command will test:
- Data isolation between tenants
- Prevention of cross-tenant access
- Complete data segregation

For more information, see `src/utils/testMultiTenantIsolation.ts`.

## Performance Testing

Performance testing is critical to ensure the application remains responsive under load. To run performance tests:

```bash
# Run performance tests
npm run test:performance
```

This will test:
- Load testing with different concurrency levels
- Stress testing to find breaking points
- Memory usage and potential memory leaks

For more information, see `src/utils/performanceTest.ts` and `src/scripts/performanceTest.ts`.

## Test Coverage Goals

We aim for the following test coverage:

- **Overall Coverage**: 80%+
- **Critical Services**: 90%+
- **UI Components**: 75%+
- **Utility Functions**: 85%+

## Writing Tests

### Guidelines

1. Each test file should focus on a single module/component
2. Use descriptive test names that explain what is being tested
3. Follow the Arrange-Act-Assert pattern
4. Mock external dependencies (Firebase, etc.)
5. For UI components, test the core functionality, not implementation details

### Example Test

```typescript
describe('CustomerService', () => {
  let customerService: CustomerService;
  
  beforeEach(() => {
    customerService = new CustomerService();
  });
  
  it('should create a new customer', async () => {
    // Arrange
    const mockCustomer = { /* ... */ };
    
    // Act
    const result = await customerService.createCustomer('tenant-id', mockCustomer);
    
    // Assert
    expect(result).toBeDefined();
  });
});
```

## Firebase Mocking

Firebase is mocked globally in the Jest setup file. See `jest.setup.js` in the project root for details on how Firebase is mocked.

## Continuous Integration

Tests are run automatically on each pull request and push to the main branch. The CI pipeline will:

1. Run all unit and integration tests
2. Generate a coverage report
3. Run multi-tenant validation tests
4. Run performance benchmarks

Any test failures will cause the CI build to fail.

## Test Environment

The test environment uses:

- **Jest**: Test runner and assertion library
- **ts-jest**: TypeScript support for Jest
- **Mock Service Worker**: API mocking
- **testing-library**: UI component testing 