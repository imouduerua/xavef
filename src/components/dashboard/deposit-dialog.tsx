'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Banknote, Loader2, CheckCircle } from 'lucide-react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import type { AccountType } from '@/lib/types';
import { BankDetailsCard } from './bank-details-card';

const depositSchema = z.object({
  amount: z.coerce
    .number()
    .positive('Amount must be a positive number.')
    .min(1, 'Deposit amount must be at least ₦1.00'),
});

type FormValues = z.infer<typeof depositSchema>;

interface DepositDialogProps {
  accountName: string;
  targetAccount: AccountType;
  children: React.ReactNode;
}

export function DepositDialog({ accountName, targetAccount, children }: DepositDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [step, setStep] = React.useState<'amount' | 'details'>('amount');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { user } = useUser();
  const firestore = useFirestore();

  const form = useForm<FormValues>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: undefined,
    },
  });

  const { reset, handleSubmit, getValues } = form;

  // This function is called when the first form (amount) is submitted
  function handleAmountSubmit() {
    setStep('details');
  }

  // This function is called when the user confirms they've made the transfer
  async function handleConfirmTransfer() {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not Authenticated',
        description: 'You must be logged in to make a deposit.',
      });
      return;
    }
    
    if(!firestore) return;

    setIsSubmitting(true);
    const values = getValues();
    const transactionRef = collection(firestore, `users/${user.uid}/transactions`);

    try {
      const newTransaction = {
        date: serverTimestamp(),
        amount: values.amount,
        description: `Deposit to ${accountName}`,
        status: 'Pending',
        type: 'Deposit',
        targetAccount: targetAccount,
      };
      
      await addDoc(transactionRef, newTransaction);

      toast({
        title: 'Deposit Submitted',
        description: `Your deposit of ₦${values.amount.toFixed(
          2
        )} is pending approval.`,
      });
      setIsOpen(false);
    } catch (error: any) {
      console.error('Error creating deposit transaction:', error);
      toast({
        variant: 'destructive',
        title: 'Deposit Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset state when dialog is closed
      setTimeout(() => {
        reset({ amount: undefined });
        setStep('amount');
      }, 300); // Delay to allow animation to finish
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Make a Deposit</DialogTitle>
           {step === 'amount' && (
            <DialogDescription>
              Enter the amount you wish to deposit. You will be shown bank transfer details in the next step.
            </DialogDescription>
          )}
           {step === 'details' && (
             <DialogDescription>
                Transfer the exact amount to the account below. Your balance will be updated upon admin approval.
             </DialogDescription>
           )}
        </DialogHeader>

        {step === 'amount' && (
          <Form {...form}>
            <form onSubmit={handleSubmit(handleAmountSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                          ₦
                        </span>
                        <Input
                          type="number"
                          placeholder="0.00"
                          className="pl-8"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2 sm:justify-end pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit">
                  <Banknote className="mr-2 h-4 w-4" />
                  Proceed to Transfer
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {step === 'details' && (
            <div className='space-y-4'>
                <BankDetailsCard amount={getValues("amount")} />
                 <DialogFooter className="gap-2 sm:justify-end pt-4">
                    <Button type="button" variant="outline" onClick={() => setStep('amount')}>
                        Back
                    </Button>
                    <Button type="button" onClick={handleConfirmTransfer} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                             <>
                               <CheckCircle className="mr-2 h-4 w-4" />
                                I Have Made The Transfer
                             </>
                        )}
                    </Button>
                </DialogFooter>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
