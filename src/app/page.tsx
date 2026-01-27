
import { XavefLogo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Users, PiggyBank, Landmark, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {icon}
                    </div>
                    <CardTitle>{title}</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
}

export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen light">
            <header className="px-4 lg:px-6 h-16 flex items-center border-b">
                <Link href="#" className="flex items-center justify-center" prefetch={false}>
                    <XavefLogo className="h-6 w-6" />
                    <span className="sr-only">XAVEF Financials</span>
                </Link>
                <nav className="ml-auto flex gap-4 sm:gap-6">
                    <Button asChild variant="ghost">
                        <Link href="/login" prefetch={false}>
                            Login
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/register" prefetch={false}>
                            Sign Up
                        </Link>
                    </Button>
                </nav>
            </header>
            <main className="flex-1">
                <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-background to-muted/50">
                    <div className="container px-4 md:px-6">
                        <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
                            <div className="flex flex-col justify-center space-y-4">
                                <div className="space-y-2">
                                    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                                        Your Partner in Financial Success
                                    </h1>
                                    <p className="max-w-[600px] text-muted-foreground md:text-xl">
                                        Save, manage, and grow your money with confidence. XAVEF provides the tools and community to help you achieve your financial goals.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                                    <Button asChild size="lg">
                                        <Link href="/register" prefetch={false}>
                                            Get Started
                                            <ArrowRight className="ml-2" />
                                        </Link>
                                    </Button>
                                    <Button asChild variant="secondary" size="lg">
                                        <Link href="#features" prefetch={false}>
                                            Learn More
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                            <Image
                                src="https://picsum.photos/seed/rocket/1200/800"
                                width="1200"
                                height="800"
                                alt="Hero"
                                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square"
                                data-ai-hint="finance growth abstract"
                            />
                        </div>
                    </div>
                </section>
                <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-background">
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center justify-center space-y-4 text-center">
                            <div className="space-y-2">
                                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
                                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Built for Your Financial Journey</h2>
                                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                    From individual savings goals to community-based finance, we have you covered.
                                </p>
                            </div>
                        </div>
                        <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-3 pt-12">
                            <FeatureCard 
                                icon={<PiggyBank className="h-6 w-6" />}
                                title="Flexible Savings"
                                description="Create personalized savings goals or use our flexible Olidara account for easy access to your funds when you need them."
                            />
                            <FeatureCard 
                                icon={<Users className="h-6 w-6" />}
                                title="Peer-to-Peer Groups"
                                description="Join or create rotating savings groups (Ajo/Esusu) to build community and achieve collective financial milestones."
                            />
                            <FeatureCard 
                                icon={<Landmark className="h-6 w-6" />}
                                title="Secure Loans"
                                description="Access secure loans managed through the official Xavef Loan & Savings Pool, backed by the community."
                            />
                        </div>
                    </div>
                </section>
                <section className="w-full py-12 md:py-24 lg:py-32 border-t">
                    <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
                        <div className="space-y-3">
                            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                                Ready to Take Control of Your Finances?
                            </h2>
                            <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                Create an account today and start your journey towards financial freedom with a supportive community.
                            </p>
                        </div>
                        <div className="mx-auto w-full max-w-sm space-y-2">
                             <Button asChild size="lg" className="w-full">
                                <Link href="/register" prefetch={false}>
                                    Sign Up Now
                                </Link>
                            </Button>
                            <p className="text-xs text-muted-foreground">
                                Join thousands of others building a better financial future.
                            </p>
                        </div>
                    </div>
                </section>
            </main>
            <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
                <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} XAVEF Financials. All rights reserved.</p>
                <nav className="sm:ml-auto flex gap-4 sm:gap-6">
                    <Link href="/terms" className="text-xs hover:underline underline-offset-4" prefetch={false}>
                        Terms of Service
                    </Link>
                    <Link href="/privacy" className="text-xs hover:underline underline-offset-4" prefetch={false}>
                        Privacy
                    </Link>
                </nav>
            </footer>
        </div>
    )
}
