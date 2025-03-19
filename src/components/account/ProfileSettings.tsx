'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthenticationService } from '@/lib/services/firebase/AuthenticationService';
import { Spinner } from '@/components/ui/spinner';
import { FaCamera, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import Image from 'next/image';

export function ProfileSettings() {
  const { user } = useAuth();
  const authService = new AuthenticationService();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [emailPassword, setEmailPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  
  // Handle profile update (name and photo)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      setLoading(true);
      setMessage(null);
      
      await authService.updateUserProfile(user, displayName);
      
      setMessage({
        text: 'Profile updated successfully!',
        type: 'success'
      });
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : 'Failed to update profile',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle email update
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      setLoading(true);
      setMessage(null);
      
      await authService.updateUserEmail(user, email, emailPassword);
      
      setMessage({
        text: 'Email updated successfully! Please verify your new email address.',
        type: 'success'
      });
      setShowEmailConfirm(false);
      setEmailPassword('');
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : 'Failed to update email',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle photo upload
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      setMessage({
        text: 'Please select an image file',
        type: 'error'
      });
      return;
    }
    
    try {
      setLoading(true);
      setMessage(null);
      
      // In a real app, this would upload the file to Firebase Storage
      // and then update the user's profile with the download URL
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const photoURL = reader.result as string;
          await authService.updateUserProfile(user, undefined, photoURL);
          
          setMessage({
            text: 'Profile photo updated successfully!',
            type: 'success'
          });
        } catch (err) {
          setMessage({
            text: err instanceof Error ? err.message : 'Failed to update profile photo',
            type: 'error'
          });
        } finally {
          setLoading(false);
          // Reset the file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : 'Failed to update profile photo',
        type: 'error'
      });
      setLoading(false);
    }
  };
  
  // Reset to initial values
  const handleCancel = () => {
    setDisplayName(user?.displayName || '');
    setEmail(user?.email || '');
    setShowEmailConfirm(false);
    setEmailPassword('');
    setMessage(null);
  };
  
  if (!user) {
    return <p>Loading profile settings...</p>;
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
      
      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
          'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {message.type === 'success' ? (
                <FaCheck className="h-5 w-5 text-green-400" />
              ) : (
                <FaExclamationTriangle className="h-5 w-5 text-red-400" />
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                {message.text}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Profile Photo Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className="relative inline-block">
              {user.photoURL ? (
                <img 
                  src={user.photoURL}
                  alt={user.displayName || 'User profile'}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-2xl">{displayName.charAt(0)}</span>
                </div>
              )}
              <label 
                htmlFor="photo-upload" 
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center cursor-pointer"
              >
                <FaCamera className="text-white" />
                <input
                  id="photo-upload"
                  name="photo"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handlePhotoChange}
                  ref={fileInputRef}
                  disabled={loading}
                />
              </label>
            </div>
            
            <div className="ml-5">
              <h3 className="text-lg font-medium text-gray-900">Profile Photo</h3>
              <p className="text-sm text-gray-500">
                Click the camera icon to update your profile photo.
                <br />
                JPG, PNG or GIF. 1MB max.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Profile Form */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
          
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
                required
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? <Spinner className="h-4 w-4 mr-2" /> : null}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Email Update Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Email Address</h3>
          
          <div className="flex items-center mb-4">
            <div className="flex-grow">
              <p className="text-sm text-gray-500">Current Email:</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              {user.emailVerified ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Not Verified
                </span>
              )}
            </div>
          </div>
          
          {!showEmailConfirm ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowEmailConfirm(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Change Email
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdateEmail} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  New Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="emailPassword" className="block text-sm font-medium text-gray-700">
                  Current Password (Required to change email)
                </label>
                <input
                  id="emailPassword"
                  type="password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                  required
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowEmailConfirm(false)}
                  className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? <Spinner className="h-4 w-4 mr-2" /> : null}
                  Update Email
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 