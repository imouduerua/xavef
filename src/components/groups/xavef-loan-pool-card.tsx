'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ShieldCheck, ArrowRight, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function XavefLoanPoolCard() {
    
    const handleJoin = () => {
        toast({
            title: "Coming Soon!",
            description: "The ability to join the loan pool is under development. Stay tuned!",
        });
    };

    return (
        <Dialog>
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
                     <DialogTrigger asChild>
                        <Button>
                            Learn More
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                     </DialogTrigger>
                </CardFooter>
            </Card>

            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                        Xavef Loan & Savings Pool
                    </DialogTitle>
                    <DialogDescription>
                        A secure, centrally-managed fund designed for disciplined savings and access to loans.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 text-sm">
                    <p>The Xavef Loan & Savings Pool is different from peer-to-peer groups. It is managed directly by Xavef to provide a stable and secure environment for all members.</p>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold">Monthly Contributions</h4>
                                <p className="text-muted-foreground">Build your savings consistently with automated or manual monthly contributions.</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold">Loan Eligibility</h4>
                                <p className="text-muted-foreground">Active and consistent contributors become eligible to apply for loans from the central purse.</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold">Year-End Payout</h4>
                                <p className="text-muted-foreground">Your total contributions are available for withdrawal every December, perfect for holiday expenses or large purchases.</p>
                            </div>
                        </li>
                    </ul>
                </div>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                    </DialogClose>
                    <Button onClick={handleJoin}>
                        Join the Pool
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
