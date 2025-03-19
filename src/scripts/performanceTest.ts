/**
 * Performance Testing Script
 * This script runs load and stress tests on critical LeadLink CRM features
 */

import { PerformanceTester, LoadTestOptions } from '../utils/performanceTest';
import { config } from 'dotenv';

// Load environment variables
config();

const TENANT_ID = process.env.TEST_TENANT_ID || 'test-tenant-1';
const CUSTOMER_ID = process.env.TEST_CUSTOMER_ID || 'test-customer-1';
const LEAD_ID = process.env.TEST_LEAD_ID || 'test-lead-1';

async function runPerformanceTests() {
  console.log('Running LeadLink CRM Performance Tests');
  console.log('=====================================');
  
  const tester = new PerformanceTester();
  
  // Test configurations
  const testConfigurations: Array<{
    name: string;
    options: LoadTestOptions;
  }> = [
    {
      name: 'Get Customers (Small Load)',
      options: {
        service: 'CustomerService',
        method: 'getCustomers',
        parameters: [TENANT_ID, 20],
        concurrentUsers: 5,
        requestsPerUser: 10
      }
    },
    {
      name: 'Get Customer Details (Medium Load)',
      options: {
        service: 'CustomerService',
        method: 'getCustomer',
        parameters: [TENANT_ID, CUSTOMER_ID],
        concurrentUsers: 20,
        requestsPerUser: 20
      }
    },
    {
      name: 'Get Leads (High Load)',
      options: {
        service: 'LeadService',
        method: 'getLeads',
        parameters: [TENANT_ID],
        concurrentUsers: 50,
        requestsPerUser: 5
      }
    }
  ];
  
  // Run load tests for each configuration
  for (const { name, options } of testConfigurations) {
    console.log(`\n🧪 Running Load Test: ${name}`);
    console.log('------------------------------------------');
    
    try {
      const metrics = await tester.runLoadTest(options);
      
      console.log('\nResults:');
      console.log(`  Total Requests: ${metrics.totalRequests}`);
      console.log(`  Successful Requests: ${metrics.successfulRequests}`);
      console.log(`  Failed Requests: ${metrics.failedRequests}`);
      console.log(`  Total Duration: ${metrics.totalDuration}ms`);
      console.log(`  Min Response Time: ${metrics.minResponseTime}ms`);
      console.log(`  Max Response Time: ${metrics.maxResponseTime}ms`);
      console.log(`  Average Response Time: ${metrics.averageResponseTime.toFixed(2)}ms`);
      console.log(`  Requests Per Second: ${metrics.requestsPerSecond.toFixed(2)}`);
      console.log(`  Success Rate: ${(metrics.successRate * 100).toFixed(2)}%`);
      console.log(`  95th Percentile Response Time: ${metrics.p95ResponseTime}ms`);
      console.log(`  99th Percentile Response Time: ${metrics.p99ResponseTime}ms`);
      
      // Warn if metrics are outside of acceptable ranges
      if (metrics.averageResponseTime > 500) {
        console.warn('⚠️ WARNING: Average response time exceeds 500ms threshold');
      }
      
      if (metrics.successRate < 0.95) {
        console.warn('⚠️ WARNING: Success rate below 95% threshold');
      }
      
      if (metrics.requestsPerSecond < 5) {
        console.warn('⚠️ WARNING: Requests per second below 5 threshold');
      }
    } catch (error) {
      console.error(`❌ ERROR: Test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Run a stress test on a critical endpoint
  console.log('\n🔥 Running Stress Test: Customer Search');
  console.log('------------------------------------------');
  
  try {
    const stressResult = await tester.runStressTest({
      service: 'CustomerService',
      method: 'searchCustomers',
      parameters: [TENANT_ID, { status: ['active'] }],
      initialUsers: 5,
      userIncrement: 5,
      maxUsers: 50,
      targetResponseTime: 1000
    });
    
    if (stressResult.breakingPoint) {
      console.log(`\n🚨 Breaking point reached at ${stressResult.breakingPoint} concurrent users`);
    } else {
      console.log(`\n✅ No breaking point reached up to ${50} concurrent users`);
    }
    
    console.log('\nResults by load level:');
    stressResult.metrics.forEach(metric => {
      console.log(`  ${metric.concurrentUsers} users: ${metric.averageResponseTime.toFixed(2)}ms average, ${(metric.successRate * 100).toFixed(2)}% success`);
    });
  } catch (error) {
    console.error(`❌ ERROR: Stress test failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // Run memory usage test
  console.log('\n🧠 Running Memory Usage Test');
  console.log('------------------------------------------');
  
  try {
    const memoryMetrics = await tester.measureMemoryUsage({
      service: 'CustomerService',
      method: 'getCustomers',
      parameters: [TENANT_ID, 100],
      iterations: 100
    });
    
    console.log('\nMemory Usage Results:');
    console.log(`  Initial Heap Used: ${(memoryMetrics.initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Final Heap Used: ${(memoryMetrics.finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Memory Difference: ${(memoryMetrics.memoryDiff.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    
    if (memoryMetrics.memoryLeakDetected) {
      console.warn('⚠️ WARNING: Potential memory leak detected');
    } else {
      console.log('✅ No significant memory growth detected');
    }
  } catch (error) {
    console.error(`❌ ERROR: Memory test failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  console.log('\n✅ Performance testing completed');
}

// Run the performance tests
runPerformanceTests().catch(error => {
  console.error('Unhandled error in performance testing script:');
  console.error(error);
  process.exit(1);
}); 