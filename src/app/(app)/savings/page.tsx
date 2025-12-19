import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SavingsPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Savings</CardTitle>
                    <CardDescription>
                        Manage your savings accounts and goals.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Savings management features will be implemented here.</p>
                </CardContent>
            </Card>
        </div>
    );
}
