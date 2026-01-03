
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { firestore } from '@/firebase/client';
import { useAuthContext } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { Group } from '@/lib/types';
import { HandCoins, Loader2 } from 'lucide-react';
import React from 'react';
import { contributeToGroupFromSavings } from '@/app/(app)/groups/client-actions';

interface ContributeDialogProps {
  group: Group;
  children: React.ReactNode;
}

export function ContributeDialog({ group, children }: ContributeDialogProps) {
  const [isContributing, setIsContributing] = React.useState(false);
  const { user } = useAuthContext();
  const { toast } = useToast();

  const formatCurrency = (amount: number) =>
    `₦${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handleContribute = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to contribute.',
      });
      return;
    }

    setIsContributing(true);
    const result = await contributeToGroupFromSavings(
      firestore,
      user.uid,
      group.id
    );

    if (result.success) {
      toast({
        title: 'Contribution Successful!',
        description: `Your contribution of ${formatCurrency(
          group.contributionAmount
        )} has been recorded.`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Contribution Failed',
        description:
          result.error || 'An unexpected error occurred. Please try again.',
      });
    }
    setIsContributing(false);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Weekly Contribution</AlertDialogTitle>
          <AlertDialogDescription>
            This will debit{' '}
            <span className="font-bold">
              {formatCurrency(group.contributionAmount)}
            </span>{' '}
            from your Olidara savings account for the group "{group.name}".
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isContributing}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleContribute} disabled={isContributing}>
            {isContributing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <HandCoins className="mr-2 h-4 w-4" />
                Confirm Contribution
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
