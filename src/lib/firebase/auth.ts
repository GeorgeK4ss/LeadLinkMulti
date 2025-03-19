import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  browserLocalPersistence,
  setPersistence,
  type User
} from 'firebase/auth';
import { auth as firebaseAuth } from './config';
import { RBACService } from '@/lib/services/rbac';

// Use the exported auth instance from the main firebase.ts
export const auth = firebaseAuth;

// Set auth persistence to LOCAL (survives browser restart)
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Firebase auth persistence error:", error);
  });

// Google provider for authentication
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Log user login
    console.log(`User logged in: ${userCredential.user.uid} (${email})`);
    
    // Get and log user role
    try {
      const rbacService = RBACService.getInstance();
      const userRole = await rbacService.getUserRole(userCredential.user.uid);
      if (userRole) {
        console.log(`User role: ${userRole.roleId}`, {
          userId: userRole.userId,
          roleId: userRole.roleId,
          companyId: userRole.companyId || 'none',
          tenantId: userRole.tenantId || 'none',
          timestamp: new Date().toISOString()
        });
      } else {
        console.log(`No role assigned for user: ${userCredential.user.uid}`);
      }
    } catch (roleError) {
      console.error('Error fetching user role during login:', roleError);
    }
    
    return { user: userCredential.user, error: null };
  } catch (error) {
    console.error(`Login failed for ${email}:`, error);
    return { user: null, error: error as Error };
  }
};

// Sign up with email and password
export const signUp = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error as Error };
  }
};

// Sign out
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};

// Reset password
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};

// Auth state observer
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error: error as Error };
  }
}; 