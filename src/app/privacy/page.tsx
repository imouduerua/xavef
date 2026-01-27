
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { XavefLogo } from "@/components/icons";

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b sticky top-0 bg-background z-10">
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
          <XavefLogo className="h-6 w-6 text-primary" />
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
                <CardTitle className="text-3xl">Privacy Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-muted-foreground">
                <p>Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.</p>
                
                <div className="space-y-2">
                    <h3 className="font-semibold text-xl text-foreground">1. Information We Collect</h3>
                    <p>We may collect information about you in a variety of ways. The information we may collect on the Service includes personal data that you provide to us, such as your name, email address, and financial information when you create an account or make transactions.</p>
                </div>

                <div className="space-y-2">
                    <h3 className="font-semibold text-xl text-foreground">2. How We Use Your Information</h3>
                    <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Service to create and manage your account, process your transactions, and monitor and analyze usage and trends to improve your experience.</p>
                </div>

                <div className="space-y-2">
                    <h3 className="font-semibold text-xl text-foreground">3. Security of Your Information</h3>
                    <p>We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.</p>
                </div>
                
                <p className="pt-4">This is a placeholder page. The full privacy policy will be detailed here.</p>
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
