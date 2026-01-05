
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";
import { AdminGroupsList } from "@/components/admin/admin-groups-list";

export default function AdminGroupsPage() {
    
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>Group Management</CardTitle>
                        <CardDescription>
                           Oversee all peer-to-peer savings groups on the platform.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xl font-semibold mb-4">All Active & Forming Groups</h3>
                             <Suspense fallback={<div>Loading groups...</div>}>
                                <AdminGroupsList />
                             </Suspense>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

    