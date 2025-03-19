import { db, auth } from '@/lib/firebase/config';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  updateProfile 
} from 'firebase/auth';
import type { User, UserRole, UserStatus } from '@/types/user';
import { CustomClaimsService } from '@/lib/services/CustomClaimsService';
import type { CustomClaimRoleType, CustomClaimUserRole } from '@/lib/types/auth';

export class UserService {
  private customClaimsService: CustomClaimsService;
  
  constructor() {
    this.customClaimsService = new CustomClaimsService();
  }
  
  /**
   * Get the collection reference for users
   */
  private getUsersRef() {
    return collection(db, 'users');
  }

  /**
   * Create a new user
   */
  async createUser(userData: Omit<User, 'id' | 'uid' | 'createdAt' | 'lastUpdated'> & { password: string }): Promise<string> {
    const { email, password, ...rest } = userData;
    
    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update display name if provided
      if (rest.displayName) {
        await updateProfile(firebaseUser, {
          displayName: rest.displayName
        });
      }
      
      // Create user document in Firestore
      const userWithDates = {
        ...rest,
        email,
        uid: firebaseUser.uid,
        status: rest.status || 'active',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };
      
      const docRef = await addDoc(this.getUsersRef(), userWithDates);
      
      // Set initial role using custom claims if role is provided
      if (rest.role) {
        await this.setUserRole(firebaseUser.uid, rest.role as unknown as CustomClaimRoleType, rest.tenantId, rest.companyId);
      }
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Get a user by ID
   */
  async getUser(id: string): Promise<User | null> {
    const docRef = doc(this.getUsersRef(), id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return { 
      id: docSnap.id, 
      ...docSnap.data() 
    } as User;
  }

  /**
   * Get a user by Firebase UID
   */
  async getUserByUid(uid: string): Promise<User | null> {
    const q = query(this.getUsersRef(), where('uid', '==', uid));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as User;
  }

  /**
   * Get a user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const q = query(this.getUsersRef(), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as User;
  }

  /**
   * Get all users
   */
  async getUsers(): Promise<User[]> {
    const querySnapshot = await getDocs(
      query(this.getUsersRef(), orderBy('createdAt', 'desc'))
    );
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];
  }

  /**
   * Get users by tenant ID
   */
  async getUsersByTenant(tenantId: string): Promise<User[]> {
    const q = query(
      this.getUsersRef(),
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];
  }

  /**
   * Get users by company ID
   */
  async getUsersByCompany(companyId: string): Promise<User[]> {
    const q = query(
      this.getUsersRef(),
      where('companyId', '==', companyId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: UserRole): Promise<User[]> {
    const q = query(
      this.getUsersRef(),
      where('role', '==', role),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];
  }

  /**
   * Get users by status
   */
  async getUsersByStatus(status: UserStatus): Promise<User[]> {
    const q = query(
      this.getUsersRef(),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];
  }

  /**
   * Update a user
   */
  async updateUser(id: string, data: Partial<User>): Promise<void> {
    const userRef = doc(this.getUsersRef(), id);
    
    await updateDoc(userRef, {
      ...data,
      lastUpdated: new Date().toISOString()
    });
  }

  /**
   * Update user status
   */
  async updateUserStatus(id: string, status: UserStatus): Promise<void> {
    await this.updateUser(id, { status });
  }

  /**
   * Update user role with custom claims
   */
  async setUserRole(
    uid: string, 
    role: CustomClaimRoleType, 
    tenantId?: string, 
    companyId?: string
  ): Promise<void> {
    await this.customClaimsService.setUserRole(uid, role, tenantId, companyId);
    
    // Also update the user document for consistency
    const user = await this.getUserByUid(uid);
    if (user) {
      await this.updateUser(user.id, { role: role as unknown as UserRole });
    }
  }

  /**
   * Get user's role with custom claims
   */
  async getUserRole(uid: string): Promise<CustomClaimUserRole | null> {
    return await this.customClaimsService.getUserRole(uid);
  }
  
  /**
   * Check if user has specific permission
   */
  async hasPermission(uid: string, permission: string, resource: string, tenantId?: string): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user || user.uid !== uid) {
        return false;
      }
      return await this.customClaimsService.hasPermission(user, permission);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }
  
  /**
   * Check if user is admin
   */
  async isAdmin(uid: string): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user || user.uid !== uid) {
        return false;
      }
      return await this.customClaimsService.isAdmin(user);
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }
  
  /**
   * Check if user is tenant admin
   */
  async isTenantAdmin(uid: string, tenantId: string): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user || user.uid !== uid) {
        return false;
      }
      return await this.customClaimsService.isTenantAdmin(user, tenantId);
    } catch (error) {
      console.error('Error checking tenant admin status:', error);
      return false;
    }
  }
  
  /**
   * Check if user has access to tenant
   */
  async hasTenantAccess(uid: string, tenantId: string): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user || user.uid !== uid) {
        return false;
      }
      return await this.customClaimsService.hasTenantAccess(user, tenantId);
    } catch (error) {
      console.error('Error checking tenant access:', error);
      return false;
    }
  }

  /**
   * Update user role (legacy method - uses new custom claims under the hood)
   */
  async updateUserRole(id: string, role: UserRole): Promise<void> {
    const user = await this.getUser(id);
    if (user && user.uid) {
      await this.setUserRole(user.uid, role as unknown as CustomClaimRoleType, user.tenantId, user.companyId);
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(id: string): Promise<void> {
    const userRef = doc(this.getUsersRef(), id);
    await deleteDoc(userRef);
    // Note: This only deletes the Firestore document
    // To fully delete a user, you would also need to delete the Authentication account
    // This would typically be handled by a Cloud Function for security
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  /**
   * Invite a user to join
   */
  async inviteUser(
    email: string, 
    role: CustomClaimRoleType | UserRole, 
    tenantId?: string, 
    companyId?: string
  ): Promise<string> {
    // In a real application, this would generate an invitation token
    // and send an email with a signup link that includes the token
    
    // For now, we'll just create a new user record with status 'invited'
    const userData = {
      email,
      role: role as UserRole, // Cast for backward compatibility
      status: 'invited' as UserStatus,
      tenantId,
      companyId,
      displayName: '',
      password: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
    };
    
    return await this.createUser(userData);
  }
} 