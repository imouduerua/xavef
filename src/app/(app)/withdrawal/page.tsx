import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function WithdrawalPage() {
    return (
        <div className="mx-auto max-w-3xl">
            <Card>
                <CardHeader>
                    <CardTitle>Withdrawal</CardTitle>
                    <CardDescription>
                        Withdraw funds from your account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Withdrawal features will be implemented here.</p>
                </CardContent>
            </Card>
        </div>
    );
}
