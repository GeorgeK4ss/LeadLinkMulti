import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  DocumentSnapshot,
  Query,
  QuerySnapshot,
  orderBy,
  limit,
  setDoc,
  updateDoc,
  runTransaction,
  arrayUnion,
  arrayRemove,
  Timestamp,
  DocumentReference,
  CollectionReference,
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import { FirestoreDocument, FirestoreService } from './firebase/FirestoreService';
import { UserService } from './UserService';

/**
 * Enum representing the different plan types available for tenants
 */
export enum PlanType {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise'
}

/**
 * Enum representing the status of a tenant account
 */
export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
  DEACTIVATED = 'deactivated'
}

/**
 * Interface representing a tenant organization in the system
 */
export interface Tenant extends FirestoreDocument {
  name: string;
  planType: PlanType;
  status: TenantStatus;
  billingEmail: string;
  trialEndsAt?: Date;
  subscriptionId?: string;
  maxUsers: number;
  maxStorage: number; // in GB
  features: {
    multipleTeams: boolean;
    advancedReporting: boolean;
    apiAccess: boolean;
    customIntegrations: boolean;
    whiteLabeling: boolean;
  };
  settings: {
    logoUrl?: string;
    primaryColor?: string;
    companyWebsite?: string;
    allowUserInvites: boolean;
    defaultTimeZone: string;
  };
  domain?: string;
  adminIds: string[];
}

/**
 * Interface for the current tenant context
 */
export interface TenantContext {
  tenant: Tenant | null;
  isAdmin: boolean;
  isTenantAdmin: boolean;
  userRoles: string[];
}

/**
 * Service class for managing tenant operations
 */
export class TenantService extends FirestoreService<Tenant> {
  private userService: UserService;
  private currentTenantId: string | null = null;

  constructor() {
    super('tenants');
    this.userService = new UserService();
  }

  /**
   * Get tenant by domain
   * @param domain Domain name to search for
   * @returns Promise resolving to the tenant if found
   */
  async getTenantByDomain(domain: string): Promise<Tenant | null> {
    try {
      const q = query(collection(this.db, this.collectionName), where('domain', '==', domain));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      return this.convertToTypedObject(querySnapshot.docs[0]);
    } catch (error) {
      console.error('Error getting tenant by domain:', error);
      return null;
    }
  }

  /**
   * Get tenant by user ID (retrieves tenants where the user is an admin)
   * @param userId User ID to search for
   * @returns Promise resolving to array of tenants
   */
  async getTenantsByAdmin(userId: string): Promise<Tenant[]> {
    try {
      const q = query(
        collection(this.db, this.collectionName),
        where('adminIds', 'array-contains', userId)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map(doc => this.convertToTypedObject(doc))
        .filter((doc): doc is Tenant => doc !== null);
    } catch (error) {
      console.error('Error getting tenants by admin:', error);
      return [];
    }
  }

  /**
   * Create a new tenant
   * @param data The tenant data
   * @returns Promise resolving to the created tenant
   */
  async createTenant(
    name: string,
    billingEmail: string,
    adminId: string,
    planType: PlanType = PlanType.FREE,
    domain?: string
  ): Promise<Tenant | null> {
    try {
      // Default feature sets based on plan type
      const featureMap = {
        [PlanType.FREE]: {
          multipleTeams: false,
          advancedReporting: false,
          apiAccess: false,
          customIntegrations: false,
          whiteLabeling: false,
        },
        [PlanType.STARTER]: {
          multipleTeams: false,
          advancedReporting: false,
          apiAccess: true,
          customIntegrations: false,
          whiteLabeling: false,
        },
        [PlanType.PROFESSIONAL]: {
          multipleTeams: true,
          advancedReporting: true,
          apiAccess: true,
          customIntegrations: false,
          whiteLabeling: false,
        },
        [PlanType.ENTERPRISE]: {
          multipleTeams: true,
          advancedReporting: true,
          apiAccess: true,
          customIntegrations: true,
          whiteLabeling: true,
        },
      };

      // Plan limits
      const planLimits = {
        [PlanType.FREE]: { maxUsers: 3, maxStorage: 1 },
        [PlanType.STARTER]: { maxUsers: 10, maxStorage: 5 },
        [PlanType.PROFESSIONAL]: { maxUsers: 50, maxStorage: 20 },
        [PlanType.ENTERPRISE]: { maxUsers: 200, maxStorage: 100 },
      };

      // Calculate trial end date (30 days from now)
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 30);

      const tenantData: Omit<Tenant, 'id'> = {
        name,
        planType,
        status: TenantStatus.ACTIVE,
        billingEmail,
        trialEndsAt: trialEnd,
        maxUsers: planLimits[planType].maxUsers,
        maxStorage: planLimits[planType].maxStorage,
        features: featureMap[planType],
        settings: {
          allowUserInvites: true,
          defaultTimeZone: 'UTC'
        },
        domain,
        adminIds: [adminId],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: adminId,
        updatedBy: adminId
      };

      const tenant = await this.create(tenantData);
      
      // Assign the admin user to the new tenant
      if (tenant && tenant.id) {
        await this.assignUserToTenant(adminId, tenant.id, ['tenantAdmin']);
      }
      
      return tenant;
    } catch (error) {
      console.error('Error creating tenant:', error);
      return null;
    }
  }

  /**
   * Add an admin to the tenant
   * @param tenantId The ID of the tenant
   * @param userId The ID of the user to add as admin
   * @returns Promise resolving to success boolean
   */
  async addAdmin(tenantId: string, userId: string): Promise<boolean> {
    try {
      const tenant = await this.getById(tenantId);
      if (!tenant) {
        return false;
      }

      // Check if the user is already an admin
      if (tenant.adminIds.includes(userId)) {
        return true;
      }

      // Add the user as an admin
      const updatedAdmins = [...tenant.adminIds, userId];
      await this.update(tenantId, { adminIds: updatedAdmins });
      
      // Ensure the user is assigned to this tenant with tenantAdmin role
      await this.assignUserToTenant(userId, tenantId, ['tenantAdmin']);
      
      return true;
    } catch (error) {
      console.error('Error adding admin to tenant:', error);
      return false;
    }
  }

  /**
   * Remove an admin from the tenant
   * @param tenantId The ID of the tenant
   * @param userId The ID of the user to remove as admin
   * @returns Promise resolving to success boolean
   */
  async removeAdmin(tenantId: string, userId: string): Promise<boolean> {
    try {
      const tenant = await this.getById(tenantId);
      if (!tenant) {
        return false;
      }

      // Check if the user is an admin
      if (!tenant.adminIds.includes(userId)) {
        return true;
      }

      // Don't remove the last admin
      if (tenant.adminIds.length <= 1) {
        throw new Error('Cannot remove the last admin from a tenant');
      }

      // Remove the user from the admins list
      const updatedAdmins = tenant.adminIds.filter(id => id !== userId);
      await this.update(tenantId, { adminIds: updatedAdmins });
      
      // Remove the tenantAdmin role from the user for this tenant
      await this.removeRoleFromUser(userId, tenantId, 'tenantAdmin');
      
      return true;
    } catch (error) {
      console.error('Error removing admin from tenant:', error);
      return false;
    }
  }

  /**
   * Update tenant's plan
   * @param tenantId The ID of the tenant
   * @param planType New plan type
   * @param subscriptionId Optional subscription ID
   * @returns Promise resolving to success boolean
   */
  async updateTenantPlan(
    tenantId: string,
    planType: PlanType,
    subscriptionId?: string
  ): Promise<boolean> {
    try {
      const tenant = await this.getById(tenantId);
      if (!tenant) {
        return false;
      }

      // Default feature sets based on plan type
      const featureMap = {
        [PlanType.FREE]: {
          multipleTeams: false,
          advancedReporting: false,
          apiAccess: false,
          customIntegrations: false,
          whiteLabeling: false,
        },
        [PlanType.STARTER]: {
          multipleTeams: false,
          advancedReporting: false,
          apiAccess: true,
          customIntegrations: false,
          whiteLabeling: false,
        },
        [PlanType.PROFESSIONAL]: {
          multipleTeams: true,
          advancedReporting: true,
          apiAccess: true,
          customIntegrations: false,
          whiteLabeling: false,
        },
        [PlanType.ENTERPRISE]: {
          multipleTeams: true,
          advancedReporting: true,
          apiAccess: true,
          customIntegrations: true,
          whiteLabeling: true,
        },
      };

      // Plan limits
      const planLimits = {
        [PlanType.FREE]: { maxUsers: 3, maxStorage: 1 },
        [PlanType.STARTER]: { maxUsers: 10, maxStorage: 5 },
        [PlanType.PROFESSIONAL]: { maxUsers: 50, maxStorage: 20 },
        [PlanType.ENTERPRISE]: { maxUsers: 200, maxStorage: 100 },
      };

      const updateData: Partial<Tenant> = {
        planType,
        features: featureMap[planType],
        maxUsers: planLimits[planType].maxUsers,
        maxStorage: planLimits[planType].maxStorage,
      };

      if (subscriptionId) {
        updateData.subscriptionId = subscriptionId;
      }

      await this.update(tenantId, updateData);
      return true;
    } catch (error) {
      console.error('Error updating tenant plan:', error);
      return false;
    }
  }

  /**
   * Update tenant's status
   * @param tenantId The ID of the tenant
   * @param status New status
   * @returns Promise resolving to success boolean
   */
  async updateTenantStatus(tenantId: string, status: TenantStatus): Promise<boolean> {
    try {
      await this.update(tenantId, { status });
      return true;
    } catch (error) {
      console.error('Error updating tenant status:', error);
      return false;
    }
  }

  /**
   * Update tenant's settings
   * @param tenantId The ID of the tenant
   * @param settings Settings to update
   * @returns Promise resolving to success boolean
   */
  async updateTenantSettings(
    tenantId: string,
    settings: Partial<Tenant['settings']>
  ): Promise<boolean> {
    try {
      const tenant = await this.getById(tenantId);
      if (!tenant) {
        return false;
      }

      // Merge the new settings with existing ones
      const updatedSettings = {
        ...tenant.settings,
        ...settings
      };

      await this.update(tenantId, { settings: updatedSettings });
      return true;
    } catch (error) {
      console.error('Error updating tenant settings:', error);
      return false;
    }
  }

  /**
   * Get a list of active tenants
   * @param resultLimit Maximum number of results to return
   * @returns Promise resolving to array of active tenants
   */
  async getActiveTenants(resultLimit: number = 50): Promise<Tenant[]> {
    try {
      const q = query(
        collection(this.db, this.collectionName),
        where('status', '==', TenantStatus.ACTIVE),
        orderBy('createdAt', 'desc'),
        limit(resultLimit)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map(doc => this.convertToTypedObject(doc))
        .filter((doc): doc is Tenant => doc !== null);
    } catch (error) {
      console.error('Error getting active tenants:', error);
      return [];
    }
  }

  /**
   * Get tenants with trials about to expire
   * @param daysUntilExpiration Days until trial expiration
   * @returns Promise resolving to array of tenants
   */
  async getExpiringTrialTenants(daysUntilExpiration: number = 7): Promise<Tenant[]> {
    try {
      // Calculate the date threshold
      const now = new Date();
      const thresholdDate = new Date();
      thresholdDate.setDate(now.getDate() + daysUntilExpiration);
      
      const q = query(
        collection(this.db, this.collectionName),
        where('status', '==', TenantStatus.ACTIVE),
        where('trialEndsAt', '<=', thresholdDate),
        where('trialEndsAt', '>', now)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map(doc => this.convertToTypedObject(doc))
        .filter((doc): doc is Tenant => doc !== null);
    } catch (error) {
      console.error('Error getting expiring trial tenants:', error);
      return [];
    }
  }

  // ====== Multi-Tenant Isolation Methods ======

  /**
   * Set the current tenant context for data operations
   * @param tenantId The tenant ID to use for subsequent operations
   */
  setCurrentTenant(tenantId: string | null): void {
    this.currentTenantId = tenantId;
  }

  /**
   * Get the current tenant ID being used for data operations
   * @returns The current tenant ID or null
   */
  getCurrentTenant(): string | null {
    return this.currentTenantId;
  }

  /**
   * Get a reference to a tenant-specific collection
   * @param collectionName Base collection name
   * @param tenantId Optional tenant ID (defaults to current tenant)
   * @returns DocumentReference to the tenant-specific collection
   */
  getTenantCollection(collectionName: string, tenantId?: string): CollectionReference {
    const effectiveTenantId = tenantId || this.currentTenantId;
    if (!effectiveTenantId) {
      throw new Error('No tenant context available for this operation');
    }
    
    return collection(this.db, `tenants/${effectiveTenantId}/${collectionName}`);
  }

  /**
   * Get a reference to a document within a tenant-specific collection
   * @param collectionName Base collection name
   * @param documentId Document ID
   * @param tenantId Optional tenant ID (defaults to current tenant)
   * @returns DocumentReference to the tenant-specific document
   */
  getTenantDocument(collectionName: string, documentId: string, tenantId?: string): DocumentReference {
    const effectiveTenantId = tenantId || this.currentTenantId;
    if (!effectiveTenantId) {
      throw new Error('No tenant context available for this operation');
    }
    
    return doc(this.db, `tenants/${effectiveTenantId}/${collectionName}/${documentId}`);
  }

  /**
   * Check if a user belongs to a specific tenant
   * @param userId User ID to check
   * @param tenantId Tenant ID to check
   * @returns Promise resolving to boolean
   */
  async isUserMemberOfTenant(userId: string, tenantId: string): Promise<boolean> {
    try {
      const userRolesDoc = await getDoc(doc(this.db, 'userRoles', userId));
      
      if (!userRolesDoc.exists()) {
        return false;
      }
      
      const userRoles = userRolesDoc.data();
      
      // Check if the user has roles in this tenant
      return userRoles && 
             userRoles.tenantRoles && 
             userRoles.tenantRoles[tenantId] !== undefined;
    } catch (error) {
      console.error('Error checking user tenant membership:', error);
      return false;
    }
  }

  /**
   * Check if a user is an admin of a specific tenant
   * @param userId User ID to check
   * @param tenantId Tenant ID to check
   * @returns Promise resolving to boolean
   */
  async isUserTenantAdmin(userId: string, tenantId: string): Promise<boolean> {
    try {
      const userRolesDoc = await getDoc(doc(this.db, 'userRoles', userId));
      
      if (!userRolesDoc.exists()) {
        return false;
      }
      
      const userRoles = userRolesDoc.data();
      
      // Check if the user has the tenantAdmin role in this tenant
      return userRoles && 
             userRoles.tenantRoles && 
             userRoles.tenantRoles[tenantId] && 
             userRoles.tenantRoles[tenantId].includes('tenantAdmin');
    } catch (error) {
      console.error('Error checking user tenant admin status:', error);
      return false;
    }
  }

  /**
   * Assign a user to a tenant with specific roles
   * @param userId User ID to assign
   * @param tenantId Tenant ID to assign to
   * @param roles Array of roles to assign
   * @returns Promise resolving to success boolean
   */
  async assignUserToTenant(userId: string, tenantId: string, roles: string[] = []): Promise<boolean> {
    try {
      const userRolesRef = doc(this.db, 'userRoles', userId);
      
      await runTransaction(this.db, async (transaction) => {
        const userRolesDoc = await transaction.get(userRolesRef);
        
        if (!userRolesDoc.exists()) {
          // Create a new user roles document
          transaction.set(userRolesRef, {
            userId,
            tenantRoles: {
              [tenantId]: roles
            },
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          });
        } else {
          // Update existing user roles document
          const userData = userRolesDoc.data();
          const currentTenantRoles = userData.tenantRoles || {};
          const updatedTenantRoles = {
            ...currentTenantRoles,
            [tenantId]: roles
          };
          
          transaction.update(userRolesRef, {
            tenantRoles: updatedTenantRoles,
            updatedAt: Timestamp.now()
          });
        }
        
        // Also update the user document to set their current tenant if not already set
        const userDoc = await transaction.get(doc(this.db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (!userData.currentTenantId) {
            transaction.update(doc(this.db, 'users', userId), {
              currentTenantId: tenantId,
              updatedAt: Timestamp.now()
            });
          }
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error assigning user to tenant:', error);
      return false;
    }
  }

  /**
   * Remove a user from a tenant
   * @param userId User ID to remove
   * @param tenantId Tenant ID to remove from
   * @returns Promise resolving to success boolean
   */
  async removeUserFromTenant(userId: string, tenantId: string): Promise<boolean> {
    try {
      const userRolesRef = doc(this.db, 'userRoles', userId);
      
      await runTransaction(this.db, async (transaction) => {
        const userRolesDoc = await transaction.get(userRolesRef);
        
        if (userRolesDoc.exists()) {
          const userData = userRolesDoc.data();
          const currentTenantRoles = userData.tenantRoles || {};
          
          // Create a new tenant roles object without the specified tenant
          const { [tenantId]: removedTenant, ...remainingTenants } = currentTenantRoles;
          
          transaction.update(userRolesRef, {
            tenantRoles: remainingTenants,
            updatedAt: Timestamp.now()
          });
          
          // Also update the user document if the removed tenant was their current tenant
          const userDoc = await transaction.get(doc(this.db, 'users', userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.currentTenantId === tenantId) {
              // Set the current tenant to the first available tenant or null
              const newCurrentTenant = Object.keys(remainingTenants)[0] || null;
              transaction.update(doc(this.db, 'users', userId), {
                currentTenantId: newCurrentTenant,
                updatedAt: Timestamp.now()
              });
            }
          }
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error removing user from tenant:', error);
      return false;
    }
  }

  /**
   * Add a role to a user within a specific tenant
   * @param userId User ID to update
   * @param tenantId Tenant ID context
   * @param role Role to add
   * @returns Promise resolving to success boolean
   */
  async addRoleToUser(userId: string, tenantId: string, role: string): Promise<boolean> {
    try {
      const userRolesRef = doc(this.db, 'userRoles', userId);
      
      await runTransaction(this.db, async (transaction) => {
        const userRolesDoc = await transaction.get(userRolesRef);
        
        if (!userRolesDoc.exists()) {
          // Create a new user roles document with this role
          transaction.set(userRolesRef, {
            userId,
            tenantRoles: {
              [tenantId]: [role]
            },
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          });
        } else {
          const userData = userRolesDoc.data();
          const currentTenantRoles = userData.tenantRoles || {};
          const currentRoles = currentTenantRoles[tenantId] || [];
          
          // Only add the role if it doesn't already exist
          if (!currentRoles.includes(role)) {
            const updatedRoles = [...currentRoles, role];
            transaction.update(userRolesRef, {
              [`tenantRoles.${tenantId}`]: updatedRoles,
              updatedAt: Timestamp.now()
            });
          }
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error adding role to user:', error);
      return false;
    }
  }

  /**
   * Remove a role from a user within a specific tenant
   * @param userId User ID to update
   * @param tenantId Tenant ID context
   * @param role Role to remove
   * @returns Promise resolving to success boolean
   */
  async removeRoleFromUser(userId: string, tenantId: string, role: string): Promise<boolean> {
    try {
      const userRolesRef = doc(this.db, 'userRoles', userId);
      
      await runTransaction(this.db, async (transaction) => {
        const userRolesDoc = await transaction.get(userRolesRef);
        
        if (userRolesDoc.exists()) {
          const userData = userRolesDoc.data();
          const currentTenantRoles = userData.tenantRoles || {};
          const currentRoles = currentTenantRoles[tenantId] || [];
          
          // Remove the specified role
          const updatedRoles = currentRoles.filter((r: string) => r !== role);
          
          transaction.update(userRolesRef, {
            [`tenantRoles.${tenantId}`]: updatedRoles,
            updatedAt: Timestamp.now()
          });
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error removing role from user:', error);
      return false;
    }
  }

  /**
   * Get all users belonging to a specific tenant
   * @param tenantId Tenant ID to query
   * @returns Promise resolving to array of user documents
   */
  async getTenantUsers(tenantId: string): Promise<any[]> {
    try {
      // Query userRoles to find all users with roles in this tenant
      const q = query(
        collection(this.db, 'userRoles'),
        where(`tenantRoles.${tenantId}`, '!=', null)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Get the user documents for each user role
      const userPromises = querySnapshot.docs.map(async (roleDoc) => {
        const userId = roleDoc.id;
        const userDoc = await getDoc(doc(this.db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          return {
            ...userData,
            id: userId,
            roles: roleDoc.data().tenantRoles[tenantId] || []
          };
        }
        return null;
      });
      
      const users = await Promise.all(userPromises);
      return users.filter(user => user !== null);
    } catch (error) {
      console.error('Error getting tenant users:', error);
      return [];
    }
  }

  /**
   * Get the tenant context for a specific user
   * @param userId User ID to get context for
   * @param tenantId Optional tenant ID (defaults to user's current tenant)
   * @returns Promise resolving to tenant context
   */
  async getTenantContext(userId: string, tenantId?: string): Promise<TenantContext | null> {
    try {
      // Get the user document to find their current tenant
      const userDoc = await getDoc(doc(this.db, 'users', userId));
      if (!userDoc.exists()) {
        return null;
      }
      
      const userData = userDoc.data();
      const effectiveTenantId = tenantId || userData.currentTenantId;
      
      if (!effectiveTenantId) {
        return null;
      }
      
      // Get the tenant data
      const tenantDoc = await getDoc(doc(this.db, 'tenants', effectiveTenantId));
      if (!tenantDoc.exists()) {
        return null;
      }
      
      const tenant = this.convertToTypedObject(tenantDoc);
      
      // Get the user's roles
      const userRolesDoc = await getDoc(doc(this.db, 'userRoles', userId));
      const userRoles = userRolesDoc.exists() 
        ? (userRolesDoc.data().tenantRoles?.[effectiveTenantId] || [])
        : [];
        
      // Check if the user is a system admin
      const isSystemAdmin = userRolesDoc.exists() && userRolesDoc.data().role === 'admin';
      
      // Check if the user is a tenant admin
      const isTenantAdmin = userRoles.includes('tenantAdmin');
      
      return {
        tenant,
        isAdmin: isSystemAdmin,
        isTenantAdmin,
        userRoles
      };
    } catch (error) {
      console.error('Error getting tenant context:', error);
      return null;
    }
  }

  /**
   * Create a test isolation function to verify tenant isolation
   * @param tenantId1 First tenant ID
   * @param tenantId2 Second tenant ID
   * @returns Promise resolving to test results
   */
  async testTenantIsolation(tenantId1: string, tenantId2: string): Promise<{success: boolean, message: string}> {
    try {
      // Create a test document in tenant 1
      const testData = {
        name: 'Isolation Test',
        value: Math.random().toString(),
        createdAt: new Date()
      };
      
      const tenant1TestCollection = this.getTenantCollection('isolationTests', tenantId1);
      const testDocRef = await addDoc(tenant1TestCollection, testData);
      
      // Try to query for the same data from tenant 2
      const tenant2TestCollection = this.getTenantCollection('isolationTests', tenantId2);
      const q = query(tenant2TestCollection, where('value', '==', testData.value));
      const querySnapshot = await getDocs(q);
      
      // Clean up the test data
      await deleteDoc(doc(this.db, `tenants/${tenantId1}/isolationTests/${testDocRef.id}`));
      
      // If isolation is working correctly, tenant 2 should not see tenant 1's data
      if (querySnapshot.empty) {
        return {
          success: true,
          message: 'Tenant isolation is functioning correctly'
        };
      } else {
        return {
          success: false,
          message: 'Tenant isolation failed: data from tenant 1 is accessible in tenant 2'
        };
      }
    } catch (error) {
      console.error('Error testing tenant isolation:', error);
      return {
        success: false,
        message: `Tenant isolation test error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Delete a document in the database (with tenant path support)
   * @param path Full path to the document
   * @returns Promise<void>
   */
  async deleteDoc(path: string): Promise<void> {
    try {
      const docRef = doc(this.db, path);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting document at path ${path}:`, error);
      throw error;
    }
  }
} 