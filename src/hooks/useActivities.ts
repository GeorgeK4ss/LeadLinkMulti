"use client";

import { useEffect, useState } from 'react';
import { DocumentData, OrderByDirection } from 'firebase/firestore';
import { subscribeToActivities } from '@/lib/realtime/firebase-realtime';
import { Activity } from '@/lib/realtime/activities';

interface ActivityOptions {
  maxResults?: number;
  entityId?: string;
  entityType?: string;
}

interface ActivitiesState {
  activities: Activity[];
  loading: boolean;
  error: Error | null;
}

/**
 * A hook for subscribing to activity logs in real-time
 * @param tenantId The tenant ID
 * @param options Optional parameters for filtering activities
 * @returns An object containing the activities data, loading state, and error
 */
export function useActivities(
  tenantId: string | null | undefined,
  options: ActivityOptions = {}
): ActivitiesState {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const { maxResults = 50, entityId, entityType } = options;

  useEffect(() => {
    // If no tenant ID is provided, set activities to empty array and stop loading
    if (!tenantId) {
      setActivities([]);
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    
    // Subscribe to activities
    const unsubscribe = subscribeToActivities<Activity>(
      tenantId,
      (newData, newError) => {
        setActivities(newData);
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

  return {
    activities,
    loading,
    error
  };
}

/**
 * A hook for subscribing to user activities in real-time
 * @param tenantId The tenant ID
 * @param userId The user ID to filter activities for
 * @param maxResults Maximum number of results to return
 * @returns An object containing the activities data, loading state, and error
 */
export function useUserActivities(
  tenantId: string | null | undefined,
  userId: string | null | undefined,
  maxResults: number = 50
): ActivitiesState {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If no tenant ID or user ID is provided, set activities to empty array and stop loading
    if (!tenantId || !userId) {
      setActivities([]);
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    
    // Subscribe to activities
    const unsubscribe = subscribeToActivities<Activity>(
      tenantId,
      (newData, newError) => {
        // Filter activities by userId
        const filteredData = newData.filter(activity => activity.userId === userId);
        setActivities(filteredData);
        setLoading(false);
        
        if (newError) {
          setError(newError);
        }
      },
      maxResults
    );
    
    // Cleanup function to unsubscribe when component unmounts
    // or when parameters change
    return () => {
      unsubscribe();
    };
  }, [tenantId, userId, maxResults]);

  return {
    activities,
    loading,
    error
  };
}

/**
 * A hook for subscribing to entity-specific activities in real-time
 * @param tenantId The tenant ID
 * @param entityType The type of entity (lead, customer, task, user, etc.)
 * @param entityId The ID of the entity
 * @param maxResults Maximum number of results to return
 * @returns An object containing the activities data, loading state, and error
 */
export function useEntityActivities(
  tenantId: string | null | undefined,
  entityType: string | null | undefined,
  entityId: string | null | undefined,
  maxResults: number = 50
): ActivitiesState {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If required parameters are missing, set activities to empty array and stop loading
    if (!tenantId || !entityType || !entityId) {
      setActivities([]);
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    
    // Subscribe to activities
    const unsubscribe = subscribeToActivities<Activity>(
      tenantId,
      (newData, newError) => {
        setActivities(newData);
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
  }, [tenantId, entityType, entityId, maxResults]);

  return {
    activities,
    loading,
    error
  };
}