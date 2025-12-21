'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function XavefLoanPoolCard() {
    
    const handleLearnMore = () => {
        toast({
            title: "Coming Soon!",
            description: "The Xavef Loan & Savings Pool is under development. Stay tuned for updates.",
        });
    };

    return (
        <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
                 <div className='flex justify-between items-start'>
                    <div>
                        <CardTitle className="flex items-center gap-2">
                           <ShieldCheck className="h-6 w-6 text-primary" />
                           Xavef Loan & Savings Pool
                        </CardTitle>
                        <CardDescription>
                            The official, Xavef-managed group for secure loans and yearly savings.
                        </CardDescription>
                    </div>
                 </div>
            </CardHeader>
            <CardContent>
                 <p className="text-sm text-muted-foreground">
                    Contribute monthly to a central purse to become eligible for loans guaranteed by other members. All your contributions are available for withdrawal every December.
                 </p>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleLearnMore}>
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}
