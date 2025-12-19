import { UserList } from "@/components/admin/user-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";

export default function AdminDashboardPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Admin Dashboard</CardTitle>
                <CardDescription>Oversee all users and their transactions.</CardDescription>
            </CardHeader>
            <CardContent>
                <Suspense fallback={<div>Loading users...</div>}>
                    <UserList />
                </Suspense>
            </CardContent>
        </Card>
    );
}
