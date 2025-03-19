import { EmailVerification } from '@/components/auth/EmailVerification';

export const metadata = {
  title: 'Verify Email | LeadLink',
  description: 'Verify your email address to complete registration',
};

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            LeadLink CRM
          </h1>
          <p className="mt-2 text-gray-600">
            Thank you for registering. Please verify your email.
          </p>
        </div>
        
        <EmailVerification />
      </div>
    </div>
  );
} 