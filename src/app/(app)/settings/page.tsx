import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Settings</CardTitle>
                    <CardDescription>
                        Manage your account settings.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Settings management features will be implemented here.</p>
                </CardContent>
            </Card>
        </div>
    );
}
