
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import { Suspense } from "react";
import { GroupsList } from "@/components/groups/groups-list";

export default function GroupsPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>Savings Groups</CardTitle>
                        <CardDescription>
                           Create or join a rotating savings group (Ajo/Esusu).
                        </CardDescription>
                    </div>
                    <CreateGroupDialog />
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<div>Loading groups...</div>}>
                        <GroupsList />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    );
}
