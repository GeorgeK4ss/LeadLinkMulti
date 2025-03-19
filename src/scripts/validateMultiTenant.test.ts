/// <reference types="@testing-library/jest-dom" />
import { MultiTenantIsolationTest } from '../utils/testMultiTenantIsolation';
import { TenantService } from '../lib/services/TenantService';

// Mock the required services
jest.mock('../utils/testMultiTenantIsolation');
jest.mock('../lib/services/TenantService');

describe('Multi-Tenant Validation Script', () => {
  let mockTenantService: jest.Mocked<TenantService>;
  let mockIsolationTest: jest.Mocked<MultiTenantIsolationTest>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up mocks
    mockTenantService = new TenantService() as jest.Mocked<TenantService>;
    mockIsolationTest = new MultiTenantIsolationTest() as jest.Mocked<MultiTenantIsolationTest>;
    
    // Mock console methods to prevent cluttering test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Mock process.exit to prevent tests from actually exiting
    jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
      return undefined as never;
    });
  });
  
  it('should execute tenant data isolation tests successfully', async () => {
    // Mock tenant data
    const mockTenants = [
      { id: 'tenant-1', name: 'Tenant 1' },
      { id: 'tenant-2', name: 'Tenant 2' },
      { id: 'tenant-3', name: 'Tenant 3' }
    ];
    
    // Mock successful test results
    const successfulResult = {
      success: true,
      message: 'Test successful',
      details: {}
    };
    
    // Setup mocks
    (TenantService.prototype.getTenants as jest.Mock).mockResolvedValue(mockTenants);
    (MultiTenantIsolationTest.prototype.testTenantDataIsolation as jest.Mock).mockResolvedValue(successfulResult);
    (MultiTenantIsolationTest.prototype.testCrossTenantAccessPrevention as jest.Mock).mockResolvedValue(successfulResult);
    (MultiTenantIsolationTest.prototype.testDataSegregation as jest.Mock).mockResolvedValue(successfulResult);
    
    // Import and execute the script (we're mocking the process.exit so it won't actually exit)
    const validateScript = require('./validateMultiTenant');
    
    // Allow async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify that the appropriate methods were called
    expect(TenantService.prototype.getTenants).toHaveBeenCalled();
    expect(MultiTenantIsolationTest.prototype.testTenantDataIsolation).toHaveBeenCalled();
    expect(MultiTenantIsolationTest.prototype.testCrossTenantAccessPrevention).toHaveBeenCalled();
    expect(MultiTenantIsolationTest.prototype.testDataSegregation).toHaveBeenCalled();
    
    // Verify process exit was called with success code
    expect(process.exit).toHaveBeenCalledWith(0);
  });
  
  it('should handle isolation test failures', async () => {
    // Mock tenant data
    const mockTenants = [
      { id: 'tenant-1', name: 'Tenant 1' },
      { id: 'tenant-2', name: 'Tenant 2' }
    ];
    
    // Mock failed test result
    const failedResult = {
      success: false,
      message: 'Test failed',
      details: { reason: 'Cross-tenant access detected' }
    };
    
    // Setup mocks
    (TenantService.prototype.getTenants as jest.Mock).mockResolvedValue(mockTenants);
    (MultiTenantIsolationTest.prototype.testTenantDataIsolation as jest.Mock).mockResolvedValue(failedResult);
    (MultiTenantIsolationTest.prototype.testCrossTenantAccessPrevention as jest.Mock).mockResolvedValue(failedResult);
    (MultiTenantIsolationTest.prototype.testDataSegregation as jest.Mock).mockResolvedValue(failedResult);
    
    // Import and execute the script (we're mocking the process.exit so it won't actually exit)
    const validateScript = require('./validateMultiTenant');
    
    // Allow async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify error output and failed exit code
    expect(console.error).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(1);
  });
  
  it('should handle insufficient tenant count', async () => {
    // Mock tenant data with only one tenant
    const mockTenants = [
      { id: 'tenant-1', name: 'Tenant 1' }
    ];
    
    // Setup mocks
    (TenantService.prototype.getTenants as jest.Mock).mockResolvedValue(mockTenants);
    
    // Import and execute the script (we're mocking the process.exit so it won't actually exit)
    const validateScript = require('./validateMultiTenant');
    
    // Allow async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify error output about insufficient tenants
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Need at least 2 tenants to run validation tests')
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });
  
  it('should handle unexpected errors during validation', async () => {
    // Mock tenant data
    const mockTenants = [
      { id: 'tenant-1', name: 'Tenant 1' },
      { id: 'tenant-2', name: 'Tenant 2' }
    ];
    
    // Setup mocks
    (TenantService.prototype.getTenants as jest.Mock).mockResolvedValue(mockTenants);
    (MultiTenantIsolationTest.prototype.testTenantDataIsolation as jest.Mock).mockRejectedValue(
      new Error('Unexpected test error')
    );
    
    // Import and execute the script (we're mocking the process.exit so it won't actually exit)
    const validateScript = require('./validateMultiTenant');
    
    // Allow async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify error output and failed exit code
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('An error occurred during validation')
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });
}); 