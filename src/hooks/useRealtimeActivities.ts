"use client";

import { useEffect, useState } from 'react';
import { DocumentData } from 'firebase/firestore';
import { subscribeToActivities } from '@/lib/realtime/firebase-realtime';

/**
 * A hook for subscribing to activity logs in real-time
 * @param tenantId The tenant ID to filter by
 * @param maxResults Maximum number of results to return
 * @param entityId Optional entity ID to filter by (user, lead, etc.)
 * @param entityType Optional entity type to filter by
 * @returns An object containing the activities data, loading state, and any error
 */
export function useRealtimeActivities<T extends DocumentData>(
  tenantId: string | null | undefined,
  maxResults: number = 50,
  entityId?: string,
  entityType?: string
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If no tenant ID is provided, set data to empty array and stop loading
    if (!tenantId) {
      setData([]);
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    
    // Subscribe to the activities
    const unsubscribe = subscribeToActivities<T>(
      tenantId,
      (newData, newError) => {
        setData(newData);
        setLoading(false);
        
        if (newError) {
          setError(newError);
        }
      },
      maxResults,
      entityId,
      entityType
    );
    
    // Cleanup function to unsubscribe when component unmounts
    // or when parameters change
    return () => {
      unsubscribe();
    };
  }, [tenantId, maxResults, entityId, entityType]);
  
  return { data, loading, error };
} 