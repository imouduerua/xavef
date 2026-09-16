
'use client'

import { AdviceForm } from "@/components/advice/advice-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminStatus } from "@/hooks/use-admin-status";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdvicePage() {
    const { isAdmin, loading } = useAdminStatus();
    const router = useRouter();

    // Redirect admins away from this user-specific page.
    useEffect(() => {
        if (!loading && isAdmin) {
            router.replace('/admin');
        }
    }, [isAdmin, loading, router]);
    
    // Don't render for admins, even during the redirect.
    if (loading || isAdmin) {
        return null;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>AI-Powered Financial Advisor</CardTitle>
                    <CardDescription>
                        Get personalized financial advice based on your current situation and goals. 
                        Fill in the details below, and our AI will provide you with actionable recommendations.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AdviceForm />
                </CardContent>
            </Card>
        </div>
    );
}
