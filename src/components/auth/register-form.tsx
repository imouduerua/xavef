
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
import { useAuth } from "@/firebase";
import { createUserProfile } from "@/app/(app)/dashboard/actions";

const formSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  referralCode: z.string().min(1, { message: "Referral code is required." }),
});

export function RegisterForm() {
  const router = useRouter();
  const auth = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
        // 1. Create the Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const user = userCredential.user;
        
        // 2. Update their Auth profile display name
        const displayName = `${values.firstName} ${values.lastName}`;
        await updateProfile(user, { displayName });

        toast({
            title: "Account Created",
            description: "Finalizing your profile setup...",
        });

        // 3. Create the Firestore user profile document and default goals
        const profileResult = await createUserProfile(user.uid, user.email!, displayName, values.referralCode);

        if (!profileResult.success) {
            // This is a critical failure, the user has an auth account but no profile.
            // Advise them to contact support. The user should not be redirected.
             toast({
                variant: "destructive",
                title: "Profile Creation Failed",
                description: `${profileResult.error} Please try registering again or contact support.`,
                duration: 10000,
            });
             setIsLoading(false);
             return;
        }
        
        toast({
            title: "Setup Complete!",
            description: "Welcome! Redirecting to your dashboard...",
        });
        
        // 4. Redirect to the dashboard ONLY after profile creation is successful
        router.push("/dashboard");

    } catch (error: any) {
        console.error("Registration Error:", error);
        
        if (error.code === 'auth/email-already-in-use') {
            toast({
                variant: "destructive",
                title: "Registration Failed",
                description: "This email address is already in use. Please log in instead.",
            });
        } else {
            toast({
                variant: "destructive",
                title: "Registration Failed",
                description: error.message || "An unknown error occurred.",
            });
        }
        setIsLoading(false);
    }
    // No need for finally block as loading is handled in error/success paths
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
           {isLoading ? "Creating Account..." : "Create Account"}
        </Button>
      </form>
    </Form>
  );
}
