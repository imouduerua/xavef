'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useUserData } from "@/hooks/use-user-data";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { UserData } from "@/lib/types";
import { WithdrawalForm } from "@/components/withdrawal/withdrawal-form";

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


export default function WithdrawalPage() {
    const { userData, loading: userDataLoading } = useUserData();

    if (userDataLoading) {
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

    const profileComplete = isProfileComplete(userData);

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Withdrawal</CardTitle>
                    <CardDescription>
                        Request a withdrawal from your Solidara savings account. Requests are processed by an admin.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {profileComplete && userData ? (
                        <WithdrawalForm 
                            solidaraBalance={userData.solidaraBalance} 
                            bankAccounts={userData.bankAccounts} 
                        />
                    ) : (
                        <CompleteProfilePrompt />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
