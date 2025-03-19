import { PasswordResetForm } from "@/components/auth/PasswordResetForm";
import { PublicLayout } from "@/components/layout/PublicLayout";
import Link from "next/link";

export const metadata = {
  title: "Reset Password - LeadLink CRM",
  description: "Reset your LeadLink CRM account password",
};

export default function ForgotPasswordPage() {
  return (
    <PublicLayout>
      <div className="container flex items-center justify-center py-16 md:py-20">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Reset Password</h1>
            <p className="text-muted-foreground">
              Enter your email and we'll send you a link to reset your password.
            </p>
          </div>
          
          <PasswordResetForm />
          
          <div className="text-center space-y-2 pt-4">
            <p className="text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link href="/login" className="font-medium underline underline-offset-4 hover:text-primary">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
} 