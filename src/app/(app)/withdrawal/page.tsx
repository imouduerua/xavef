
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuthContext } from "@/context/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { UserData, Transaction } from "@/lib/types";
import { WithdrawalForm } from "@/components/withdrawal/withdrawal-form";
import { useCollection, useFirestore, useUser } from "@/firebase";
import React, { useMemo } from "react";
import { collection, query, where } from "firebase/firestore";
import { PendingWithdrawalCard } from "@/components/withdrawal/pending-withdrawal-card";

function isProfileComplete(userData: UserData | null) {
    if (!userData) return false;
    const requiredFields: (keyof UserData)[] = [
        'firstName', 'lastName', 'phoneNumber', 'address', 'state', 'country',
    ];
    const profileFieldsComplete = requiredFields.every(field => {
        const value = userData[field];
        return typeof value === 'string' && value.trim() !== '';
    });
    
    const bankAccountsExist = userData.bankAccounts && userData.bankAccounts.length > 0;

    return profileFieldsComplete && bankAccountsExist;
}


function CompleteProfilePrompt() {
    return (
        <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Profile Incomplete</AlertTitle>
            <AlertDescription>
                <div className="space-y-4">
                    <p>
                        To withdraw funds, you must first complete your personal details and add at least one bank account in your profile.
                    </p>
                    <Button asChild>
                        <Link href="/settings">
                            Go to Settings
                        </Link>
                    </Button>
                </div>
            </AlertDescription>
        </Alert>
    )
}

function PageSkeleton() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-full max-w-md" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
        </div>
    )
}


export default function WithdrawalPage() {
    const { user, userData, loading } = useAuthContext();
    const firestore = useFirestore();

    const pendingWithdrawalQuery = useMemo(() => (user?.uid && firestore) ? query(
            collection(firestore, 'users', user.uid, 'transactions'),
            where('status', '==', 'Pending'),
            where('type', '==', 'Withdrawal'),
            where('targetAccount', '==', 'solidara')
        ) : null, [user?.uid, firestore]);

    const { data: pendingWithdrawals, loading: pendingWithdrawalsLoading } = useCollection<Transaction>(pendingWithdrawalQuery);

    const pendingSolidaraWithdrawal = pendingWithdrawals?.[0];

    if (loading || pendingWithdrawalsLoading) {
        return <PageSkeleton />;
    }

    const profileComplete = isProfileComplete(userData);

    const renderContent = () => {
        if (!profileComplete) {
            return <CompleteProfilePrompt />;
        }
        if (pendingSolidaraWithdrawal) {
            return <PendingWithdrawalCard transaction={pendingSolidaraWithdrawal} />;
        }
        if (userData) {
             return <WithdrawalForm 
                solidaraBalance={userData.solidaraBalance} 
                bankAccounts={userData.bankAccounts} 
            />;
        }
        return <CompleteProfilePrompt />; // Fallback
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Withdrawal</CardTitle>
                    <CardDescription>
                       {pendingSolidaraWithdrawal 
                            ? "You have a pending withdrawal request from your Olidara savings account."
                            : "Request a withdrawal from your Olidara savings account. Requests are processed by an admin."
                       }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {renderContent()}
                </CardContent>
            </Card>
        </div>
    );
}
