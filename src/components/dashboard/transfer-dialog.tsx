

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Repeat } from 'lucide-react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
import { Separator } from '../ui/separator';

const formSchema = z.object({
    amount: z.coerce.number().positive('Amount must be a positive number.'),
    fromAccount: z.enum(['solidara', 'annual']),
    toAccount: z.string().min(1, "Please select a destination."),
  }).refine((data) => {
    return data.fromAccount !== data.toAccount;
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
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '' as any,
      fromAccount: 'solidara',
      toAccount: '',
    },
  });

  const { formState: { isSubmitting }, reset } = form;

  async function onSubmit(values: FormValues) {
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
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
       reset({
        amount: '' as any,
        fromAccount: 'solidara',
        toAccount: ''
       });
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
            Move money between your savings accounts and goals.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
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
