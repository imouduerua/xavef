import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export function MissingIndexAlert({ url }: { url: string }) {
    return (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Database Index Required</AlertTitle>
            <AlertDescription>
                <p className="mb-4">
                    This query requires a composite index. To view the data, please create the necessary index in the Firebase console.
                    It may take a few minutes for the index to build after creation.
                </p>
                <Button asChild>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                        Create Database Index
                    </a>
                </Button>
            </AlertDescription>
        </Alert>
    )
}
