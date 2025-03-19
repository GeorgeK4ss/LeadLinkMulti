'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthenticationService } from '@/lib/services/firebase/AuthenticationService';
import { Spinner } from '@/components/ui/spinner';
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

export function SecuritySettings() {
  const { user } = useAuth();
  const authService = new AuthenticationService();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // Password validation state
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  
  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Basic validation
    if (newPassword.length < 8) {
      setMessage({
        text: 'Password must be at least 8 characters long.',
        type: 'error'
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setMessage({
        text: 'Passwords do not match.',
        type: 'error'
      });
      return;
    }
    
    try {
      setLoading(true);
      setMessage(null);
      
      await authService.updateUserPassword(user, currentPassword, newPassword);
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordStrength(null);
      
      setMessage({
        text: 'Password updated successfully!',
        type: 'success'
      });
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : 'Failed to update password',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Check password strength
  const checkPasswordStrength = (password: string) => {
    if (password.length === 0) {
      setPasswordStrength(null);
      return;
    }
    
    // Basic password strength rules
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const passedChecks = [
      password.length >= 8,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChars
    ].filter(Boolean).length;
    
    if (passedChecks <= 2) {
      setPasswordStrength('weak');
    } else if (passedChecks <= 4) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('strong');
    }
  };
  
  if (!user) {
    return <p>Loading security settings...</p>;
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Security Settings</h2>
      
      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
          'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}
      
      {/* Account Security Overview */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Account Security Overview</h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Email Verification</dt>
              <dd className="mt-1 flex items-center">
                {user.emailVerified ? (
                  <>
                    <FaCheckCircle className="h-5 w-5 text-green-500 mr-1.5" />
                    <span className="text-sm text-green-700">Verified</span>
                  </>
                ) : (
                  <>
                    <FaExclamationTriangle className="h-5 w-5 text-yellow-500 mr-1.5" />
                    <span className="text-sm text-yellow-700">Not Verified</span>
                    <button
                      type="button"
                      className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                      onClick={async () => {
                        try {
                          setLoading(true);
                          await authService.sendVerificationEmail(user);
                          setMessage({
                            text: 'Verification email sent! Please check your inbox.',
                            type: 'success'
                          });
                        } catch (err) {
                          setMessage({
                            text: err instanceof Error ? err.message : 'Failed to send verification email',
                            type: 'error'
                          });
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                    >
                      Verify Now
                    </button>
                  </>
                )}
              </dd>
            </div>
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Last Sign In</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user.metadata.lastSignInTime 
                  ? new Date(user.metadata.lastSignInTime).toLocaleString() 
                  : 'Unknown'}
              </dd>
            </div>
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Account Created</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user.metadata.creationTime 
                  ? new Date(user.metadata.creationTime).toLocaleString() 
                  : 'Unknown'}
              </dd>
            </div>
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Auth Provider</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user.providerData[0]?.providerId || 'Email/Password'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      
      {/* Change Password Form */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
          <p className="mt-1 text-sm text-gray-500">
            Update your password regularly to keep your account secure.
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
                required
              />
            </div>
            
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  checkPasswordStrength(e.target.value);
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
                required
                minLength={8}
              />
              
              {passwordStrength && (
                <div className="mt-2">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        passwordStrength === 'weak' ? 'bg-red-500 w-1/3' :
                        passwordStrength === 'medium' ? 'bg-yellow-500 w-2/3' :
                        'bg-green-500 w-full'
                      }`}
                    ></div>
                  </div>
                  <p className={`mt-1 text-xs ${
                    passwordStrength === 'weak' ? 'text-red-600' :
                    passwordStrength === 'medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {passwordStrength === 'weak' && 'Weak password - consider adding numbers, special characters and making it longer'}
                    {passwordStrength === 'medium' && 'Medium strength - good password but could be stronger'}
                    {passwordStrength === 'strong' && 'Strong password - excellent choice!'}
                  </p>
                </div>
              )}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`mt-1 block w-full border ${
                  confirmPassword && newPassword !== confirmPassword 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } rounded-md shadow-sm py-2 px-3 focus:outline-none`}
                disabled={loading}
                required
              />
              
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-1 text-xs text-red-600">
                  Passwords do not match
                </p>
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={loading || (!!confirmPassword && newPassword !== confirmPassword)}
              >
                {loading ? <Spinner className="h-4 w-4 mr-2" /> : null}
                Change Password
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Future Security Features (Coming Soon) */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Additional Security Features</h3>
          <p className="mt-1 text-sm text-gray-500">
            These features will be available soon to further enhance your account security.
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <ul className="divide-y divide-gray-200">
            <li className="py-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
                <p className="text-sm text-gray-500">Add an extra layer of security to your account.</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Coming Soon
              </span>
            </li>
            
            <li className="py-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Login Activity</h4>
                <p className="text-sm text-gray-500">View and manage your recent login activity.</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Coming Soon
              </span>
            </li>
            
            <li className="py-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Security Alerts</h4>
                <p className="text-sm text-gray-500">
                  Get notified of suspicious activity on your account.
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Coming Soon
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 