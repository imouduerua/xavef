
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AllGroupsTable } from "@/components/admin/all-groups-table";
import { Suspense } from "react";

export default function AdminGroupsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Group Management</CardTitle>
          <CardDescription>
            View and manage all savings groups on the platform.
          </CardDescription>
        </CardHeader>
      </Card>
      <Suspense fallback={<div>Loading groups...</div>}>
        <AllGroupsTable />
      </Suspense>
    </div>
  );
}
