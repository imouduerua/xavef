
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import { Suspense } from "react";
import { AvailableGroupsList } from "@/components/groups/available-groups-list";
import { Separator } from "@/components/ui/separator";
import { MyGroupsSection } from "@/components/groups/my-groups-section";
import { XavefLoanPoolCard } from "@/components/groups/xavef-loan-pool-card";
import { useFirestore } from "@/firebase/provider";

export default function GroupsPage() {
    const firestore = useFirestore();
    
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
             <XavefLoanPoolCard />
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>Peer-to-Peer Savings Groups</CardTitle>
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
                                {firestore ? <MyGroupsSection /> : <div>Loading...</div>}
                            </Suspense>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="text-xl font-semibold mb-4">Available Groups to Join</h3>
                             <Suspense fallback={<div>Loading available groups...</div>}>
                                {firestore ? <AvailableGroupsList /> : <div>Loading...</div>}
                             </Suspense>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
