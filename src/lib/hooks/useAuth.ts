import { useState, useEffect, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { UserService } from '@/lib/services/UserService';
import type { CustomClaimUserRole, CustomClaims } from '@/lib/types/auth';
import type { PermissionResource, Permission } from '@/lib/types/auth';

interface AuthState {
  user: FirebaseUser | null;
  userRole: CustomClaimUserRole | null;
  claims: CustomClaims | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    userRole: null,
    claims: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });
  
  const userService = new UserService();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get user claims from token
          const tokenResult = await user.getIdTokenResult();
          const claims = tokenResult.claims as CustomClaims;
          
          // Get full user role from Firestore
          const userRole = await userService.getUserRole(user.uid);
          
          setAuthState({
            user,
            userRole,
            claims,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error) {
          console.error('Error fetching user claims:', error);
          setAuthState({
            user,
            userRole: null,
            claims: null,
            isAuthenticated: true,
            isLoading: false,
            error: 'Failed to load user permissions'
          });
        }
      } else {
        setAuthState({
          user: null,
          userRole: null,
          claims: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Auth state will be updated by the onAuthStateChanged listener
    } catch (error) {
      console.error('Sign in error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Invalid email or password'
      }));
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      // Auth state will be updated by the onAuthStateChanged listener
    } catch (error) {
      console.error('Sign out error:', error);
      setAuthState(prev => ({
        ...prev,
        error: 'Error signing out'
      }));
    }
  }, []);

  const hasPermission = useCallback((permission: string, resource?: PermissionResource) => {
    if (!authState.claims || !authState.claims.permissions) {
      return false;
    }
    
    // Check for wildcard permissions
    if (authState.claims.permissions.includes('read:all') && permission === 'read') {
      return true;
    }
    
    if (authState.claims.permissions.includes('write:all') && 
        (permission === 'create' || permission === 'update' || permission === 'delete')) {
      return true;
    }
    
    // Check for specific resource permission
    if (resource) {
      const permissionString = `${permission}:${resource}` as Permission;
      return authState.claims.permissions.includes(permissionString);
    }
    
    // Check for any permission that starts with the requested permission
    return authState.claims.permissions.some(p => p.startsWith(`${permission}:`));
  }, [authState.claims]);

  const hasRole = useCallback((role: string) => {
    return authState.claims?.role === role;
  }, [authState.claims]);

  const isAdmin = useCallback(() => {
    return hasRole('admin');
  }, [hasRole]);

  const isTenantAdmin = useCallback((tenantId?: string) => {
    if (!authState.claims) {
      return false;
    }
    
    if (hasRole('admin')) {
      return true;
    }
    
    if (hasRole('tenantAdmin')) {
      if (!tenantId) {
        return true;
      }
      return authState.claims.tenantId === tenantId;
    }
    
    return false;
  }, [authState.claims, hasRole]);

  const hasTenantAccess = useCallback((tenantId: string) => {
    if (!authState.claims) {
      return false;
    }
    
    if (hasRole('admin')) {
      return true;
    }
    
    return authState.claims.tenantId === tenantId;
  }, [authState.claims, hasRole]);

  return {
    ...authState,
    signIn,
    signOut,
    hasPermission,
    hasRole,
    isAdmin,
    isTenantAdmin,
    hasTenantAccess
  };
}; 