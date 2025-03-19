# Firebase Testing Framework

This directory contains the testing framework for the Firebase implementation. It provides utilities and services for testing Firebase authentication, Firestore operations, and integration between various Firebase services.

## Testing Structure

- `TestingService.ts`: Core testing service with utilities for test setup, assertions, and cleanup
- `auth.test.ts`: Unit tests for Firebase Authentication
- `firestore.test.ts`: Unit tests for Firestore operations
- `integration.test.ts`: Integration tests for interactions between Firebase services
- `testRunner.ts`: Test runner for executing tests in CI/CD pipelines or locally

## Running Tests

### Run all tests

```bash
node src/lib/testing/testRunner.js
```

### Run specific test suites

```bash
node src/lib/testing/testRunner.js --filter auth,firestore
```

### Generate test reports

```bash
node src/lib/testing/testRunner.js --output test-results.xml --format junit
```

## Available Options

The test runner supports the following options:

- `--filter <filter>`: Filter tests to run (auth,firestore,integration,all)
- `--output <file>`: Output file for test results
- `--format <format>`: Output format (json,junit,console)
- `--verbose`: Verbose output
- `--fail-fast`: Stop on first test failure
- `--help`: Show help

## CI/CD Integration

The tests are integrated with GitHub Actions for continuous integration. The workflow file is located at `.github/workflows/firebase-tests.yml`. Tests will run automatically on:

- Push to main and develop branches
- Pull requests to main and develop branches
- Manual workflow dispatch

## Adding New Tests

To add new tests:

1. Create a new test suite in the appropriate file or create a new file for a new test category
2. Use the `TestingService` to set up test data and make assertions
3. Implement a run function to execute the tests
4. Add the test suite to the test runner

### Example Test Suite

```typescript
import { TestingService, TestResult, TestStatus } from './TestingService';

export async function runCustomTests() {
  const testingService = new TestingService('custom-tests');
  const results: TestResult[] = [];
  
  // Test 1: Your test description
  try {
    // Setup test data
    const testData = await testingService.setupTestData();
    
    // Perform assertions
    testingService.assertEqual(actual, expected, 'Values should match');
    
    results.push({
      testName: 'Your test name',
      status: TestStatus.PASSED
    });
  } catch (error) {
    results.push({
      testName: 'Your test name',
      status: TestStatus.FAILED,
      error
    });
  }
  
  // Clean up test data
  await testingService.cleanup();
  
  // Return test results
  const passedTests = results.filter(r => r.status === TestStatus.PASSED).length;
  
  return {
    totalTests: results.length,
    passedTests,
    successRate: Math.round((passedTests / results.length) * 100),
    results
  };
}
```

## Best Practices

- Use the `TestingService` for consistent test setup and teardown
- Create isolated test data for each test to avoid interference
- Clean up test data after tests complete
- Use descriptive test names and error messages
- Group related tests into test suites
- Keep tests independent and idempotent

## Mocking Firebase Services

The `TestingService` provides mocking capabilities for Firebase services. Use these mocks to isolate tests and improve test reliability.

```typescript
// Example: Mocking Firebase Auth
const mockAuth = testingService.mockFirebaseAuth();

// Example: Mocking Firestore
const mockFirestore = testingService.mockFirestore();

// Example: Mocking Cloud Functions
const mockFunctions = testingService.mockCloudFunctions();
```

## Troubleshooting

- If tests fail with connection issues, ensure Firebase emulators are running
- For authentication test failures, check that the test user credentials are valid
- For Firestore test failures, verify that security rules allow test operations
- If CI/CD tests fail but local tests pass, check environment variables and secrets 