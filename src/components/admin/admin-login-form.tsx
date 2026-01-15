
'use client';

import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';
import * as z from 'zod';
import React, { useEffect, useState } from 'react';
import {signInWithEmailAndPassword, getIdToken, signOut} from 'firebase/auth';

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
import {useAuth} from '@/firebase';
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
  const [isLoading, setIsLoading] = React.useState(false);
  const [isClient, setIsClient] = useState(false);
  const auth = useAuth();
  
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
            description: "Authentication service is not ready. Please try again in a moment.",
        });
        setIsLoading(false);
        return;
    }

    try {
      // Step 1: Attempt to sign in the user on the client-side.
      const userCredential = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );

      // Step 2: If client-side login is successful, get the ID token.
      const idToken = await getIdToken(userCredential.user);

      // Step 3: Call the API route to create the session cookie.
      // This route will also verify that the user is an admin on the server.
      const response = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
      });
      
      if (!response.ok) {
          const errorData = await response.json();
          // This will catch server-side session creation errors, including permission denied.
          throw new Error(errorData.error || "Session creation failed on the server.");
      }
      
      // Step 4: Success! Redirect to the admin dashboard.
      toast({
          title: 'Login Successful',
          description: 'Redirecting to the admin dashboard...',
      });
      
      // A full page reload is crucial to ensure the server recognizes the new session cookie.
      window.location.href = '/admin';

    } catch (error: any) {
      let errorMessage = 'An unknown error occurred. Please try again.';
      
      if (error.code === 'auth/invalid-credential') {
          errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.message) {
          // This will catch the permission error from our API route.
          errorMessage = error.message;
      }
      
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: errorMessage,
      });

      // If a user was partially logged in but failed server validation, sign them out.
      if (auth.currentUser) {
        await signOut(auth);
      }
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
        <Button type="submit" className="w-full" disabled={!isClient || isLoading || !auth}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...</> : 'Sign In'}
        </Button>
      </form>
    </Form>
  );
}
