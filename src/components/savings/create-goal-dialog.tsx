
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Target } from 'lucide-react';
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
import { firestore } from '@/firebase/client';
import { useAuthContext } from '@/context/auth-context';
import { createSavingGoal } from '@/app/(app)/savings/client-actions';

const defaultEmojis = ['🎯', '✈️', '🏠', '🚗', '🎓', '🎁', '💻', '💍', '💼', '🏖️', '🚀', '🎉'];

const formSchema = z.object({
  name: z.string().min(1, 'Goal name is required.'),
  targetAmount: z.coerce.number().positive('Target amount must be positive.'),
  emoji: z.string().optional(),
});

export function CreateGoalDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user } = useAuthContext();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      targetAmount: '' as any,
      emoji: '🎯',
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to create a goal.',
      });
      return;
    }
    const result = await createSavingGoal(firestore, user.uid, values);
    if (result.success) {
      toast({
        title: 'Goal Created!',
        description: `Your goal "${values.name}" has been created.`,
      });
      setIsOpen(false);
      form.reset({
        name: '',
        targetAmount: '' as any,
        emoji: '🎯',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Failed to Create Goal',
        description: result.error,
      });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Saving Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a New Saving Goal</DialogTitle>
          <DialogDescription>
            What are you saving for?
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

            <DialogFooter className="gap-2 pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Target className="mr-2 h-4 w-4" />
                    Create Goal
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
