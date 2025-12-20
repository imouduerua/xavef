'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Wallet } from 'lucide-react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
import { requestWithdrawal } from '@/app/(app)/withdrawal/actions';
import { useAuth } from '@/firebase';

interface WithdrawalFormProps {
  solidaraBalance: number;
  bankAccounts: BankAccount[];
}

export function WithdrawalForm({ solidaraBalance, bankAccounts }: WithdrawalFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const auth = useAuth();

  const withdrawalSchema = z.object({
    amount: z.coerce
      .number()
      .positive('Amount must be positive.')
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

  async function onSubmit(values: z.infer<typeof withdrawalSchema>) {
    setIsSubmitting(true);
    
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

    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            throw new Error("User not authenticated.");
        }

        const idToken = await currentUser.getIdToken();

        const result = await requestWithdrawal({
            amount: values.amount,
            destinationBank: selectedAccount,
        });

      if (result.success) {
        toast({
          title: 'Withdrawal Request Submitted',
          description: `Your request for ₦${values.amount.toFixed(2)} is pending approval.`,
        });
        form.reset();
      } else {
        throw new Error(result.error || 'An unknown error occurred.');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Request Failed',
        description: error.message,
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
                Available Solidara Balance: ₦{solidaraBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
