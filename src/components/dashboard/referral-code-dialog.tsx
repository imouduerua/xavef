'use client';

import { useFirestore } from '@/firebase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { addDoc, collection } from 'firebase/firestore';
import { Check, Copy, Loader2, PartyPopper, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface ReferralCodeDialogProps {
  userId: string;
  children: React.ReactNode;
}

function generateReferralCode(length = 8) {
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
  const firestore = useFirestore();
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleGenerateCode = async () => {
    if (!userId || !firestore) return;
    setIsLoading(true);
    setIsCopied(false);
    try {
      const newCode = generateReferralCode();
      const referralCodesRef = collection(firestore, 'referralCodes');

      await addDoc(referralCodesRef, {
        code: newCode,
        creatorUid: userId,
        used: false,
        createdAt: new Date().toISOString(),
      });

      setCode(newCode);
      toast({
        title: 'Code Generated!',
        description: 'You can now copy and share your new code.',
      });
    } catch (error: any) {
      console.error('Error generating referral code:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Generate Code',
        description:
          error.message || 'An unexpected error occurred. Please try again.',
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
