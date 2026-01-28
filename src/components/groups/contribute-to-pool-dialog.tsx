
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, HandCoins } from 'lucide-react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { contributeToGroupPoolFromSavings } from '@/app/(app)/groups/client-actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger,
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
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { UserData } from '@/lib/types';
import { doc } from 'firebase/firestore';

interface ContributeToPoolDialogProps {
  children: React.ReactNode;
  disabled?: boolean;
}

const formSchema = z.object({
  amount: z.coerce
    .number()
    .positive('Amount must be positive.')
    .min(1, 'Minimum amount is ₦1.00'),
});

type FormValues = z.infer<typeof formSchema>;

export function ContributeToPoolDialog({ children, disabled }: ContributeToPoolDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user } = useUser();
  const { toast } = useToast();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => (firestore && user?.uid ? doc(firestore, 'users', user.uid) : null), [firestore, user?.uid]);
  const { data: userData, loading: userDataLoading } = useDoc<UserData>(userDocRef);
  const olidaraBalance = userData?.olidaraBalance ?? 0;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '' as any,
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: FormValues) {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not process request. Please try again later.',
      });
      return;
    }
    
    if (values.amount > olidaraBalance) {
        form.setError("amount", { type: "manual", message: `Amount cannot exceed your Olidara balance of ₦${olidaraBalance.toFixed(2)}.` });
        return;
    }

    const result = await contributeToGroupPoolFromSavings(firestore, user, values.amount);
    
    if (result.success) {
      toast({
        title: 'Contribution Successful!',
        description: `₦${values.amount.toFixed(2)} was contributed to the Xavef Savings Pool.`,
      });
      setIsOpen(false);
    } else {
      toast({
        variant: 'destructive',
        title: 'Contribution Failed',
        description: result.error,
      });
    }
  }

  const onOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset({ amount: '' as any });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild disabled={disabled}>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contribute to Xavef Savings Pool</DialogTitle>
          <DialogDescription>
            Transfer funds from your flexible Olidara savings account to the pool.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount to Contribute</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                        ₦
                      </span>
                      <Input type="number" placeholder="0.00" className="pl-8" {...field} />
                    </div>
                  </FormControl>
                   <FormDescription>
                    Available Olidara Balance: {userDataLoading ? 'Loading...' : `₦${olidaraBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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
              <Button type="submit" disabled={isSubmitting || userDataLoading}>
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Contributing...</>
                ) : (
                  <><HandCoins className="mr-2 h-4 w-4" /> Contribute</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    
