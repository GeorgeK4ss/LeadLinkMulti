"use client";

import { useEffect, useState } from 'react';
import { DocumentData, QueryConstraint } from 'firebase/firestore';
import { subscribeToCollection } from '@/lib/realtime/firebase-realtime';

/**
 * A hook for subscribing to a Firestore collection in real-time
 * @param collectionName The Firestore collection name
 * @param constraints Optional query constraints (where, orderBy, limit, etc.)
 * @returns An object containing the collection data, loading state, and any error
 */
export function useRealtimeCollection<T extends DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    
    // Subscribe to the collection
    const unsubscribe = subscribeToCollection<T>(
      collectionName,
      constraints,
      (newData, newError) => {
        setData(newData);
        setLoading(false);
        
        if (newError) {
          setError(newError);
        }
      }
    );
    
    // Cleanup function to unsubscribe when component unmounts
    // or when collectionName or constraints change
    return () => {
      unsubscribe();
    };
  }, [collectionName, constraints]);
  
  return { data, loading, error };
} 