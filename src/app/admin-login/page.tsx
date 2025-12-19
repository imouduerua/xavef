import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { XavefLogo } from "@/components/icons";
import { Shield } from "lucide-react";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
                <XavefLogo className="h-16 w-16" />
                <Shield className="absolute -bottom-2 -right-2 h-8 w-8 text-primary bg-background p-1 rounded-full border" />
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
  );
}
