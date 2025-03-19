import { FirestoreDocument } from './firebase/FirestoreService';

/**
 * Cache entry interface
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number; // Timestamp when the cache was created or updated
  expiry: number;    // Expiry timestamp
}

/**
 * Cache configuration interface
 */
export interface CacheConfig {
  defaultTTL: number;       // Default time-to-live in milliseconds
  maxSize: number;          // Maximum number of items to store in the cache
  cleanupInterval: number;  // Interval in milliseconds for running cache cleanup
}

/**
 * Cache statistics interface
 */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  keySpace: Map<string, number>; // Namespace -> count
}

/**
 * Type of environment for cache storage
 */
export enum CacheStorageType {
  MEMORY = 'memory',
  LOCAL_STORAGE = 'localStorage',
  INDEXED_DB = 'indexedDB'
}

/**
 * Service for caching data to improve application performance
 */
export class CacheService {
  private cache: Map<string, CacheEntry<any>>;
  private config: CacheConfig;
  private stats: CacheStats;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private readonly storageType: CacheStorageType;
  private readonly storagePrefix = 'leadlink_cache_';
  private readonly statsKey = 'cache_stats';
  private initialized = false;
  
  constructor(
    config?: Partial<CacheConfig>,
    storageType: CacheStorageType = CacheStorageType.MEMORY
  ) {
    this.cache = new Map<string, CacheEntry<any>>();
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes in milliseconds
      maxSize: 1000,             // Maximum 1000 items
      cleanupInterval: 60 * 1000, // Cleanup every 60 seconds
      ...config
    };
    this.storageType = storageType;
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      keySpace: new Map<string, number>()
    };
  }
  
  /**
   * Initialize the cache service
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    // Load cache from persistent storage if using localStorage or indexedDB
    if (this.storageType !== CacheStorageType.MEMORY) {
      await this.loadFromStorage();
    }
    
    // Start the cleanup timer
    this.startCleanupTimer();
    
    this.initialized = true;
  }
  
  /**
   * Set cache entry with a specific key
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time-to-live in milliseconds, defaults to the service's default TTL
   * @param namespace Optional namespace for grouping related cache entries
   */
  set<T>(key: string, data: T, ttl?: number, namespace?: string): void {
    this.ensureInitialized();
    
    const cacheKey = this.buildKey(key, namespace);
    const now = Date.now();
    const expiry = now + (ttl || this.config.defaultTTL);
    
    // Create cache entry
    this.cache.set(cacheKey, {
      data,
      timestamp: now,
      expiry
    });
    
    // Update stats
    this.updateStats(cacheKey, namespace, true);
    
    // If using persistent storage, save to it
    if (this.storageType !== CacheStorageType.MEMORY) {
      this.saveToStorage(cacheKey, data, expiry);
    }
    
    // If we've exceeded the max size, remove the oldest entry
    if (this.cache.size > this.config.maxSize) {
      this.removeOldest();
    }
  }
  
  /**
   * Get data from cache
   * @param key Cache key
   * @param namespace Optional namespace
   * @returns Cached data or null if not found or expired
   */
  get<T>(key: string, namespace?: string): T | null {
    this.ensureInitialized();
    
    const cacheKey = this.buildKey(key, namespace);
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    const now = Date.now();
    
    // Check if the entry has expired
    if (entry.expiry < now) {
      this.cache.delete(cacheKey);
      
      if (this.storageType !== CacheStorageType.MEMORY) {
        this.removeFromStorage(cacheKey);
      }
      
      this.stats.misses++;
      this.updateStats(cacheKey, namespace, false);
      
      return null;
    }
    
    // Cache hit
    this.stats.hits++;
    return entry.data as T;
  }
  
  /**
   * Check if key exists in cache and is not expired
   * @param key Cache key
   * @param namespace Optional namespace
   * @returns True if key exists and is not expired
   */
  has(key: string, namespace?: string): boolean {
    this.ensureInitialized();
    
    const cacheKey = this.buildKey(key, namespace);
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      return false;
    }
    
    const now = Date.now();
    
    // Check if the entry has expired
    if (entry.expiry < now) {
      this.cache.delete(cacheKey);
      
      if (this.storageType !== CacheStorageType.MEMORY) {
        this.removeFromStorage(cacheKey);
      }
      
      this.updateStats(cacheKey, namespace, false);
      
      return false;
    }
    
    return true;
  }
  
  /**
   * Delete a cache entry
   * @param key Cache key
   * @param namespace Optional namespace
   * @returns True if entry was deleted, false if it didn't exist
   */
  delete(key: string, namespace?: string): boolean {
    this.ensureInitialized();
    
    const cacheKey = this.buildKey(key, namespace);
    const deleted = this.cache.delete(cacheKey);
    
    if (deleted) {
      this.updateStats(cacheKey, namespace, false);
      
      if (this.storageType !== CacheStorageType.MEMORY) {
        this.removeFromStorage(cacheKey);
      }
    }
    
    return deleted;
  }
  
  /**
   * Clear all cache entries
   */
  clear(): void {
    this.ensureInitialized();
    
    this.cache.clear();
    this.resetStats();
    
    if (this.storageType !== CacheStorageType.MEMORY) {
      this.clearStorage();
    }
  }
  
  /**
   * Clear all cache entries in a namespace
   * @param namespace Namespace to clear
   */
  clearNamespace(namespace: string): void {
    this.ensureInitialized();
    
    const prefix = `${namespace}:`;
    
    // Find all keys in the namespace
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    });
    
    // Delete the keys
    for (const key of keysToDelete) {
      this.cache.delete(key);
      
      if (this.storageType !== CacheStorageType.MEMORY) {
        this.removeFromStorage(key);
      }
    }
    
    // Update stats
    if (this.stats.keySpace.has(namespace)) {
      this.stats.keySpace.delete(namespace);
      this.saveStats();
    }
  }
  
  /**
   * Get the current cache statistics
   * @returns Cache statistics
   */
  getStats(): CacheStats {
    this.ensureInitialized();
    
    return {
      ...this.stats,
      size: this.cache.size
    };
  }
  
  /**
   * Build a full cache key with optional namespace
   * @param key Base key
   * @param namespace Optional namespace
   * @returns Full cache key
   */
  private buildKey(key: string, namespace?: string): string {
    return namespace ? `${namespace}:${key}` : key;
  }
  
  /**
   * Update cache statistics
   * @param key Full cache key
   * @param namespace Optional namespace
   * @param isAdd Whether entry is being added (true) or removed (false)
   */
  private updateStats(key: string, namespace?: string, isAdd: boolean = true): void {
    if (namespace) {
      const count = this.stats.keySpace.get(namespace) || 0;
      
      if (isAdd) {
        this.stats.keySpace.set(namespace, count + 1);
      } else if (count > 0) {
        this.stats.keySpace.set(namespace, count - 1);
        
        if (count - 1 === 0) {
          this.stats.keySpace.delete(namespace);
        }
      }
    }
    
    this.stats.size = this.cache.size;
    
    if (this.storageType !== CacheStorageType.MEMORY) {
      this.saveStats();
    }
  }
  
  /**
   * Reset cache statistics
   */
  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      keySpace: new Map<string, number>()
    };
    
    if (this.storageType !== CacheStorageType.MEMORY) {
      this.saveStats();
    }
  }
  
  /**
   * Remove the oldest cache entry
   */
  private removeOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();
    
    // Find the oldest entry
    this.cache.forEach((entry, key) => {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    });
    
    // Remove the oldest entry
    if (oldestKey) {
      this.cache.delete(oldestKey);
      
      if (this.storageType !== CacheStorageType.MEMORY) {
        this.removeFromStorage(oldestKey);
      }
      
      // Extract namespace if it exists
      const namespaceMatch = typeof oldestKey === 'string' ? oldestKey.match(/^([^:]+):/) : null;
      const namespace = namespaceMatch ? namespaceMatch[1] : undefined;
      
      this.updateStats(oldestKey, namespace, false);
    }
  }
  
  /**
   * Start the cleanup timer to remove expired entries
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }
  
  /**
   * Clean up expired cache entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    // Find all expired entries
    this.cache.forEach((entry, key) => {
      if (entry.expiry < now) {
        expiredKeys.push(key);
      }
    });
    
    // Remove expired entries
    for (const key of expiredKeys) {
      this.cache.delete(key);
      
      if (this.storageType !== CacheStorageType.MEMORY) {
        this.removeFromStorage(key);
      }
      
      // Extract namespace if it exists
      const namespaceMatch = key.match(/^([^:]+):/);
      const namespace = namespaceMatch ? namespaceMatch[1] : undefined;
      
      this.updateStats(key, namespace, false);
    }
  }
  
  /**
   * Save cache entry to persistent storage
   * @param key Cache key
   * @param data Data to save
   * @param expiry Expiry timestamp
   */
  private saveToStorage(key: string, data: any, expiry: number): void {
    const entry: CacheEntry<any> = {
      data,
      timestamp: Date.now(),
      expiry
    };
    
    try {
      if (this.storageType === CacheStorageType.LOCAL_STORAGE && typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storagePrefix + key, JSON.stringify(entry));
      } else if (this.storageType === CacheStorageType.INDEXED_DB) {
        // IndexedDB implementation would go here
        // For simplicity, we're not implementing IndexedDB in this example
        console.warn('IndexedDB storage not implemented');
      }
    } catch (error) {
      console.error('Error saving to cache storage:', error);
    }
  }
  
  /**
   * Remove cache entry from persistent storage
   * @param key Cache key
   */
  private removeFromStorage(key: string): void {
    try {
      if (this.storageType === CacheStorageType.LOCAL_STORAGE && typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.storagePrefix + key);
      } else if (this.storageType === CacheStorageType.INDEXED_DB) {
        // IndexedDB implementation would go here
        console.warn('IndexedDB storage not implemented');
      }
    } catch (error) {
      console.error('Error removing from cache storage:', error);
    }
  }
  
  /**
   * Clear all cache entries from persistent storage
   */
  private clearStorage(): void {
    try {
      if (this.storageType === CacheStorageType.LOCAL_STORAGE && typeof localStorage !== 'undefined') {
        // Only clear keys with our prefix
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(this.storagePrefix)) {
            localStorage.removeItem(key);
          }
        });
      } else if (this.storageType === CacheStorageType.INDEXED_DB) {
        // IndexedDB implementation would go here
        console.warn('IndexedDB storage not implemented');
      }
    } catch (error) {
      console.error('Error clearing cache storage:', error);
    }
  }
  
  /**
   * Load cache from persistent storage
   */
  private async loadFromStorage(): Promise<void> {
    try {
      if (this.storageType === CacheStorageType.LOCAL_STORAGE && typeof localStorage !== 'undefined') {
        // Load stats
        const statsJson = localStorage.getItem(this.storagePrefix + this.statsKey);
        if (statsJson) {
          const parsedStats = JSON.parse(statsJson);
          this.stats = {
            ...parsedStats,
            keySpace: new Map(parsedStats.keySpace)
          };
        }
        
        // Load cache entries
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(this.storagePrefix) && key !== this.storagePrefix + this.statsKey) {
            const entryKey = key.substring(this.storagePrefix.length);
            const entryJson = localStorage.getItem(key);
            
            if (entryJson) {
              try {
                const entry: CacheEntry<any> = JSON.parse(entryJson);
                
                // Check if expired
                if (entry.expiry > Date.now()) {
                  this.cache.set(entryKey, entry);
                } else {
                  // Remove expired entry
                  localStorage.removeItem(key);
                }
              } catch (e) {
                console.warn(`Error parsing cache entry ${key}:`, e);
                localStorage.removeItem(key);
              }
            }
          }
        });
      } else if (this.storageType === CacheStorageType.INDEXED_DB) {
        // IndexedDB implementation would go here
        console.warn('IndexedDB storage not implemented');
      }
    } catch (error) {
      console.error('Error loading from cache storage:', error);
    }
  }
  
  /**
   * Save statistics to persistent storage
   */
  private saveStats(): void {
    try {
      if (this.storageType === CacheStorageType.LOCAL_STORAGE && typeof localStorage !== 'undefined') {
        // Convert Map to array for JSON serialization
        const serializedStats = {
          ...this.stats,
          keySpace: Array.from(this.stats.keySpace.entries())
        };
        
        localStorage.setItem(
          this.storagePrefix + this.statsKey,
          JSON.stringify(serializedStats)
        );
      } else if (this.storageType === CacheStorageType.INDEXED_DB) {
        // IndexedDB implementation would go here
        console.warn('IndexedDB storage not implemented');
      }
    } catch (error) {
      console.error('Error saving cache stats:', error);
    }
  }
  
  /**
   * Ensure the cache service is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Cache service has not been initialized. Call initialize() first.');
    }
  }
  
  /**
   * Dispose of the cache service
   */
  dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    this.initialized = false;
  }
}

/**
 * Cache collection interface for caching Firestore documents
 */
export class CacheCollection<T extends FirestoreDocument> {
  private readonly cache: CacheService;
  private readonly collectionName: string;
  private readonly ttl?: number;
  
  constructor(cache: CacheService, collectionName: string, ttl?: number) {
    this.cache = cache;
    this.collectionName = collectionName;
    this.ttl = ttl;
  }
  
  /**
   * Get a document by ID from cache or return null
   * @param id Document ID
   * @returns Document or null if not in cache
   */
  getById(id: string): T | null {
    return this.cache.get<T>(id, this.collectionName);
  }
  
  /**
   * Set a document in the cache
   * @param doc Document to cache
   */
  set(doc: T): void {
    if (!doc.id) {
      throw new Error('Document must have an ID to be cached');
    }
    
    this.cache.set<T>(doc.id, doc, this.ttl, this.collectionName);
  }
  
  /**
   * Check if document exists in cache
   * @param id Document ID
   * @returns True if document exists in cache
   */
  has(id: string): boolean {
    return this.cache.has(id, this.collectionName);
  }
  
  /**
   * Delete a document from cache
   * @param id Document ID
   * @returns True if document was deleted
   */
  delete(id: string): boolean {
    return this.cache.delete(id, this.collectionName);
  }
  
  /**
   * Clear all cached documents for this collection
   */
  clear(): void {
    this.cache.clearNamespace(this.collectionName);
  }
}

// Create a singleton instance of the cache service
export const cacheService = new CacheService({
  defaultTTL: 10 * 60 * 1000, // 10 minutes
  maxSize: 5000,             // 5000 items
  cleanupInterval: 5 * 60 * 1000 // 5 minutes
}); 