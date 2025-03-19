import { validationService, ValidationRuleType, ValidationSchema } from './ValidationService';

/**
 * Initialize validation schemas for all entity types in the application
 * @param tenantId Optional tenant ID to initialize schemas for a specific tenant
 */
export function initializeValidationService(tenantId?: string): void {
  if (tenantId) {
    console.log(`Initializing validation schemas for tenant: ${tenantId}`);
    validationService.setTenantContext(tenantId);
  } else {
    console.log('Initializing validation schemas for default context');
  }

  // Register lead validation schema
  const leadSchema: ValidationSchema = {
    tenantId: [{ type: ValidationRuleType.REQUIRED }],
    firstName: [
      { type: ValidationRuleType.REQUIRED },
      { type: ValidationRuleType.MAX_LENGTH, length: 50 }
    ],
    lastName: [
      { type: ValidationRuleType.REQUIRED },
      { type: ValidationRuleType.MAX_LENGTH, length: 50 }
    ],
    email: [
      { type: ValidationRuleType.REQUIRED },
      { type: ValidationRuleType.EMAIL }
    ],
    phone: [
      { type: ValidationRuleType.PHONE }
    ],
    status: [
      { type: ValidationRuleType.REQUIRED },
      { type: ValidationRuleType.ENUM, values: ['new', 'contacted', 'qualified', 'converted', 'archived'] }
    ],
    source: [
      { type: ValidationRuleType.MAX_LENGTH, length: 100 }
    ]
  };
  validationService.registerSchema('leads', leadSchema, tenantId);
  
  // Register customer validation schema
  const customerSchema: ValidationSchema = {
    tenantId: [{ type: ValidationRuleType.REQUIRED }],
    companyName: [
      { type: ValidationRuleType.REQUIRED },
      { type: ValidationRuleType.MAX_LENGTH, length: 100 }
    ],
    industry: [
      { type: ValidationRuleType.MAX_LENGTH, length: 50 }
    ],
    website: [
      { type: ValidationRuleType.URL, requireProtocol: true }
    ],
    contactEmail: [
      { type: ValidationRuleType.REQUIRED },
      { type: ValidationRuleType.EMAIL }
    ],
    contactPhone: [
      { type: ValidationRuleType.PHONE }
    ],
    status: [
      { type: ValidationRuleType.REQUIRED },
      { type: ValidationRuleType.ENUM, values: ['active', 'inactive', 'prospect'] }
    ]
  };
  validationService.registerSchema('customers', customerSchema, tenantId);
  
  // Register task validation schema
  const taskSchema: ValidationSchema = {
    tenantId: [{ type: ValidationRuleType.REQUIRED }],
    title: [
      { type: ValidationRuleType.REQUIRED },
      { type: ValidationRuleType.MAX_LENGTH, length: 100 }
    ],
    description: [
      { type: ValidationRuleType.MAX_LENGTH, length: 500 }
    ],
    assignedTo: [
      { type: ValidationRuleType.REQUIRED }
    ],
    dueDate: [
      { type: ValidationRuleType.REQUIRED }
    ],
    priority: [
      { type: ValidationRuleType.REQUIRED },
      { type: ValidationRuleType.ENUM, values: ['low', 'medium', 'high', 'urgent'] }
    ],
    status: [
      { type: ValidationRuleType.REQUIRED },
      { type: ValidationRuleType.ENUM, values: ['todo', 'in_progress', 'review', 'completed', 'cancelled'] }
    ]
  };
  validationService.registerSchema('tasks', taskSchema, tenantId);
  
  // Register deal validation schema
  const dealSchema: ValidationSchema = {
    tenantId: [{ type: ValidationRuleType.REQUIRED }],
    name: [
      { type: ValidationRuleType.REQUIRED },
      { type: ValidationRuleType.MAX_LENGTH, length: 100 }
    ],
    customerId: [
      { type: ValidationRuleType.REQUIRED },
      { type: ValidationRuleType.REFERENCE_EXISTS, collection: 'customers' }
    ],
    value: [
      { type: ValidationRuleType.REQUIRED },
      { type: ValidationRuleType.NUMERIC, allowDecimals: true, allowNegative: false },
      { type: ValidationRuleType.MIN_VALUE, value: 0 }
    ],
    currency: [
      { type: ValidationRuleType.REQUIRED },
      { type: ValidationRuleType.ENUM, values: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'] }
    ],
    stage: [
      { type: ValidationRuleType.REQUIRED },
      { 
        type: ValidationRuleType.ENUM, 
        values: ['initial_contact', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'] 
      }
    ],
    expectedCloseDate: [
      { type: ValidationRuleType.REQUIRED }
    ],
    probability: [
      { type: ValidationRuleType.NUMERIC, allowDecimals: true, allowNegative: false },
      { type: ValidationRuleType.MIN_VALUE, value: 0 },
      { type: ValidationRuleType.MAX_VALUE, value: 100 }
    ]
  };
  validationService.registerSchema('deals', dealSchema, tenantId);
  
  // Register user validation schema
  const userSchema: ValidationSchema = {
    tenantId: [{ type: ValidationRuleType.REQUIRED }],
    email: [
      { type: ValidationRuleType.REQUIRED },
      { type: ValidationRuleType.EMAIL },
      { type: ValidationRuleType.UNIQUE, collection: 'users', field: 'email', ignoreCase: true }
    ],
    displayName: [
      { type: ValidationRuleType.REQUIRED },
      { type: ValidationRuleType.MAX_LENGTH, length: 100 }
    ],
    role: [
      { type: ValidationRuleType.REQUIRED },
      { type: ValidationRuleType.ENUM, values: ['admin', 'manager', 'user', 'guest'] }
    ],
    status: [
      { type: ValidationRuleType.REQUIRED },
      { type: ValidationRuleType.ENUM, values: ['active', 'inactive', 'pending'] }
    ]
  };
  validationService.registerSchema('users', userSchema, tenantId);
  
  // Register payment validation schema with custom validation
  const paymentSchema: ValidationSchema = {
    tenantId: [{ type: ValidationRuleType.REQUIRED }],
    amount: [
      { type: ValidationRuleType.REQUIRED },
      { type: ValidationRuleType.NUMERIC, allowDecimals: true, allowNegative: false },
      { type: ValidationRuleType.MIN_VALUE, value: 0.01 }
    ],
    currency: [
      { type: ValidationRuleType.REQUIRED },
      { type: ValidationRuleType.ENUM, values: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'] }
    ],
    paymentMethod: [
      { type: ValidationRuleType.REQUIRED },
      { type: ValidationRuleType.ENUM, values: ['credit_card', 'bank_transfer', 'paypal', 'other'] }
    ],
    paymentDate: [
      { type: ValidationRuleType.REQUIRED },
      { 
        type: ValidationRuleType.CUSTOM, 
        validate: (value, data) => {
          // Custom validation: payment date cannot be in the future
          const paymentDate = new Date(value);
          const today = new Date();
          
          // Clear time part for comparison
          today.setHours(0, 0, 0, 0);
          
          return !isNaN(paymentDate.getTime()) && paymentDate <= today;
        },
        message: 'Payment date cannot be in the future'
      }
    ],
    dealId: [
      { type: ValidationRuleType.REQUIRED },
      { type: ValidationRuleType.REFERENCE_EXISTS, collection: 'deals' }
    ]
  };
  validationService.registerSchema('payments', paymentSchema, tenantId);
  
  // Register file metadata validation schema
  const fileMetadataSchema: ValidationSchema = {
    tenantId: [{ type: ValidationRuleType.REQUIRED }],
    name: [
      { type: ValidationRuleType.REQUIRED },
      { type: ValidationRuleType.MAX_LENGTH, length: 255 }
    ],
    originalName: [
      { type: ValidationRuleType.REQUIRED },
      { type: ValidationRuleType.MAX_LENGTH, length: 255 }
    ],
    size: [
      { type: ValidationRuleType.REQUIRED },
      { type: ValidationRuleType.NUMERIC, allowDecimals: false, allowNegative: false },
      { type: ValidationRuleType.MIN_VALUE, value: 0 }
    ],
    type: [
      { type: ValidationRuleType.REQUIRED },
      { type: ValidationRuleType.MAX_LENGTH, length: 100 }
    ],
    path: [
      { type: ValidationRuleType.REQUIRED },
      { type: ValidationRuleType.MAX_LENGTH, length: 500 }
    ],
    storageUri: [
      { type: ValidationRuleType.REQUIRED },
      { type: ValidationRuleType.MAX_LENGTH, length: 1000 }
    ],
    category: [
      { type: ValidationRuleType.REQUIRED },
      { 
        type: ValidationRuleType.ENUM, 
        values: [
          'document', 'image', 'spreadsheet', 'presentation', 
          'pdf', 'archive', 'video', 'audio', 'other'
        ] 
      }
    ],
    accessLevel: [
      { type: ValidationRuleType.REQUIRED },
      { 
        type: ValidationRuleType.ENUM, 
        values: ['private', 'restricted', 'tenant', 'public'] 
      }
    ]
  };
  validationService.registerSchema('fileMetadata', fileMetadataSchema, tenantId);
  
  console.log(`Validation schemas registered successfully${tenantId ? ` for tenant: ${tenantId}` : ''}`);
}

/**
 * Helper function to validate data directly
 * @param collectionName The collection to validate against
 * @param data The data to validate
 * @param tenantId Optional tenant ID to override current context
 * @returns Promise resolving to true if validation passes, false otherwise
 */
export async function validateData(
  collectionName: string, 
  data: any, 
  tenantId?: string
): Promise<boolean> {
  try {
    if (tenantId) {
      validationService.setTenantContext(tenantId);
    }
    
    const result = await validationService.validateForCollection(collectionName, data, tenantId);
    
    if (!result.isValid) {
      console.error(`Validation errors for ${collectionName}:`, result.errors);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error validating ${collectionName}:`, error);
    return false;
  }
}

/**
 * Helper function to get validation errors
 * @param collectionName The collection to validate against
 * @param data The data to validate
 * @param tenantId Optional tenant ID to override current context
 * @returns Array of error messages or empty array if validation passes
 */
export async function getValidationErrors(
  collectionName: string, 
  data: any,
  tenantId?: string
): Promise<string[]> {
  try {
    if (tenantId) {
      validationService.setTenantContext(tenantId);
    }
    
    const result = await validationService.validateForCollection(collectionName, data, tenantId);
    
    if (!result.isValid) {
      return result.errors.map(error => error.message);
    }
    
    return [];
  } catch (error) {
    return [error instanceof Error ? error.message : 'Unknown validation error'];
  }
}

/**
 * Initialize schemas for a specific tenant
 * @param tenantId Tenant ID to initialize schemas for
 */
export function initializeTenantValidation(tenantId: string): void {
  if (!tenantId) {
    throw new Error('Tenant ID is required for tenant-specific validation initialization');
  }
  
  initializeValidationService(tenantId);
}

/**
 * Test isolation between two tenants
 * @param tenantId1 First tenant ID
 * @param tenantId2 Second tenant ID
 * @returns Promise resolving to test result
 */
export async function testValidationIsolation(
  tenantId1: string, 
  tenantId2: string
): Promise<{ success: boolean; message: string }> {
  return validationService.testValidationIsolation(tenantId1, tenantId2);
} 