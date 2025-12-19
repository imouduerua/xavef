'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Admin Dashboard</CardTitle>
                    <CardDescription>Welcome to the XAVEF Financials control panel. From here you can oversee users and manage the application.</CardDescription>
                </CardHeader>
            </Card>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">User Management</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Oversee Users</div>
                        <p className="text-xs text-muted-foreground">
                            View all registered users and their transaction histories.
                        </p>
                    </CardContent>
                    <CardContent>
                         <Button asChild>
                            <Link href="/admin/users">Go to User Management</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
