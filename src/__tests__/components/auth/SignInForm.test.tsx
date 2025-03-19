/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SignInForm } from '@/components/auth/SignInForm';
import { signIn, signInWithGoogle } from '@/lib/firebase/auth';
import '@testing-library/jest-dom';

// Mock the next/navigation router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the Firebase auth module
jest.mock('@/lib/firebase/auth', () => ({
  signIn: jest.fn(),
  signInWithGoogle: jest.fn(),
}));

describe('SignInForm', () => {
  const mockRouter = { push: jest.fn() };
  
  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-ignore - we're mocking only the parts we need
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue(mockRouter);
  });

  it('renders the sign-in form correctly', () => {
    render(<SignInForm />);
    
    // Check if all the form elements are in the document
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('handles form submission with valid credentials', async () => {
    // Mock successful sign-in
    (signIn as jest.Mock).mockResolvedValueOnce({
      user: { uid: 'test-user-id' },
      error: null,
    });

    render(<SignInForm />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    
    // Check if the loading state is shown
    expect(screen.getByRole('button', { name: 'Signing in...' })).toBeInTheDocument();
    
    // Wait for the form submission to complete
    await waitFor(() => {
      // Check if the signIn function was called with the correct arguments
      expect(signIn).toHaveBeenCalledWith('test@example.com', 'password123');
      // Check if the user is redirected to the dashboard
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays an error message when sign-in fails', async () => {
    // Mock failed sign-in
    (signIn as jest.Mock).mockResolvedValueOnce({
      user: null,
      error: new Error('Invalid email or password'),
    });

    render(<SignInForm />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrong-password' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
      // Check if the sign-in button is enabled again
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeEnabled();
    });
    
    // Check that the router was not called
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('handles unexpected errors during sign-in', async () => {
    // Mock an unexpected error
    (signIn as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<SignInForm />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
    });
  });

  it('handles Google sign-in correctly', async () => {
    // Mock successful Google sign-in
    (signInWithGoogle as jest.Mock).mockResolvedValueOnce({
      user: { uid: 'google-user-id' },
      error: null,
    });

    render(<SignInForm />);
    
    // Click the Google sign-in button
    fireEvent.click(screen.getByRole('button', { name: /sign in with google/i }));
    
    // Wait for the Google sign-in to complete
    await waitFor(() => {
      // Check if the signInWithGoogle function was called
      expect(signInWithGoogle).toHaveBeenCalled();
      // Check if the user is redirected to the dashboard
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays an error message when Google sign-in fails', async () => {
    // Mock failed Google sign-in
    (signInWithGoogle as jest.Mock).mockResolvedValueOnce({
      user: null,
      error: new Error('Google authentication failed'),
    });

    render(<SignInForm />);
    
    // Click the Google sign-in button
    fireEvent.click(screen.getByRole('button', { name: /sign in with google/i }));
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('Google authentication failed')).toBeInTheDocument();
    });
    
    // Check that the router was not called
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('disables form inputs during form submission', async () => {
    // Mock a delayed sign-in response
    (signIn as jest.Mock).mockImplementationOnce(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            user: { uid: 'test-user-id' },
            error: null,
          });
        }, 100);
      });
    });

    render(<SignInForm />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    
    // Check if the form inputs are disabled during submission
    expect(screen.getByLabelText('Email')).toBeDisabled();
    expect(screen.getByLabelText('Password')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Signing in...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeDisabled();
    
    // Wait for the form submission to complete
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    });
  });
}); 