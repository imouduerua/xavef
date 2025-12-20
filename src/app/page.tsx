import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { XavefLogo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { AuthBanner } from "@/components/layout/auth-banner";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
        <AuthBanner />
        <div className="flex w-full md:w-1/2 flex-col items-center justify-center p-8">
            <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center text-center">
                    <XavefLogo className="mb-4 h-12 w-12 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Welcome Back
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Securely access your financial dashboard.
                    </p>
                </div>

                <LoginForm />

                <div className="text-center text-sm text-muted-foreground">
                    <p>
                        Don&apos;t have an account?{" "}
                        <Button variant="link" asChild className="p-0">
                            <Link href="/register">Sign up</Link>
                        </Button>
                    </p>
                    <p className="mt-2">
                        Are you an administrator?{" "}
                        <Button variant="link" asChild className="p-0">
                            <Link href="/admin-login">Admin Login</Link>
                        </Button>
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
}
