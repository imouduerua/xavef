'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save } from 'lucide-react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useFirestore, useUser } from '@/firebase';
import { updateSavingGoal } from '@/app/(app)/savings/client-actions';
import { SavingGoal } from '@/lib/types';

const defaultEmojis = ['🎯', '✈️', '🏠', '🚗', '🎓', '🎁', '💻', '💍', '💼', '🏖️', '🚀', '🎉'];

const formSchema = z.object({
  name: z.string().min(1, 'Goal name is required.'),
  targetAmount: z.coerce.number().positive('Target amount must be positive.'),
  emoji: z.string().optional(),
});

interface EditGoalDialogProps {
    goal: SavingGoal;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditGoalDialog({ goal, open, onOpenChange }: EditGoalDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    // Default values will be set by the effect when the dialog opens
    defaultValues: {
      name: goal.name,
      targetAmount: goal.targetAmount,
      emoji: goal.emoji || '🎯',
    },
  });

  // Reset the form with the goal's current data whenever the dialog opens.
  React.useEffect(() => {
    if (open) {
      form.reset({
        name: goal.name,
        targetAmount: goal.targetAmount,
        emoji: goal.emoji || '🎯',
      });
    }
  }, [open, goal, form]);


  const { isSubmitting } = form.formState;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to edit a goal.',
      });
      return;
    }
    const result = await updateSavingGoal(firestore, user.uid, goal.id, values);
    if (result.success) {
      toast({
        title: 'Goal Updated!',
        description: `Your goal "${values.name}" has been updated.`,
      });
      onOpenChange(false); // Close the dialog on success
    } else {
      toast({
        variant: 'destructive',
        title: 'Failed to Update Goal',
        description: result.error,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Saving Goal</DialogTitle>
          <DialogDescription>
            Update the details for your "{goal.name}" goal.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., European Vacation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                        ₦
                      </span>
                      <Input type="number" placeholder="0.00" className="pl-8" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emoji"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select an Emoji</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-6 gap-2">
                      {defaultEmojis.map((emoji) => (
                        <Button
                          key={emoji}
                          type="button"
                          variant={field.value === emoji ? 'default' : 'outline'}
                          className="text-2xl p-2 h-auto aspect-square"
                          onClick={() => field.onChange(emoji)}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
