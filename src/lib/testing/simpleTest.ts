/**
 * Simple test script to verify testing setup
 */

console.log('Running simple test verification...');

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
}

const results: TestResult[] = [];

// Simple test 1: Basic assertion
function testBasicAssertion() {
  const name = 'Basic Assertion Test';
  try {
    const expected = 1 + 1;
    const actual = 2;
    
    if (expected !== actual) {
      throw new Error(`Expected ${expected} to equal ${actual}`);
    }
    
    results.push({ name, passed: true });
    console.log(`✅ ${name}: Passed`);
  } catch (error) {
    results.push({ 
      name, 
      passed: false, 
      message: error instanceof Error ? error.message : String(error) 
    });
    console.log(`❌ ${name}: Failed - ${error}`);
  }
}

// Simple test 2: Array comparison
function testArrayComparison() {
  const name = 'Array Comparison Test';
  try {
    const expected = [1, 2, 3];
    const actual = [1, 2, 3];
    
    if (expected.length !== actual.length) {
      throw new Error(`Arrays have different lengths: ${expected.length} vs ${actual.length}`);
    }
    
    for (let i = 0; i < expected.length; i++) {
      if (expected[i] !== actual[i]) {
        throw new Error(`Arrays differ at index ${i}: ${expected[i]} vs ${actual[i]}`);
      }
    }
    
    results.push({ name, passed: true });
    console.log(`✅ ${name}: Passed`);
  } catch (error) {
    results.push({ 
      name, 
      passed: false, 
      message: error instanceof Error ? error.message : String(error) 
    });
    console.log(`❌ ${name}: Failed - ${error}`);
  }
}

// Simple test 3: Object comparison
function testObjectComparison() {
  const name = 'Object Comparison Test';
  try {
    const expected = { name: 'Test', value: 42 };
    const actual = { name: 'Test', value: 42 };
    
    if (expected.name !== actual.name) {
      throw new Error(`Objects have different name property: ${expected.name} vs ${actual.name}`);
    }
    
    if (expected.value !== actual.value) {
      throw new Error(`Objects have different value property: ${expected.value} vs ${actual.value}`);
    }
    
    results.push({ name, passed: true });
    console.log(`✅ ${name}: Passed`);
  } catch (error) {
    results.push({ 
      name, 
      passed: false, 
      message: error instanceof Error ? error.message : String(error) 
    });
    console.log(`❌ ${name}: Failed - ${error}`);
  }
}

// Simple test 4: Async operation
async function testAsyncOperation() {
  const name = 'Async Operation Test';
  try {
    const result = await new Promise<number>((resolve) => {
      setTimeout(() => resolve(42), 100);
    });
    
    if (result !== 42) {
      throw new Error(`Expected 42 but got ${result}`);
    }
    
    results.push({ name, passed: true });
    console.log(`✅ ${name}: Passed`);
  } catch (error) {
    results.push({ 
      name, 
      passed: false, 
      message: error instanceof Error ? error.message : String(error) 
    });
    console.log(`❌ ${name}: Failed - ${error}`);
  }
}

// Run all tests
async function runTests() {
  console.log('Starting tests...\n');
  
  testBasicAssertion();
  testArrayComparison();
  testObjectComparison();
  await testAsyncOperation();
  
  // Print summary
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  
  console.log('\nTest Summary:');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (failedTests > 0) {
    console.log('\nFailed Tests:');
    results.filter(r => !r.passed).forEach(test => {
      console.log(`- ${test.name}: ${test.message}`);
    });
    
    process.exit(1);
  } else {
    console.log('\nAll tests passed! Testing setup is working correctly.');
    process.exit(0);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Error running tests:', error);
    process.exit(1);
  });
}

// CommonJS export
module.exports = { runTests }; 