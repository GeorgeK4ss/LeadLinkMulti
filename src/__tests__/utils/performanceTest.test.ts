/// <reference types="@testing-library/jest-dom" />
import { PerformanceTester } from '@/utils/performanceTest';
import { CustomerService } from '@/lib/services/CustomerService';
import { LeadService } from '@/lib/services/LeadService';

// Mock the required services
jest.mock('@/lib/services/CustomerService');
jest.mock('@/lib/services/LeadService');
jest.mock('@/lib/services/TenantService');
jest.mock('@/lib/services/UserService');
jest.mock('@/lib/services/CompanyService');

describe('PerformanceTester', () => {
  let performanceTester: PerformanceTester;
  
  beforeEach(() => {
    jest.clearAllMocks();
    performanceTester = new PerformanceTester();
    
    // Mock console methods to keep test output clean
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Mock Date.now for consistent timing measurements
    jest.spyOn(Date, 'now').mockImplementation(() => 1000);
    
    // Mock process.memoryUsage for memory tests
    const mockMemoryUsage = {
      rss: 1024 * 1024 * 100,        // 100 MB
      heapTotal: 1024 * 1024 * 50,    // 50 MB
      heapUsed: 1024 * 1024 * 25,     // 25 MB
      external: 1024 * 1024 * 10,     // 10 MB
      arrayBuffers: 1024 * 1024 * 5   // 5 MB
    };
    
    jest.spyOn(process, 'memoryUsage').mockImplementation(() => mockMemoryUsage);
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  describe('runLoadTest', () => {
    it('should execute a load test successfully', async () => {
      // Mock CustomerService getCustomers method to resolve successfully
      (CustomerService.prototype.getCustomers as jest.Mock).mockResolvedValue([]);
      
      // Configure the Date.now mock to increment by 100ms on each call to simulate time passing
      let callCount = 0;
      (Date.now as jest.Mock).mockImplementation(() => {
        callCount++;
        return 1000 + (callCount * 100);
      });
      
      const loadTestOptions = {
        service: 'CustomerService' as const,
        method: 'getCustomers',
        parameters: ['test-tenant-1', 10],
        concurrentUsers: 2,
        requestsPerUser: 2
      };
      
      const metrics = await performanceTester.runLoadTest(loadTestOptions);
      
      // Verify that the test was executed with the correct parameters
      expect(CustomerService.prototype.getCustomers).toHaveBeenCalledWith('test-tenant-1', 10);
      expect(CustomerService.prototype.getCustomers).toHaveBeenCalledTimes(4); // 2 users * 2 requests
      
      // Verify metrics were calculated
      expect(metrics.totalRequests).toBe(4);
      expect(metrics.successfulRequests).toBe(4);
      expect(metrics.failedRequests).toBe(0);
      expect(metrics.successRate).toBe(1); // 100% success rate
    });
    
    it('should handle errors during load test', async () => {
      // Mock CustomerService to fail on even-numbered calls
      let callCount = 0;
      (CustomerService.prototype.getCustomers as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 0) {
          return Promise.reject(new Error('Test error'));
        }
        return Promise.resolve([]);
      });
      
      const loadTestOptions = {
        service: 'CustomerService' as const,
        method: 'getCustomers',
        parameters: ['test-tenant-1', 10],
        concurrentUsers: 2,
        requestsPerUser: 2
      };
      
      const metrics = await performanceTester.runLoadTest(loadTestOptions);
      
      // Verify metrics reflect the failed requests
      expect(metrics.totalRequests).toBe(4);
      expect(metrics.successfulRequests).toBe(2);
      expect(metrics.failedRequests).toBe(2);
      expect(metrics.successRate).toBe(0.5); // 50% success rate
      expect(metrics.errorRate).toBe(0.5); // 50% error rate
    });
  });
  
  describe('runStressTest', () => {
    it('should execute a stress test until breaking point', async () => {
      // Mock runLoadTest to return increasingly slower response times
      let userCount = 0;
      jest.spyOn(performanceTester, 'runLoadTest').mockImplementation(async () => {
        userCount++;
        
        // Simulate reaching breaking point at 15 users
        const responseTime = userCount * 100; // Increases with each call
        const successRate = userCount < 15 ? 1 : 0.7; // Drops below threshold at 15 users
        
        return {
          totalRequests: 10,
          successfulRequests: Math.floor(10 * successRate),
          failedRequests: Math.floor(10 * (1 - successRate)),
          totalDuration: 1000,
          minResponseTime: responseTime - 50,
          maxResponseTime: responseTime + 50,
          averageResponseTime: responseTime,
          requestsPerSecond: 10,
          successRate: successRate,
          errorRate: 1 - successRate,
          p95ResponseTime: responseTime + 20,
          p99ResponseTime: responseTime + 40
        };
      });
      
      const stressTestOptions = {
        service: 'LeadService' as const,
        method: 'getLeads',
        parameters: ['test-tenant-1'],
        initialUsers: 5,
        userIncrement: 5,
        maxUsers: 30,
        targetResponseTime: 1200 // Breaking at 15 users (1500ms)
      };
      
      const result = await performanceTester.runStressTest(stressTestOptions);
      
      // Verify that the test found the breaking point
      expect(result.breakingPoint).toBe(15);
      expect(result.metrics.length).toBe(3); // 5, 10, 15 users
      
      // Verify runLoadTest was called the correct number of times
      expect(performanceTester.runLoadTest).toHaveBeenCalledTimes(3);
    });
  });
  
  describe('measureMemoryUsage', () => {
    it('should measure memory usage before and after operations', async () => {
      // Mock CustomerService method
      (CustomerService.prototype.getCustomers as jest.Mock).mockResolvedValue([]);
      
      // Setup process.memoryUsage to return different values on subsequent calls
      // to simulate memory increase
      const initialMemory = {
        rss: 1024 * 1024 * 100,        // 100 MB
        heapTotal: 1024 * 1024 * 50,    // 50 MB
        heapUsed: 1024 * 1024 * 25,     // 25 MB
        external: 1024 * 1024 * 10,     // 10 MB
        arrayBuffers: 1024 * 1024 * 5    // 5 MB
      };
      
      const finalMemory = {
        rss: 1024 * 1024 * 110,        // 110 MB
        heapTotal: 1024 * 1024 * 55,    // 55 MB
        heapUsed: 1024 * 1024 * 30,     // 30 MB
        external: 1024 * 1024 * 12,     // 12 MB
        arrayBuffers: 1024 * 1024 * 6    // 6 MB
      };
      
      let callCount = 0;
      (process.memoryUsage as unknown as jest.Mock).mockImplementation(() => {
        callCount++;
        return callCount === 1 ? initialMemory : finalMemory;
      });
      
      const options = {
        service: 'CustomerService' as const,
        method: 'getCustomers',
        parameters: ['test-tenant-1', 20],
        iterations: 5
      };
      
      const result = await performanceTester.measureMemoryUsage(options);
      
      // Verify service method was called the correct number of times
      expect(CustomerService.prototype.getCustomers).toHaveBeenCalledTimes(5);
      
      // Verify memory metrics
      expect(result.initialMemory).toEqual(initialMemory);
      expect(result.finalMemory).toEqual(finalMemory);
      expect(result.memoryDiff).toEqual({
        rss: 1024 * 1024 * 10,        // 10 MB difference
        heapTotal: 1024 * 1024 * 5,    // 5 MB difference
        heapUsed: 1024 * 1024 * 5,     // 5 MB difference
        external: 1024 * 1024 * 2,     // 2 MB difference
        arrayBuffers: 1024 * 1024 * 1   // 1 MB difference
      });
      
      // Verify memory leak detection (5MB is below our threshold)
      expect(result.memoryLeakDetected).toBe(false);
    });
    
    it('should detect a memory leak when heap usage increases significantly', async () => {
      // Mock CustomerService method
      (CustomerService.prototype.getCustomers as jest.Mock).mockResolvedValue([]);
      
      // Setup process.memoryUsage to return values that indicate a memory leak
      const initialMemory = {
        rss: 1024 * 1024 * 100,
        heapTotal: 1024 * 1024 * 50,
        heapUsed: 1024 * 1024 * 25,
        external: 1024 * 1024 * 10,
        arrayBuffers: 1024 * 1024 * 5
      };
      
      const finalMemory = {
        rss: 1024 * 1024 * 150,
        heapTotal: 1024 * 1024 * 80,
        heapUsed: 1024 * 1024 * 50,  // 25MB increase (over threshold)
        external: 1024 * 1024 * 15,
        arrayBuffers: 1024 * 1024 * 8
      };
      
      let callCount = 0;
      (process.memoryUsage as unknown as jest.Mock).mockImplementation(() => {
        callCount++;
        return callCount === 1 ? initialMemory : finalMemory;
      });
      
      const options = {
        service: 'CustomerService' as const,
        method: 'getCustomers',
        parameters: ['test-tenant-1', 20],
        iterations: 5
      };
      
      const result = await performanceTester.measureMemoryUsage(options);
      
      // Verify memory leak detection (25MB is above our threshold)
      expect(result.memoryLeakDetected).toBe(true);
    });
  });
}); 