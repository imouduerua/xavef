import { UserList } from "@/components/admin/user-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminUsersPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Oversee all users and their transactions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <UserList />
                </CardContent>
            </Card>
        </div>
    );
}
