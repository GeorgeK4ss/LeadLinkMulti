'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/spinner';
import { AuthenticationService } from '@/lib/services/firebase/AuthenticationService';

interface EmailVerificationProps {
  redirectUrl?: string;
}

export function EmailVerification({ redirectUrl = '/dashboard' }: EmailVerificationProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'unverified' | 'verified' | 'sent'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const authService = new AuthenticationService();

  // Check verification status when component mounts
  useEffect(() => {
    if (!user) {
      // If no user is logged in, redirect to login
      router.push('/auth?tab=login&redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    // Force refresh the token to get the latest email verification status
    user.getIdToken(true)
      .then(() => {
        // Check if email is verified
        if (user.emailVerified) {
          setStatus('verified');
          // Redirect after a delay to show success message
          setTimeout(() => router.push(redirectUrl), 3000);
        } else {
          setStatus('unverified');
        }
      })
      .catch(err => {
        setError('Failed to refresh authentication status.');
        console.error('Token refresh error:', err);
      });
  }, [user, router, redirectUrl]);

  // Handle countdown for resend cooldown
  useEffect(() => {
    if (countdown <= 0) return;
    
    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown]);

  // Send verification email
  const handleSendVerification = async () => {
    if (!user) return;
    
    try {
      setError(null);
      setStatus('loading');
      await authService.sendVerificationEmail(user);
      setStatus('sent');
      setCountdown(60); // Set cooldown timer
    } catch (err) {
      setStatus('unverified');
      setError(err instanceof Error ? err.message : 'Failed to send verification email.');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Email Verification</h1>
      
      {status === 'loading' && (
        <div className="flex justify-center my-8">
          <Spinner className="h-10 w-10 text-blue-500" />
        </div>
      )}
      
      {status === 'verified' && (
        <div className="bg-green-50 border border-green-200 rounded p-4 mb-6">
          <h2 className="text-green-800 font-medium">Email Verified Successfully!</h2>
          <p className="text-green-700 mt-1">
            Your email has been verified. You will be redirected to the dashboard shortly.
          </p>
        </div>
      )}
      
      {status === 'unverified' && (
        <div className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <h2 className="text-yellow-800 font-medium">Verification Required</h2>
            <p className="text-yellow-700 mt-1">
              Your email address has not been verified yet. Please check your inbox for a verification link or request a new one.
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          <button
            onClick={handleSendVerification}
            disabled={countdown > 0}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
          >
            {countdown > 0 ? `Resend in ${countdown}s` : 'Send Verification Email'}
          </button>
          
          <p className="text-sm text-gray-600 text-center">
            Need help? Contact our support team.
          </p>
        </div>
      )}
      
      {status === 'sent' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h2 className="text-blue-800 font-medium">Verification Email Sent</h2>
            <p className="text-blue-700 mt-1">
              We've sent a verification email to <span className="font-medium">{user?.email}</span>.
              Please check your inbox and click the verification link.
            </p>
            <p className="text-blue-700 mt-2">
              After verifying your email, click the button below to continue.
            </p>
          </div>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            I've Verified My Email
          </button>
          
          <div className="text-center">
            <button
              onClick={handleSendVerification}
              disabled={countdown > 0}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
            >
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Verification Email'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 