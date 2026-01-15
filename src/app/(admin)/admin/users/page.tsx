
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersTable } from "@/components/admin/users-table";
import { Suspense } from "react";

export default function AdminUsersPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            View and manage all registered users.
          </CardDescription>
        </CardHeader>
      </Card>
      <Suspense fallback={<div>Loading users...</div>}>
        <UsersTable />
      </Suspense>
    </div>
  );
}
