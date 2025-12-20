
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "@/lib/types";
import { Clock } from "lucide-react";

interface PendingWithdrawalCardProps {
    transaction: Transaction;
}

const formatDate = (date: any) => {
    if (!date) return 'N/A';
    if (date.toDate) {
        return date.toDate().toLocaleString();
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleString();
};

export function PendingWithdrawalCard({ transaction }: PendingWithdrawalCardProps) {
    const withdrawalAmount = Math.abs(transaction.amount);

    return (
        <Card className="bg-muted/30 border-yellow-500/50">
            <CardHeader>
                <div className="flex items-center gap-3">
                     <Clock className="h-6 w-6 text-yellow-600" />
                    <CardTitle>Withdrawal Request Pending</CardTitle>
                </div>
                <CardDescription>Your request is awaiting admin approval. You cannot make another withdrawal until this one is processed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Request Date</span>
                    <span className="font-medium">{formatDate(transaction.date)}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium text-yellow-600">{transaction.status}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t">
                    <span className="text-muted-foreground">Amount Requested</span>
                    <span className="font-bold text-lg">₦{withdrawalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
            </CardContent>
        </Card>
    );
}
