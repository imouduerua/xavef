import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoansPage() {
    return (
        <div className="mx-auto max-w-3xl">
            <Card>
                <CardHeader>
                    <CardTitle>Loans</CardTitle>
                    <CardDescription>
                        Manage your loans.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Loan management features will be implemented here.</p>
                </CardContent>
            </Card>
        </div>
    );
}
