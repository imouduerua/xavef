
'use client';

import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';
import * as z from 'zod';
import React from 'react';
import {signInWithEmailAndPassword, getIdToken } from 'firebase/auth';
import {useRouter} from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';

import {Button} from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {toast} from '@/hooks/use-toast';
import {useAuth, useFirestore} from '@/firebase';


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
  const [isLoading, setIsLoading] = React.useState(false);
  const auth = useAuth();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    if (!firestore) {
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Database service is not available."
        });
        setIsLoading(false);
        return;
    }

    try {
      // 1. Sign in the user on the client-side first.
      const userCredential = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;

      // 2. Now check if the user is an admin on the server.
      const adminDocRef = doc(firestore, 'admins', user.uid);
      const adminDocSnap = await getDoc(adminDocRef);

      if (!adminDocSnap.exists() && user.email !== 'admin@xavef.com') {
          await auth.signOut(); // Important: Sign out the non-admin user.
          throw new Error('This account does not have administrative privileges.');
      }
      
      // 3. Get the ID token and create the server-side session.
      const idToken = await getIdToken(user);
      const response = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Session creation failed on the server.");
      }

      toast({
          title: 'Login Successful',
          description: 'Redirecting to the admin dashboard...',
      });
      
      // Use window.location.href for a full page reload to ensure server state is cleared
      window.location.href = '/admin';

    } catch (error: any) {
      let errorMessage = 'An unknown error occurred. Please try again.';
      
      if (error.code === 'auth/invalid-credential') {
          errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.message) {
          errorMessage = error.message;
      }
      
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: errorMessage,
      });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({field}) => (
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
          render={({field}) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>
    </Form>
  );
}
