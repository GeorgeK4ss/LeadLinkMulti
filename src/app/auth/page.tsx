'use client';

import { useSearchParams } from 'next/navigation';
import { AuthTabs } from '@/components/auth/AuthForms';

export default function AuthPage() {
  const searchParams = useSearchParams();
  const defaultTab = (searchParams.get('tab') as 'login' | 'register' | 'reset') || 'login';
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to LeadLink CRM
          </h1>
          <p className="mt-2 text-gray-600">
            The modern customer relationship management platform
          </p>
        </div>
        
        <AuthTabs 
          defaultTab={defaultTab} 
          redirectUrl={redirectUrl as string} 
        />
      </div>
    </div>
  );
} 