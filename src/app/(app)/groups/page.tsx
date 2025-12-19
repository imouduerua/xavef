import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function GroupsPage() {
    return (
        <div className="mx-auto max-w-3xl">
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
