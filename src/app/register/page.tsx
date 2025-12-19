import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { XavefLogo } from "@/components/icons";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="flex flex-col items-center text-center">
          <XavefLogo className="mb-4 h-16 w-16" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Create an Account
          </h1>
          <p className="mt-2 text-muted-foreground">
            Join XAVEF and take control of your finances.
          </p>
        </div>

        <RegisterForm />

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Button variant="link" asChild className="p-0">
            <Link href="/">Log in</Link>
          </Button>
        </p>
      </div>
    </div>
  );
}
