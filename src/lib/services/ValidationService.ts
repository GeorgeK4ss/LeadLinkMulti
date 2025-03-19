import { FirestoreDocument } from './firebase/FirestoreService';
import { 
  Firestore, 
  collection, 
  doc, 
  getDoc,
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Validation rule types
 */
export enum ValidationRuleType {
  REQUIRED = 'required',
  MIN_LENGTH = 'minLength',
  MAX_LENGTH = 'maxLength',
  PATTERN = 'pattern',
  EMAIL = 'email',
  PHONE = 'phone',
  URL = 'url',
  NUMERIC = 'numeric',
  MIN_VALUE = 'minValue',
  MAX_VALUE = 'maxValue',
  ENUM = 'enum',
  CUSTOM = 'custom',
  NESTED = 'nested',
  ARRAY = 'array',
  UNIQUE = 'unique',
  REFERENCE_EXISTS = 'referenceExists',
  TENANT_MATCH = 'tenantMatch',
  DATE_RANGE = 'dateRange'
}

/**
 * Base validation rule interface
 */
export interface ValidationRule {
  type: ValidationRuleType;
  message?: string;
}

/**
 * Required field validation rule
 */
export interface RequiredRule extends ValidationRule {
  type: ValidationRuleType.REQUIRED;
}

/**
 * Minimum length validation rule
 */
export interface MinLengthRule extends ValidationRule {
  type: ValidationRuleType.MIN_LENGTH;
  length: number;
}

/**
 * Maximum length validation rule
 */
export interface MaxLengthRule extends ValidationRule {
  type: ValidationRuleType.MAX_LENGTH;
  length: number;
}

/**
 * Pattern validation rule
 */
export interface PatternRule extends ValidationRule {
  type: ValidationRuleType.PATTERN;
  pattern: string | RegExp;
}

/**
 * Email validation rule
 */
export interface EmailRule extends ValidationRule {
  type: ValidationRuleType.EMAIL;
}

/**
 * Phone validation rule
 */
export interface PhoneRule extends ValidationRule {
  type: ValidationRuleType.PHONE;
  countryCode?: string;
}

/**
 * URL validation rule
 */
export interface URLRule extends ValidationRule {
  type: ValidationRuleType.URL;
  requireProtocol?: boolean;
}

/**
 * Numeric validation rule
 */
export interface NumericRule extends ValidationRule {
  type: ValidationRuleType.NUMERIC;
  allowDecimals?: boolean;
  allowNegative?: boolean;
}

/**
 * Minimum value validation rule
 */
export interface MinValueRule extends ValidationRule {
  type: ValidationRuleType.MIN_VALUE;
  value: number;
}

/**
 * Maximum value validation rule
 */
export interface MaxValueRule extends ValidationRule {
  type: ValidationRuleType.MAX_VALUE;
  value: number;
}

/**
 * Enum validation rule
 */
export interface EnumRule extends ValidationRule {
  type: ValidationRuleType.ENUM;
  values: any[];
}

/**
 * Custom validation rule
 */
export interface CustomRule extends ValidationRule {
  type: ValidationRuleType.CUSTOM;
  validate: (value: any, data: any) => boolean | Promise<boolean>;
}

/**
 * Nested object validation rule
 */
export interface NestedRule extends ValidationRule {
  type: ValidationRuleType.NESTED;
  schema: ValidationSchema;
}

/**
 * Array validation rule
 */
export interface ArrayRule extends ValidationRule {
  type: ValidationRuleType.ARRAY;
  minItems?: number;
  maxItems?: number;
  itemSchema?: ValidationSchema;
}

/**
 * Unique values validation rule
 */
export interface UniqueRule extends ValidationRule {
  type: ValidationRuleType.UNIQUE;
  field: string;
  collection: string;
  ignoreCase?: boolean;
}

/**
 * Reference exists validation rule
 */
export interface ReferenceExistsRule extends ValidationRule {
  type: ValidationRuleType.REFERENCE_EXISTS;
  collection: string;
  field?: string;
}

/**
 * Tenant match validation rule
 */
export interface TenantMatchRule extends ValidationRule {
  type: ValidationRuleType.TENANT_MATCH;
}

/**
 * Date range validation rule
 */
export interface DateRangeRule extends ValidationRule {
  type: ValidationRuleType.DATE_RANGE;
  min?: Date;
  max?: Date;
  relativeToField?: string;
  beforeField?: string;
  afterField?: string;
}

/**
 * Union type of all validation rules
 */
export type ValidationRuleUnion = 
  | RequiredRule
  | MinLengthRule
  | MaxLengthRule
  | PatternRule
  | EmailRule
  | PhoneRule
  | URLRule
  | NumericRule
  | MinValueRule
  | MaxValueRule
  | EnumRule
  | CustomRule
  | NestedRule
  | ArrayRule
  | UniqueRule
  | ReferenceExistsRule
  | TenantMatchRule
  | DateRangeRule;

/**
 * Validation schema type
 */
export type ValidationSchema = Record<string, ValidationRuleUnion[]>;

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string;
  message: string;
  rule: ValidationRuleType;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Service for validating data against schemas with multi-tenant isolation
 */
export class ValidationService {
  // Collection schemas cache - now tenant-aware
  private schemas: Map<string, Map<string, ValidationSchema>> = new Map();
  private currentTenantId: string | null = null;
  private db: Firestore;
  
  /**
   * Creates a new ValidationService instance
   * @param tenantId Optional initial tenant ID
   */
  constructor(tenantId?: string) {
    this.db = db;
    if (tenantId) {
      this.currentTenantId = tenantId;
    }
  }
  
  /**
   * Sets the current tenant context for operations
   * @param tenantId The tenant ID to set as current context
   */
  setTenantContext(tenantId: string): void {
    this.currentTenantId = tenantId;
  }

  /**
   * Gets the current tenant ID from context
   * @returns The current tenant ID
   * @throws Error if no tenant context is set
   */
  getCurrentTenantId(): string {
    if (!this.currentTenantId) {
      throw new Error('No tenant context set. Call setTenantContext first or provide tenantId to method.');
    }
    return this.currentTenantId;
  }
  
  /**
   * Register a validation schema for a collection within a tenant
   * @param collectionName Collection name
   * @param schema Validation schema
   * @param tenantId Optional tenant ID (uses current context if not provided)
   */
  registerSchema(collectionName: string, schema: ValidationSchema, tenantId?: string): void {
    const effectiveTenantId = tenantId || this.getCurrentTenantId();
    
    // Initialize tenant map if it doesn't exist
    if (!this.schemas.has(effectiveTenantId)) {
      this.schemas.set(effectiveTenantId, new Map<string, ValidationSchema>());
    }
    
    // Set schema for collection within tenant
    const tenantSchemas = this.schemas.get(effectiveTenantId);
    if (tenantSchemas) {
      tenantSchemas.set(collectionName, schema);
    }
  }
  
  /**
   * Get a validation schema for a collection within a tenant
   * @param collectionName Collection name
   * @param tenantId Optional tenant ID (uses current context if not provided)
   * @returns Validation schema or undefined if not registered
   */
  getSchema(collectionName: string, tenantId?: string): ValidationSchema | undefined {
    const effectiveTenantId = tenantId || this.getCurrentTenantId();
    
    const tenantSchemas = this.schemas.get(effectiveTenantId);
    if (!tenantSchemas) {
      return undefined;
    }
    
    return tenantSchemas.get(collectionName);
  }
  
  /**
   * Get a list of all collections with schemas for a tenant
   * @param tenantId Optional tenant ID (uses current context if not provided)
   * @returns Array of collection names
   */
  getRegisteredCollections(tenantId?: string): string[] {
    const effectiveTenantId = tenantId || this.getCurrentTenantId();
    
    const tenantSchemas = this.schemas.get(effectiveTenantId);
    if (!tenantSchemas) {
      return [];
    }
    
    return Array.from(tenantSchemas.keys());
  }
  
  /**
   * Validate data against a schema
   * @param data Data to validate
   * @param schema Validation schema
   * @param tenantId Optional tenant ID for context
   * @returns Promise with validation result
   */
  async validate(data: any, schema: ValidationSchema, tenantId?: string): Promise<ValidationResult> {
    // Convert null to undefined to match the parameter type of validateRule
    const effectiveTenantId = tenantId || this.currentTenantId || undefined;
    const errors: ValidationError[] = [];
    
    // Add tenant validation check if tenant context is available
    if (effectiveTenantId && data && typeof data === 'object' && 'tenantId' in data) {
      if (data.tenantId !== effectiveTenantId) {
        errors.push({
          field: 'tenantId',
          message: 'Tenant ID mismatch with current context',
          rule: ValidationRuleType.TENANT_MATCH
        });
        
        return {
          isValid: false,
          errors
        };
      }
    }
    
    // Process each field in the schema
    for (const [field, rules] of Object.entries(schema)) {
      const value = data?.[field];
      
      // Process each rule for the field
      for (const rule of rules) {
        const error = await this.validateRule(field, value, rule, data, effectiveTenantId);
        
        if (error) {
          errors.push(error);
          break; // Stop on first error for this field
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate data for a collection within a tenant
   * @param collectionName Collection name
   * @param data Data to validate
   * @param tenantId Optional tenant ID (uses current context if not provided)
   * @returns Promise with validation result
   */
  async validateForCollection(
    collectionName: string, 
    data: any, 
    tenantId?: string
  ): Promise<ValidationResult> {
    const effectiveTenantId = tenantId || this.getCurrentTenantId();
    
    const schema = this.getSchema(collectionName, effectiveTenantId);
    if (!schema) {
      throw new Error(`No schema registered for collection "${collectionName}" in tenant "${effectiveTenantId}"`);
    }
    
    return this.validate(data, schema, effectiveTenantId);
  }
  
  /**
   * Get collection path based on tenant context
   * @param collectionName Base collection name
   * @param tenantId Optional tenant ID (uses current context if not provided)
   * @returns Properly formatted collection path
   */
  getCollectionPath(collectionName: string, tenantId?: string): string {
    const effectiveTenantId = tenantId || this.getCurrentTenantId();
    
    // For collections that should be tenant-isolated
    const tenantScopedCollections = [
      'leads', 'customers', 'activities', 'notifications', 'documents',
      'tasks', 'deals', 'users', 'payments', 'fileMetadata'
    ];
    
    if (tenantScopedCollections.includes(collectionName)) {
      return `tenants/${effectiveTenantId}/${collectionName}`;
    }
    
    return collectionName;
  }
  
  /**
   * Validate a single value against a rule
   * @param field Field name
   * @param value Value to validate
   * @param rule Validation rule
   * @param data Complete data object (for rules that need context)
   * @param tenantId Optional tenant ID for context-specific validations
   * @returns Promise with validation error or null if valid
   */
  private async validateRule(
    field: string,
    value: any,
    rule: ValidationRuleUnion,
    data: any,
    tenantId?: string
  ): Promise<ValidationError | null> {
    const defaultMessage = `Validation failed for field '${field}'`;
    const message = rule.message || defaultMessage;
    
    switch (rule.type) {
      case ValidationRuleType.REQUIRED:
        if (value === undefined || value === null || value === '') {
          return { field, message: message || 'Field is required', rule: rule.type };
        }
        break;
        
      case ValidationRuleType.MIN_LENGTH:
        if (value && String(value).length < (rule as MinLengthRule).length) {
          return { 
            field, 
            message: message || `Minimum length is ${(rule as MinLengthRule).length}`, 
            rule: rule.type 
          };
        }
        break;
        
      case ValidationRuleType.MAX_LENGTH:
        if (value && String(value).length > (rule as MaxLengthRule).length) {
          return { 
            field, 
            message: message || `Maximum length is ${(rule as MaxLengthRule).length}`, 
            rule: rule.type 
          };
        }
        break;
        
      case ValidationRuleType.PATTERN:
        const patternRule = rule as PatternRule;
        const pattern = typeof patternRule.pattern === 'string' 
          ? new RegExp(patternRule.pattern) 
          : patternRule.pattern;
          
        if (value && !pattern.test(String(value))) {
          return { 
            field, 
            message: message || 'Invalid format', 
            rule: rule.type 
          };
        }
        break;
        
      case ValidationRuleType.EMAIL:
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (value && !emailPattern.test(String(value))) {
          return { field, message: message || 'Invalid email address', rule: rule.type };
        }
        break;
        
      case ValidationRuleType.PHONE:
        // Simplified validation - in a real implementation, use a library like libphonenumber-js
        const phonePattern = /^\+?[0-9]{10,15}$/;
        if (value && !phonePattern.test(String(value))) {
          return { field, message: message || 'Invalid phone number', rule: rule.type };
        }
        break;
        
      case ValidationRuleType.URL:
        const urlRule = rule as URLRule;
        let urlPattern: RegExp;
        
        if (urlRule.requireProtocol) {
          urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
        } else {
          urlPattern = /^(https?:\/\/)([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
        }
        
        if (value && !urlPattern.test(String(value))) {
          return { field, message: message || 'Invalid URL', rule: rule.type };
        }
        break;
        
      case ValidationRuleType.NUMERIC:
        const numericRule = rule as NumericRule;
        let numericPattern: RegExp;
        
        if (numericRule.allowDecimals) {
          if (numericRule.allowNegative) {
            numericPattern = /^-?\d+(\.\d+)?$/;
          } else {
            numericPattern = /^\d+(\.\d+)?$/;
          }
        } else {
          if (numericRule.allowNegative) {
            numericPattern = /^-?\d+$/;
          } else {
            numericPattern = /^\d+$/;
          }
        }
        
        if (value && !numericPattern.test(String(value))) {
          return { field, message: message || 'Invalid numeric value', rule: rule.type };
        }
        break;
        
      case ValidationRuleType.MIN_VALUE:
        const minRule = rule as MinValueRule;
        if (value !== undefined && value !== null && Number(value) < minRule.value) {
          return { 
            field, 
            message: message || `Minimum value is ${minRule.value}`, 
            rule: rule.type 
          };
        }
        break;
        
      case ValidationRuleType.MAX_VALUE:
        const maxRule = rule as MaxValueRule;
        if (value !== undefined && value !== null && Number(value) > maxRule.value) {
          return { 
            field, 
            message: message || `Maximum value is ${maxRule.value}`, 
            rule: rule.type 
          };
        }
        break;
        
      case ValidationRuleType.ENUM:
        const enumRule = rule as EnumRule;
        if (value !== undefined && value !== null && !enumRule.values.includes(value)) {
          return { 
            field, 
            message: message || `Value must be one of: ${enumRule.values.join(', ')}`, 
            rule: rule.type 
          };
        }
        break;
        
      case ValidationRuleType.CUSTOM:
        const customRule = rule as CustomRule;
        try {
          const isValid = await customRule.validate(value, data);
          if (!isValid) {
            return { field, message, rule: rule.type };
          }
        } catch (error) {
          return { 
            field, 
            message: message || (error instanceof Error ? error.message : 'Custom validation failed'), 
            rule: rule.type 
          };
        }
        break;
        
      case ValidationRuleType.NESTED:
        if (value && typeof value === 'object') {
          const nestedRule = rule as NestedRule;
          const nestedResult = await this.validate(value, nestedRule.schema, tenantId);
          
          if (!nestedResult.isValid) {
            // Transform nested errors to include parent field name
            const nestedErrors = nestedResult.errors.map(error => ({
              field: `${field}.${error.field}`,
              message: error.message,
              rule: error.rule
            }));
            
            // Return the first error
            return nestedErrors[0];
          }
        }
        break;
        
      case ValidationRuleType.ARRAY:
        const arrayRule = rule as ArrayRule;
        
        if (value && Array.isArray(value)) {
          // Check array length
          if (arrayRule.minItems !== undefined && value.length < arrayRule.minItems) {
            return { 
              field, 
              message: message || `Array must have at least ${arrayRule.minItems} items`, 
              rule: rule.type 
            };
          }
          
          if (arrayRule.maxItems !== undefined && value.length > arrayRule.maxItems) {
            return { 
              field, 
              message: message || `Array must have at most ${arrayRule.maxItems} items`, 
              rule: rule.type 
            };
          }
          
          // Validate each item if itemSchema is provided
          if (arrayRule.itemSchema) {
            for (let i = 0; i < value.length; i++) {
              const itemResult = await this.validate(value[i], arrayRule.itemSchema, tenantId);
              
              if (!itemResult.isValid) {
                // Transform item errors to include array index
                const itemErrors = itemResult.errors.map(error => ({
                  field: `${field}[${i}].${error.field}`,
                  message: error.message,
                  rule: error.rule
                }));
                
                // Return the first error
                return itemErrors[0];
              }
            }
          }
        }
        break;
        
      case ValidationRuleType.TENANT_MATCH:
        // Enhanced tenant validation
        if (tenantId && value && value !== tenantId) {
          return { 
            field, 
            message: message || 'Tenant ID does not match the current context', 
            rule: rule.type 
          };
        }
        break;
        
      case ValidationRuleType.REFERENCE_EXISTS:
        // Enhanced to support tenant-specific collections
        const referenceRule = rule as ReferenceExistsRule;
        if (value) {
          try {
            const targetCollection = this.getCollectionPath(referenceRule.collection, tenantId);
            const refField = referenceRule.field || 'id';
            
            if (refField === 'id') {
              // Check if document exists
              const docRef = doc(this.db, targetCollection, String(value));
              const docSnap = await getDoc(docRef);
              
              if (!docSnap.exists()) {
                return { 
                  field, 
                  message: message || `Referenced ${referenceRule.collection} does not exist`, 
                  rule: rule.type 
                };
              }
              
              // If tenant verification is requested and field contains a tenant ID
              const docData = docSnap.data();
              if (tenantId && docData && 'tenantId' in docData && docData.tenantId !== tenantId) {
                return { 
                  field, 
                  message: message || `Referenced ${referenceRule.collection} belongs to a different tenant`, 
                  rule: rule.type 
                };
              }
            } else {
              // Check if any document with the field value exists
              const q = query(
                collection(this.db, targetCollection),
                where(refField, '==', value)
              );
              
              const querySnapshot = await getDocs(q);
              if (querySnapshot.empty) {
                return { 
                  field, 
                  message: message || `No ${referenceRule.collection} found with ${refField} = ${value}`, 
                  rule: rule.type 
                };
              }
            }
          } catch (error) {
            console.error(`Error checking reference existence: ${error}`);
            return { 
              field, 
              message: message || 'Error validating reference', 
              rule: rule.type 
            };
          }
        }
        break;
        
      case ValidationRuleType.UNIQUE:
        // Enhanced to support tenant-specific uniqueness
        const uniqueRule = rule as UniqueRule;
        if (value) {
          try {
            const targetCollection = this.getCollectionPath(uniqueRule.collection, tenantId);
            const checkField = uniqueRule.field || field;
            
            let q;
            if (uniqueRule.ignoreCase && typeof value === 'string') {
              // Case-insensitive search is complex in Firestore
              // Simplified approach - convert to lowercase and search
              const lowerValue = value.toLowerCase();
              q = query(
                collection(this.db, targetCollection),
                where(checkField.toLowerCase(), '==', lowerValue)
              );
            } else {
              q = query(
                collection(this.db, targetCollection),
                where(checkField, '==', value)
              );
            }
            
            const querySnapshot = await getDocs(q);
            
            // If found documents and not ourselves (for updates)
            if (!querySnapshot.empty && data) {
              // Check if the found document is not the one being updated
              const hasNonSelf = querySnapshot.docs.some(doc => {
                // For document updates (when we have an ID)
                if (data.id) {
                  return doc.id !== data.id;
                }
                return true; // For new documents, any match means non-unique
              });
              
              if (hasNonSelf) {
                return { 
                  field, 
                  message: message || `Value must be unique in ${uniqueRule.collection}`, 
                  rule: rule.type 
                };
              }
            }
          } catch (error) {
            console.error(`Error checking uniqueness: ${error}`);
            return { 
              field, 
              message: message || 'Error validating uniqueness', 
              rule: rule.type 
            };
          }
        }
        break;
        
      case ValidationRuleType.DATE_RANGE:
        const dateRule = rule as DateRangeRule;
        let dateValue: Date | null = null;
        
        if (value) {
          dateValue = value instanceof Date ? value : new Date(value);
          
          if (isNaN(dateValue.getTime())) {
            return { field, message: message || 'Invalid date format', rule: rule.type };
          }
          
          if (dateRule.min && dateValue < dateRule.min) {
            return { 
              field, 
              message: message || `Date must be after ${dateRule.min.toISOString()}`, 
              rule: rule.type 
            };
          }
          
          if (dateRule.max && dateValue > dateRule.max) {
            return { 
              field, 
              message: message || `Date must be before ${dateRule.max.toISOString()}`, 
              rule: rule.type 
            };
          }
          
          if (dateRule.beforeField && data[dateRule.beforeField]) {
            const beforeDate = new Date(data[dateRule.beforeField]);
            
            if (!isNaN(beforeDate.getTime()) && dateValue >= beforeDate) {
              return { 
                field, 
                message: message || `Date must be before ${dateRule.beforeField}`, 
                rule: rule.type 
              };
            }
          }
          
          if (dateRule.afterField && data[dateRule.afterField]) {
            const afterDate = new Date(data[dateRule.afterField]);
            
            if (!isNaN(afterDate.getTime()) && dateValue <= afterDate) {
              return { 
                field, 
                message: message || `Date must be after ${dateRule.afterField}`, 
                rule: rule.type 
              };
            }
          }
        }
        break;
    }
    
    return null;
  }
  
  /**
   * Test validation isolation between tenants
   * Verifies that validation schemas from one tenant aren't accessible from another
   * 
   * @param tenantId1 First tenant ID
   * @param tenantId2 Second tenant ID
   * @returns Object indicating success or failure with message
   */
  async testValidationIsolation(
    tenantId1: string, 
    tenantId2: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Register a test schema for tenant1
      const testSchema: ValidationSchema = {
        testField: [
          { type: ValidationRuleType.REQUIRED },
          { type: ValidationRuleType.MAX_LENGTH, length: 10 }
        ]
      };
      
      this.registerSchema('test_collection', testSchema, tenantId1);
      
      // 2. Try to access it from tenant2 context
      this.setTenantContext(tenantId2);
      const tenant2Schema = this.getSchema('test_collection');
      
      if (tenant2Schema) {
        return {
          success: false,
          message: 'Tenant isolation failed: Schema from tenant1 accessible from tenant2'
        };
      }
      
      // 3. Validate test data with both tenants
      const testData = { testField: 'test' };
      
      // Set context to tenant1 and validate
      this.setTenantContext(tenantId1);
      const tenant1Result = await this.validateForCollection('test_collection', testData);
      
      // Should be valid for tenant1
      if (!tenant1Result.isValid) {
        return {
          success: false,
          message: `Unexpected validation failure for tenant1: ${tenant1Result.errors.map(e => e.message).join(', ')}`
        };
      }
      
      // Set context to tenant2 and try to validate
      this.setTenantContext(tenantId2);
      
      try {
        await this.validateForCollection('test_collection', testData);
        return {
          success: false,
          message: 'Tenant isolation failed: Validation using tenant1 schema succeeded from tenant2 context'
        };
      } catch (error) {
        // Expected error - schema doesn't exist for tenant2
        return {
          success: true,
          message: 'Tenant isolation successful: Schemas properly isolated between tenants'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error testing validation isolation: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Create schema for typical models
   * @param modelType Type of model to create schema for
   * @returns Validation schema
   */
  createDefaultSchema(modelType: 'lead' | 'customer' | 'task' | 'deal'): ValidationSchema {
    switch (modelType) {
      case 'lead':
        return {
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
        
      case 'customer':
        return {
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
        
      case 'task':
        return {
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
        
      case 'deal':
        return {
          tenantId: [{ type: ValidationRuleType.REQUIRED }],
          name: [
            { type: ValidationRuleType.REQUIRED },
            { type: ValidationRuleType.MAX_LENGTH, length: 100 }
          ],
          customerId: [
            { type: ValidationRuleType.REQUIRED }
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
            { type: ValidationRuleType.ENUM, values: [
              'initial_contact', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'
            ]}
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
        
      default:
        return {};
    }
  }
}

/**
 * Decorator for adding validation to methods
 * @param schema Validation schema
 * @param paramIndex Index of parameter to validate
 * @returns Decorator function
 */
export function Validate(schema: ValidationSchema, paramIndex: number = 0) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const validationService = new ValidationService();
    
    descriptor.value = async function(...args: any[]) {
      // Validate the parameter
      const result = await validationService.validate(args[paramIndex], schema);
      
      if (!result.isValid) {
        throw new Error(`Validation failed: ${result.errors.map(e => e.message).join(', ')}`);
      }
      
      // Call the original method if validation passes
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

/**
 * Singleton instance of ValidationService
 */
export const validationService = new ValidationService(); 