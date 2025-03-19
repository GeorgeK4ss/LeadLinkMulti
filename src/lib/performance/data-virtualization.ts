/**
 * Data virtualization utilities for handling large datasets efficiently
 * These utilities help with pagination, windowing, and chunking of large data
 */

/**
 * Configuration options for paginated data
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
  totalItems?: number;
}

/**
 * Result of pagination operation
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Paginate an array of data
 * 
 * @param data Full array of data
 * @param options Pagination options
 * @returns Paginated subset of data with pagination metadata
 */
export function paginateData<T>(
  data: T[],
  options: PaginationOptions
): PaginatedResult<T> {
  const { page, pageSize } = options;
  const totalItems = options.totalItems || data.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  
  // Calculate start and end indices
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, data.length);
  
  // Get the current page data
  const paginatedData = data.slice(startIndex, endIndex);
  
  return {
    data: paginatedData,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

/**
 * Configuration for data chunking
 */
export interface ChunkOptions {
  chunkSize: number;
  maxParallelChunks?: number;
}

/**
 * Process large datasets in chunks to avoid UI blocking
 * 
 * @param items Array of items to process
 * @param processor Function to process each item
 * @param options Chunking options
 * @returns Promise that resolves when all processing is complete
 */
export async function processInChunks<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: ChunkOptions
): Promise<R[]> {
  const { chunkSize, maxParallelChunks = 1 } = options;
  const results: R[] = [];
  
  // Process data in chunks
  for (let i = 0; i < items.length; i += chunkSize * maxParallelChunks) {
    const chunk = items.slice(i, i + chunkSize * maxParallelChunks);
    
    // Process chunks in parallel batches
    const batchPromises: Promise<R[]>[] = [];
    
    for (let j = 0; j < chunk.length; j += chunkSize) {
      const batchItems = chunk.slice(j, j + chunkSize);
      
      // Create a promise that processes all items in this batch
      const batchPromise = new Promise<R[]>((resolve) => {
        // Use setTimeout to yield to browser rendering between chunks
        setTimeout(async () => {
          const batchResults: R[] = [];
          
          for (const item of batchItems) {
            const result = await processor(item);
            batchResults.push(result);
          }
          
          resolve(batchResults);
        }, 0);
      });
      
      batchPromises.push(batchPromise);
    }
    
    // Wait for all batches in this chunk to complete
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.flat());
  }
  
  return results;
}

/**
 * Configuration for windowed data rendering
 */
export interface WindowConfig {
  itemCount: number;
  itemHeight: number;
  overscan?: number;
  viewportHeight: number;
  scrollTop: number;
}

/**
 * Calculate which items should be rendered in a virtualized list
 * 
 * @param config Window configuration
 * @returns Range of items to render
 */
export function calculateVisibleWindowRange(
  config: WindowConfig
): { startIndex: number; endIndex: number; offsetY: number } {
  const {
    itemCount,
    itemHeight,
    overscan = 3,
    viewportHeight,
    scrollTop,
  } = config;
  
  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleItemCount = Math.ceil(viewportHeight / itemHeight) + 2 * overscan;
  const endIndex = Math.min(itemCount - 1, startIndex + visibleItemCount);
  
  // Calculate offset for smooth scrolling
  const offsetY = startIndex * itemHeight;
  
  return { startIndex, endIndex, offsetY };
}

/**
 * Optimize search for large datasets
 * 
 * @param data The dataset to search
 * @param searchFn Function to determine if an item matches
 * @param options Optional configuration
 * @returns Matching items
 */
export function optimizedSearch<T>(
  data: T[],
  searchFn: (item: T) => boolean,
  options: { limit?: number; threshold?: number } = {}
): T[] {
  const { limit = Infinity, threshold = 1000 } = options;
  const results: T[] = [];
  
  // If dataset is small, do simple filter
  if (data.length < threshold) {
    return data.filter(searchFn).slice(0, limit);
  }
  
  // For large datasets, use chunked approach with early termination
  for (let i = 0; i < data.length; i += 500) {
    // Process in chunks of 500 items
    const chunk = data.slice(i, i + 500);
    
    // Find matches in this chunk
    for (const item of chunk) {
      if (searchFn(item)) {
        results.push(item);
        
        // Early termination if we've reached limit
        if (results.length >= limit) {
          return results;
        }
      }
    }
    
    // Yield to main thread every 500 items
    if (i + 500 < data.length) {
      setTimeout(() => {}, 0);
    }
  }
  
  return results;
}

/**
 * Memoize a function's results to avoid expensive recalculations
 * 
 * @param fn Function to memoize
 * @param keyFn Optional function to generate cache key
 * @returns Memoized function
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyFn: (...args: Parameters<T>) => string = (...args) => JSON.stringify(args)
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyFn(...args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Clear cached items from a specific table that match a predicate
 * Useful for invalidating caches when data changes
 */
export class DataCache {
  private static cache = new Map<string, Map<string, any>>();
  
  /**
   * Store an item in the cache
   */
  static set(table: string, key: string, value: any): void {
    if (!this.cache.has(table)) {
      this.cache.set(table, new Map());
    }
    
    this.cache.get(table)!.set(key, value);
  }
  
  /**
   * Retrieve an item from the cache
   */
  static get<T>(table: string, key: string): T | undefined {
    return this.cache.get(table)?.get(key);
  }
  
  /**
   * Check if an item exists in the cache
   */
  static has(table: string, key: string): boolean {
    return this.cache.get(table)?.has(key) ?? false;
  }
  
  /**
   * Delete a specific item from the cache
   */
  static delete(table: string, key: string): boolean {
    return this.cache.get(table)?.delete(key) ?? false;
  }
  
  /**
   * Clear all items from a specific table
   */
  static clearTable(table: string): boolean {
    return this.cache.delete(table);
  }
  
  /**
   * Clear all cached data
   */
  static clearAll(): void {
    this.cache.clear();
  }
} 