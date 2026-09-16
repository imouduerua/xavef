import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminManagementClient } from "@/components/admin/admin-management-client";
import { Suspense } from "react";

export default function AdminManagementPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Management</CardTitle>
          <CardDescription>
            Grant and revoke administrative privileges for users.
          </CardDescription>
        </CardHeader>
      </Card>
      <Suspense fallback={<div>Loading management tools...</div>}>
        <AdminManagementClient />
      </Suspense>
    </div>
  );
}
