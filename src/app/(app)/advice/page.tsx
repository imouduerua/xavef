import { AdviceForm } from "@/components/advice/advice-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdvicePage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>AI-Powered Financial Advisor</CardTitle>
                <CardDescription>
                    Get personalized financial advice based on your current situation and goals. 
                    Fill in the details below, and our AI will provide you with actionable recommendations.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <AdviceForm />
            </CardContent>
        </Card>
    );
}
