"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { EmailTemplate, EmailCategory, DEFAULT_TEMPLATES } from '@/lib/emailUtils';

export function useEmailTemplates(category?: EmailCategory) {
  const { tenant } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!tenant) {
        setTemplates([]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        let q = query(
          collection(db, 'emailTemplates'),
          where('tenantId', '==', tenant.id)
        );
        
        if (category) {
          q = query(q, where('category', '==', category));
        }
        
        const snapshot = await getDocs(q);
        const fetchedTemplates = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as EmailTemplate));
        
        setTemplates(fetchedTemplates);
      } catch (err) {
        console.error('Error fetching email templates:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch email templates'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplates();
  }, [tenant, category]);
  
  const createTemplate = async (template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!tenant) {
      throw new Error('No tenant selected');
    }
    
    try {
      const newTemplate = {
        ...template,
        tenantId: tenant.id,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, 'emailTemplates'), newTemplate);
      
      // Update local state
      setTemplates(prev => [
        ...prev,
        { ...newTemplate, id: docRef.id } as EmailTemplate
      ]);
      
      return docRef.id;
    } catch (err) {
      console.error('Error creating email template:', err);
      throw err instanceof Error ? err : new Error('Failed to create email template');
    }
  };
  
  const updateTemplate = async (id: string, updates: Partial<Omit<EmailTemplate, 'id' | 'createdAt'>>): Promise<void> => {
    if (!tenant) {
      throw new Error('No tenant selected');
    }
    
    try {
      const templateRef = doc(db, 'emailTemplates', id);
      
      await updateDoc(templateRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
      
      // Update local state
      setTemplates(prev => 
        prev.map(template => 
          template.id === id 
            ? { ...template, ...updates, updatedAt: Timestamp.now() } 
            : template
        )
      );
    } catch (err) {
      console.error('Error updating email template:', err);
      throw err instanceof Error ? err : new Error('Failed to update email template');
    }
  };
  
  const deleteTemplate = async (id: string): Promise<void> => {
    if (!tenant) {
      throw new Error('No tenant selected');
    }
    
    try {
      await deleteDoc(doc(db, 'emailTemplates', id));
      
      // Update local state
      setTemplates(prev => prev.filter(template => template.id !== id));
    } catch (err) {
      console.error('Error deleting email template:', err);
      throw err instanceof Error ? err : new Error('Failed to delete email template');
    }
  };
  
  const initializeDefaultTemplates = async (): Promise<void> => {
    if (!tenant) {
      throw new Error('No tenant selected');
    }
    
    try {
      const batch = [];
      
      for (const template of DEFAULT_TEMPLATES) {
        batch.push(createTemplate(template));
      }
      
      await Promise.all(batch);
    } catch (err) {
      console.error('Error initializing default templates:', err);
      throw err instanceof Error ? err : new Error('Failed to initialize default templates');
    }
  };
  
  return {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    initializeDefaultTemplates
  };
} 