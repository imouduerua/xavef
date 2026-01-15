
'use client';

import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';
import * as z from 'zod';
import React from 'react';
import {signInWithEmailAndPassword, getIdToken, signOut} from 'firebase/auth';
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
import { Loader2 } from 'lucide-react';


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
      // Step 1: Sign in the user on the client-side.
      const userCredential = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;

      // Step 2: Check for admin privileges on the server-side via Firestore.
      const adminDocRef = doc(firestore, 'admins', user.uid);
      const adminDocSnap = await getDoc(adminDocRef);

      const isSuperAdmin = user.email === 'admin@xavef.com';
      const isDbAdmin = adminDocSnap.exists();

      if (!isSuperAdmin && !isDbAdmin) {
        // If not an admin, sign out immediately and throw an error.
        await signOut(auth);
        throw new Error('Permission denied. This account does not have administrative privileges.');
      }
      
      // Step 3: If admin check passes, get ID token and create the server-side session.
      const idToken = await getIdToken(user);
      const response = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
          const errorData = await response.json();
          // This will catch server-side session creation errors.
          throw new Error(errorData.error || "Session creation failed on the server.");
      }

      // Step 4: Success! Redirect to the admin dashboard.
      toast({
          title: 'Login Successful',
          description: 'Redirecting to the admin dashboard...',
      });
      
      // Use window.location.href for a full page reload to ensure the server recognizes the new cookie.
      window.location.href = '/admin';

    } catch (error: any) {
      let errorMessage = 'An unknown error occurred. Please try again.';
      
      // Provide clear, user-friendly error messages.
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
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...</> : 'Sign In'}
        </Button>
      </form>
    </Form>
  );
}
