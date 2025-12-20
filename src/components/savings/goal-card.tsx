
'use client';

import { format, formatDistanceToNow } from 'date-fns';
import { MoreVertical, Trash2, Pencil, PartyPopper } from 'lucide-react';
import React from 'react';

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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import type { SavingGoal } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase';
import { deleteSavingGoal, withdrawCompletedGoal } from '@/app/(app)/savings/client-actions';
import { AddFundsDialog } from './add-funds-dialog';
import { useUserData } from '@/hooks/use-user-data';
import { EditGoalDialog } from './edit-goal-dialog';


interface GoalCardProps {
  goal: SavingGoal;
}

export function GoalCard({ goal }: GoalCardProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { userData, loading: userDataLoading } = useUserData();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isWithdrawing, setIsWithdrawing] = React.useState(false);

  const isCompleted = goal.targetAmount > 0 && goal.currentAmount >= goal.targetAmount;
  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const targetDate = goal.targetDate ? goal.targetDate.toDate() : null;

  const formatCurrency = (amount: number) =>
    `₦${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handleDelete = async () => {
    if (!user || !firestore) return;
    setIsDeleting(true);
    const result = await deleteSavingGoal(firestore, user.uid, goal.id);
    if (result.success) {
      toast({
        title: 'Goal Deleted',
        description: `Your goal "${goal.name}" has been removed.`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
      setIsDeleting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user || !firestore) return;
    setIsWithdrawing(true);
    const result = await withdrawCompletedGoal(firestore, user.uid, goal.id);
    if (result.success) {
      toast({
        title: 'Goal Completed!',
        description: `Funds from "${goal.name}" have been moved to your Solidara savings account and the goal has been reset.`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Withdrawal Failed',
        description: result.error,
      });
    }
    setIsWithdrawing(false);
  };

  const renderFooter = () => {
    if (isCompleted) {
      return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="w-full" disabled={isWithdrawing}>
              <PartyPopper className="mr-2 h-4 w-4" />
              Withdraw to Savings
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Withdraw Completed Goal?</AlertDialogTitle>
              <AlertDialogDescription>
                This will move {formatCurrency(goal.currentAmount)} to your main Solidara savings account and reset this goal's progress to zero.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleWithdraw}>
                Yes, Withdraw
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    return (
      <AddFundsDialog
        goal={goal}
        solidaraBalance={userData?.solidaraBalance ?? 0}
        disabled={userDataLoading}
      >
        <Button variant="outline" className="w-full" disabled={userDataLoading}>
          Add Funds
        </Button>
      </AddFundsDialog>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center gap-2">
            {goal.emoji && <span className="text-2xl">{goal.emoji}</span>}
            <span>{goal.name}</span>
          </CardTitle>
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                 <EditGoalDialog goal={goal}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                    </DropdownMenuItem>
                </EditGoalDialog>
                <DropdownMenuSeparator />
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive" disabled={isDeleting}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your saving goal
                  named "{goal.name}". Any funds in this goal will NOT be returned.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                  Yes, delete it
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <CardDescription>
          Target: {formatCurrency(goal.targetAmount)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Progress value={progress} />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatCurrency(goal.currentAmount)}</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
        {targetDate && (
          <div className="text-sm text-muted-foreground">
            Target Date: {format(targetDate, 'PPP')} ({formatDistanceToNow(targetDate, { addSuffix: true })})
          </div>
        )}
      </CardContent>
      <CardFooter className="gap-2">
        {renderFooter()}
      </CardFooter>
    </Card>
  );
}
