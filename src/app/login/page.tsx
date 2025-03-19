import { SignInForm } from "@/components/auth/SignInForm";
import { PublicLayout } from "@/components/layout/PublicLayout";
import Link from "next/link";

export const metadata = {
  title: "Sign In - LeadLink CRM",
  description: "Sign in to your LeadLink CRM account",
};

export default function LoginPage() {
  return (
    <PublicLayout>
      <div className="container flex items-center justify-center py-16 md:py-20">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Sign In</h1>
            <p className="text-muted-foreground">
              Welcome back! Sign in to access your LeadLink CRM account.
            </p>
          </div>
          
          <SignInForm />
          
          <div className="text-center space-y-2 pt-4">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="font-medium underline underline-offset-4 hover:text-primary">
                Sign up
              </Link>
            </p>
            <p className="text-sm text-muted-foreground">
              <Link href="/forgot-password" className="font-medium underline underline-offset-4 hover:text-primary">
                Forgot your password?
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
} 