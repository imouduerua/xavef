
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useUserData } from "@/hooks/use-user-data";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Wallet } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function isProfileComplete(userData: any) {
    if (!userData) return false;
    const requiredFields = [
        'firstName', 'lastName', 'phoneNumber', 'address', 'state', 'country',
        'bankName', 'accountName', 'bankAccountNumber'
    ];
    return requiredFields.every(field => userData[field] && userData[field].trim() !== '');
}

function WithdrawalForm() {
    // Placeholder for the actual withdrawal form
    return (
        <div>
            <p>Withdrawal form will be here.</p>
        </div>
    )
}

function CompleteProfilePrompt() {
    return (
        <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Profile Incomplete</AlertTitle>
            <AlertDescription>
                <div className="space-y-4">
                    <p>
                        To withdraw funds, you must first complete your personal and bank details in your profile.
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
                        Withdraw funds from your account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {profileComplete ? <WithdrawalForm /> : <CompleteProfilePrompt />}
                </CardContent>
            </Card>
        </div>
    );
}
