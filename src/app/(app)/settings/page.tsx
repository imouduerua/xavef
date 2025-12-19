import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
    return (
        <div className="mx-auto max-w-3xl">
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
