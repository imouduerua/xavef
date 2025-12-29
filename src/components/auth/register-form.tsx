
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import React from "react";
import { createUserWithEmailAndPassword, updateProfile, deleteUser, type UserCredential } from "firebase/auth";

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
import { useAuth, useFirestore } from "@/firebase";
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
});

export function RegisterForm() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    let userCredential: UserCredential | null = null;
    
    if(!firestore) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "Database service is not available. Please try again later.",
      });
      setIsLoading(false);
      return;
    }

    try {
        // Step 1: Create the Firebase Auth user
        userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const user = userCredential.user;
        
        // Step 2: Update their Auth profile display name
        const displayName = `${values.firstName} ${values.lastName}`;
        await updateProfile(user, { displayName });

        toast({
            title: "Account Created",
            description: "Finalizing your profile setup...",
        });

        // Step 3: Create the Firestore user profile document
        const profileResult = await createUserProfile(firestore, user, {
            firstName: values.firstName,
            lastName: values.lastName,
            displayName: displayName,
            email: user.email!,
        });

        if (!profileResult.success) {
            // This is a critical failure.
            // We must delete the orphaned auth user and show the error to the user.
            if (userCredential) {
              await deleteUser(userCredential.user).catch(deleteError => {
                  console.error("Failed to clean up orphaned auth user:", deleteError);
              });
            }

            toast({
                variant: "destructive",
                title: "Registration Failed",
                description: profileResult.error || "Failed to create user profile. Please check your details and try again.",
                duration: 10000,
            });
            setIsLoading(false);
            return; // Stop execution here.
        }
        
        toast({
            title: "Setup Complete!",
            description: "Welcome! Redirecting to your dashboard...",
        });
        
        // Step 4: Redirect to the dashboard ONLY after profile creation is successful
        router.push("/dashboard");

    } catch (error: any) {
        console.error("Registration Error:", error);
        
        // This catch block will now primarily handle auth errors like "email-already-in-use"
        if (userCredential) {
            // If an auth user was created but another error occurred, clean it up.
            await deleteUser(userCredential.user).catch(deleteError => {
                console.error("Failed to clean up orphaned auth user during general error:", deleteError);
            });
        }
        
        let errorMessage = "An unknown error occurred during registration.";
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "This email address is already in use. Please log in instead.";
        } else if (error.message) {
            errorMessage = error.message;
        }

        toast({
            variant: "destructive",
            title: "Registration Failed",
            description: errorMessage,
            duration: 10000,
        });

    } finally {
        // Only set loading to false if we haven't navigated away
        if (router.asPath === '/register') { 
            setIsLoading(false);
        }
    }
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
        <Button type="submit" className="w-full" disabled={isLoading}>
           {isLoading ? "Creating Account..." : "Create Account"}
        </Button>
      </form>
    </Form>
  );
}
