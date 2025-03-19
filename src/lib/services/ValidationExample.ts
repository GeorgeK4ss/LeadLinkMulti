import { validationService, ValidationRuleType } from './ValidationService';
import { LeadService } from './LeadService';
import { CustomerService } from './CustomerService';
import { TaskService } from './TaskService';
import { DealService } from './DealService';

/**
 * Example of setting up validation for the CRM system
 * This should be called on application startup
 */
export function setupValidation(): void {
  // Register validation schemas for each collection
  
  // Lead validation
  validationService.registerSchema('leads', validationService.createDefaultSchema('lead'));
  
  // Customer validation
  validationService.registerSchema('customers', validationService.createDefaultSchema('customer'));
  
  // Task validation
  validationService.registerSchema('tasks', validationService.createDefaultSchema('task'));
  
  // Deal validation
  validationService.registerSchema('deals', validationService.createDefaultSchema('deal'));
  
  // Register custom schemas for other collections as needed
  validationService.registerSchema('users', {
    tenantId: [{ type: ValidationRuleType.REQUIRED }],
    email: [
      { type: ValidationRuleType.REQUIRED },
      { type: ValidationRuleType.EMAIL }
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
  });
  
  console.log('Validation schemas registered successfully');
}

/**
 * Example of extending a service with validation
 */
export class ValidatedLeadService extends LeadService {
  async createLead(tenantId: string, leadData: any, userId: string) {
    // Validate the lead data before creating
    const validationResult = await validationService.validateForCollection('leads', {
      ...leadData,
      tenantId
    });
    
    if (!validationResult.isValid) {
      throw new Error(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
    }
    
    // Proceed with creating the lead if validation passes
    return super.createLead(tenantId, leadData, userId);
  }
  
  async updateLead(tenantId: string, leadId: string, leadData: any, userId: string) {
    // For updates, we need to validate only the fields being updated
    const fieldsToValidate = Object.keys(leadData);
    const schema = validationService.getSchema('leads');
    
    if (!schema) {
      throw new Error('No validation schema registered for leads');
    }
    
    // Create a subset of the schema with only the fields being updated
    const updateSchema: any = {};
    for (const field of fieldsToValidate) {
      if (schema[field]) {
        updateSchema[field] = schema[field];
      }
    }
    
    // Validate the data
    const validationResult = await validationService.validate({
      ...leadData,
      tenantId
    }, updateSchema);
    
    if (!validationResult.isValid) {
      throw new Error(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
    }
    
    // Proceed with updating the lead if validation passes
    return super.updateLead(tenantId, leadId, leadData, userId);
  }
}

/**
 * Example of using the validation service directly
 */
export async function validateData(collectionName: string, data: any): Promise<boolean> {
  try {
    const result = await validationService.validateForCollection(collectionName, data);
    
    if (!result.isValid) {
      console.error('Validation errors:', result.errors);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating data:', error);
    return false;
  }
}

/**
 * Example of using a custom validation rule
 */
export function setupCustomValidations(): void {
  // Register a custom schema with a custom validation rule
  validationService.registerSchema('payments', {
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
      { 
        type: ValidationRuleType.REFERENCE_EXISTS,
        collection: 'deals'
      }
    ]
  });
}

/**
 * Initialize all validations
 */
export function initializeValidations(): void {
  setupValidation();
  setupCustomValidations();
  
  // Example of validating data
  const exampleLead = {
    tenantId: 'tenant-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    status: 'new',
    source: 'Website'
  };
  
  validateData('leads', exampleLead)
    .then(isValid => {
      console.log('Lead validation result:', isValid);
    });
} 