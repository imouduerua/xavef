
'use client';

import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';
import * as z from 'zod';
import React from 'react';
import {signInWithEmailAndPassword, signOut} from 'firebase/auth';
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
      const userCredential = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;

      // Direct check for admin status
      const adminDocRef = doc(firestore, 'admins', user.uid);
      const adminDocSnap = await getDoc(adminDocRef);

      if (adminDocSnap.exists() || user.email === 'admin@xavef.com') {
         toast({
            title: 'Login Successful',
            description: 'Redirecting to the admin dashboard...',
        });
        router.replace('/admin');
      } else {
        await signOut(auth);
        toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: 'This account does not have administrative privileges.',
        });
        setIsLoading(false);
      }

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid email or password. Please try again.',
      });
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
