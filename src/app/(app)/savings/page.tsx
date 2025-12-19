import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SavingsPage() {
    return (
        <div className="mx-auto max-w-3xl">
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
