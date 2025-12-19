'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { createDepositTransaction } from '@/app/(app)/dashboard/actions';
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
import { useUser } from '@/firebase';

const depositSchema = z.object({
  amount: z.coerce
    .number()
    .positive('Amount must be a positive number.')
    .min(1, 'Deposit amount must be at least ₦1.00'),
});

type FormValues = z.infer<typeof depositSchema>;

interface DepositDialogProps {
  accountName: string;
  children: React.ReactNode;
}

export function DepositDialog({ accountName, children }: DepositDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user } = useUser();

  const form = useForm<FormValues>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: 0,
    },
  });

  const {
    formState: { isSubmitting },
    reset,
  } = form;

  async function onSubmit(values: FormValues) {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Not Authenticated',
            description: 'You must be logged in to make a deposit.',
        });
        return;
    }

    const result = await createDepositTransaction({
        userId: user.uid,
        amount: values.amount,
        description: `Deposit to ${accountName}`,
    });

    if (result.success) {
      toast({
        title: 'Deposit Submitted',
        description: `Your deposit of ₦${values.amount.toFixed(2)} is pending approval.`,
      });
      setIsOpen(false);
      reset({ amount: 0 });
    } else {
      toast({
        variant: 'destructive',
        title: 'Deposit Failed',
        description: result.error,
      });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Make a Deposit</DialogTitle>
          <DialogDescription>
            Deposits must be approved by an administrator before they are
            reflected in your balance.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Deposit'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
