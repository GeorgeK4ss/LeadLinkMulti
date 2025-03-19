/**
 * Performance testing utility for LeadLink CRM
 * Used to test load capacity, stress resistance, and memory usage
 */

import { CompanyService } from '@/lib/services/CompanyService';
import { TenantService } from '@/lib/services/TenantService';
import { UserService } from '@/lib/services/UserService';
import { LeadService } from '@/lib/services/LeadService';
import { CustomerService } from '@/lib/services/CustomerService';

export class PerformanceTester {
  private companyService: CompanyService;
  private tenantService: TenantService;
  private userService: UserService;
  private leadService: LeadService;
  private customerService: CustomerService;
  
  constructor() {
    this.companyService = new CompanyService();
    this.tenantService = new TenantService();
    this.userService = new UserService();
    this.leadService = new LeadService('default-tenant-id');
    this.customerService = new CustomerService();
  }
  
  /**
   * Runs a load test on the specified service method
   * @param options Load test options
   * @returns Performance metrics for the load test
   */
  async runLoadTest(options: LoadTestOptions): Promise<PerformanceMetrics> {
    const { 
      service, 
      method, 
      parameters, 
      concurrentUsers = 10, 
      requestsPerUser = 10, 
      delayBetweenRequests = 100 
    } = options;
    
    console.log(`Starting load test: ${service}.${method} with ${concurrentUsers} concurrent users`);
    
    const startTime = Date.now();
    const results: RequestResult[] = [];
    
    // Create user simulations
    const userSimulations = [];
    for (let userIndex = 0; userIndex < concurrentUsers; userIndex++) {
      userSimulations.push(this.simulateUser(
        userIndex,
        service,
        method,
        parameters,
        requestsPerUser,
        delayBetweenRequests,
        results
      ));
    }
    
    // Wait for all user simulations to complete
    await Promise.all(userSimulations);
    
    const totalDuration = Date.now() - startTime;
    
    // Calculate metrics
    const metrics = this.calculateMetrics(results, totalDuration);
    
    console.log(`Load test completed in ${totalDuration}ms`);
    console.log(`Average response time: ${metrics.averageResponseTime}ms`);
    console.log(`Requests per second: ${metrics.requestsPerSecond}`);
    console.log(`Success rate: ${metrics.successRate * 100}%`);
    
    return metrics;
  }
  
  /**
   * Runs a stress test by gradually increasing load until failure or threshold reached
   * @param options Stress test options
   * @returns Array of performance metrics for each stress level
   */
  async runStressTest(options: StressTestOptions): Promise<StressTestResult> {
    const { 
      service, 
      method, 
      parameters, 
      initialUsers = 5, 
      userIncrement = 5, 
      maxUsers = 100, 
      requestsPerUser = 5,
      targetResponseTime = 1000,
      delayBetweenRequests = 100
    } = options;
    
    console.log(`Starting stress test: ${service}.${method}`);
    console.log(`Initial users: ${initialUsers}, Max users: ${maxUsers}, Target response time: ${targetResponseTime}ms`);
    
    const results: Array<PerformanceMetrics & { concurrentUsers: number }> = [];
    let breakingPoint: number | null = null;
    
    // Start with initial users and incrementally increase
    for (let users = initialUsers; users <= maxUsers; users += userIncrement) {
      console.log(`Testing with ${users} concurrent users...`);
      
      const metrics = await this.runLoadTest({
        service,
        method,
        parameters,
        concurrentUsers: users,
        requestsPerUser,
        delayBetweenRequests
      });
      
      results.push({
        ...metrics,
        concurrentUsers: users
      });
      
      // Check if we've reached breaking point
      if (
        metrics.averageResponseTime > targetResponseTime || 
        metrics.errorRate > 0.1 || // More than 10% errors
        metrics.successRate < 0.9  // Less than 90% success
      ) {
        breakingPoint = users;
        console.log(`Breaking point reached at ${users} users`);
        console.log(`Average response time: ${metrics.averageResponseTime}ms`);
        console.log(`Error rate: ${metrics.errorRate * 100}%`);
        break;
      }
    }
    
    if (!breakingPoint) {
      console.log(`No breaking point reached with ${maxUsers} users`);
    }
    
    return {
      breakingPoint,
      metrics: results
    };
  }
  
  /**
   * Measures memory usage during operations
   * @param options Memory test options
   * @returns Memory usage metrics
   */
  async measureMemoryUsage(options: MemoryTestOptions): Promise<MemoryMetrics> {
    const { service, method, parameters, iterations = 10 } = options;
    
    console.log(`Starting memory usage test: ${service}.${method}`);
    
    // Get initial memory usage
    const initialMemory = process.memoryUsage();
    
    // Run operations
    for (let i = 0; i < iterations; i++) {
      await this.executeMethod(service, method, parameters);
    }
    
    // Get final memory usage
    const finalMemory = process.memoryUsage();
    
    const memoryDiff = {
      rss: finalMemory.rss - initialMemory.rss,
      heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
      heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
      external: finalMemory.external - initialMemory.external,
      arrayBuffers: finalMemory.arrayBuffers - initialMemory.arrayBuffers
    };
    
    const metrics = {
      initialMemory,
      finalMemory,
      memoryDiff,
      memoryLeakDetected: memoryDiff.heapUsed > 10 * 1024 * 1024 // Arbitrary threshold of 10MB
    };
    
    console.log(`Memory usage test completed`);
    console.log(`Initial heap used: ${Math.round(initialMemory.heapUsed / 1024 / 1024)}MB`);
    console.log(`Final heap used: ${Math.round(finalMemory.heapUsed / 1024 / 1024)}MB`);
    console.log(`Memory difference: ${Math.round(memoryDiff.heapUsed / 1024 / 1024)}MB`);
    
    return metrics;
  }
  
  /**
   * Simulates a user making multiple requests
   */
  private async simulateUser(
    userIndex: number,
    service: ServiceName,
    method: string,
    parameters: any[],
    requestCount: number,
    delayMs: number,
    results: RequestResult[]
  ): Promise<void> {
    for (let requestIndex = 0; requestIndex < requestCount; requestIndex++) {
      // Add small random delay to simulate more realistic traffic
      await new Promise(resolve => setTimeout(resolve, Math.random() * delayMs));
      
      const result = await this.makeRequest(service, method, parameters);
      results.push(result);
    }
  }
  
  /**
   * Makes a single request and measures performance
   */
  private async makeRequest(
    service: ServiceName,
    method: string,
    parameters: any[]
  ): Promise<RequestResult> {
    const startTime = Date.now();
    let success = false;
    let error: any = null;
    
    try {
      await this.executeMethod(service, method, parameters);
      success = true;
    } catch (err) {
      error = err;
    }
    
    const duration = Date.now() - startTime;
    
    return {
      duration,
      success,
      error,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Executes a method on the specified service
   */
  private async executeMethod(service: ServiceName, method: string, parameters: any[]): Promise<any> {
    switch (service) {
      case 'CompanyService':
        return (this.companyService as any)[method](...parameters);
      case 'TenantService':
        return (this.tenantService as any)[method](...parameters);
      case 'UserService':
        return (this.userService as any)[method](...parameters);
      case 'LeadService':
        return (this.leadService as any)[method](...parameters);
      case 'CustomerService':
        return (this.customerService as any)[method](...parameters);
      default:
        throw new Error(`Unknown service: ${service}`);
    }
  }
  
  /**
   * Calculates performance metrics from request results
   */
  private calculateMetrics(results: RequestResult[], totalDuration: number): PerformanceMetrics {
    const totalRequests = results.length;
    const successfulRequests = results.filter(r => r.success).length;
    const failedRequests = totalRequests - successfulRequests;
    
    const responseTimes = results.map(r => r.duration);
    const totalResponseTime = responseTimes.reduce((sum, time) => sum + time, 0);
    
    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      totalDuration,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      averageResponseTime: totalResponseTime / totalRequests,
      requestsPerSecond: (totalRequests / totalDuration) * 1000,
      successRate: successfulRequests / totalRequests,
      errorRate: failedRequests / totalRequests,
      p95ResponseTime: this.calculatePercentile(responseTimes, 95),
      p99ResponseTime: this.calculatePercentile(responseTimes, 99)
    };
  }
  
  /**
   * Calculates percentiles for response times
   */
  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }
}

// Types and interfaces
type ServiceName = 'CompanyService' | 'TenantService' | 'UserService' | 'LeadService' | 'CustomerService';

interface RequestResult {
  duration: number;
  success: boolean;
  error: any;
  timestamp: string;
}

export interface PerformanceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalDuration: number;
  minResponseTime: number;
  maxResponseTime: number;
  averageResponseTime: number;
  requestsPerSecond: number;
  successRate: number;
  errorRate: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

export interface LoadTestOptions {
  service: ServiceName;
  method: string;
  parameters: any[];
  concurrentUsers?: number;
  requestsPerUser?: number;
  delayBetweenRequests?: number;
}

export interface StressTestOptions {
  service: ServiceName;
  method: string;
  parameters: any[];
  initialUsers?: number;
  userIncrement?: number;
  maxUsers?: number;
  requestsPerUser?: number;
  targetResponseTime?: number;
  delayBetweenRequests?: number;
}

export interface StressTestResult {
  breakingPoint: number | null;
  metrics: Array<PerformanceMetrics & { concurrentUsers: number }>;
}

export interface MemoryTestOptions {
  service: ServiceName;
  method: string;
  parameters: any[];
  iterations?: number;
}

export interface MemoryMetrics {
  initialMemory: NodeJS.MemoryUsage;
  finalMemory: NodeJS.MemoryUsage;
  memoryDiff: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  memoryLeakDetected: boolean;
} 