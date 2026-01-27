
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { XavefLogo } from "@/components/icons";

export default function TermsOfServicePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b sticky top-0 bg-background z-10">
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
          <XavefLogo className="h-6 w-6 text-sidebar-primary" />
          <span className="sr-only">XAVEF Financials</span>
        </Link>
         <nav className="ml-auto flex gap-4 sm:gap-6">
            <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
                Login
            </Link>
            <Link href="/register" className="text-sm font-medium text-primary underline-offset-4 hover:underline" prefetch={false}>
                Sign Up
            </Link>
        </nav>
      </header>
      <main className="flex-1 py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
            <Card className="w-full max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="text-3xl">Terms of Service</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-muted-foreground">
                <p>Welcome to XAVEF Financials. By using our services, you agree to these terms. Please read them carefully.</p>
                
                <div className="space-y-2">
                    <h3 className="font-semibold text-xl text-foreground">1. Your Account</h3>
                    <p>You are responsible for maintaining the confidentiality of your account and password, including but not limited to the restriction of access to your computer and/or account. You agree to accept responsibility for any and all activities or actions that occur under your account and/or password.</p>
                </div>

                <div className="space-y-2">
                    <h3 className="font-semibold text-xl text-foreground">2. Use of Services</h3>
                    <p>You agree to use our services for lawful purposes only and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the services. Prohibited behavior includes harassing or causing distress or inconvenience to any other user, transmitting obscene or offensive content or disrupting the normal flow of dialogue within our services.</p>
                </div>

                <div className="space-y-2">
                    <h3 className="font-semibold text-xl text-foreground">3. Termination</h3>
                    <p>We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.</p>
                </div>
                
                <p className="pt-4">This is a placeholder page. The full terms of service will be detailed here.</p>
                 <div className="pt-4">
                    <Link href="/" className="text-primary hover:underline font-semibold">
                        &larr; Back to Home
                    </Link>
                </div>
              </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
