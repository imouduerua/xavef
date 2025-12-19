'use client';

import { useFirestore } from '@/firebase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { addDoc, collection } from 'firebase/firestore';
import { Check, Copy, Loader2, PartyPopper } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';

interface ReferralCodeDialogProps {
  userId: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
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
  isOpen,
  setIsOpen,
}: ReferralCodeDialogProps) {
  const firestore = useFirestore();
  const [code, setCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleGenerateCode = async () => {
    if (!userId || !firestore) return;
    setIsLoading(true);
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
    } catch (error: any) {
      console.error("Error generating referral code:", error);
      toast({
        variant: 'destructive',
        title: 'Failed to Generate Code',
        description: error.message || 'An unexpected error occurred. Please try again.',
      });
      setIsOpen(false);
    } finally {
        setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (isOpen) {
      handleGenerateCode();
    } else {
      // Reset state when dialog is closed
      setCode(null);
      setIsLoading(false);
      setIsCopied(false);
    }
  }, [isOpen]);

  const handleCopy = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setIsCopied(true);
      toast({
        title: 'Copied!',
        description: 'The referral code has been copied to your clipboard.',
      });
      setTimeout(() => setIsCopied(false), 2000); // Reset icon after 2 seconds
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
             <PartyPopper className="h-6 w-6" />
            Your One-Time Referral Code
          </DialogTitle>
          <DialogDescription>
            Share this code with a friend. It can only be used once.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 pt-4">
          {isLoading || !code ? (
            <div className="flex h-10 w-full items-center justify-center rounded-md border border-dashed">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid flex-1 gap-2">
              <pre className="flex h-10 w-full items-center justify-center rounded-md bg-muted px-4 font-mono text-lg font-semibold text-muted-foreground">
                {code}
              </pre>
            </div>
          )}
          <Button type="button" size="icon" onClick={handleCopy} disabled={!code || isLoading}>
            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="sr-only">Copy</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
