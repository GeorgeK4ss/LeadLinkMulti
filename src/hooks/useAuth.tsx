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
  sendEmailVerification,
  Auth
} from 'firebase/auth';
import { doc, getDoc, setDoc, Firestore } from 'firebase/firestore';
import { auth as firebaseAuth, db as firebaseDb, initializeFirebase, getAuth, getDb } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export interface Tenant {
  id: string;
  name: string;
  plan: string;
  role: string;
}

interface UserData {
  tenants: string[];
  // Add other user data fields as needed
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

// Use a default mock Auth context to avoid blocking UI render
const AuthContext = createContext<AuthContextType>({
  user: null,
  tenant: null,
  tenants: [],
  loading: false, // Change default to false to avoid loading states
  login: async () => {},
  register: async () => { return null as unknown as User },
  logout: async () => {},
  resetPassword: async () => {},
  updateUserProfile: async () => {},
  updateUserEmail: async () => {},
  updateUserPassword: async () => {},
  sendVerificationEmail: async () => {},
  setCurrentTenant: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Start with loading false to not block UI
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false); 
  const [auth, setAuth] = useState<Auth | null>(null);
  const [db, setDb] = useState<Firestore | null>(null);
  const router = useRouter();

  // Initialize Firebase in an idle callback
  useEffect(() => {
    let mounted = true;
    
    // Use requestIdleCallback to avoid blocking UI thread
    const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 500));
    idleCallback(() => {
      async function initialize() {
        try {
          await initializeFirebase();
          
          if (!mounted) return;
          
          const authInstance = await getAuth();
          const dbInstance = await getDb();
          
          if (mounted) {
            setAuth(authInstance);
            setDb(dbInstance);
          }
        } catch (error) {
          console.error("Failed to initialize Firebase:", error);
        }
      }
      
      initialize();
    });
    
    return () => {
      mounted = false;
    };
  }, []);

  // Then, listen for auth state changes only after Firebase is initialized
  useEffect(() => {
    if (!auth || !db) return;
    
    // Flag to prevent operations after component unmount
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;
    
    // Use queued microtask to avoid blocking main thread
    queueMicrotask(() => {
      unsubscribe = onAuthStateChanged(auth, async (authUser) => {
        if (!isMounted) return;
  
        if (authUser) {
          try {
            // First check for cached user data
            const cachedUserData = localStorage.getItem(`user_data_${authUser.uid}`);
            if (cachedUserData) {
              try {
                const userData = JSON.parse(cachedUserData) as UserData;
                // Use cached data immediately
                if (isMounted) {
                  setUser(authUser);
                  
                  // Also try to load cached tenants
                  const cachedTenantsStr = localStorage.getItem(`user_tenants_${authUser.uid}`);
                  if (cachedTenantsStr) {
                    try {
                      const cachedTenants = JSON.parse(cachedTenantsStr) as Tenant[];
                      setTenants(cachedTenants);
                      
                      // Set current tenant if not already set
                      if (!tenant && cachedTenants.length > 0) {
                        setTenant(cachedTenants[0]);
                      }
                    } catch (e) {
                      console.warn("Failed to parse cached tenants:", e);
                    }
                  }
                }
              } catch (e) {
                console.warn("Failed to parse cached user data:", e);
              }
            }
            
            // Fetch user data in the background with low priority
            const fetchData = async () => {
              try {
                // Fetch user data
                const userRef = doc(db, 'users', authUser.uid);
                const userSnap = await getDoc(userRef);
                
                if (isMounted && userSnap.exists()) {
                  const userData = userSnap.data() as UserData;
                  
                  // Cache the user data
                  try {
                    localStorage.setItem(`user_data_${authUser.uid}`, JSON.stringify(userData));
                  } catch (e) {
                    console.warn("Failed to cache user data:", e);
                  }
                  
                  // Update the user state with the auth user
                  setUser(authUser);
                  
                  // Fetch tenants in parallel with low priority
                  if (userData.tenants && userData.tenants.length > 0) {
                    // Use the optimized tenant fetching from before
                    const fetchTenants = async () => {
                      try {
                        // First try to load from cache to improve initial response time
                        let cachedTenantsStr = localStorage.getItem(`user_tenants_${authUser.uid}`);
                        let cachedTenants: Tenant[] = [];
                        
                        if (cachedTenantsStr) {
                          try {
                            cachedTenants = JSON.parse(cachedTenantsStr);
                            // Use cached tenants immediately to unblock UI
                            if (isMounted) {
                              setTenants(cachedTenants);
                              
                              // Set current tenant if not already set
                              if (!tenant && cachedTenants.length > 0) {
                                setTenant(cachedTenants[0]);
                              }
                            }
                          } catch (e) {
                            console.warn("Failed to parse cached tenants:", e);
                          }
                        }
                        
                        // Fetch fresh data if needed in the background
                        if (!cachedTenants.length || Date.now() - (Number(localStorage.getItem(`user_tenants_timestamp_${authUser.uid}`)) || 0) > 3600000) {
                          const tenantsData: Tenant[] = [];
                          
                          // Fetch in smaller batches with smaller delays
                          const batchSize = 10;
                          for (let i = 0; i < userData.tenants.length; i += batchSize) {
                            const batch = userData.tenants.slice(i, i + batchSize);
                            
                            // Use Promise.all for batch
                            const batchData = await Promise.all(
                              batch.map(async (tenantId: string) => {
                                const tenantSnap = await getDoc(doc(db, 'tenants', tenantId));
                                if (tenantSnap.exists()) {
                                  return {
                                    id: tenantSnap.id,
                                    ...tenantSnap.data()
                                  } as Tenant;
                                }
                                return null;
                              })
                            );
                            
                            // Add valid tenants to the list
                            tenantsData.push(...batchData.filter(Boolean) as Tenant[]);
                            
                            // Allow UI to update between batches with minimal delay
                            if (i + batchSize < userData.tenants.length) {
                              await new Promise(resolve => requestAnimationFrame(resolve));
                            }
                          }
                          
                          if (isMounted) {
                            setTenants(tenantsData);
                            
                            // Cache the tenant data
                            try {
                              localStorage.setItem(`user_tenants_${authUser.uid}`, JSON.stringify(tenantsData));
                              localStorage.setItem(`user_tenants_timestamp_${authUser.uid}`, Date.now().toString());
                            } catch (e) {
                              console.warn("Failed to cache tenants:", e);
                            }
                            
                            // Set current tenant if not already set
                            if (!tenant && tenantsData.length > 0) {
                              setTenant(tenantsData[0]);
                            }
                          }
                        }
                      } catch (error) {
                        console.error("Error fetching tenants:", error);
                      }
                    };
                    
                    // Use requestIdleCallback to avoid blocking the UI
                    if (window.requestIdleCallback) {
                      window.requestIdleCallback(() => {
                        // Add null check to avoid TypeScript errors
                        if (authUser && db && isMounted) {
                          fetchTenants();
                        }
                      });
                    } else {
                      setTimeout(() => {
                        // Add null check to avoid TypeScript errors
                        if (authUser && db && isMounted) {
                          fetchTenants();
                        }
                      }, 500);
                    }
                  }
                }
              } catch (error) {
                console.error("Error fetching user data:", error);
              }
            };
            
            // Call fetchData in an idle callback to avoid blocking UI
            if (window.requestIdleCallback) {
              window.requestIdleCallback(() => {
                if (isMounted) fetchData();
              });
            } else {
              setTimeout(() => {
                if (isMounted) fetchData();
              }, 200);
            }
          } catch (error) {
            console.error("Error in auth state change:", error);
          }
        } else {
          // User is signed out
          if (isMounted) {
            setUser(null);
            setTenant(null);
            setTenants([]);
          }
        }
      });
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [auth, db, tenant]);

  // Function to set the current tenant
  const setCurrentTenant = (selectedTenant: Tenant) => {
    setTenant(selectedTenant);
    localStorage.setItem('currentTenant', selectedTenant.id);
  };

  // Sign in with email and password
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      // Add null check for auth and get a fresh instance if needed
      let authInstance = auth;
      if (!authInstance) {
        authInstance = await getAuth();
        if (!authInstance) throw new Error("Auth not initialized");
        setAuth(authInstance);
      }
      
      const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
      
      // Log successful login with timestamp
      console.log(`Auth: User login successful`, {
        userId: userCredential.user.uid,
        email: userCredential.user.email,
        timestamp: new Date().toISOString(),
        displayName: userCredential.user.displayName || 'N/A'
      });
      
      // Load and log role information 
      try {
        // Import dynamically to avoid circular dependency
        const { RBACService } = await import('@/lib/services/rbac');
        const rbacService = RBACService.getInstance();
        const userRole = await rbacService.getUserRole(userCredential.user.uid);
        if (userRole) {
          console.log(`Auth: User logged in with role`, {
            roleId: userRole.roleId,
            companyId: userRole.companyId || 'N/A',
            tenantId: userRole.tenantId || 'N/A'
          });
        }
      } catch (roleError) {
        console.error('Error fetching role during login:', roleError);
      }
      
      router.push('/dashboard');
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Create a new user
  const register = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      // Add null check for auth/db and get fresh instances if needed
      let authInstance = auth;
      let dbInstance = db;
      
      if (!authInstance) {
        authInstance = await getAuth();
        if (!authInstance) throw new Error("Auth not initialized");
        setAuth(authInstance);
      }
      
      if (!dbInstance) {
        dbInstance = await getDb();
        if (!dbInstance) throw new Error("Database not initialized");
        setDb(dbInstance);
      }
      
      const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
      const user = userCredential.user;
      
      // Update profile
      await updateProfile(user, {
        displayName: name
      });
      
      // Create user document
      await setDoc(doc(dbInstance, 'users', user.uid), {
        email,
        displayName: name,
        createdAt: new Date(),
        tenants: []
      });
      
      return user;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const logout = async () => {
    try {
      // Add null check for auth and get a fresh instance if needed
      let authInstance = auth;
      if (!authInstance) {
        authInstance = await getAuth();
        if (!authInstance) throw new Error("Auth not initialized");
        setAuth(authInstance);
      }
      
      setLoading(true);
      await signOut(authInstance);
      router.push('/auth/login');
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      // Add null check for auth and get a fresh instance if needed
      let authInstance = auth;
      if (!authInstance) {
        authInstance = await getAuth();
        if (!authInstance) throw new Error("Auth not initialized");
        setAuth(authInstance);
      }
      
      setLoading(true);
      await sendPasswordResetEmail(authInstance, email);
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateUserProfile = async (displayName?: string, photoURL?: string) => {
    try {
      if (!user || !db) throw new Error('No user is logged in or database is not initialized');
      
      setLoading(true);
      
      const updateData: {
        displayName?: string;
        photoURL?: string;
      } = {};
      
      if (displayName) updateData.displayName = displayName;
      if (photoURL) updateData.photoURL = photoURL;
      
      await updateProfile(user, updateData);
      
      // Update user document in Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, updateData, { merge: true });
      
      // Force refresh the user
      setUser({ ...user });
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Update user email
  const updateUserEmail = async (email: string, password: string) => {
    try {
      if (!user) throw new Error("No user logged in");
      
      // Add null check for auth and get a fresh instance if needed
      let authInstance = auth;
      if (!authInstance) {
        authInstance = await getAuth();
        if (!authInstance) throw new Error("Auth not initialized");
        setAuth(authInstance);
      }
      
      // Re-authenticate
      if (!user.email) throw new Error("Current user has no email address");
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
      // Update email
      await updateEmail(user, email);
    } catch (error) {
      console.error("Email update error:", error);
      throw error;
    }
  };

  // Update user password
  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    try {
      if (!user || !auth) throw new Error('Firebase authentication is not initialized or no user is logged in');
      if (!user.email) throw new Error('Current user has no email');
      
      setLoading(true);
      
      // Re-authenticate the user first
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Send verification email
  const sendVerificationEmail = async () => {
    try {
      if (!user) throw new Error('No user is logged in');
      
      setLoading(true);
      await sendEmailVerification(user);
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const value = {
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
  };

  // Don't block rendering while waiting for Firebase initialization
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default useAuth; 