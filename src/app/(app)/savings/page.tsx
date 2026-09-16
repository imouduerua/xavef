
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateGoalDialog } from "@/components/savings/create-goal-dialog";
import { GoalsList } from "@/components/savings/goals-list";
import { Suspense } from "react";

export default function SavingsPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>Savings Goals</CardTitle>
                        <CardDescription>
                            Create and manage your savings goals to track your progress.
                        </CardDescription>
                    </div>
                    <CreateGoalDialog />
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<div>Loading goals...</div>}>
                        <GoalsList />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    );
}

    