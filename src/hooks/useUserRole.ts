"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { getAuth } from "firebase/auth";

/**
 * Hook to get the current user's role with priority on cached values
 */
export function useUserRole() {
  const { user } = useAuth();
  // Initialize with cached value if available
  const getCachedRole = () => {
    if (typeof window === 'undefined') return null;
    
    try {
      // First try to get from memory cache
      if (window.__roleCache) {
        return window.__roleCache;
      }
      
      // Try localStorage cache if user exists
      if (user?.uid) {
        const cachedRole = localStorage.getItem(`user_role_${user.uid}`);
        if (cachedRole) {
          // Save to memory cache
          window.__roleCache = cachedRole;
          return cachedRole;
        }
      }
      
      // Default to agent if no role found
      return user ? 'agent' : null;
    } catch (e) {
      console.warn("Error accessing role cache:", e);
      return user ? 'agent' : null;
    }
  };
  
  const [role, setRole] = useState<string | null>(getCachedRole());
  const [loading, setLoading] = useState(false); // Start with loading false
  const [error, setError] = useState<Error | null>(null);

  // Effect to update role asynchronously only if needed
  useEffect(() => {
    let isActive = true;
    
    // Update cached role immediately on user change
    const immediateRole = getCachedRole();
    if (immediateRole !== role) {
      setRole(immediateRole);
    }
    
    // Only fetch from Firebase if there's a user and we don't have a role
    if (!user || immediateRole) {
      return () => { isActive = false; };
    }
    
    // Run in a non-blocking way by breaking out of the React lifecycle
    const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 1000));
    idleCallback(() => {
      if (!isActive || !user) return;
      
      // Try to detect role from email before network request
      if (user.email) {
        let detectedRole = 'agent'; // Default
        
        if (user.email === 'admin@leadlink.com' || user.email.includes('@leadlink.com')) {
          detectedRole = 'admin';
        } else if (user.email.includes('company')) {
          detectedRole = 'company';
        } else if (user.email.includes('tenant')) {
          detectedRole = 'tenant';
        } else if (user.email.includes('agent')) {
          detectedRole = 'agent';
        }
        
        // Cache the role in memory and localStorage
        window.__roleCache = detectedRole;
        localStorage.setItem(`user_role_${user.uid}`, detectedRole);
        
        if (isActive) {
          setRole(detectedRole);
        }
        return;
      }
      
      // Last resort - use default role
      if (isActive) {
        const defaultRole = 'agent';
        window.__roleCache = defaultRole;
        if (user.uid) {
          localStorage.setItem(`user_role_${user.uid}`, defaultRole);
        }
        setRole(defaultRole);
      }
    });
    
    return () => {
      isActive = false;
    };
  }, [user, role]);

  // Function to manually update the role state
  const updateRole = (newRole: string | null) => {
    if (newRole && user?.uid) {
      // Update both memory and localStorage cache
      window.__roleCache = newRole;
      localStorage.setItem(`user_role_${user.uid}`, newRole);
    } else if (window.__roleCache) {
      // Clear memory cache if role is null
      delete window.__roleCache;
    }
    
    setRole(newRole);
  };

  return { role, loading, error, setRole: updateRole };
}

// Add global declaration for role cache
declare global {
  interface Window {
    __roleCache?: string;
  }
} 