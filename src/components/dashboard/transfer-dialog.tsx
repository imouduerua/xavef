'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Repeat } from 'lucide-react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { makeTransfer } from '@/app/(app)/dashboard/actions';
import type { AccountType } from '@/lib/types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

const formSchema = z.discriminatedUnion('transferType', [
  z.object({
    transferType: z.literal('toSelf'),
    amount: z.coerce.number().positive('Amount must be a positive number.'),
    fromAccount: z.literal('solidara'),
    toAccount: z.enum(['solidara', 'annual']),
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
  onSelfTransfer: (
    amount: number,
    from: AccountType,
    to: AccountType
  ) => boolean;
}

export function TransferDialog({ balances, onSelfTransfer }: TransferDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'toSelf' | 'toOther'>(
    'toSelf'
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transferType: 'toSelf',
      amount: undefined,
      fromAccount: 'solidara',
      toAccount: 'annual',
    },
  });

  const { formState: { isSubmitting }, reset } = form;

  async function onSubmit(values: FormValues) {
    if (values.transferType === 'toSelf') {
      const success = onSelfTransfer(
        values.amount,
        values.fromAccount,
        values.toAccount as AccountType
      );
      if (success) {
        toast({
          title: 'Transfer Successful!',
          description: `You transferred ₦${values.amount.toFixed(2)} from your ${
            values.fromAccount
          } account to your ${values.toAccount} account.`,
        });
        setIsOpen(false);
        reset({ transferType: 'toSelf', amount: undefined, fromAccount: 'solidara', toAccount: 'annual' });
      }
    } else if (values.transferType === 'toOther') {
      const result = await makeTransfer({
        recipientId: values.recipientId,
        amount: values.amount,
      });
      if (result.success) {
        toast({
          title: 'Transfer Successful!',
          description: `You sent ₦${values.amount.toFixed(
            2
          )} to ID ${values.recipientId}.`,
        });
        setIsOpen(false);
        reset({ transferType: 'toOther', amount: undefined, recipientId: '' });
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
      amount: undefined,
      ...(tab === 'toSelf'
        ? { fromAccount: 'solidara', toAccount: 'annual' }
        : { recipientId: '' }),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                 <FormItem>
                    <FormLabel>From</FormLabel>
                    <Select defaultValue="solidara" disabled>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select source account" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="solidara">
                                Savings (Olidara) (Balance: ₦{balances.solidara.toFixed(2)})
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </FormItem>
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
                            <SelectValue placeholder="Select destination account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           <SelectItem value="solidara" disabled>
                            Savings (Olidara) (Balance: ₦{balances.solidara.toFixed(2)})
                          </SelectItem>
                          <SelectItem value="annual">
                            Annual Savings (Balance: ₦{balances.annual.toFixed(2)})
                          </SelectItem>
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
                    Sending...
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
