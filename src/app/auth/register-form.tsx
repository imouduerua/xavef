
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import React from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, runTransaction, collection, query, where, getDocs, limit, Timestamp, setDoc } from "firebase/firestore";
import type { UserData, ReferralCode } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

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
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  referralCode: z.string().optional(),
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    if (!firestore) {
        toast({
            variant: "destructive",
            title: "Registration Error",
            description: "Database service is not available. Please try again later.",
        });
        setIsLoading(false);
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const user = userCredential.user;
        
        const displayName = `${values.firstName} ${values.lastName}`;
        await updateProfile(user, { displayName });

        const userDocRef = doc(firestore, 'users', user.uid);
        let referredBy: string | null = null;
        let referralCodeDocId: string | null = null;

        if (values.referralCode) {
            const codeQuery = query(
                collection(firestore, 'referralCodes'),
                where('code', '==', values.referralCode.trim().toUpperCase()),
                where('used', '==', false),
                limit(1)
            );
            const codeSnap = await getDocs(codeQuery);

            if (codeSnap.empty) {
                throw new Error('Invalid or already used referral code.');
            }
            
            const codeDoc = codeSnap.docs[0];
            const codeData = codeDoc.data() as ReferralCode;
            
            referredBy = codeData.creatorUid;
            referralCodeDocId = codeDoc.id;
        }

        const xavefId = uuidv4().substring(0, 6).toUpperCase();

        await runTransaction(firestore, async (transaction) => {
            const newUserProfile: UserData = {
                uid: user.uid,
                email: values.email,
                firstName: values.firstName,
                lastName: values.lastName,
                displayName: displayName,
                dateOfBirth: null,
                phoneNumber: null,
                address: null,
                state: null,
                country: null,
                xavefId,
                createdAt: Timestamp.now(),
                referredBy: referredBy,
                solidaraBalance: 0,
                annualBalance: 0,
                bankAccounts: [],
            };

            transaction.set(userDocRef, newUserProfile);

            if (referralCodeDocId) {
                const codeRef = doc(firestore, 'referralCodes', referralCodeDocId);
                transaction.update(codeRef, { used: true });
            }
        });

        toast({
            title: "Account Created!",
            description: "Redirecting to your dashboard...",
        });
        
        router.push('/dashboard');

    } catch (error: any) {
        console.error("Registration Error:", error);
        
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
            duration: 9000,
        });
    } finally {
        setIsLoading(false);
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
           {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...</> : "Create Account"}
        </Button>
      </form>
    </Form>
  );
}
