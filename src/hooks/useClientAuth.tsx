"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  updateProfile,
  onAuthStateChanged,
  updateEmail, 
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth as firebaseAuth, db as firebaseDb } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export interface Tenant {
  id: string;
  name: string;
  plan: string;
  role: string;
}

interface UserData {
  tenants: string[];
  displayName?: string;
  email?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  tenants: Tenant[];
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName?: string, photoURL?: string) => Promise<void>;
  updateUserEmail: (email: string, password: string) => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  setCurrentTenant: (tenant: Tenant) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  tenant: null,
  tenants: [],
  loading: true,
  login: async () => {},
  register: async () => {
    throw new Error('Not implemented');
  },
  logout: async () => {},
  resetPassword: async () => {},
  updateUserProfile: async () => {},
  updateUserEmail: async () => {},
  updateUserPassword: async () => {},
  sendVerificationEmail: async () => {},
  setCurrentTenant: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      setUser(user);
      setLoading(false);
      
      if (user) {
        try {
          // Fetch user's tenants
          const userDoc = await getDoc(doc(firebaseDb, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserData;
            
            // Fetch tenant details
            const fetchedTenants: Tenant[] = [];
            for (const tenantId of userData.tenants || []) {
              const tenantDoc = await getDoc(doc(firebaseDb, 'tenants', tenantId));
              if (tenantDoc.exists()) {
                const tenantData = tenantDoc.data();
                
                // Get user role in this tenant
                const memberDoc = await getDoc(doc(firebaseDb, `tenants/${tenantId}/members`, user.uid));
                const role = memberDoc.exists() ? memberDoc.data().role : 'user';
                
                fetchedTenants.push({
                  id: tenantId,
                  name: tenantData.name,
                  plan: tenantData.plan,
                  role: role
                });
              }
            }
            
            setTenants(fetchedTenants);
            
            // Set the current tenant
            if (fetchedTenants.length > 0 && !tenant) {
              setTenant(fetchedTenants[0]);
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setTenants([]);
        setTenant(null);
      }
    });
    
    return () => unsubscribe();
  }, [tenant]);

  const setCurrentTenant = (selectedTenant: Tenant) => {
    setTenant(selectedTenant);
    localStorage.setItem('currentTenant', selectedTenant.id);
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      const user = userCredential.user;
      
      await updateProfile(user, {
        displayName: name,
      });
      
      await setDoc(doc(firebaseDb, 'users', user.uid), {
        email,
        displayName: name,
        createdAt: new Date(),
        tenants: [],
      });
      
      return user;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(firebaseAuth);
      router.push('/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(firebaseAuth, email);
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (displayName?: string, photoURL?: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const updates: { displayName?: string; photoURL?: string } = {};
      
      if (displayName) updates.displayName = displayName;
      if (photoURL) updates.photoURL = photoURL;
      
      await updateProfile(user, updates);
      
      // Update in Firestore as well
      const userDocRef = doc(firebaseDb, 'users', user.uid);
      await setDoc(userDocRef, updates, { merge: true });
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUserEmail = async (email: string, password: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Reauthenticate the user first
      const credential = EmailAuthProvider.credential(user.email || '', password);
      await reauthenticateWithCredential(user, credential);
      
      // Update email
      await updateEmail(user, email);
      
      // Update in Firestore
      const userDocRef = doc(firebaseDb, 'users', user.uid);
      await setDoc(userDocRef, { email }, { merge: true });
    } catch (error: any) {
      console.error('Update email error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    if (!user || !user.email) return;
    
    setLoading(true);
    try {
      // Reauthenticate first
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
    } catch (error: any) {
      console.error('Update password error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationEmail = async () => {
    if (!user) return;
    
    try {
      await sendEmailVerification(user);
    } catch (error: any) {
      console.error('Send verification email error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      tenant,
      tenants,
      loading,
      login,
      register,
      logout,
      resetPassword,
      updateUserProfile,
      updateUserEmail,
      updateUserPassword,
      sendVerificationEmail,
      setCurrentTenant,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 