/**
 * Options for async batch processing
 */
export interface AsyncBatchOptions {
  /**
   * Maximum number of concurrent operations
   */
  concurrency?: number;
  
  /**
   * Whether to continue on error
   */
  continueOnError?: boolean;
}

/**
 * Default batch options
 */
const DEFAULT_BATCH_OPTIONS: AsyncBatchOptions = {
  concurrency: 5,
  continueOnError: false
};

/**
 * Process batches of data asynchronously with concurrency control
 * @param batches Array of batches to process
 * @param fn Function to process each batch
 * @param options Processing options
 * @returns Promise resolved when all batches are processed
 */
export async function asyncBatch<T>(
  batches: T[][],
  fn: (batch: T[]) => Promise<void>,
  options: AsyncBatchOptions = {}
): Promise<void> {
  const opts = { ...DEFAULT_BATCH_OPTIONS, ...options };
  const { concurrency = 5, continueOnError = false } = opts;
  
  // Create a queue of batches
  const queue = [...batches];
  let activeCount = 0;
  let errors: Error[] = [];
  
  // Return a promise that resolves when all batches are processed
  return new Promise((resolve, reject) => {
    // Process next batch from the queue
    const processNext = async () => {
      // If queue is empty and no active processes, we're done
      if (queue.length === 0 && activeCount === 0) {
        if (errors.length > 0 && !continueOnError) {
          reject(new Error(`${errors.length} errors occurred during batch processing`));
        } else {
          resolve();
        }
        return;
      }
      
      // If queue is empty but we have active processes, wait for them
      if (queue.length === 0) {
        return;
      }
      
      // If we've reached max concurrency, wait
      if (activeCount >= concurrency) {
        return;
      }
      
      // Get the next batch and process it
      const batch = queue.shift();
      if (!batch) return;
      
      activeCount++;
      
      try {
        await fn(batch);
      } catch (error) {
        errors.push(error as Error);
        if (!continueOnError) {
          reject(error);
          return;
        }
      } finally {
        activeCount--;
        processNext();
      }
      
      // Continue processing
      processNext();
    };
    
    // Start processing up to concurrency batches
    for (let i = 0; i < concurrency; i++) {
      processNext();
    }
  });
}

/**
 * Process array items asynchronously with concurrency control
 * @param items Array of items to process
 * @param fn Function to process each item
 * @param options Processing options
 * @returns Promise resolved when all items are processed
 */
export async function asyncParallel<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  options: AsyncBatchOptions = {}
): Promise<R[]> {
  const opts = { ...DEFAULT_BATCH_OPTIONS, ...options };
  const { concurrency = 5, continueOnError = false } = opts;
  
  const results: R[] = new Array(items.length);
  let index = 0;
  let activeCount = 0;
  let errors: Error[] = [];
  let completed = 0;
  
  // Return a promise that resolves when all items are processed
  return new Promise((resolve, reject) => {
    // Process next item from the array
    const processNext = async () => {
      // If all items are started and no active processes, we're done
      if (index >= items.length && activeCount === 0) {
        if (errors.length > 0 && !continueOnError) {
          reject(new Error(`${errors.length} errors occurred during parallel processing`));
        } else {
          resolve(results);
        }
        return;
      }
      
      // If all items are started but we have active processes, wait for them
      if (index >= items.length) {
        return;
      }
      
      // If we've reached max concurrency, wait
      if (activeCount >= concurrency) {
        return;
      }
      
      // Get the next item and process it
      const itemIndex = index++;
      const item = items[itemIndex];
      
      activeCount++;
      
      try {
        const result = await fn(item, itemIndex);
        results[itemIndex] = result;
        completed++;
      } catch (error) {
        errors.push(error as Error);
        if (!continueOnError) {
          reject(error);
          return;
        }
      } finally {
        activeCount--;
        processNext();
      }
      
      // Continue processing
      processNext();
    };
    
    // Start processing up to concurrency items
    for (let i = 0; i < concurrency && i < items.length; i++) {
      processNext();
    }
    
    // Handle empty array case
    if (items.length === 0) {
      resolve([]);
    }
  });
} 