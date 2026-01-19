
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ShieldCheck, HandCoins, CheckCircle } from 'lucide-react';
import { DepositDialog } from '../dashboard/deposit-dialog';

export function XavefLoanPoolCard() {
    
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
                        Contribute to a central purse to become eligible for loans and get a lump-sum payout of your savings every December.
                     </p>
                </CardContent>
                <CardFooter className="gap-2">
                     <DialogTrigger asChild>
                        <Button variant="outline">
                            Learn More
                        </Button>
                     </DialogTrigger>
                     <DepositDialog accountName="Xavef Loan & Savings Pool" targetAccount="groupPool">
                        <Button className="flex-1">
                            <HandCoins className="mr-2 h-4 w-4" />
                            Contribute
                        </Button>
                    </DepositDialog>
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
                                <h4 className="font-semibold">Flexible Contributions</h4>
                                <p className="text-muted-foreground">Build your savings by contributing any amount, any time. All contributions are added to your Annual Savings balance.</p>
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
                <DialogFooter>
                    <DialogClose asChild>
                        <Button>Sounds Good</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
