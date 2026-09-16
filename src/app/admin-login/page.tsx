
import Link from "next/link";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { XavefLogo } from "@/components/icons";
import { AuthBanner } from "@/components/layout/auth-banner";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
        <AuthBanner />
        <div className="flex w-full md:w-1/2 flex-col items-center justify-center p-8">
            <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center text-center">
                    <XavefLogo className="mb-4 h-12 w-12" />
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Admin Access
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Enter your credentials to manage the platform.
                    </p>
                </div>

                <AdminLoginForm />
                
                <p className="text-center text-sm text-muted-foreground">
                    Not an admin?{" "}
                    <Link
                        href="/login"
                        className="font-semibold text-primary underline-offset-4 hover:underline"
                    >
                        Go to user login
                    </Link>
                </p>

            </div>
        </div>
    </div>
  );
}
