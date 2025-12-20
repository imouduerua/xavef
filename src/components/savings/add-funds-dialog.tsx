
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, PiggyBank } from 'lucide-react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { addFundsToGoal } from '@/app/(app)/savings/client-actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
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
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { SavingGoal } from '@/lib/types';

interface AddFundsDialogProps {
  goal: SavingGoal;
  solidaraBalance: number;
  children: React.ReactNode;
  disabled?: boolean;
}

export function AddFundsDialog({ goal, solidaraBalance, children, disabled }: AddFundsDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const formSchema = z.object({
    amount: z.coerce
      .number()
      .positive('Amount must be positive.')
      .min(1, 'Minimum amount is ₦1.00')
      .refine(amount => typeof solidaraBalance === 'number' ? amount <= solidaraBalance : true, {
        message: 'Amount cannot exceed your Solidara balance.'
      }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '' as any,
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not process request. Please try again later.',
      });
      return;
    }

    const result = await addFundsToGoal(firestore, user.uid, goal.id, values.amount);
    
    if (result.success) {
      toast({
        title: 'Funds Added!',
        description: `₦${values.amount.toFixed(2)} was added to your "${goal.name}" goal.`,
      });
      setIsOpen(false);
      form.reset({ amount: '' as any });
    } else {
      toast({
        variant: 'destructive',
        title: 'Transfer Failed',
        description: result.error,
      });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild disabled={disabled}>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Funds to "{goal.name}"</DialogTitle>
          <DialogDescription>
            Transfer money from your main Solidara account to this savings goal.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount to Add</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                        ₦
                      </span>
                      <Input type="number" placeholder="0.00" className="pl-8" {...field} />
                    </div>
                  </FormControl>
                   <FormDescription>
                    Available Solidara Balance: ₦{solidaraBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2 pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Transferring...</>
                ) : (
                  <><PiggyBank className="mr-2 h-4 w-4" /> Add Funds</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
