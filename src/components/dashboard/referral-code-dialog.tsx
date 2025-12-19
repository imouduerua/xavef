'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth, useFirestore } from '@/firebase';
import { toast } from '@/hooks/use-toast';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Check, Copy, Loader2, PartyPopper, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface ReferralCodeDialogProps {
  userId: string;
  children: React.ReactNode;
}

function generateRandomCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}


export function ReferralCodeDialog({
  userId,
  children,
}: ReferralCodeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const firestore = useFirestore();

  const handleGenerateCode = async () => {
    if (!userId) return;
    setIsLoading(true);
    setIsCopied(false);
    try {
      const newCode = generateRandomCode();
      // Note: In a production app, you'd want a server-side check to guarantee uniqueness.
      // For this development environment, client-side generation is acceptable.
      const referralDocRef = doc(firestore, 'referralCodes', newCode);

      await setDoc(referralDocRef, {
        code: newCode,
        creatorUid: userId,
        used: false,
        createdAt: serverTimestamp(),
      });
      
      setCode(newCode);
      toast({
        title: 'Code Generated!',
        description: 'You can now copy and share your new code.',
      });

    } catch (error: any) {
      console.error('Error generating referral code:', error);
      
      let description = 'An unexpected error occurred. Please try again.';
      if (error.message && error.message.includes('permission-denied')) {
          description = "You don't have permission to create a referral code. Please check Firestore rules."
      }

      toast({
        variant: 'destructive',
        title: 'Failed to Generate Code',
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setIsCopied(true);
      toast({
        title: 'Copied!',
        description: 'The referral code has been copied to your clipboard.',
      });
      setTimeout(() => setIsCopied(false), 3000); // Reset icon after 3 seconds
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset state when the dialog is closed
      setCode(null);
      setIsLoading(false);
      setIsCopied(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PartyPopper className="h-6 w-6" />
            Your One-Time Referral Code
          </DialogTitle>
          <DialogDescription>
            Generate a new code to share with a friend. Each code can only be used once.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
            <div className="flex items-center space-x-2">
                <Input
                    id="link"
                    value={code || 'Click the button to generate a code'}
                    readOnly
                    className="h-12 text-center font-mono text-lg tracking-widest"
                />
                 <Button
                    type="button"
                    size="icon"
                    className="h-12 w-12 shrink-0"
                    onClick={handleCopy}
                    disabled={!code || isLoading}
                >
                    {isCopied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    <span className="sr-only">Copy</span>
                </Button>
            </div>
             <Button onClick={handleGenerateCode} disabled={isLoading} className="w-full">
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                    </>
                ) : (
                    <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Generate New Code
                    </>
                )}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
