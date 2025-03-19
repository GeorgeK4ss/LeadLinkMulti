import { SignUpForm } from "@/components/auth/SignUpForm";
import { PublicLayout } from "@/components/layout/PublicLayout";
import Link from "next/link";

export const metadata = {
  title: "Sign Up - LeadLink CRM",
  description: "Create a new LeadLink CRM account",
};

export default function RegisterPage() {
  return (
    <PublicLayout>
      <div className="container flex items-center justify-center py-16 md:py-20">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Create an Account</h1>
            <p className="text-muted-foreground">
              Sign up for LeadLink CRM to start managing your leads effectively.
            </p>
          </div>
          
          <SignUpForm />
          
          <div className="text-center space-y-2 pt-4">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium underline underline-offset-4 hover:text-primary">
                Sign in
              </Link>
            </p>
            <p className="text-sm text-muted-foreground">
              By signing up, you agree to our{" "}
              <Link href="/terms" className="font-medium underline underline-offset-4 hover:text-primary">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-medium underline underline-offset-4 hover:text-primary">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
} 