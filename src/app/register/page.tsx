
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { XavefLogo } from "@/components/icons";
import { AuthBanner } from "@/components/layout/auth-banner";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      <AuthBanner />
      <div className="flex w-full md:w-1/2 flex-col items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
            <div className="flex flex-col items-center text-center">
                <XavefLogo className="mb-4 h-12 w-12 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Create an Account
              </h1>
              <p className="mt-2 text-muted-foreground">
                Start your journey to financial success today.
              </p>
            </div>

            <RegisterForm />

            <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                    href="/login"
                    className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                    Log in
                </Link>
            </p>
        </div>
      </div>
    </div>
  );
}
