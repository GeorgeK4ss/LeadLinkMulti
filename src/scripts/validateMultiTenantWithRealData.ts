/**
 * Multi-tenant Validation Script with Real Data
 * This script uses the MultiTenantIsolationTest utility to validate data isolation
 * using real production-like data. It generates comprehensive reports and
 * validates that multi-tenant isolation works correctly.
 */

import { MultiTenantIsolationTest } from '../utils/testMultiTenantIsolation';
import { TenantService } from '@/lib/services/TenantService';
import { UserService } from '@/lib/services/UserService';
import { LeadService } from '@/lib/services/LeadService';
import { CustomerService } from '@/lib/services/CustomerService';
import { CompanyService } from '@/lib/services/CompanyService';
import { CustomerStatus, CustomerCategory } from '@/types/customer';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
config();

// Test report path
const REPORT_DIR = path.join(process.cwd(), 'test-reports');
const REPORT_PATH = path.join(REPORT_DIR, `multi-tenant-validation-${new Date().toISOString().replace(/:/g, '-')}.json`);

interface ValidationReport {
  timestamp: string;
  summary: {
    totalTenants: number;
    tenantsWithData: number;
    validationsPassed: number;
    validationsFailed: number;
    success: boolean;
  };
  tenantDataStats: Record<string, {
    leadCount: number;
    customerCount: number;
    userCount: number;
  }>;
  testResults: {
    dataIsolation: Record<string, any>;
    accessPrevention: Record<string, any>;
    dataSegregation: any;
  };
  validationErrors: string[];
}

async function generateTestData(tenantId: string) {
  console.log(`Generating test data for tenant ${tenantId}...`);
  
  const leadService = new LeadService(tenantId);
  const customerService = new CustomerService();
  
  // Generate sample leads
  for (let i = 0; i < 5; i++) {
    try {
      await leadService.createLead({
        contact: {
          name: `Test Lead ${i}`,
          email: `test.lead${i}@example.com`,
          phone: `555-000-${i.toString().padStart(4, '0')}`,
          jobTitle: 'Test Lead',
          department: 'Testing Department'
        },
        company: {
          name: `Test Company ${i}`,
          website: `https://testcompany${i}.example.com`,
          industry: 'Technology',
          size: '10-50',
          address: {
            street: `${i} Test Street`,
            city: 'Test City',
            state: 'TS',
            postalCode: `TS${i}123`,
            country: 'Test Country'
          }
        },
        status: i % 2 === 0 ? 'new' : 'contacted',
        source: i % 3 === 0 ? 'website' : 'referral',
        priority: i % 2 === 0 ? 'high' : 'medium',
        value: 1000 * (i + 1),
        tags: [`test-tag-${i}`, 'validation']
      });
    } catch (error) {
      console.error(`Error creating test lead for tenant ${tenantId}:`, error);
    }
  }
  
  // Generate sample customers
  for (let i = 0; i < 5; i++) {
    try {
      await customerService.createCustomer(tenantId, {
        name: `Test Customer ${i}`,
        tenantId: tenantId,
        status: 'active' as CustomerStatus,
        category: 'mid_market' as CustomerCategory,
        contacts: [],
        addresses: [],
        contracts: [],
        subscriptions: [],
        interactions: [],
        notes: [],
        opportunities: [],
        lifetimeValue: 0
      });
    } catch (error) {
      console.error(`Error creating test customer for tenant ${tenantId}:`, error);
    }
  }
  
  console.log(`Finished generating test data for tenant ${tenantId}`);
}

async function runRealDataValidation() {
  console.log('Starting Multi-Tenant Isolation Validation with Real Data');
  console.log('=====================================================');
  
  // Initialize services
  const tenantService = new TenantService();
  const userService = new UserService();
  const customerService = new CustomerService();
  const isolationTest = new MultiTenantIsolationTest();
  
  // Initialize report
  const report: ValidationReport = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTenants: 0,
      tenantsWithData: 0,
      validationsPassed: 0,
      validationsFailed: 0,
      success: false
    },
    tenantDataStats: {},
    testResults: {
      dataIsolation: {},
      accessPrevention: {},
      dataSegregation: null
    },
    validationErrors: []
  };
  
  try {
    // Get actual tenant IDs from the system
    console.log('Fetching tenants...');
    const tenants = await tenantService.getTenants();
    
    if (tenants.length < 2) {
      const error = '❌ ERROR: Need at least 2 tenants to run validation tests';
      console.error(error);
      console.log('Please create at least 2 test tenants and try again');
      report.validationErrors.push(error);
      saveReport(report);
      process.exit(1);
    }
    
    report.summary.totalTenants = tenants.length;
    
    const tenantIds = tenants.slice(0, 5).map((tenant: { id: string }) => tenant.id); // Use up to 5 tenants
    console.log(`Found ${tenantIds.length} tenants for testing`);
    
    // Check for existing data or generate test data if needed
    for (const tenantId of tenantIds) {
      const leadService = new LeadService(tenantId);
      const leads = await leadService.getLeads();
      const customers = await customerService.getCustomers(tenantId);
      const users = await userService.getUsersByTenant(tenantId);
      
      report.tenantDataStats[tenantId] = {
        leadCount: leads.length,
        customerCount: customers.length,
        userCount: users.length
      };
      
      // If we have insufficient data, generate some test data
      if (leads.length < 3 || customers.length < 3) {
        console.log(`Tenant ${tenantId} has insufficient data. Generating test data...`);
        await generateTestData(tenantId);
        
        // Update counts after generating data
        const updatedLeads = await leadService.getLeads();
        const updatedCustomers = await customerService.getCustomers(tenantId);
        
        report.tenantDataStats[tenantId] = {
          leadCount: updatedLeads.length,
          customerCount: updatedCustomers.length,
          userCount: users.length
        };
      }
      
      if (report.tenantDataStats[tenantId].leadCount > 0 || 
          report.tenantDataStats[tenantId].customerCount > 0) {
        report.summary.tenantsWithData++;
      }
    }
    
    console.log(`Proceeding with ${report.summary.tenantsWithData} tenants that have data`);
    
    // Test 1: Data Isolation
    console.log('\n📊 Test 1: Tenant Data Isolation');
    console.log('--------------------------------');
    
    for (let i = 0; i < tenantIds.length; i++) {
      for (let j = 0; j < tenantIds.length; j++) {
        if (i === j) continue; // Skip same tenant comparisons
        
        const srcTenantId = tenantIds[i];
        const dstTenantId = tenantIds[j];
        
        const testKey = `${srcTenantId}_to_${dstTenantId}`;
        
        console.log(`Testing isolation between ${srcTenantId} and ${dstTenantId}...`);
        const isolationResult = await isolationTest.testTenantDataIsolation(srcTenantId, dstTenantId);
        
        report.testResults.dataIsolation[testKey] = isolationResult;
        
        if (isolationResult.success) {
          console.log(`✅ PASSED: ${isolationResult.message}`);
          report.summary.validationsPassed++;
        } else {
          console.error(`❌ FAILED: ${isolationResult.message}`);
          report.summary.validationsFailed++;
          if (isolationResult.details) {
            console.error(JSON.stringify(isolationResult.details, null, 2));
          }
        }
      }
    }
    
    // Test 2: Cross-Tenant Access Prevention
    console.log('\n🔒 Test 2: Cross-Tenant Access Prevention');
    console.log('----------------------------------------');
    
    for (let i = 0; i < tenantIds.length; i++) {
      for (let j = 0; j < tenantIds.length; j++) {
        if (i === j) continue; // Skip same tenant comparisons
        
        const srcTenantId = tenantIds[i];
        const dstTenantId = tenantIds[j];
        
        const testKey = `${srcTenantId}_to_${dstTenantId}`;
        
        console.log(`Testing access prevention from ${dstTenantId} to ${srcTenantId}...`);
        const preventionResult = await isolationTest.testCrossTenantAccessPrevention(srcTenantId, dstTenantId);
        
        report.testResults.accessPrevention[testKey] = preventionResult;
        
        if (preventionResult.success) {
          console.log(`✅ PASSED: ${preventionResult.message}`);
          report.summary.validationsPassed++;
        } else {
          console.error(`❌ FAILED: ${preventionResult.message}`);
          report.summary.validationsFailed++;
          if (preventionResult.details) {
            console.error(JSON.stringify(preventionResult.details, null, 2));
          }
        }
      }
    }
    
    // Test 3: Complete Data Segregation
    console.log('\n🧩 Test 3: Complete Data Segregation');
    console.log('----------------------------------');
    
    console.log(`Testing data segregation across all tenants...`);
    const segregationResult = await isolationTest.testDataSegregation(tenantIds);
    
    report.testResults.dataSegregation = segregationResult;
    
    if (segregationResult.success) {
      console.log(`✅ PASSED: ${segregationResult.message}`);
      report.summary.validationsPassed++;
    } else {
      console.error(`❌ FAILED: ${segregationResult.message}`);
      report.summary.validationsFailed++;
      if (segregationResult.details) {
        console.error(JSON.stringify(segregationResult.details, null, 2));
      }
    }
    
    // Summary
    console.log('\n📝 Validation Summary');
    console.log('-------------------');
    console.log(`Tested ${tenantIds.length} tenants with ${report.summary.validationsPassed + report.summary.validationsFailed} validations`);
    console.log(`Tests passed: ${report.summary.validationsPassed}`);
    console.log(`Tests failed: ${report.summary.validationsFailed}`);
    
    // Set overall success
    report.summary.success = report.summary.validationsFailed === 0;
    
    // Save report
    saveReport(report);
    
    console.log(`\nValidation report saved to: ${REPORT_PATH}`);
    console.log(`All tests completed with ${report.summary.success ? 'SUCCESS' : 'FAILURES'}`);
    
    // Exit with appropriate code
    process.exit(report.summary.success ? 0 : 1);
    
  } catch (error) {
    const errorMessage = `Unhandled error in validation script: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(errorMessage);
    console.error(error);
    
    report.validationErrors.push(errorMessage);
    saveReport(report);
    
    process.exit(1);
  }
}

function saveReport(report: ValidationReport) {
  try {
    // Ensure directory exists
    if (!fs.existsSync(REPORT_DIR)) {
      fs.mkdirSync(REPORT_DIR, { recursive: true });
    }
    
    // Write report to file
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  } catch (error) {
    console.error('Error saving validation report:', error);
  }
}

// Run the validation script
runRealDataValidation().catch(error => {
  console.error('Fatal error in validation script:');
  console.error(error);
  process.exit(1);
}); 