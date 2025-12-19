import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoansPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8">
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
