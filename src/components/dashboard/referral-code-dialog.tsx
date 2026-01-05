
'use client';

import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import React from 'react';

import { useFirestore, useUser } from '@/firebase/provider';
import { toast } from '@/hooks/use-toast';
import { Loader2, Copy, Share2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

export function ReferralCodeDialog({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [generatedCode, setGeneratedCode] = React.useState<string | null>(null);
    const { user } = useUser();
    const firestore = useFirestore();

    const generateCode = async () => {
        if (!user || !firestore) return;
        
        setIsLoading(true);
        setGeneratedCode(null);

        const codesRef = collection(firestore, 'referralCodes');
        const q = query(codesRef, where('creatorUid', '==', user.uid), where('used', '==', false));
        const existingCodesSnap = await getDocs(q);

        if (!existingCodesSnap.empty) {
            setGeneratedCode(existingCodesSnap.docs[0].data().code);
            setIsLoading(false);
            return;
        }

        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        try {
            await addDoc(codesRef, {
                code,
                creatorUid: user.uid,
                used: false,
                createdAt: serverTimestamp(),
            });
            setGeneratedCode(code);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Generation Failed",
                description: "You do not have permission to generate a code."
            })
            setIsOpen(false);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!generatedCode) return;
        navigator.clipboard.writeText(generatedCode);
        toast({
            title: 'Copied!',
            description: 'Referral code copied to clipboard.',
        });
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open) {
            generateCode();
        } else {
            setTimeout(() => {
                setGeneratedCode(null);
                setIsLoading(false);
            }, 300)
        }
    }


    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Your Referral Code</DialogTitle>
                    <DialogDescription>
                        Share this code with a new user. They can use it once during signup.
                    </DialogDescription>
                </DialogHeader>

                {isLoading && (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                )}

                {generatedCode && (
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Input
                                id="referral-code"
                                value={generatedCode}
                                readOnly
                                className="h-12 text-2xl font-mono tracking-widest text-center"
                            />
                            <Button type="button" size="icon" className="h-12 w-12" onClick={copyToClipboard}>
                                <Copy className="h-6 w-6" />
                            </Button>
                        </div>
                        <Alert>
                            <Share2 className="h-4 w-4" />
                            <AlertTitle>How it works</AlertTitle>
                            <AlertDescription>
                                Give this one-time use code to someone new to XAVEF. They will be prompted to enter it when they create their account.
                            </AlertDescription>
                        </Alert>
                    </div>
                )}

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            Close
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

    