import { initializeTestEnvironment, RulesTestEnvironment, RulesTestContext } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, collection, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

describe('Firebase Security Rules', () => {
  let testEnv: RulesTestEnvironment;
  let tenantAContext: RulesTestContext;
  let tenantBContext: RulesTestContext;
  let unauthContext: RulesTestContext;

  const TENANT_A_ID = 'tenant-a';
  const TENANT_B_ID = 'tenant-b';
  const USER_A = {
    uid: 'user-a',
    email: 'user.a@example.com',
    tenantId: TENANT_A_ID,
    role: 'tenant_admin'
  };
  const USER_B = {
    uid: 'user-b',
    email: 'user.b@example.com',
    tenantId: TENANT_B_ID,
    role: 'tenant_user'
  };

  beforeAll(async () => {
    // Initialize the test environment
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-leadlink-test',
      firestore: {
        rules: `
          rules_version = '2';
          service cloud.firestore {
            match /databases/{database}/documents {
              // Helper functions
              function isAuthenticated() {
                return request.auth != null;
              }
              
              function belongsToTenant(tenantId) {
                return isAuthenticated() && 
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.tenantId == tenantId;
              }
              
              function hasRole(role) {
                return isAuthenticated() && 
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
              }
              
              // User collection rules
              match /users/{userId} {
                allow read: if isAuthenticated() && (
                  request.auth.uid == userId || 
                  hasRole('system_admin') ||
                  (belongsToTenant(resource.data.tenantId) && hasRole('tenant_admin'))
                );
                allow write: if hasRole('system_admin') ||
                           (belongsToTenant(resource.data.tenantId) && hasRole('tenant_admin'));
              }
              
              // Tenant collection rules
              match /tenants/{tenantId} {
                allow read: if belongsToTenant(tenantId);
                allow write: if hasRole('system_admin');
                
                // Nested collections within tenants
                match /leads/{leadId} {
                  allow read, write: if belongsToTenant(tenantId);
                }
                
                match /customers/{customerId} {
                  allow read, write: if belongsToTenant(tenantId);
                }
                
                match /settings/{settingId} {
                  allow read: if belongsToTenant(tenantId);
                  allow write: if belongsToTenant(tenantId) && hasRole('tenant_admin');
                }
              }
              
              // Company collection rules
              match /companies/{companyId} {
                allow read: if hasRole('system_admin');
                allow write: if hasRole('system_admin');
              }
            }
          }
        `
      }
    });

    // Create authenticated contexts for different users
    tenantAContext = testEnv.authenticatedContext(USER_A.uid);
    tenantBContext = testEnv.authenticatedContext(USER_B.uid);
    unauthContext = testEnv.unauthenticatedContext();

    // Set up test data
    const adminContext = testEnv.authenticatedContext('admin', { role: 'system_admin' });
    
    // Create user documents
    await adminContext.firestore()
      .doc(`users/${USER_A.uid}`)
      .set(USER_A);
      
    await adminContext.firestore()
      .doc(`users/${USER_B.uid}`)
      .set(USER_B);
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  describe('User Collection Rules', () => {
    it('allows users to read their own profile', async () => {
      const userDoc = doc(tenantAContext.firestore(), `users/${USER_A.uid}`);
      await expect(getDoc(userDoc)).resolves.toBeDefined();
    });

    it('prevents users from reading other tenant profiles', async () => {
      const otherUserDoc = doc(tenantBContext.firestore(), `users/${USER_A.uid}`);
      await expect(getDoc(otherUserDoc)).rejects.toThrow();
    });

    it('prevents unauthenticated access to user profiles', async () => {
      const userDoc = doc(unauthContext.firestore(), `users/${USER_A.uid}`);
      await expect(getDoc(userDoc)).rejects.toThrow();
    });
  });

  describe('Tenant Collection Rules', () => {
    beforeEach(async () => {
      // Set up test data for each tenant
      const adminContext = testEnv.authenticatedContext('admin', { role: 'system_admin' });
      
      // Create test leads
      await adminContext.firestore()
        .doc(`tenants/${TENANT_A_ID}/leads/lead1`)
        .set({ title: 'Test Lead A', createdBy: USER_A.uid });
        
      await adminContext.firestore()
        .doc(`tenants/${TENANT_B_ID}/leads/lead1`)
        .set({ title: 'Test Lead B', createdBy: USER_B.uid });
    });

    it('allows users to read their tenant data', async () => {
      const leadsRef = collection(tenantAContext.firestore(), `tenants/${TENANT_A_ID}/leads`);
      const snapshot = await getDocs(leadsRef);
      expect(snapshot.empty).toBe(false);
    });

    it('prevents cross-tenant data access', async () => {
      const otherTenantLeads = collection(tenantAContext.firestore(), `tenants/${TENANT_B_ID}/leads`);
      await expect(getDocs(otherTenantLeads)).rejects.toThrow();
    });

    it('allows tenant users to create leads in their tenant', async () => {
      const newLeadRef = doc(tenantAContext.firestore(), `tenants/${TENANT_A_ID}/leads/newLead`);
      await expect(setDoc(newLeadRef, {
        title: 'New Test Lead',
        createdBy: USER_A.uid
      })).resolves.toBeUndefined();
    });

    it('prevents creating leads in other tenants', async () => {
      const otherTenantLeadRef = doc(tenantAContext.firestore(), `tenants/${TENANT_B_ID}/leads/newLead`);
      await expect(setDoc(otherTenantLeadRef, {
        title: 'New Test Lead',
        createdBy: USER_A.uid
      })).rejects.toThrow();
    });
  });

  describe('Settings Collection Rules', () => {
    beforeEach(async () => {
      const adminContext = testEnv.authenticatedContext('admin', { role: 'system_admin' });
      
      // Create test settings
      await adminContext.firestore()
        .doc(`tenants/${TENANT_A_ID}/settings/general`)
        .set({ theme: 'light', language: 'en' });
    });

    it('allows tenant admin to update settings', async () => {
      const settingsRef = doc(tenantAContext.firestore(), `tenants/${TENANT_A_ID}/settings/general`);
      await expect(setDoc(settingsRef, {
        theme: 'dark',
        language: 'en'
      })).resolves.toBeUndefined();
    });

    it('prevents regular users from updating settings', async () => {
      const settingsRef = doc(tenantBContext.firestore(), `tenants/${TENANT_B_ID}/settings/general`);
      await expect(setDoc(settingsRef, {
        theme: 'dark',
        language: 'en'
      })).rejects.toThrow();
    });
  });

  describe('Company Collection Rules', () => {
    it('prevents tenant users from accessing company data', async () => {
      const companiesRef = collection(tenantAContext.firestore(), 'companies');
      await expect(getDocs(companiesRef)).rejects.toThrow();
    });

    it('prevents unauthenticated access to company data', async () => {
      const companiesRef = collection(unauthContext.firestore(), 'companies');
      await expect(getDocs(companiesRef)).rejects.toThrow();
    });
  });

  describe('Data Deletion Rules', () => {
    it('allows users to delete their own tenant data', async () => {
      const leadRef = doc(tenantAContext.firestore(), `tenants/${TENANT_A_ID}/leads/lead1`);
      await expect(deleteDoc(leadRef)).resolves.toBeUndefined();
    });

    it('prevents deleting data from other tenants', async () => {
      const otherLeadRef = doc(tenantAContext.firestore(), `tenants/${TENANT_B_ID}/leads/lead1`);
      await expect(deleteDoc(otherLeadRef)).rejects.toThrow();
    });
  });

  describe('Query Rules', () => {
    it('allows querying data within tenant scope', async () => {
      const leadsRef = collection(tenantAContext.firestore(), `tenants/${TENANT_A_ID}/leads`);
      const q = query(leadsRef, where('createdBy', '==', USER_A.uid));
      await expect(getDocs(q)).resolves.toBeDefined();
    });

    it('prevents querying data across tenants', async () => {
      const leadsRef = collection(tenantAContext.firestore(), `tenants/${TENANT_B_ID}/leads`);
      const q = query(leadsRef, where('createdBy', '==', USER_B.uid));
      await expect(getDocs(q)).rejects.toThrow();
    });
  });
}); 