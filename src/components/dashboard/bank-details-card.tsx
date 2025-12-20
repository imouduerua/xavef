'use client';

import { toast } from '@/hooks/use-toast';
import { Copy } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const bankDetails = {
    accountName: 'XAVEF FINANCIALS LTD',
    accountNumber: '1234567890',
    bankName: 'Providus Bank'
};

interface BankDetailsCardProps {
    amount: number;
}

export function BankDetailsCard({ amount }: BankDetailsCardProps) {

    const copyToClipboard = (text: string, fieldName: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: 'Copied!',
            description: `${fieldName} has been copied to your clipboard.`,
        });
    };

    return (
        <Card className="bg-muted/30">
            <CardHeader>
                <CardTitle>Transfer Details</CardTitle>
                <CardDescription>Please make a bank transfer using the details below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className='flex justify-between items-center'>
                    <span className='text-sm text-muted-foreground'>Amount to Transfer</span>
                    <span className='font-bold text-lg'>₦{amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                 <div className='flex justify-between items-center'>
                    <span className='text-sm text-muted-foreground'>Account Name</span>
                     <div className='flex items-center gap-2'>
                        <span className='font-semibold'>{bankDetails.accountName}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(bankDetails.accountName, 'Account Name')}>
                            <Copy size={14} />
                        </Button>
                    </div>
                </div>
                <div className='flex justify-between items-center'>
                    <span className='text-sm text-muted-foreground'>Account Number</span>
                    <div className='flex items-center gap-2'>
                        <span className='font-semibold'>{bankDetails.accountNumber}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(bankDetails.accountNumber, 'Account Number')}>
                            <Copy size={14} />
                        </Button>
                    </div>
                </div>
                 <div className='flex justify-between items-center'>
                    <span className='text-sm text-muted-foreground'>Bank Name</span>
                    <div className='flex items-center gap-2'>
                        <span className='font-semibold'>{bankDetails.bankName}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(bankDetails.bankName, 'Bank Name')}>
                            <Copy size={14} />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
