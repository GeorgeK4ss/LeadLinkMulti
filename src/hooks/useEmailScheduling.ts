"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, Timestamp, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { EmailSchedule, scheduleEmail, cancelScheduledEmail, EmailVariables } from '@/lib/emailUtils';

export function useEmailScheduling() {
  const { tenant } = useAuth();
  const [schedules, setSchedules] = useState<EmailSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchSchedules = async () => {
      if (!tenant) {
        setSchedules([]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const q = query(
          collection(db, 'emailSchedules'),
          where('tenantId', '==', tenant.id),
          orderBy('scheduledFor', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const fetchedSchedules = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as EmailSchedule));
        
        setSchedules(fetchedSchedules);
      } catch (err) {
        console.error('Error fetching email schedules:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch email schedules'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchSchedules();
  }, [tenant]);
  
  const createSchedule = async (
    templateId: string,
    recipients: string[],
    scheduledFor: Date,
    variables: EmailVariables = {}
  ): Promise<string> => {
    if (!tenant) {
      throw new Error('No tenant selected');
    }
    
    try {
      const scheduleId = await scheduleEmail(templateId, recipients, scheduledFor, variables);
      
      // Update the document with tenant ID
      const scheduleRef = doc(db, 'emailSchedules', scheduleId);
      await updateDoc(scheduleRef, { tenantId: tenant.id });
      
      // Fetch the updated schedule
      const updatedSchedule = {
        id: scheduleId,
        templateId,
        recipients,
        scheduledFor: Timestamp.fromDate(scheduledFor),
        status: 'scheduled',
        metadata: { variables },
        tenantId: tenant.id,
        createdAt: Timestamp.now()
      } as EmailSchedule;
      
      // Update local state
      setSchedules(prev => [updatedSchedule, ...prev]);
      
      return scheduleId;
    } catch (err) {
      console.error('Error creating email schedule:', err);
      throw err instanceof Error ? err : new Error('Failed to create email schedule');
    }
  };
  
  const cancelSchedule = async (scheduleId: string): Promise<void> => {
    if (!tenant) {
      throw new Error('No tenant selected');
    }
    
    try {
      await cancelScheduledEmail(scheduleId);
      
      // Update local state
      setSchedules(prev => 
        prev.map(schedule => 
          schedule.id === scheduleId 
            ? { ...schedule, status: 'cancelled', updatedAt: Timestamp.now() } 
            : schedule
        )
      );
    } catch (err) {
      console.error('Error cancelling email schedule:', err);
      throw err instanceof Error ? err : new Error('Failed to cancel email schedule');
    }
  };
  
  const deleteSchedule = async (scheduleId: string): Promise<void> => {
    if (!tenant) {
      throw new Error('No tenant selected');
    }
    
    try {
      await deleteDoc(doc(db, 'emailSchedules', scheduleId));
      
      // Update local state
      setSchedules(prev => prev.filter(schedule => schedule.id !== scheduleId));
    } catch (err) {
      console.error('Error deleting email schedule:', err);
      throw err instanceof Error ? err : new Error('Failed to delete email schedule');
    }
  };
  
  const getUpcomingSchedules = async (count: number = 5): Promise<EmailSchedule[]> => {
    if (!tenant) {
      return [];
    }
    
    try {
      const now = Timestamp.now();
      
      const q = query(
        collection(db, 'emailSchedules'),
        where('tenantId', '==', tenant.id),
        where('status', '==', 'scheduled'),
        where('scheduledFor', '>=', now),
        orderBy('scheduledFor', 'asc'),
        limit(count)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as EmailSchedule));
    } catch (err) {
      console.error('Error fetching upcoming schedules:', err);
      throw err instanceof Error ? err : new Error('Failed to fetch upcoming schedules');
    }
  };
  
  return {
    schedules,
    loading,
    error,
    createSchedule,
    cancelSchedule,
    deleteSchedule,
    getUpcomingSchedules
  };
} 