import { 
  Firestore, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit as limitQuery, 
  startAfter, 
  getDocs, 
  QueryDocumentSnapshot,
  DocumentData,
  WhereFilterOp,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FirestoreDocument } from './firebase/FirestoreService';
import { cacheService, CacheCollection } from './CacheService';

/**
 * Search configuration
 */
export interface SearchConfig {
  enableCache: boolean;
  cacheTTL: number;  // in milliseconds
  defaultResultsLimit: number;
  debugMode: boolean;
}

/**
 * Default search configuration
 */
const DEFAULT_CONFIG: SearchConfig = {
  enableCache: true,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
  defaultResultsLimit: 20,
  debugMode: false
};

/**
 * Search condition interface
 */
export interface SearchCondition {
  field: string;
  operator: WhereFilterOp;
  value: any;
}

/**
 * Search sort interface
 */
export interface SearchSort {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Search results interface
 */
export interface SearchResults<T extends FirestoreDocument> {
  items: T[];
  totalCount: number;
  hasMore: boolean;
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
}

/**
 * Search service for performing advanced searches across collections
 */
export class SearchService {
  private db: Firestore;
  private config: SearchConfig;
  private searchCaches: Map<string, CacheCollection<any>> = new Map();
  
  constructor(config: Partial<SearchConfig> = {}) {
    this.db = db;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize cache
    if (this.config.enableCache) {
      cacheService.initialize().catch(error => {
        console.error('Error initializing cache service:', error);
      });
    }
  }
  
  /**
   * Perform a search on a collection
   * @param collectionName Collection name to search
   * @param conditions Search conditions
   * @param sortOptions Sort options
   * @param limitCount Maximum number of results to return
   * @param lastDoc Last document from previous page (for pagination)
   * @returns Search results
   */
  async search<T extends FirestoreDocument>(
    collectionName: string,
    conditions: SearchCondition[] = [],
    sortOptions: SearchSort[] = [],
    limitCount: number = this.config.defaultResultsLimit,
    lastDoc?: QueryDocumentSnapshot<DocumentData>
  ): Promise<SearchResults<T>> {
    try {
      // Generate cache key based on search parameters
      const cacheKey = this.generateCacheKey(collectionName, conditions, sortOptions, limitCount);
      
      // Check cache first if enabled
      if (this.config.enableCache) {
        const cachedResults = this.getFromCache<T>(cacheKey, collectionName);
        
        if (cachedResults) {
          this.log(`Cache hit for search: ${cacheKey}`);
          return cachedResults;
        }
      }
      
      // Build the query
      const collectionRef = collection(this.db, collectionName);
      
      // Create array of all query constraints
      const queryConstraints: QueryConstraint[] = [];
      
      // Add where conditions
      conditions.forEach(condition => {
        queryConstraints.push(where(condition.field, condition.operator, condition.value));
      });
      
      // Add sorting
      sortOptions.forEach(sort => {
        queryConstraints.push(orderBy(sort.field, sort.direction));
      });
      
      // Create base query
      let q = query(collectionRef, ...queryConstraints);
      
      // Add pagination
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      
      // Add limit
      q = query(q, limitQuery(limitCount + 1)); // +1 to check if there are more results
      
      // Execute the query
      const querySnapshot = await getDocs(q);
      
      // Convert to result items, handling the +1 for hasMore check
      const items: T[] = [];
      let hasMore = false;
      let newLastDoc: QueryDocumentSnapshot<DocumentData> | null = null;
      
      if (querySnapshot.size > limitCount) {
        hasMore = true;
        
        // Process only the limited number of items
        querySnapshot.docs.slice(0, limitCount).forEach(doc => {
          items.push({ id: doc.id, ...doc.data() } as T);
        });
        
        newLastDoc = querySnapshot.docs[limitCount - 1];
      } else {
        querySnapshot.forEach(doc => {
          items.push({ id: doc.id, ...doc.data() } as T);
        });
        
        if (querySnapshot.size > 0) {
          newLastDoc = querySnapshot.docs[querySnapshot.size - 1];
        }
      }
      
      // Create search results
      const results: SearchResults<T> = {
        items,
        totalCount: items.length,
        hasMore,
        lastDoc: newLastDoc
      };
      
      // Cache the results if enabled
      if (this.config.enableCache) {
        this.saveToCache(cacheKey, results, collectionName);
      }
      
      this.log(`Search executed for ${collectionName}: ${items.length} results`);
      return results;
    } catch (error) {
      console.error(`Error searching in ${collectionName}:`, error);
      throw error;
    }
  }
  
  /**
   * Perform a full-text search using Firestore where clauses
   * @param collectionName Collection name to search
   * @param field Field to search in
   * @param searchTerm Search term
   * @param sortOptions Sort options
   * @param limitCount Maximum number of results to return
   * @param lastDoc Last document from previous page (for pagination)
   * @returns Search results
   */
  async textSearch<T extends FirestoreDocument>(
    collectionName: string,
    field: string,
    searchTerm: string,
    sortOptions: SearchSort[] = [],
    limitCount: number = this.config.defaultResultsLimit,
    lastDoc?: QueryDocumentSnapshot<DocumentData>
  ): Promise<SearchResults<T>> {
    // Prepare the search term (lowercase, trim)
    const term = searchTerm.toLowerCase().trim();
    
    if (term === '') {
      return {
        items: [],
        totalCount: 0,
        hasMore: false,
        lastDoc: null
      };
    }
    
    // Full-text search is limited in Firestore, so we'll use a simple "contains" approach
    // In a production app, you might want to use Algolia, Typesense, or a similar service
    // Or you can implement keyword indexing for better Firestore search
    
    const conditions: SearchCondition[] = [
      {
        field: `${field}_lowercase`,
        operator: '>=',
        value: term
      },
      {
        field: `${field}_lowercase`,
        operator: '<=',
        value: term + '\uf8ff' // This is a high Unicode character
      }
    ];
    
    return this.search<T>(collectionName, conditions, sortOptions, limitCount, lastDoc);
  }
  
  /**
   * Search across multiple collections
   * @param collectionNames Collections to search
   * @param conditions Search conditions
   * @param sortField Common field to sort by (must exist in all collections)
   * @param sortDirection Sort direction
   * @param limitCount Maximum total results to return
   * @returns Combined search results
   */
  async searchMultiCollection<T extends FirestoreDocument>(
    collectionNames: string[],
    conditions: SearchCondition[] = [],
    sortField?: string,
    sortDirection: 'asc' | 'desc' = 'asc',
    limitCount: number = this.config.defaultResultsLimit
  ): Promise<T[]> {
    try {
      // Execute searches for each collection in parallel
      const searchPromises = collectionNames.map(collectionName => {
        const sortOptions = sortField 
          ? [{ field: sortField, direction: sortDirection }] 
          : [];
          
        return this.search<T>(collectionName, conditions, sortOptions, limitCount);
      });
      
      const results = await Promise.all(searchPromises);
      
      // Combine results
      let combinedResults: T[] = [];
      
      results.forEach(result => {
        combinedResults = [...combinedResults, ...result.items];
      });
      
      // Sort combined results if sorting field provided
      if (sortField) {
        combinedResults.sort((a, b) => {
          const aValue = (a as any)[sortField];
          const bValue = (b as any)[sortField];
          
          if (aValue === bValue) return 0;
          
          if (sortDirection === 'asc') {
            return aValue < bValue ? -1 : 1;
          } else {
            return aValue > bValue ? -1 : 1;
          }
        });
      }
      
      // Limit the final result set
      return combinedResults.slice(0, limitCount);
    } catch (error) {
      console.error('Error searching across multiple collections:', error);
      throw error;
    }
  }
  
  /**
   * Perform a faceted search
   * @param collectionName Collection to search
   * @param conditions Base search conditions
   * @param facetFields Fields to generate facets for
   * @param sortOptions Sort options
   * @param limitCount Maximum number of results to return
   * @returns Faceted search results
   */
  async facetedSearch<T extends FirestoreDocument>(
    collectionName: string,
    conditions: SearchCondition[] = [],
    facetFields: string[] = [],
    sortOptions: SearchSort[] = [],
    limitCount: number = this.config.defaultResultsLimit
  ): Promise<{
    results: SearchResults<T>;
    facets: Record<string, {value: any, count: number}[]>;
  }> {
    try {
      // Perform the base search
      const results = await this.search<T>(
        collectionName,
        conditions,
        sortOptions,
        limitCount
      );
      
      // Generate facets
      const facets: Record<string, {value: any, count: number}[]> = {};
      
      if (facetFields.length > 0) {
        // For each facet field, count values
        facetFields.forEach(field => {
          const facetCounts: Record<string, number> = {};
          
          // Count occurrences of each value
          results.items.forEach(item => {
            const value = (item as any)[field];
            
            if (value !== undefined && value !== null) {
              const valueKey = Array.isArray(value) 
                ? value.map(v => String(v)).sort().join(',')
                : String(value);
                
              facetCounts[valueKey] = (facetCounts[valueKey] || 0) + 1;
            }
          });
          
          // Convert counts to facet format
          facets[field] = Object.entries(facetCounts).map(([valueKey, count]) => {
            // Convert back from string key to original type if needed
            let value: any = valueKey;
            
            // Handle arrays
            if (valueKey.includes(',')) {
              value = valueKey.split(',');
            }
            
            return { value, count };
          });
          
          // Sort by count descending
          facets[field].sort((a, b) => b.count - a.count);
        });
      }
      
      return { results, facets };
    } catch (error) {
      console.error(`Error performing faceted search in ${collectionName}:`, error);
      throw error;
    }
  }
  
  /**
   * Perform geo-based search - using a basic bounding box approach
   * @param collectionName Collection to search
   * @param latField Latitude field name
   * @param lngField Longitude field name
   * @param centerLat Center latitude
   * @param centerLng Center longitude
   * @param radiusKm Radius in kilometers
   * @param additionalConditions Additional search conditions
   * @param sortOptions Sort options
   * @param limitCount Maximum number of results to return
   * @returns Search results
   */
  async geoSearch<T extends FirestoreDocument>(
    collectionName: string,
    latField: string,
    lngField: string,
    centerLat: number,
    centerLng: number,
    radiusKm: number,
    additionalConditions: SearchCondition[] = [],
    sortOptions: SearchSort[] = [],
    limitCount: number = this.config.defaultResultsLimit
  ): Promise<SearchResults<T>> {
    try {
      // Calculate bounding box
      // Note: This is an approximation and will not be perfect, especially near poles
      // For a production app, consider using Geohash or a proper geo-indexing solution
      const latDegreePerKm = 1 / 111.32; // approx degrees per km
      const lngDegreePerKm = 1 / (111.32 * Math.cos(centerLat * Math.PI / 180));
      
      const latDelta = radiusKm * latDegreePerKm;
      const lngDelta = radiusKm * lngDegreePerKm;
      
      const minLat = centerLat - latDelta;
      const maxLat = centerLat + latDelta;
      const minLng = centerLng - lngDelta;
      const maxLng = centerLng + lngDelta;
      
      // Add geo conditions
      const conditions: SearchCondition[] = [
        ...additionalConditions,
        { field: latField, operator: '>=', value: minLat },
        { field: latField, operator: '<=', value: maxLat },
        { field: lngField, operator: '>=', value: minLng },
        { field: lngField, operator: '<=', value: maxLng }
      ];
      
      // Perform the search
      const results = await this.search<T>(
        collectionName,
        conditions,
        sortOptions,
        limitCount
      );
      
      // Filter the results by actual distance (since bounding box is an approximation)
      const filteredItems = results.items.filter(item => {
        const lat = (item as any)[latField];
        const lng = (item as any)[lngField];
        
        if (lat === undefined || lng === undefined) {
          return false;
        }
        
        // Calculate actual distance using Haversine formula
        const distance = this.calculateDistance(
          centerLat, centerLng,
          lat, lng
        );
        
        // Add distance to the item for sorting/display
        (item as any).distance = distance;
        
        return distance <= radiusKm;
      });
      
      // Sort by distance if no other sort specified
      if (sortOptions.length === 0) {
        filteredItems.sort((a, b) => {
          return (a as any).distance - (b as any).distance;
        });
      }
      
      return {
        items: filteredItems,
        totalCount: filteredItems.length,
        hasMore: results.hasMore,
        lastDoc: results.lastDoc
      };
    } catch (error) {
      console.error(`Error performing geo search in ${collectionName}:`, error);
      throw error;
    }
  }
  
  /**
   * Calculate distance between two points using Haversine formula
   * @param lat1 Latitude of first point
   * @param lng1 Longitude of first point
   * @param lat2 Latitude of second point
   * @param lng2 Longitude of second point
   * @returns Distance in kilometers
   */
  private calculateDistance(
    lat1: number, lng1: number,
    lat2: number, lng2: number
  ): number {
    const R = 6371; // Earth's radius in km
    
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }
  
  /**
   * Convert degrees to radians
   * @param degrees Degrees
   * @returns Radians
   */
  private toRad(degrees: number): number {
    return degrees * Math.PI / 180;
  }
  
  /**
   * Generate a cache key for a search
   * @param collectionName Collection name
   * @param conditions Search conditions
   * @param sortOptions Sort options
   * @param limitCount Result limit
   * @returns Cache key
   */
  private generateCacheKey(
    collectionName: string,
    conditions: SearchCondition[],
    sortOptions: SearchSort[],
    limitCount: number
  ): string {
    // Serialize the search parameters
    const conditionsStr = JSON.stringify(conditions);
    const sortStr = JSON.stringify(sortOptions);
    
    // Generate a hash using a simple algorithm
    return `${collectionName}:${conditionsStr}:${sortStr}:${limitCount}`;
  }
  
  /**
   * Get a search result from cache
   * @param cacheKey Cache key
   * @param collectionName Collection name
   * @returns Cached search results or null
   */
  private getFromCache<T extends FirestoreDocument>(
    cacheKey: string,
    collectionName: string
  ): SearchResults<T> | null {
    // Set up namespace for this collection if needed
    this.setupCacheNamespace(collectionName);
    
    // Get from cache
    const cachedResult = cacheService.get<SearchResults<T>>(cacheKey, `search:${collectionName}`);
    
    if (cachedResult) {
      return cachedResult;
    }
    
    return null;
  }
  
  /**
   * Save search results to cache
   * @param cacheKey Cache key
   * @param results Search results
   * @param collectionName Collection name
   */
  private saveToCache<T extends FirestoreDocument>(
    cacheKey: string,
    results: SearchResults<T>,
    collectionName: string
  ): void {
    // Set up namespace for this collection if needed
    this.setupCacheNamespace(collectionName);
    
    // Save to cache with TTL
    cacheService.set(
      cacheKey,
      results,
      this.config.cacheTTL,
      `search:${collectionName}`
    );
  }
  
  /**
   * Set up cache namespace for a collection
   * @param collectionName Collection name
   */
  private setupCacheNamespace(collectionName: string): void {
    // Set up a cache collection for this namespace if it doesn't exist
    const cacheNamespace = `search:${collectionName}`;
    
    if (!this.searchCaches.has(cacheNamespace)) {
      this.searchCaches.set(
        cacheNamespace,
        new CacheCollection(cacheService, cacheNamespace, this.config.cacheTTL)
      );
    }
  }
  
  /**
   * Clear search cache for a collection
   * @param collectionName Collection name
   */
  clearCache(collectionName?: string): void {
    if (collectionName) {
      // Clear cache for specific collection
      const cacheNamespace = `search:${collectionName}`;
      cacheService.clearNamespace(cacheNamespace);
    } else {
      // Clear all search cache
      this.searchCaches.forEach((_, cacheNamespace) => {
        cacheService.clearNamespace(cacheNamespace);
      });
      this.searchCaches.clear();
    }
  }
  
  /**
   * Log debug message
   * @param message Debug message
   */
  private log(message: string): void {
    if (this.config.debugMode) {
      console.log(`[SearchService] ${message}`);
    }
  }
}

// Export a singleton instance
export const searchService = new SearchService(); 