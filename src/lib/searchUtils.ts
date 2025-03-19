import { FilterCondition, FilterValues } from '@/components/ui/advanced-search';
import { Timestamp } from 'firebase/firestore';

/**
 * Apply filters to any data array
 */
export function applyFilters<T>(data: T[], filters: FilterValues, searchTerm: string, searchFields: string[]): T[] {
  if (!data || data.length === 0) return [];
  
  // First apply basic text search
  let filteredData = searchTerm ? applySearchTerm(data, searchTerm, searchFields) : [...data];
  
  // Then apply advanced filters
  if (filters && Object.keys(filters).length > 0) {
    filteredData = applyAdvancedFilters(filteredData, filters);
  }
  
  return filteredData;
}

/**
 * Apply text search to specified fields
 */
export function applySearchTerm<T>(data: T[], searchTerm: string, searchFields: string[]): T[] {
  if (!searchTerm || !searchFields || searchFields.length === 0) return data;
  
  const normalizedTerm = searchTerm.toLowerCase().trim();
  if (!normalizedTerm) return data;
  
  return data.filter(item => {
    return searchFields.some(field => {
      const value = getNestedPropertyValue(item, field);
      
      if (value === undefined || value === null) return false;
      
      if (typeof value === 'string') {
        return value.toLowerCase().includes(normalizedTerm);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        return value.toString().toLowerCase().includes(normalizedTerm);
      } else if (Array.isArray(value)) {
        return value.some(v => 
          (v !== null && v !== undefined) && 
          v.toString().toLowerCase().includes(normalizedTerm)
        );
      } else if (typeof value === 'object') {
        // Handle Firestore Timestamps
        if (value instanceof Timestamp) {
          const dateStr = value.toDate().toLocaleDateString();
          return dateStr.toLowerCase().includes(normalizedTerm);
        }
        
        // For other objects, stringify and search
        try {
          return JSON.stringify(value).toLowerCase().includes(normalizedTerm);
        } catch (e) {
          return false;
        }
      }
      
      return false;
    });
  });
}

/**
 * Apply advanced filter conditions
 */
export function applyAdvancedFilters<T>(data: T[], filters: FilterValues): T[] {
  if (!filters || Object.keys(filters).length === 0) return data;
  
  return data.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      // Skip empty filter values
      if (value === undefined || value === null || value === '') return true;
      if (Array.isArray(value) && value.length === 0) return true;
      
      // Get the actual value from the item
      const itemValue = getNestedPropertyValue(item, key);
      
      // Handle different value types
      if (typeof value === 'boolean') {
        return value === Boolean(itemValue);
      } else if (Array.isArray(value)) {
        // If the item property is also an array, check for any overlap
        if (Array.isArray(itemValue)) {
          return value.some(v => itemValue.includes(v));
        }
        // Otherwise, check if the item value is in the array
        return value.includes(itemValue);
      } else if (typeof value === 'object' && value !== null) {
        // Handle range filters
        if ('min' in value || 'max' in value) {
          const min = value.min !== undefined ? Number(value.min) : Number.MIN_SAFE_INTEGER;
          const max = value.max !== undefined ? Number(value.max) : Number.MAX_SAFE_INTEGER;
          const numValue = Number(itemValue);
          
          return !isNaN(numValue) && numValue >= min && numValue <= max;
        }
        // Handle date range filters
        else if ('start' in value || 'end' in value) {
          if (!itemValue) return false;
          
          let itemDate: Date;
          
          // Handle different date formats
          if (itemValue instanceof Date) {
            itemDate = itemValue;
          } else if (itemValue instanceof Timestamp) {
            itemDate = itemValue.toDate();
          } else if (typeof itemValue === 'string') {
            itemDate = new Date(itemValue);
          } else if (typeof itemValue === 'number') {
            itemDate = new Date(itemValue);
          } else {
            return false;
          }
          
          const startDate = value.start ? new Date(value.start) : new Date(0);
          const endDate = value.end ? new Date(value.end) : new Date(9999, 11, 31);
          
          // Set the time to midnight for proper comparison
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          
          return itemDate >= startDate && itemDate <= endDate;
        }
      } else {
        // Simple equality check
        return itemValue === value;
      }
      
      return true;
    });
  });
}

/**
 * Build a filter condition from the filter values
 */
export function buildFilterConditions(filters: FilterValues): FilterCondition[] {
  const conditions: FilterCondition[] = [];
  
  Object.entries(filters).forEach(([field, value]) => {
    // Skip empty filter values
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value) && value.length === 0) return;
    
    if (typeof value === 'boolean') {
      conditions.push({
        field,
        operator: 'eq',
        value
      });
    } else if (Array.isArray(value)) {
      conditions.push({
        field,
        operator: 'in',
        value
      });
    } else if (typeof value === 'object' && value !== null) {
      // Handle range filters
      if ('min' in value || 'max' in value) {
        if (value.min !== undefined) {
          conditions.push({
            field,
            operator: 'gte',
            value: value.min
          });
        }
        
        if (value.max !== undefined) {
          conditions.push({
            field,
            operator: 'lte',
            value: value.max
          });
        }
      }
      // Handle date range filters
      else if ('start' in value || 'end' in value) {
        if (value.start) {
          conditions.push({
            field,
            operator: 'gte',
            value: new Date(value.start)
          });
        }
        
        if (value.end) {
          conditions.push({
            field,
            operator: 'lte',
            value: new Date(value.end)
          });
        }
      }
    } else {
      conditions.push({
        field,
        operator: 'eq',
        value
      });
    }
  });
  
  return conditions;
}

/**
 * Access nested property using dot notation
 * e.g. getNestedPropertyValue(obj, 'user.profile.name')
 */
export function getNestedPropertyValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value === null || value === undefined) return undefined;
    value = value[key];
  }
  
  return value;
}

/**
 * Sort data by a specific field and direction
 */
export function sortData<T>(data: T[], field: string, direction: 'asc' | 'desc' = 'asc'): T[] {
  if (!data || data.length === 0 || !field) return data;
  
  return [...data].sort((a, b) => {
    const aValue = getNestedPropertyValue(a, field);
    const bValue = getNestedPropertyValue(b, field);
    
    // Handle null/undefined values
    if (aValue === undefined || aValue === null) return direction === 'asc' ? -1 : 1;
    if (bValue === undefined || bValue === null) return direction === 'asc' ? 1 : -1;
    
    // Handle dates
    if (aValue instanceof Date && bValue instanceof Date) {
      return direction === 'asc' 
        ? aValue.getTime() - bValue.getTime() 
        : bValue.getTime() - aValue.getTime();
    }
    
    // Handle timestamps
    if (aValue instanceof Timestamp && bValue instanceof Timestamp) {
      return direction === 'asc' 
        ? aValue.toMillis() - bValue.toMillis() 
        : bValue.toMillis() - aValue.toMillis();
    }
    
    // Handle strings
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return direction === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    
    // Handle numbers
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return direction === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    // Default comparison
    const strA = String(aValue);
    const strB = String(bValue);
    
    return direction === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
  });
}

/**
 * Create a paginated subset of data
 */
export function paginateData<T>(data: T[], page: number, pageSize: number): T[] {
  if (!data || data.length === 0) return [];
  if (page < 1) page = 1;
  if (pageSize < 1) pageSize = 10;
  
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  return data.slice(start, end);
} 