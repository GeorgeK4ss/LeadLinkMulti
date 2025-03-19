import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { SignInForm } from '@/components/auth/SignInForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { PasswordResetForm } from '@/components/auth/PasswordResetForm';
import { UserService } from '@/lib/services/UserService';
import { TenantService } from '@/lib/services/TenantService';
import { useToast } from '@/components/ui/use-toast';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn()
}));

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  getAuth: jest.fn()
}));

// Mock UserService
jest.mock('@/lib/services/UserService');

// Mock TenantService
jest.mock('@/lib/services/TenantService');

// Mock useToast
jest.mock('@/components/ui/use-toast', () => ({
  useToast: jest.fn()
}));

describe('Authentication Flows', () => {
  const mockRouter = {
    push: jest.fn(),
    query: {}
  };
  
  const mockToast = {
    toast: jest.fn()
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useToast as jest.Mock).mockReturnValue(mockToast);
  });
  
  describe('Sign In Flow', () => {
    it('successfully signs in with valid credentials', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com'
      };
      
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
        user: mockUser
      });
      
      (UserService.prototype.getUserByUid as jest.Mock).mockResolvedValueOnce({
        ...mockUser,
        tenantId: 'test-tenant',
        role: 'tenant_user'
      });
      
      render(<SignInForm />);
      
      // Fill in the form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });
      
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      });
      
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
          expect.anything(),
          'test@example.com',
          'password123'
        );
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
      });
    });
    
    it('handles invalid credentials correctly', async () => {
      const mockError = new Error('auth/invalid-credentials');
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(mockError);
      
      render(<SignInForm />);
      
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });
      
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'wrongpassword' }
      });
      
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(mockToast.toast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error',
            description: expect.stringContaining('Invalid credentials'),
            variant: 'destructive'
          })
        );
      });
    });
  });
  
  describe('Sign Up Flow', () => {
    it('successfully creates a new user account', async () => {
      const mockUser = {
        uid: 'new-user-uid',
        email: 'newuser@example.com'
      };
      
      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
        user: mockUser
      });
      
      (UserService.prototype.createUser as jest.Mock).mockResolvedValueOnce({
        ...mockUser,
        tenantId: 'test-tenant',
        role: 'tenant_user'
      });
      
      render(<SignUpForm tenantId="test-tenant" />);
      
      // Fill in the form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'newuser@example.com' }
      });
      
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'newpassword123' }
      });
      
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'newpassword123' }
      });
      
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
      
      await waitFor(() => {
        expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
          expect.anything(),
          'newuser@example.com',
          'newpassword123'
        );
        expect(UserService.prototype.createUser).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'newuser@example.com',
            tenantId: 'test-tenant'
          })
        );
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
      });
    });
    
    it('validates password requirements', async () => {
      render(<SignUpForm tenantId="test-tenant" />);
      
      // Try with a weak password
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'newuser@example.com' }
      });
      
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'weak' }
      });
      
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'weak' }
      });
      
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
        expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
      });
    });
  });
  
  describe('Password Reset Flow', () => {
    it('successfully sends password reset email', async () => {
      (sendPasswordResetEmail as jest.Mock).mockResolvedValueOnce(undefined);
      
      render(<PasswordResetForm />);
      
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });
      
      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
      
      await waitFor(() => {
        expect(sendPasswordResetEmail).toHaveBeenCalledWith(
          expect.anything(),
          'test@example.com'
        );
        expect(mockToast.toast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Success',
            description: expect.stringContaining('password reset email')
          })
        );
      });
    });
    
    it('handles non-existent email addresses', async () => {
      const mockError = new Error('auth/user-not-found');
      (sendPasswordResetEmail as jest.Mock).mockRejectedValueOnce(mockError);
      
      render(<PasswordResetForm />);
      
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'nonexistent@example.com' }
      });
      
      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
      
      await waitFor(() => {
        expect(mockToast.toast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error',
            description: expect.stringContaining('No account found'),
            variant: 'destructive'
          })
        );
      });
    });
  });
  
  describe('Authorization Flows', () => {
    it('redirects unauthorized users from protected routes', async () => {
      (UserService.prototype.getCurrentUser as jest.Mock).mockResolvedValueOnce(null);
      
      render(<SignInForm />);
      
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/signin');
      });
    });
    
    it('enforces role-based access control', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        tenantId: 'test-tenant',
        role: 'tenant_user'
      };
      
      (UserService.prototype.getCurrentUser as jest.Mock).mockResolvedValueOnce(mockUser);
      (TenantService.prototype.getTenantSettings as jest.Mock).mockRejectedValueOnce(
        new Error('Unauthorized')
      );
      
      // Attempt to access admin-only route
      mockRouter.query.path = '/admin/settings';
      
      render(<SignInForm />);
      
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
        expect(mockToast.toast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Access Denied',
            description: expect.stringContaining('do not have permission'),
            variant: 'destructive'
          })
        );
      });
    });
  });
}); 