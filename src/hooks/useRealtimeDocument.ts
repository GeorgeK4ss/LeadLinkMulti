"use client";

import { useEffect, useState } from 'react';
import { subscribeToDocument } from '@/lib/realtime/firebase-realtime';
import { DocumentData } from 'firebase/firestore';

/**
 * A hook for subscribing to a Firestore document in real-time
 * @param collectionName The Firestore collection name
 * @param documentId The document ID to subscribe to
 * @returns An object containing the document data, loading state, and any error
 */
export function useRealtimeDocument<T extends DocumentData>(
  collectionName: string,
  documentId: string | null | undefined
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If no document ID is provided, set data to null and stop loading
    if (!documentId) {
      setData(null);
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    
    // Subscribe to the document
    const unsubscribe = subscribeToDocument<T>(
      collectionName,
      documentId,
      (newData, newError) => {
        setData(newData);
        setLoading(false);
        
        if (newError) {
          setError(newError);
        }
      }
    );
    
    // Cleanup function to unsubscribe when component unmounts
    // or when collectionName or documentId changes
    return () => {
      unsubscribe();
    };
  }, [collectionName, documentId]);
  
  return { data, loading, error };
}