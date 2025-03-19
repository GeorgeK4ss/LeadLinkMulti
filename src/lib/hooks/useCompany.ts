import { useState, useEffect, useContext, createContext } from 'react';
import { useAuth } from './useAuth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface Company {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  website?: string;
  logo?: string;
  industry?: string;
  size?: string;
  createdAt: Date;
  updatedAt: Date;
  activeSubscriptionId?: string;
  tenantId?: string;
}

interface CompanyContextType {
  company: Company | null;
  isLoading: boolean;
  error: Error | null;
  refreshCompany: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType>({
  company: null,
  isLoading: true,
  error: null,
  refreshCompany: async () => {}
});

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (!user) {
      setCompany(null);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    // First, get the user's company ID
    const getUserCompany = async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          throw new Error('User document not found');
        }
        
        const userData = userDoc.data();
        const companyId = userData.companyId;
        
        if (!companyId) {
          setCompany(null);
          setIsLoading(false);
          return;
        }
        
        // Set up a real-time listener for the company
        const companyDocRef = doc(db, 'companies', companyId);
        const unsubscribe = onSnapshot(
          companyDocRef,
          (docSnapshot) => {
            if (docSnapshot.exists()) {
              const companyData = docSnapshot.data();
              setCompany({
                id: docSnapshot.id,
                ...companyData,
                createdAt: companyData.createdAt?.toDate(),
                updatedAt: companyData.updatedAt?.toDate()
              } as Company);
            } else {
              setCompany(null);
            }
            setIsLoading(false);
          },
          (err) => {
            console.error('Error fetching company:', err);
            setError(err as Error);
            setIsLoading(false);
          }
        );
        
        // Clean up the listener
        return unsubscribe;
      } catch (err) {
        console.error('Error setting up company listener:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    };
    
    const unsubscribePromise = getUserCompany();
    
    return () => {
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, [user]);
  
  const refreshCompany = async (): Promise<void> => {
    if (!company) return;
    
    try {
      setIsLoading(true);
      const companyDocRef = doc(db, 'companies', company.id);
      const companyDoc = await getDoc(companyDocRef);
      
      if (companyDoc.exists()) {
        const companyData = companyDoc.data();
        setCompany({
          id: companyDoc.id,
          ...companyData,
          createdAt: companyData.createdAt?.toDate(),
          updatedAt: companyData.updatedAt?.toDate()
        } as Company);
      }
    } catch (err) {
      console.error('Error refreshing company data:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <CompanyContext.Provider value={{ company, isLoading, error, refreshCompany }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = (): CompanyContextType => {
  return useContext(CompanyContext);
};

export default useCompany;
