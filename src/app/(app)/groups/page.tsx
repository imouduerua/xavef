import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function GroupsPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Groups</CardTitle>
                    <CardDescription>
                        Manage your savings groups.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Group management features will be implemented here.</p>
                </CardContent>
            </Card>
        </div>
    );
}
