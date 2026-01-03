
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Wallet } from 'lucide-react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { addDoc, collection, serverTimestamp, writeBatch } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import type { BankAccount } from '@/lib/types';
import { firestore } from '@/firebase/client';
import { useAuthContext } from '@/context/auth-context';
import { Card, CardContent } from '../ui/card';

interface WithdrawalFormProps {
  solidaraBalance: number;
  bankAccounts: BankAccount[];
}

const WITHDRAWAL_FEE_PERCENTAGE = 0.033;

export function WithdrawalForm({ solidaraBalance, bankAccounts }: WithdrawalFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { user } = useAuthContext();

  const withdrawalSchema = z.object({
    amount: z.coerce
      .number()
      .positive('Amount must be positive.')
      .min(100, 'Minimum withdrawal is ₦100.00')
      .max(solidaraBalance, `Withdrawal cannot exceed your balance of ₦${solidaraBalance.toFixed(2)}`),
    bankAccountId: z.string().min(1, 'Please select a bank account.'),
  });

  const form = useForm<z.infer<typeof withdrawalSchema>>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: '' as any,
      bankAccountId: bankAccounts[0]?.bankAccountNumber || '',
    },
  });

  const watchAmount = form.watch('amount');
  const withdrawalAmount = Number(watchAmount) || 0;
  const fee = withdrawalAmount * WITHDRAWAL_FEE_PERCENTAGE;
  const payoutAmount = withdrawalAmount - fee;

  async function onSubmit(values: z.infer<typeof withdrawalSchema>) {
    setIsSubmitting(true);
    
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'User or database is not available. Please try again.',
      });
      setIsSubmitting(false);
      return;
    }

    const selectedAccount = bankAccounts.find(
      (acc) => acc.bankAccountNumber === values.bankAccountId
    );

    if (!selectedAccount) {
      toast({
        variant: 'destructive',
        title: 'Invalid Bank Account',
        description: 'The selected bank account could not be found.',
      });
      setIsSubmitting(false);
      return;
    }
    
    const finalAmount = Number(values.amount);
    const finalFee = finalAmount * WITHDRAWAL_FEE_PERCENTAGE;
    const finalPayout = finalAmount - finalFee;


    try {
      const transactionRef = collection(firestore, 'users', user.uid, 'transactions');
      
      const newTransaction = {
        date: serverTimestamp(),
        amount: -finalAmount, 
        fee: finalFee,
        payoutAmount: finalPayout, 
        description: `Withdrawal to ${selectedAccount.bankName}`,
        type: 'Withdrawal' as const,
        status: 'Pending' as const,
        targetAccount: 'solidara' as const,
        destinationBankName: selectedAccount.bankName,
        destinationAccountName: selectedAccount.accountName,
        destinationAccountNumber: selectedAccount.bankAccountNumber,
      };

      await addDoc(transactionRef, newTransaction);
      
      toast({
        title: 'Withdrawal Request Submitted',
        description: `Your request for ₦${finalAmount.toFixed(2)} is pending approval.`,
      });
      form.reset();

    } catch (error: any) {
      console.error('Error requesting withdrawal:', error);
      toast({
        variant: 'destructive',
        title: 'Request Failed',
        description: error.message || 'An unexpected client-side error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount to Withdraw</FormLabel>
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
              <FormDescription>
                Available Olidara Balance: ₦{solidaraBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="bankAccountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Withdraw To</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a bank account" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem
                      key={account.bankAccountNumber}
                      value={account.bankAccountNumber}
                    >
                      {account.bankName} - ****{account.bankAccountNumber.slice(-4)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {payoutAmount > 0 && (
             <Card className="bg-muted/50">
                <CardContent className="p-4 text-sm space-y-2">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Withdrawal Fee (3.3%)</span>
                        <span>- ₦{fee.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between font-semibold">
                        <span className="text-muted-foreground">You Will Receive</span>
                        <span>₦{payoutAmount.toFixed(2)}</span>
                    </div>
                </CardContent>
            </Card>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting Request...</>
          ) : (
            <><Wallet className="mr-2 h-4 w-4" /> Request Withdrawal</>
          )}
        </Button>
      </form>
    </Form>
  );
}
