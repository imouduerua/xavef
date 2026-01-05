
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import React from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useAuth, useFirestore } from "@/firebase/provider";
import { Loader2 } from "lucide-react";
import { createUserProfile } from "../(app)/dashboard/actions";

const formSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  referralCode: z.string().min(1, { message: "A referral code is required." }),
});

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const auth = useAuth();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      referralCode: "",
    },
  });
  
  const handleRegistration = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const user = userCredential.user;
        
        const displayName = `${values.firstName} ${values.lastName}`;
        await updateProfile(user, { displayName });
        
        const profileResult = await createUserProfile(firestore, user, {
            firstName: values.firstName,
            lastName: values.lastName,
            displayName: displayName,
            email: values.email,
            referralCode: values.referralCode,
        });

        if (!profileResult.success) {
            // This will be caught by the outer catch block
            throw new Error(profileResult.error || "Failed to create user profile in database.");
        }

        toast({
            title: "Account Created!",
            description: "Redirecting to your dashboard...",
        });
        
        // Using replace to prevent user from going back to the registration page
        router.replace(`/dashboard`);

    } catch (error: any) {
        console.error("Registration Error:", error);
        
        let errorMessage = "An unknown error occurred during registration.";
        // Firebase Auth errors have a 'code' property
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "This email address is already in use. Please log in instead.";
        } else if (error.message) {
            // Use the error message from createUserProfile or other Firebase errors
            errorMessage = error.message;
        }

        toast({
            variant: "destructive",
            title: "Registration Failed",
            description: errorMessage,
            duration: 10000,
        });
    } finally {
        setIsLoading(false);
    }
  }

  // We wrap the async logic in a separate function.
  // The form's `onSubmit` handler will just call this function.
  function onSubmit(values: z.infer<typeof formSchema>) {
    handleRegistration(values);
  }

  return (
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="name@example.com" {...field} />
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
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="referralCode"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Referral Code</FormLabel>
                    <FormControl>
                        <Input placeholder="Enter referral code" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
           {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...</> : "Create Account"}
        </Button>
      </form>
    </Form>
  );
}
