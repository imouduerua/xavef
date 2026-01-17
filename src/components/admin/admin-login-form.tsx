'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

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
import { useAuth } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { ForgotPasswordDialog } from '../auth/forgot-password-dialog';

const formSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(1, {
    message: 'Password is required.',
  }),
});

export function AdminLoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    if (!auth) {
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Authentication service is not available. Please try again later.",
        });
        setIsLoading(false);
        return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const idToken = await userCredential.user.getIdToken();

      // Set the session cookie by calling our new API route.
      const response = await fetch('/api/auth/admin-session', {
        method: 'POST',
        body: idToken,
      });

      if (!response.ok) {
        throw new Error('Failed to create server session.');
      }
      
      toast({
        title: 'Login Successful',
        description: 'Redirecting to your dashboard...',
      });
      router.replace('/admin');

    } catch (error: any) {
      let description = 'An unknown error occurred. Please try again.';
      if (error.code === 'auth/invalid-credential') {
          description = 'Invalid email or password. Please try again.';
      } else if (error.message) {
          description = error.message;
      }
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const isButtonDisabled = isLoading || !isClient || !auth;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="admin@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Password</FormLabel>
                 <ForgotPasswordDialog>
                  <Button
                    variant="link"
                    type="button"
                    className="p-0 h-auto text-xs"
                  >
                    Forgot password?
                  </Button>
                </ForgotPasswordDialog>
              </div>
              <FormControl>
                <Input type="password" placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isButtonDisabled}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Signing In...</> : 'Sign In'}
        </Button>
      </form>
    </Form>
  );
}
