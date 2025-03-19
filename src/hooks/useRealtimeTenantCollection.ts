"use client";

import { useEffect, useState } from 'react';
import { DocumentData, QueryConstraint, where } from 'firebase/firestore';
import { subscribeTenantCollection } from '@/lib/realtime/firebase-realtime';

/**
 * A hook for subscribing to a tenant-specific Firestore collection in real-time
 * @param collectionName The Firestore collection name
 * @param tenantId The tenant ID to filter by
 * @param additionalConstraints Optional additional query constraints
 * @returns An object containing the collection data, loading state, and any error
 */
export function useRealtimeTenantCollection<T extends DocumentData>(
  collectionName: string,
  tenantId: string | null | undefined,
  additionalConstraints: QueryConstraint[] = []
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
    
    // Subscribe to the tenant-specific collection
    const unsubscribe = subscribeTenantCollection<T>(
      collectionName,
      tenantId,
      additionalConstraints,
      (newData, newError) => {
        setData(newData);
        setLoading(false);
        
        if (newError) {
          setError(newError);
        }
      }
    );
    
    // Cleanup function to unsubscribe when component unmounts
    // or when parameters change
    return () => {
      unsubscribe();
    };
  }, [collectionName, tenantId, additionalConstraints]);
  
  return { data, loading, error };
} 