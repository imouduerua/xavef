

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Repeat, UserCheck } from 'lucide-react';
import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { findUserByXavefIdClient, makeTransferClient } from '@/app/(app)/dashboard/client-actions';
import type { AccountType, SavingGoal } from '@/lib/types';
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';
import { useUser, useFirestore } from '@/firebase';
import { useDebounce } from 'use-debounce';

const formSchema = z.discriminatedUnion('transferType', [
  z.object({
    transferType: z.literal('toSelf'),
    amount: z.coerce.number().positive('Amount must be a positive number.'),
    fromAccount: z.enum(['solidara', 'annual']),
    toAccount: z.string().min(1, "Please select a destination."),
  }),
  z.object({
    transferType: z.literal('toOther'),
    amount: z.coerce.number().positive('Amount must be a positive number.'),
    recipientId: z.string().min(1, 'Recipient ID is required.'),
  }),
]).refine((data) => {
    if (data.transferType === 'toSelf') {
        return data.fromAccount !== data.toAccount;
    }
    return true;
}, {
    message: 'Source and destination accounts cannot be the same.',
    path: ['toAccount'],
});


type FormValues = z.infer<typeof formSchema>;

interface TransferDialogProps {
  balances: { solidara: number; annual: number };
  goals: SavingGoal[];
  onSelfTransfer: (
    amount: number,
    from: AccountType,
    to: string
  ) => Promise<boolean>;
}

export function TransferDialog({ balances, goals, onSelfTransfer }: TransferDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'toSelf' | 'toOther'>(
    'toSelf'
  );
  const { user } = useUser();
  const firestore = useFirestore();
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [isCheckingRecipient, setIsCheckingRecipient] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transferType: 'toSelf',
      amount: '' as any,
      fromAccount: 'solidara',
      toAccount: '',
    },
  });

  const { formState: { isSubmitting }, reset, getValues, watch } = form;

  const recipientIdValue = watch('recipientId', '');
  const [debouncedRecipientId] = useDebounce(recipientIdValue, 500);

  const checkRecipient = useCallback(async (id: string) => {
    if (!id || !user || !firestore) {
        setRecipientName(null);
        return;
    }
    setIsCheckingRecipient(true);
    const result = await findUserByXavefIdClient(firestore, id, user.uid);
    if (result.success && result.name) {
        setRecipientName(result.name);
    } else {
        setRecipientName(null);
    }
    setIsCheckingRecipient(false);
  }, [user, firestore]);

  useEffect(() => {
    if (debouncedRecipientId) {
        checkRecipient(debouncedRecipientId);
    } else {
        setRecipientName(null);
    }
  }, [debouncedRecipientId, checkRecipient]);


  async function onSubmit(values: FormValues) {
    if (values.transferType === 'toSelf') {
      if (values.amount > balances.solidara) {
         toast({
            variant: "destructive",
            title: "Transfer Failed",
            description: "Insufficient Olidara balance.",
        });
        return;
      }
      const success = await onSelfTransfer(
        values.amount,
        values.fromAccount,
        values.toAccount
      );
      if (success) {
        setIsOpen(false);
      }
    } else if (values.transferType === 'toOther') {
       if (!user || !firestore) {
         toast({ variant: 'destructive', title: 'Not Authenticated' });
         return;
      }
       if (values.amount > balances.solidara) {
         toast({
            variant: "destructive",
            title: "Transfer Failed",
            description: "Insufficient Olidara balance.",
        });
        return;
      }
      if (!recipientName) {
         toast({
            variant: "destructive",
            title: "Invalid Recipient",
            description: "Please enter a valid recipient Xavef ID.",
        });
        return;
      }
      const result = await makeTransferClient(firestore, {
        senderUid: user.uid,
        recipientXavefId: values.recipientId,
        recipientName: recipientName,
        amount: values.amount,
      });
      if (result.success) {
        toast({
          title: 'Transfer Successful!',
          description: `You have sent ₦${values.amount.toFixed(
            2
          )} to ${recipientName}.`,
        });
        setIsOpen(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Transfer Failed',
          description: result.error,
        });
      }
    }
  }

  const handleTabChange = (value: string) => {
    const tab = value as 'toSelf' | 'toOther';
    setActiveTab(tab);
    reset({
      transferType: tab,
      amount: '' as any,
      ...(tab === 'toSelf'
        ? { fromAccount: 'solidara', toAccount: '' }
        : { recipientId: '' }),
    });
    setRecipientName(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
       handleTabChange('toSelf');
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Repeat className="mr-2 h-4 w-4" />
          Transfer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Funds</DialogTitle>
          <DialogDescription>
            Move money between your accounts or send to another Xavef user.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="toSelf">To Self</TabsTrigger>
                <TabsTrigger value="toOther">To Other User</TabsTrigger>
              </TabsList>
              <TabsContent value="toSelf" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                           <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">₦</span>
                           <Input type="number" placeholder="0.00" className="pl-8" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="fromAccount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select source account" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="solidara">
                                Olidara Savings (Balance: ₦{balances.solidara.toFixed(2)})
                            </SelectItem>
                             <SelectItem value="annual" disabled>
                                Annual Savings (Balance: ₦{balances.annual.toFixed(2)})
                            </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="toAccount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select destination" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="annual">
                            Annual Savings (Balance: ₦{balances.annual.toFixed(2)})
                          </SelectItem>
                           {goals.length > 0 && <Separator className="my-2" />}
                           {goals.map(goal => (
                              <SelectItem key={goal.id} value={goal.id}>
                                  Goal: {goal.name} (Balance: ₦{goal.currentAmount.toFixed(2)})
                              </SelectItem>
                           ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              <TabsContent value="toOther" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="recipientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient&apos;s Xavef ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 5678" {...field} />
                      </FormControl>
                       {isCheckingRecipient && <div className="text-sm text-muted-foreground flex items-center pt-2"><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Checking...</div>}
                       {recipientName && !isCheckingRecipient && (
                          <div className="text-sm text-green-600 font-medium flex items-center pt-2">
                            <UserCheck className="mr-2 h-4 w-4" />
                            {recipientName}
                          </div>
                        )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (₦)</FormLabel>
                       <FormControl>
                        <div className="relative">
                           <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">₦</span>
                           <Input type="number" placeholder="0.00" className="pl-8" {...field} />
                        </div>
                      </FormControl>
                       <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormDescription>
                    From Olidara Savings (Balance: ₦{balances.solidara.toFixed(2)})
                 </FormDescription>
              </TabsContent>
            </Tabs>
            <DialogFooter className="gap-2 sm:justify-end pt-4">
              <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Transfer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
