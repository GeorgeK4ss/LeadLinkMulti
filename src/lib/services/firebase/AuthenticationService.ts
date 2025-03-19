'use client';

import { 
  User,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  Auth
} from 'firebase/auth';

import { auth } from '@/lib/firebase';

export class AuthenticationService {
  private auth: Auth;

  constructor() {
    this.auth = auth;
  }

  // Email authentication methods
  async loginWithEmail(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Login failed:', error);
      throw this.formatAuthError(error);
    }
  }

  async registerWithEmail(email: string, password: string, displayName?: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      
      // Update profile if display name is provided
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }
      
      return userCredential.user;
    } catch (error) {
      console.error('Registration failed:', error);
      throw this.formatAuthError(error);
    }
  }

  // OAuth authentication methods
  async loginWithGoogle(): Promise<User> {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      const result = await signInWithPopup(this.auth, provider);
      return result.user;
    } catch (error) {
      console.error('Google login failed:', error);
      throw this.formatAuthError(error);
    }
  }

  async loginWithFacebook(): Promise<User> {
    try {
      const provider = new FacebookAuthProvider();
      provider.addScope('email');
      provider.addScope('public_profile');
      const result = await signInWithPopup(this.auth, provider);
      return result.user;
    } catch (error) {
      console.error('Facebook login failed:', error);
      throw this.formatAuthError(error);
    }
  }

  async loginWithTwitter(): Promise<User> {
    try {
      const provider = new TwitterAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      return result.user;
    } catch (error) {
      console.error('Twitter login failed:', error);
      throw this.formatAuthError(error);
    }
  }

  async loginWithGithub(): Promise<User> {
    try {
      const provider = new GithubAuthProvider();
      provider.addScope('read:user');
      provider.addScope('user:email');
      const result = await signInWithPopup(this.auth, provider);
      return result.user;
    } catch (error) {
      console.error('GitHub login failed:', error);
      throw this.formatAuthError(error);
    }
  }

  async loginWithMicrosoft(): Promise<User> {
    try {
      const provider = new OAuthProvider('microsoft.com');
      provider.addScope('openid');
      provider.addScope('profile');
      provider.addScope('email');
      const result = await signInWithPopup(this.auth, provider);
      return result.user;
    } catch (error) {
      console.error('Microsoft login failed:', error);
      throw this.formatAuthError(error);
    }
  }

  // User management methods
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error) {
      console.error('Logout failed:', error);
      throw this.formatAuthError(error);
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      console.error('Password reset failed:', error);
      throw this.formatAuthError(error);
    }
  }

  async updateUserProfile(user: User, displayName?: string, photoURL?: string): Promise<void> {
    try {
      const updateData: { displayName?: string; photoURL?: string } = {};
      
      if (displayName !== undefined) {
        updateData.displayName = displayName;
      }
      
      if (photoURL !== undefined) {
        updateData.photoURL = photoURL;
      }
      
      await updateProfile(user, updateData);
    } catch (error) {
      console.error('Profile update failed:', error);
      throw this.formatAuthError(error);
    }
  }

  async updateUserEmail(user: User, newEmail: string, password: string): Promise<void> {
    try {
      // Re-authenticate the user before email change
      const credential = EmailAuthProvider.credential(user.email || '', password);
      await reauthenticateWithCredential(user, credential);
      
      // Update the email
      await updateEmail(user, newEmail);
    } catch (error) {
      console.error('Email update failed:', error);
      throw this.formatAuthError(error);
    }
  }

  async updateUserPassword(user: User, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Re-authenticate the user before password change
      const credential = EmailAuthProvider.credential(user.email || '', currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update the password
      await updatePassword(user, newPassword);
    } catch (error) {
      console.error('Password update failed:', error);
      throw this.formatAuthError(error);
    }
  }

  async sendVerificationEmail(user: User): Promise<void> {
    try {
      await sendEmailVerification(user);
    } catch (error) {
      console.error('Verification email failed:', error);
      throw this.formatAuthError(error);
    }
  }

  // Helper method to format auth errors
  private formatAuthError(error: any): Error {
    // Extract error code and message
    const errorCode = error.code || 'unknown';
    const errorMessage = error.message || 'An unknown error occurred';
    
    // Map Firebase error codes to user-friendly messages
    const errorMap: Record<string, string> = {
      'auth/user-not-found': 'No user found with this email address.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/email-already-in-use': 'This email is already registered. Please use a different email or sign in.',
      'auth/invalid-email': 'Invalid email address format.',
      'auth/weak-password': 'Password is too weak. Please use a stronger password.',
      'auth/user-disabled': 'This account has been disabled. Please contact support.',
      'auth/requires-recent-login': 'This operation requires recent authentication. Please sign in again.',
      'auth/popup-closed-by-user': 'Login canceled. The popup was closed before completing the sign-in process.',
      'auth/unauthorized-domain': 'This domain is not authorized for OAuth operations.',
      'auth/operation-not-allowed': 'This sign-in method is not allowed. Please contact support.',
      'auth/account-exists-with-different-credential': 'An account already exists with the same email but different sign-in credentials.',
    };
    
    // Use the mapped message or the original message
    const friendlyMessage = errorMap[errorCode] || errorMessage;
    
    return new Error(friendlyMessage);
  }
} 