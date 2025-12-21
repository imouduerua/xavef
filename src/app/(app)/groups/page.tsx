
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import { Suspense } from "react";
import { AvailableGroupsList } from "@/components/groups/available-groups-list";
import { Separator } from "@/components/ui/separator";
import { MyGroupsSection } from "@/components/groups/my-groups-section";

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
                    <div className="space-y-8">
                         <div>
                            <Suspense fallback={<div>Loading your groups...</div>}>
                                <MyGroupsSection />
                            </Suspense>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="text-xl font-semibold mb-4">Available Groups</h3>
                             <Suspense fallback={<div>Loading available groups...</div>}>
                                <AvailableGroupsList />
                            </Suspense>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
