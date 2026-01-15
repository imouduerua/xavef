
'use client';
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Button } from "../ui/button";

export function MissingIndexAlert({ url }: { url: string }) {
    return (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Database Index Required</AlertTitle>
            <AlertDescription>
                <p className="mb-4">
                    To efficiently query and sort the data for this page, a composite index is needed in Firestore.
                    Please click the button below to open the Firebase console and create the required index.
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
