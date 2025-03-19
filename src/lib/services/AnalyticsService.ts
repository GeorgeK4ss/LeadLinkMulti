import {
  Firestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  doc,
  Timestamp,
  DocumentData,
  QuerySnapshot,
  startAfter,
  endBefore,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FirestoreDocument } from './firebase/FirestoreService';
import { cacheService } from './CacheService';

/**
 * Time period for analytics
 */
export enum AnalyticsPeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
  CUSTOM = 'custom'
}

/**
 * Analytics dimension
 */
export interface AnalyticsDimension {
  field: string;
  displayName: string;
}

/**
 * Analytics metric
 */
export interface AnalyticsMetric {
  name: string;
  displayName: string;
  type: 'count' | 'sum' | 'average' | 'min' | 'max' | 'distinct';
  field?: string; // Required for all except 'count'
}

/**
 * Analytics filter
 */
export interface AnalyticsFilter {
  field: string;
  operator: '==' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'not-in' | 'array-contains' | 'array-contains-any';
  value: any;
}

/**
 * Analytics data point
 */
export interface AnalyticsDataPoint {
  dimensionValue: any;
  metrics: Record<string, number>;
}

/**
 * Analytics result
 */
export interface AnalyticsResult {
  dimensions: string[];
  metrics: string[];
  data: AnalyticsDataPoint[];
  totals: Record<string, number>;
  period: {
    start: Date;
    end: Date;
    type: AnalyticsPeriod;
  };
}

/**
 * Analytics query options
 */
export interface AnalyticsQueryOptions {
  dimensions: AnalyticsDimension[];
  metrics: AnalyticsMetric[];
  filters?: AnalyticsFilter[];
  period: {
    type: AnalyticsPeriod;
    start?: Date;
    end?: Date;
  };
  limit?: number;
  cache?: boolean;
  cacheTTL?: number; // in milliseconds
  sortBy?: {
    metric: string;
    direction: 'asc' | 'desc';
  };
}

/**
 * Analytics Service for generating insights from data with multi-tenant isolation
 */
export class AnalyticsService {
  private db: Firestore;
  private readonly DEFAULT_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  private currentTenantId: string | null = null;
  
  /**
   * Creates a new instance of AnalyticsService
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
   * Get a reference to a collection with tenant path if appropriate
   * @param collectionName Base collection name
   * @param tenantId Optional tenant ID to override current context
   * @returns Collection reference path (either direct or tenant-scoped)
   */
  getCollectionPath(collectionName: string, tenantId?: string): string {
    // For collections that should be tenant-isolated
    const tenantScopedCollections = [
      'leads', 'customers', 'activities', 'notifications', 
      'documents', 'tasks', 'opportunities', 'campaigns'
    ];
    
    const effectiveTenantId = tenantId || this.currentTenantId;
    
    if (effectiveTenantId && tenantScopedCollections.includes(collectionName)) {
      return `tenants/${effectiveTenantId}/${collectionName}`;
    }
    
    return collectionName;
  }
  
  /**
   * Run an analytics query on a collection
   * @param collectionName Collection to query
   * @param options Query options
   * @param tenantId Optional tenant ID to override current context
   * @returns Analytics result
   */
  async runQuery(
    collectionName: string,
    options: AnalyticsQueryOptions,
    tenantId?: string
  ): Promise<AnalyticsResult> {
    const effectiveTenantId = tenantId || this.currentTenantId || undefined;
    
    // Generate cache key
    const cacheKey = this.generateCacheKey(collectionName, options, effectiveTenantId);
    
    // Check cache if enabled
    if (options.cache !== false) {
      const cachedResult = cacheService.get<AnalyticsResult>(cacheKey, 'analytics');
      if (cachedResult) {
        return cachedResult;
      }
    }
    
    try {
      // Build query
      const queryConstraints: QueryConstraint[] = [];
      
      // Get appropriate collection path (tenant-scoped or direct)
      const collectionPath = this.getCollectionPath(collectionName, effectiveTenantId);
      
      // Add tenant filter for non-tenant-scoped collections that still need isolation
      if (effectiveTenantId && !collectionPath.includes(`tenants/${effectiveTenantId}`)) {
        queryConstraints.push(where('tenantId', '==', effectiveTenantId));
      }
      
      // Add date range filter based on period
      const { start, end } = this.calculateDateRange(options.period);
      
      if (start) {
        queryConstraints.push(where('createdAt', '>=', start));
      }
      
      if (end) {
        queryConstraints.push(where('createdAt', '<=', end));
      }
      
      // Add custom filters
      if (options.filters && options.filters.length > 0) {
        options.filters.forEach(filter => {
          queryConstraints.push(where(filter.field, filter.operator, filter.value));
        });
      }
      
      // Add sorting if specified
      if (options.sortBy) {
        queryConstraints.push(orderBy(
          options.sortBy.metric === 'count' ? 'createdAt' : options.sortBy.metric, 
          options.sortBy.direction
        ));
      } else {
        // Default sort by createdAt desc
        queryConstraints.push(orderBy('createdAt', 'desc'));
      }
      
      // Add limit if specified
      if (options.limit) {
        queryConstraints.push(limit(options.limit));
      }
      
      // Execute query
      const collectionRef = collection(this.db, collectionPath);
      const q = query(collectionRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      
      // Process results
      const result = this.processQueryResults(
        querySnapshot,
        options.dimensions,
        options.metrics,
        {
          start,
          end,
          type: options.period.type
        }
      );
      
      // Cache result if enabled
      if (options.cache !== false) {
        const ttl = options.cacheTTL || this.DEFAULT_CACHE_TTL;
        cacheService.set(cacheKey, result, ttl, 'analytics');
      }
      
      return result;
    } catch (error) {
      console.error(`Error running analytics query on ${collectionName}:`, error);
      throw error;
    }
  }
  
  /**
   * Get lead conversion metrics
   * @param options Query options
   * @param tenantId Optional tenant ID to override current context
   * @returns Analytics result with conversion metrics
   */
  async getLeadConversionMetrics(
    options: Partial<AnalyticsQueryOptions> = {},
    tenantId?: string
  ): Promise<AnalyticsResult> {
    const effectiveTenantId = tenantId || this.currentTenantId || undefined;
    
    // Build query options with defaults
    const queryOptions: AnalyticsQueryOptions = {
      dimensions: [
        { field: 'status', displayName: 'Lead Status' }
      ],
      metrics: [
        { name: 'count', displayName: 'Count', type: 'count' },
        { name: 'conversionRate', displayName: 'Conversion Rate', type: 'average', field: 'isConverted' }
      ],
      period: options.period || {
        type: AnalyticsPeriod.MONTH
      },
      cache: options.cache !== false,
      cacheTTL: options.cacheTTL || this.DEFAULT_CACHE_TTL
    };
    
    // Run the query
    return this.runQuery('leads', queryOptions, effectiveTenantId);
  }
  
  /**
   * Get customer activity metrics
   * @param options Query options
   * @param tenantId Optional tenant ID to override current context
   * @returns Analytics result with customer activity metrics
   */
  async getCustomerActivityMetrics(
    options: Partial<AnalyticsQueryOptions> = {},
    tenantId?: string
  ): Promise<AnalyticsResult> {
    const effectiveTenantId = tenantId || this.currentTenantId || undefined;
    
    // Build query options with defaults
    const queryOptions: AnalyticsQueryOptions = {
      dimensions: [
        { field: 'activityType', displayName: 'Activity Type' }
      ],
      metrics: [
        { name: 'count', displayName: 'Count', type: 'count' }
      ],
      period: options.period || {
        type: AnalyticsPeriod.MONTH
      },
      cache: options.cache !== false,
      cacheTTL: options.cacheTTL || this.DEFAULT_CACHE_TTL
    };
    
    // Run the query
    return this.runQuery('activities', queryOptions, effectiveTenantId);
  }
  
  /**
   * Get sales performance metrics
   * @param options Query options
   * @param tenantId Optional tenant ID to override current context
   * @returns Analytics result with sales metrics
   */
  async getSalesPerformanceMetrics(
    options: Partial<AnalyticsQueryOptions> = {},
    tenantId?: string
  ): Promise<AnalyticsResult> {
    const effectiveTenantId = tenantId || this.currentTenantId || undefined;
    
    // Build query options with defaults
    const queryOptions: AnalyticsQueryOptions = {
      dimensions: [
        { field: 'stage', displayName: 'Sales Stage' }
      ],
      metrics: [
        { name: 'count', displayName: 'Count', type: 'count' },
        { name: 'amount', displayName: 'Total Amount', type: 'sum', field: 'amount' },
        { name: 'averageAmount', displayName: 'Average Amount', type: 'average', field: 'amount' }
      ],
      period: options.period || {
        type: AnalyticsPeriod.MONTH
      },
      cache: options.cache !== false,
      cacheTTL: options.cacheTTL || this.DEFAULT_CACHE_TTL
    };
    
    // Run the query
    return this.runQuery('opportunities', queryOptions, effectiveTenantId);
  }
  
  /**
   * Get user engagement metrics
   * @param options Query options
   * @param tenantId Optional tenant ID to override current context
   * @returns Analytics result with user engagement metrics
   */
  async getUserEngagementMetrics(
    options: Partial<AnalyticsQueryOptions> = {},
    tenantId?: string
  ): Promise<AnalyticsResult> {
    const effectiveTenantId = tenantId || this.currentTenantId || undefined;
    
    // Build query options with defaults
    const queryOptions: AnalyticsQueryOptions = {
      dimensions: [
        { field: 'type', displayName: 'Engagement Type' }
      ],
      metrics: [
        { name: 'count', displayName: 'Count', type: 'count' },
        { name: 'duration', displayName: 'Average Duration', type: 'average', field: 'duration' }
      ],
      period: options.period || {
        type: AnalyticsPeriod.MONTH
      },
      cache: options.cache !== false,
      cacheTTL: options.cacheTTL || this.DEFAULT_CACHE_TTL
    };
    
    // Run the query
    return this.runQuery('userEngagements', queryOptions, effectiveTenantId);
  }
  
  /**
   * Get trending content metrics
   * @param options Query options
   * @param tenantId Optional tenant ID to override current context
   * @returns Analytics result with content metrics
   */
  async getTrendingContentMetrics(
    options: Partial<AnalyticsQueryOptions> = {},
    tenantId?: string
  ): Promise<AnalyticsResult> {
    const effectiveTenantId = tenantId || this.currentTenantId || undefined;
    
    // Build query options with defaults
    const queryOptions: AnalyticsQueryOptions = {
      dimensions: [
        { field: 'contentType', displayName: 'Content Type' }
      ],
      metrics: [
        { name: 'count', displayName: 'Views', type: 'count' },
        { name: 'engagement', displayName: 'Engagement Score', type: 'average', field: 'engagementScore' }
      ],
      period: options.period || {
        type: AnalyticsPeriod.MONTH
      },
      sortBy: {
        metric: 'count',
        direction: 'desc'
      },
      limit: options.limit || 10,
      cache: options.cache !== false,
      cacheTTL: options.cacheTTL || this.DEFAULT_CACHE_TTL
    };
    
    // Run the query
    return this.runQuery('contentViews', queryOptions, effectiveTenantId);
  }
  
  /**
   * Test tenant isolation by running the same query for two different tenants
   * @param tenantId1 First tenant ID
   * @param tenantId2 Second tenant ID
   * @returns Object indicating success or failure with message
   */
  async testAnalyticsIsolation(tenantId1: string, tenantId2: string): Promise<{ success: boolean; message: string }> {
    try {
      // Run the same query for both tenants
      const options: AnalyticsQueryOptions = {
        dimensions: [{ field: 'status', displayName: 'Status' }],
        metrics: [{ name: 'count', displayName: 'Count', type: 'count' }],
        period: { type: AnalyticsPeriod.MONTH },
        cache: false
      };
      
      const result1 = await this.runQuery('leads', options, tenantId1);
      const result2 = await this.runQuery('leads', options, tenantId2);
      
      // Compare total counts - they should almost certainly be different
      // A match could happen by coincidence but is unlikely
      if (JSON.stringify(result1.totals) === JSON.stringify(result2.totals) &&
          JSON.stringify(result1.data) === JSON.stringify(result2.data)) {
        return {
          success: false,
          message: 'Tenant isolation may have failed: identical results returned for different tenants'
        };
      }
      
      return {
        success: true,
        message: 'Tenant isolation successful: different results returned for different tenants'
      };
    } catch (error) {
      console.error('Error in analytics isolation test:', error);
      return {
        success: false,
        message: `Error testing analytics isolation: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Calculate date range based on period
   * @param period Period specification
   * @returns Start and end dates
   */
  private calculateDateRange(period: {
    type: AnalyticsPeriod;
    start?: Date;
    end?: Date;
  }): { start: Date | null; end: Date | null } {
    // For custom period, use provided dates
    if (period.type === AnalyticsPeriod.CUSTOM) {
      return {
        start: period.start || null,
        end: period.end || null
      };
    }
    
    const now = new Date();
    const end = new Date(now);
    let start = new Date(now);
    
    // Calculate start date based on period type
    switch (period.type) {
      case AnalyticsPeriod.DAY:
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
        
      case AnalyticsPeriod.WEEK:
        // Start of week (Sunday)
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        
        // End of week (Saturday)
        end.setDate(end.getDate() + (6 - dayOfWeek));
        end.setHours(23, 59, 59, 999);
        break;
        
      case AnalyticsPeriod.MONTH:
        // Start of month
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        
        // End of month
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
        
      case AnalyticsPeriod.QUARTER:
        // Start of quarter
        const quarterMonth = Math.floor(start.getMonth() / 3) * 3;
        start.setMonth(quarterMonth);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        
        // End of quarter
        end.setMonth(quarterMonth + 3);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
        
      case AnalyticsPeriod.YEAR:
        // Start of year
        start.setMonth(0);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        
        // End of year
        end.setMonth(11);
        end.setDate(31);
        end.setHours(23, 59, 59, 999);
        break;
        
      default:
        return { start: null, end: null };
    }
    
    return { start, end };
  }
  
  /**
   * Process query results into analytics format
   * @param querySnapshot Query results
   * @param dimensions Analytics dimensions
   * @param metrics Analytics metrics
   * @param period Query period
   * @returns Formatted analytics result
   */
  private processQueryResults(
    querySnapshot: QuerySnapshot<DocumentData>,
    dimensions: AnalyticsDimension[],
    metrics: AnalyticsMetric[],
    period: {
      start: Date | null;
      end: Date | null;
      type: AnalyticsPeriod;
    }
  ): AnalyticsResult {
    // Initialize result structure
    const result: AnalyticsResult = {
      dimensions: dimensions.map(d => d.displayName),
      metrics: metrics.map(m => m.displayName),
      data: [],
      totals: {},
      period: {
        start: period.start || new Date(),
        end: period.end || new Date(),
        type: period.type
      }
    };
    
    // Initialize dimension value map
    const dimensionValues: Record<string, any[]> = {};
    dimensions.forEach(dimension => {
      dimensionValues[dimension.field] = [];
    });
    
    // Initialize metrics totals
    metrics.forEach(metric => {
      result.totals[metric.name] = 0;
    });
    
    // Process each document
    querySnapshot.forEach(docSnapshot => {
      const doc = docSnapshot.data();
      
      // Extract dimension values
      dimensions.forEach(dimension => {
        const value = this.getNestedValue(doc, dimension.field);
        if (!dimensionValues[dimension.field].includes(value)) {
          dimensionValues[dimension.field].push(value);
        }
      });
    });
    
    // Generate data points for each unique dimension value combination
    if (dimensions.length === 1) {
      // Single dimension case
      const dimension = dimensions[0];
      
      dimensionValues[dimension.field].forEach(dimensionValue => {
        // Filter docs matching this dimension value
        const matchingDocs = querySnapshot.docs.filter(docSnapshot => {
          const docData = docSnapshot.data();
          return this.getNestedValue(docData, dimension.field) === dimensionValue;
        });
        
        // Calculate metrics for this dimension value
        const metricsValues: Record<string, number> = {};
        
        metrics.forEach(metric => {
          let value = 0;
          
          if (metric.type === 'count') {
            value = matchingDocs.length;
          } else {
            // Extract values for the metric field
            const values = matchingDocs
              .map(docSnapshot => this.getNestedValue(docSnapshot.data(), metric.field!))
              .filter(value => value !== undefined && value !== null);
            
            // Calculate metric based on type
            switch (metric.type) {
              case 'sum':
                value = values.reduce((sum, val) => sum + Number(val), 0);
                break;
                
              case 'average':
                value = values.length > 0
                  ? values.reduce((sum, val) => sum + Number(val), 0) / values.length
                  : 0;
                break;
                
              case 'min':
                value = values.length > 0
                  ? Math.min(...values.map(val => Number(val)))
                  : 0;
                break;
                
              case 'max':
                value = values.length > 0
                  ? Math.max(...values.map(val => Number(val)))
                  : 0;
                break;
                
              case 'distinct':
                value = new Set(values).size;
                break;
            }
          }
          
          metricsValues[metric.name] = value;
          
          // Add to totals
          result.totals[metric.name] += value;
        });
        
        // Add data point
        result.data.push({
          dimensionValue,
          metrics: metricsValues
        });
      });
    } else {
      // Multi-dimension case (more complex)
      // Would need to implement cartesian product of dimension values
      // and filter docs matching each combination
      // Not implemented in this simplified version
    }
    
    return result;
  }
  
  /**
   * Get a nested value from an object using dot notation
   * @param obj Object to extract value from
   * @param path Path to value using dot notation
   * @returns The value at the path
   */
  private getNestedValue(obj: any, path: string): any {
    if (!obj || !path) {
      return undefined;
    }
    
    // Convert timestamps to dates
    if (path === 'createdAt' || path === 'updatedAt') {
      const timestamp = obj[path];
      if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
      }
    }
    
    // Handle dot notation
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }
    
    return current;
  }
  
  /**
   * Generate a cache key for query results
   * @param collectionName Collection name
   * @param options Query options
   * @param tenantId Optional tenant ID
   * @returns Cache key string
   */
  private generateCacheKey(
    collectionName: string,
    options: AnalyticsQueryOptions,
    tenantId?: string
  ): string {
    // Create a simplified version of options for cache key
    const keyObj = {
      collection: collectionName,
      tenantId: tenantId || '',
      dimensions: options.dimensions.map(d => d.field),
      metrics: options.metrics.map(m => m.name),
      filters: options.filters,
      period: options.period,
      limit: options.limit,
      sortBy: options.sortBy
    };
    
    // Generate key
    return `analytics:${JSON.stringify(keyObj)}`;
  }
  
  /**
   * Clears analytics cache for the specified tenant or all tenants
   * @param tenantId Optional tenant ID to clear cache for
   */
  clearCache(tenantId?: string): void {
    // If no tenantId is provided, clear all analytics cache
    if (!tenantId) {
      // Use clearNamespace which is available in CacheService
      cacheService.clearNamespace('analytics');
      return;
    }

    // Clear cache for specific tenant
    // We need to form the namespace that includes the tenant ID
    const tenantNamespace = `analytics:${tenantId}`;
    cacheService.clearNamespace(tenantNamespace);
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService(); 