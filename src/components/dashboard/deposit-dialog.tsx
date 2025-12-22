
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Banknote, Loader2, CheckCircle, Upload } from 'lucide-react';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import type { AccountType } from '@/lib/types';
import { BankDetailsCard } from './bank-details-card';
import Image from 'next/image';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

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

const MAX_FILE_SIZE_MB = 1;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function DepositDialog({ 
    accountName, 
    targetAccount, 
    children, 
}: DepositDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [step, setStep] = React.useState<'amount' | 'details'>('amount');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [proofOfPayment, setProofOfPayment] = React.useState<{ file: File | null, dataUrl: string | null }>({ file: null, dataUrl: null });
  const { user } = useUser();
  const firestore = useFirestore();


  const form = useForm<FormValues>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: '' as any,
    },
  });

  const { reset, handleSubmit, getValues } = form;

  function handleAmountSubmit() {
    setStep('details');
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({
          variant: 'destructive',
          title: 'File Too Large',
          description: `The selected file must be smaller than ${MAX_FILE_SIZE_MB}MB.`,
        });
        setProofOfPayment({ file: null, dataUrl: null });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setProofOfPayment({ file: file, dataUrl: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };


  async function handleConfirmTransfer() {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Not Authenticated',
        description: 'You must be logged in to make a deposit.',
      });
      return;
    }

    setIsSubmitting(true);
    const values = getValues();
    const amountAsNumber = Number(values.amount);

    if (isNaN(amountAsNumber) || amountAsNumber <= 0) {
        toast({
            variant: "destructive",
            title: "Invalid Amount",
            description: "The deposit amount is not valid.",
        });
        setIsSubmitting(false);
        return;
    }

    const transactionRef = collection(firestore, `users/${user.uid}/transactions`);

    try {
      const newTransaction = {
        date: Timestamp.now(),
        amount: amountAsNumber,
        description: `Contribution to ${accountName}`,
        status: 'Pending' as const,
        type: 'Deposit' as const,
        targetAccount: targetAccount,
        proofOfPaymentUrl: proofOfPayment.dataUrl || '',
      };
      
      await addDoc(transactionRef, newTransaction);

      toast({
        title: 'Contribution Submitted',
        description: `Your contribution of ₦${amountAsNumber.toFixed(
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
      setTimeout(() => {
        reset({ amount: '' as any });
        setStep('amount');
        setProofOfPayment({ file: null, dataUrl: null });
      }, 300);
    }
  };
  
  const dialogTitle = `Contribute to ${accountName}`;
  const amountLabel = 'Amount';


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md grid-rows-[auto_minmax(0,1fr)_auto] p-0 max-h-[90vh]">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{dialogTitle}</DialogTitle>
           {step === 'amount' && (
            <DialogDescription>
              Enter the amount you wish to contribute. You will be shown bank transfer details in the next step.
            </DialogDescription>
          )}
           {step === 'details' && (
             <DialogDescription>
                Transfer the exact amount, then upload your receipt to confirm.
             </DialogDescription>
           )}
        </DialogHeader>

        <div className="grid gap-4 overflow-y-auto">
          <Form {...form}>
            {step === 'amount' ? (
                <form onSubmit={handleSubmit(handleAmountSubmit)} className="space-y-4 px-6">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{amountLabel}</FormLabel>
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
            ) : (
              <div className='px-6 space-y-4'>
                  <BankDetailsCard amount={Number(getValues("amount"))} />
                    <FormItem>
                      <FormLabel htmlFor="receipt">Proof of Payment (Optional)</FormLabel>
                      <FormControl>
                        <Input id="receipt" type="file" accept="image/*" onChange={handleFileChange} />
                      </FormControl>
                      <FormDescription>
                          Upload a screenshot or receipt. Max size: {MAX_FILE_SIZE_MB}MB.
                      </FormDescription>
                      {proofOfPayment.dataUrl && (
                          <div className="mt-4 relative w-full h-40 rounded-md overflow-hidden border">
                              <Image src={proofOfPayment.dataUrl} alt="Receipt preview" layout="fill" objectFit="contain" />
                          </div>
                      )}
                    </FormItem>
              </div>
            )}
          </Form>
        </div>
        {step === 'details' && (
            <DialogFooter className="gap-2 sm:justify-end p-6 pt-4 border-t">
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
        )}
      </DialogContent>
    </Dialog>
  );
}
