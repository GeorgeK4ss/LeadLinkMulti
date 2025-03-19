import { runAuthTests } from './auth.test';
import { runFirestoreTests } from './firestore.test';
import { runIntegrationTests, runAllTests } from './integration.test';
import { TestStatus } from './TestingService';
import * as fs from 'fs';
import * as path from 'path';

// Test run options
interface TestRunOptions {
  filter?: string[] | string;
  output?: string;
  format?: 'json' | 'junit' | 'console';
  verbose?: boolean;
  failFast?: boolean;
}

// Test result summary
interface TestSummary {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  successRate: number;
  duration: number;
  details: {
    auth: {
      totalTests: number;
      passedTests: number;
      failedTests: number;
      skippedTests: number;
      successRate: number;
    };
    firestore: {
      totalTests: number;
      passedTests: number;
      failedTests: number;
      skippedTests: number;
      successRate: number;
    };
    integration: {
      totalTests: number;
      passedTests: number;
      failedTests: number;
      skippedTests: number;
      successRate: number;
    };
  };
  failed: {
    testName: string;
    suite: string;
    error?: string;
  }[];
}

/**
 * Run tests with options
 * @param options Test run options
 */
async function runTests(options: TestRunOptions = {}): Promise<TestSummary> {
  console.log('Running Firebase tests...');
  console.log('Options:', JSON.stringify(options, null, 2));
  
  const startTime = Date.now();
  let authResults, firestoreResults, integrationResults;
  
  // Determine which tests to run
  const filter = options.filter || 'all';
  const filters = Array.isArray(filter) ? filter : [filter];
  
  let allResults = true;
  
  for (const f of filters) {
    if (f !== 'all' && f !== 'auth' && f !== 'firestore' && f !== 'integration') {
      console.warn(`Unknown filter: ${f}, ignoring...`);
    }
  }
  
  if (filters.includes('all') || filters.includes('auth')) {
    console.log('\n=== Running Auth Tests ===');
    authResults = await runAuthTests();
    
    if (options.verbose) {
      console.log('Auth Test Results:', JSON.stringify(authResults, null, 2));
    }
    
    if (options.failFast && authResults.successRate < 100) {
      console.error('Auth tests failed, stopping due to failFast option');
      allResults = false;
    }
  }
  
  if (allResults && (filters.includes('all') || filters.includes('firestore'))) {
    console.log('\n=== Running Firestore Tests ===');
    firestoreResults = await runFirestoreTests();
    
    if (options.verbose) {
      console.log('Firestore Test Results:', JSON.stringify(firestoreResults, null, 2));
    }
    
    if (options.failFast && firestoreResults.successRate < 100) {
      console.error('Firestore tests failed, stopping due to failFast option');
      allResults = false;
    }
  }
  
  if (allResults && (filters.includes('all') || filters.includes('integration'))) {
    console.log('\n=== Running Integration Tests ===');
    integrationResults = await runIntegrationTests();
    
    if (options.verbose) {
      console.log('Integration Test Results:', JSON.stringify(integrationResults, null, 2));
    }
  }
  
  // Calculate totals
  const totalDuration = Date.now() - startTime;
  
  const summary: TestSummary = {
    timestamp: new Date().toISOString(),
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    skippedTests: 0,
    successRate: 0,
    duration: totalDuration,
    details: {
      auth: {
        totalTests: authResults?.totalTests || 0,
        passedTests: authResults?.passedTests || 0,
        failedTests: authResults?.totalTests ? authResults.totalTests - authResults.passedTests : 0,
        skippedTests: authResults?.results ? authResults.results.filter(r => r.status === TestStatus.SKIPPED).length : 0,
        successRate: authResults?.successRate || 0
      },
      firestore: {
        totalTests: firestoreResults?.totalTests || 0,
        passedTests: firestoreResults?.passedTests || 0,
        failedTests: firestoreResults?.totalTests ? firestoreResults.totalTests - firestoreResults.passedTests : 0,
        skippedTests: firestoreResults?.results ? firestoreResults.results.filter(r => r.status === TestStatus.SKIPPED).length : 0,
        successRate: firestoreResults?.successRate || 0
      },
      integration: {
        totalTests: integrationResults?.totalTests || 0,
        passedTests: integrationResults?.passedTests || 0,
        failedTests: integrationResults?.totalTests ? integrationResults.totalTests - integrationResults.passedTests : 0,
        skippedTests: integrationResults?.results ? integrationResults.results.filter(r => r.status === TestStatus.SKIPPED).length : 0,
        successRate: integrationResults?.successRate || 0
      }
    },
    failed: []
  };
  
  // Collect failed tests
  if (authResults?.results) {
    const failedAuthTests = authResults.results
      .filter(r => r.status === TestStatus.FAILED)
      .map(r => ({
        testName: r.testName,
        suite: 'Auth',
        error: r.error?.message
      }));
    
    summary.failed.push(...failedAuthTests);
  }
  
  if (firestoreResults?.results) {
    const failedFirestoreTests = firestoreResults.results
      .filter(r => r.status === TestStatus.FAILED)
      .map(r => ({
        testName: r.testName,
        suite: 'Firestore',
        error: r.error?.message
      }));
    
    summary.failed.push(...failedFirestoreTests);
  }
  
  if (integrationResults?.results) {
    const failedIntegrationTests = integrationResults.results
      .filter(r => r.status === TestStatus.FAILED)
      .map(r => ({
        testName: r.testName,
        suite: 'Integration',
        error: r.error?.message
      }));
    
    summary.failed.push(...failedIntegrationTests);
  }
  
  // Calculate overall totals
  summary.totalTests = 
    summary.details.auth.totalTests + 
    summary.details.firestore.totalTests + 
    summary.details.integration.totalTests;
  
  summary.passedTests = 
    summary.details.auth.passedTests + 
    summary.details.firestore.passedTests + 
    summary.details.integration.passedTests;
  
  summary.failedTests = 
    summary.details.auth.failedTests + 
    summary.details.firestore.failedTests + 
    summary.details.integration.failedTests;
  
  summary.skippedTests = 
    summary.details.auth.skippedTests + 
    summary.details.firestore.skippedTests + 
    summary.details.integration.skippedTests;
  
  summary.successRate = summary.totalTests > 0 ? 
    Math.round((summary.passedTests / summary.totalTests) * 100) : 0;
  
  // Output results
  console.log('\n=== Test Run Summary ===');
  console.log(`Total Tests: ${summary.totalTests}`);
  console.log(`Passed: ${summary.passedTests}`);
  console.log(`Failed: ${summary.failedTests}`);
  console.log(`Skipped: ${summary.skippedTests}`);
  console.log(`Success Rate: ${summary.successRate}%`);
  console.log(`Duration: ${summary.duration}ms`);
  
  if (summary.failed.length > 0) {
    console.log('\n=== Failed Tests ===');
    summary.failed.forEach(test => {
      console.log(`- ${test.suite}: ${test.testName}`);
      if (test.error) {
        console.log(`  Error: ${test.error}`);
      }
    });
  }
  
  // Save results if output is specified
  if (options.output) {
    const outputDir = path.dirname(options.output);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const format = options.format || 'json';
    
    switch (format) {
      case 'json':
        fs.writeFileSync(options.output, JSON.stringify(summary, null, 2));
        break;
      
      case 'junit':
        const junitXml = generateJUnitXml(summary);
        fs.writeFileSync(options.output, junitXml);
        break;
      
      default:
        fs.writeFileSync(options.output, JSON.stringify(summary, null, 2));
        break;
    }
    
    console.log(`Test results saved to ${options.output}`);
  }
  
  return summary;
}

/**
 * Generate JUnit XML for test results
 * @param summary Test summary
 */
function generateJUnitXml(summary: TestSummary): string {
  const timestamp = summary.timestamp.replace(/[-:]/g, '');
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += `<testsuites name="Firebase Tests" tests="${summary.totalTests}" failures="${summary.failedTests}" errors="0" skipped="${summary.skippedTests}" time="${summary.duration / 1000}" timestamp="${summary.timestamp}">\n`;
  
  // Auth test suite
  if (summary.details.auth.totalTests > 0) {
    xml += `  <testsuite name="Auth Tests" tests="${summary.details.auth.totalTests}" failures="${summary.details.auth.failedTests}" errors="0" skipped="${summary.details.auth.skippedTests}" time="${summary.duration / 1000}">\n`;
    
    const authFailures = summary.failed.filter(f => f.suite === 'Auth');
    
    // Add test cases
    for (let i = 0; i < summary.details.auth.totalTests; i++) {
      const failure = authFailures.find(f => f.testName === `Test ${i + 1}`);
      
      if (failure) {
        xml += `    <testcase name="${failure.testName}" classname="Auth" time="0">\n`;
        xml += `      <failure message="${failure.error || 'Test failed'}" type="AssertionError">${failure.error || 'Test failed'}</failure>\n`;
        xml += '    </testcase>\n';
      } else {
        xml += `    <testcase name="Test ${i + 1}" classname="Auth" time="0" />\n`;
      }
    }
    
    xml += '  </testsuite>\n';
  }
  
  // Firestore test suite
  if (summary.details.firestore.totalTests > 0) {
    xml += `  <testsuite name="Firestore Tests" tests="${summary.details.firestore.totalTests}" failures="${summary.details.firestore.failedTests}" errors="0" skipped="${summary.details.firestore.skippedTests}" time="${summary.duration / 1000}">\n`;
    
    const firestoreFailures = summary.failed.filter(f => f.suite === 'Firestore');
    
    // Add test cases
    for (let i = 0; i < summary.details.firestore.totalTests; i++) {
      const failure = firestoreFailures.find(f => f.testName === `Test ${i + 1}`);
      
      if (failure) {
        xml += `    <testcase name="${failure.testName}" classname="Firestore" time="0">\n`;
        xml += `      <failure message="${failure.error || 'Test failed'}" type="AssertionError">${failure.error || 'Test failed'}</failure>\n`;
        xml += '    </testcase>\n';
      } else {
        xml += `    <testcase name="Test ${i + 1}" classname="Firestore" time="0" />\n`;
      }
    }
    
    xml += '  </testsuite>\n';
  }
  
  // Integration test suite
  if (summary.details.integration.totalTests > 0) {
    xml += `  <testsuite name="Integration Tests" tests="${summary.details.integration.totalTests}" failures="${summary.details.integration.failedTests}" errors="0" skipped="${summary.details.integration.skippedTests}" time="${summary.duration / 1000}">\n`;
    
    const integrationFailures = summary.failed.filter(f => f.suite === 'Integration');
    
    // Add test cases
    for (let i = 0; i < summary.details.integration.totalTests; i++) {
      const failure = integrationFailures.find(f => f.testName === `Test ${i + 1}`);
      
      if (failure) {
        xml += `    <testcase name="${failure.testName}" classname="Integration" time="0">\n`;
        xml += `      <failure message="${failure.error || 'Test failed'}" type="AssertionError">${failure.error || 'Test failed'}</failure>\n`;
        xml += '    </testcase>\n';
      } else {
        xml += `    <testcase name="Test ${i + 1}" classname="Integration" time="0" />\n`;
      }
    }
    
    xml += '  </testsuite>\n';
  }
  
  xml += '</testsuites>';
  
  return xml;
}

// If this file is executed directly, run the tests
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options: TestRunOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--filter':
        options.filter = args[++i].split(',');
        break;
      
      case '--output':
        options.output = args[++i];
        break;
      
      case '--format':
        options.format = args[++i] as 'json' | 'junit' | 'console';
        break;
      
      case '--verbose':
        options.verbose = true;
        break;
      
      case '--fail-fast':
        options.failFast = true;
        break;
      
      case '--help':
        console.log('Usage: node testRunner.js [options]');
        console.log('');
        console.log('Options:');
        console.log('  --filter <filter>   Filter tests to run (auth,firestore,integration,all)');
        console.log('  --output <file>     Output file for test results');
        console.log('  --format <format>   Output format (json,junit,console)');
        console.log('  --verbose           Verbose output');
        console.log('  --fail-fast         Stop on first test failure');
        console.log('  --help              Show this help');
        process.exit(0);
        break;
      
      default:
        console.warn(`Unknown option: ${arg}`);
        break;
    }
  }
  
  runTests(options)
    .then(summary => {
      // Exit with appropriate code based on test success
      process.exit(summary.failedTests > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Error running tests:', error);
      process.exit(1);
    });
}

// Export for programmatic use
export { runTests };
export type { TestRunOptions, TestSummary }; 