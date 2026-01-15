
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { AuthBanner } from "@/components/layout/auth-banner";
import { XavefLogo } from "@/components/icons";
import { Shield } from "lucide-react";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      <AuthBanner />
      <div className="flex w-full md:w-1/2 flex-col items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
            <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                    <XavefLogo className="h-12 w-12 text-primary" />
                    <Shield className="absolute -bottom-2 -right-2 h-6 w-6 text-primary bg-background p-1 rounded-full border-2" />
                </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Admin Portal
              </h1>
              <p className="mt-2 text-muted-foreground">
                Securely access the XAVEF admin dashboard.
              </p>
            </div>

            <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
