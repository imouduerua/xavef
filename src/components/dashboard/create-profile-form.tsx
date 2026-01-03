
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import React from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
import { useFirestore } from '@/firebase';
import { createUserProfile } from '@/app/(app)/dashboard/actions';
import { useAuthContext } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

// This schema is simplified as some data comes directly from the auth user object
const formSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required.' }),
  lastName: z.string().min(1, { message: 'Last name is required.' }),
  referralCode: z.string().optional(),
});

export function CreateProfileForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useAuthContext();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: user?.displayName?.split(' ')[0] || '',
      lastName: user?.displayName?.split(' ').slice(1).join(' ') || '',
      referralCode: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !user.email || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Setup Failed',
        description: 'User authentication is not available. Please try again later.',
      });
      return;
    }
    
    setIsLoading(true);

    const profileResult = await createUserProfile(firestore, user, {
      firstName: values.firstName,
      lastName: values.lastName,
      displayName: `${values.firstName} ${values.lastName}`,
      email: user.email,
      referralCode: values.referralCode,
    });

    if (profileResult.success) {
      toast({
        title: 'Profile Setup Complete!',
        description: "Welcome! We're glad to have you.",
      });
      // The AuthProvider will automatically pick up the new userData and re-render the dashboard.
      // No navigation needed, the component will just be replaced.
    } else {
      toast({
        variant: 'destructive',
        title: 'Setup Failed',
        description: profileResult.error || 'Failed to create user profile. Please check your details and try again.',
        duration: 10000,
      });
      setIsLoading(false);
    }
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
                Just a few more details to get your account set up.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                        <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                        <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                </div>
                <FormField
                control={form.control}
                name="referralCode"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Referral Code (Optional)</FormLabel>
                    <FormControl>
                        <Input placeholder="Enter referral code" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finalizing Setup...</>
                ) : (
                    'Complete Setup'
                )}
                </Button>
            </form>
            </Form>
      </CardContent>
    </Card>
  );
}
