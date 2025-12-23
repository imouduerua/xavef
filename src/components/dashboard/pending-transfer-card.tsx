
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Transaction } from "@/lib/types";
import { Clock } from "lucide-react";
import React, { useEffect, useState } from "react";

interface PendingTransferCardProps {
    transaction: Transaction;
}

const COUNTDOWN_MINUTES = 15;

const formatDate = (date: any): Date | null => {
    if (!date) return null;
    if (date.toDate) return date.toDate();
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d;
};

export function PendingTransferCard({ transaction }: PendingTransferCardProps) {
    const transferAmount = Math.abs(transaction.amount);
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        const transactionDate = formatDate(transaction.date);
        if (!transactionDate) return;

        const endTime = new Date(transactionDate.getTime() + COUNTDOWN_MINUTES * 60 * 1000);

        const interval = setInterval(() => {
            const now = new Date();
            const difference = endTime.getTime() - now.getTime();

            if (difference <= 0) {
                setTimeLeft("Processing...");
                clearInterval(interval);
                return;
            }

            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);

            setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [transaction.date]);


    return (
        <Card className="bg-muted/30 border-yellow-500/50">
            <CardHeader>
                <div className="flex items-center gap-3">
                     <Clock className="h-6 w-6 text-yellow-600" />
                    <CardTitle>Transfer Processing</CardTitle>
                </div>
                <CardDescription>Your transfer is being confirmed by an admin. This usually takes less than 15 minutes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Sending To</span>
                    <span className="font-medium">{transaction.recipientName || 'N/A'} ({transaction.recipientXavefId || 'N/A'})</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t">
                    <span className="text-muted-foreground">Amount Sent</span>
                    <span className="font-bold text-lg">₦{transferAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                 <div className="flex justify-between items-baseline pt-2">
                    <span className="text-muted-foreground">Estimated Time Remaining</span>
                    <span className="font-bold text-lg text-yellow-600">{timeLeft || "Calculating..."}</span>
                </div>
            </CardContent>
        </Card>
    );
}
