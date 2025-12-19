
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import React from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, getDocs, collection, query, where, updateDoc } from "firebase/firestore";

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

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  referralCode: z.string().optional(),
});

// Function to generate a unique 4 to 6 digit ID
async function generateUniqueXavefId(firestore: any): Promise<string> {
  let xavefId;
  let isUnique = false;
  const usersRef = collection(firestore, 'users');
  const length = Math.floor(Math.random() * 3) + 4; // 4, 5, or 6

  while (!isUnique) {
    xavefId = Math.floor(Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1)).toString();
    const q = query(usersRef, where('xavefId', '==', xavefId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      isUnique = true;
    }
  }
  return xavefId!;
}

export function RegisterForm() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      referralCode: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    let userCredential;
    try {
        // 1. Create user with email and password
        userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const user = userCredential.user;
        const displayName = values.email.split('@')[0];

        // 2. Update user profile
        await updateProfile(user, { displayName });

        // 3. Check for referral code and get referrer UID
        let referrerUid: string | null = null;
        let referralCodeDocRef: any = null;
        if (values.referralCode) {
            const referralCodesRef = collection(firestore, 'referralCodes');
            const q = query(referralCodesRef, where("code", "==", values.referralCode), where("used", "==", false));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const referralDoc = querySnapshot.docs[0];
                referrerUid = referralDoc.data().creatorUid;
                referralCodeDocRef = referralDoc.ref;
            } else {
                toast({
                    variant: "destructive",
                    title: "Registration Warning",
                    description: "Invalid or already used referral code. Continuing without it.",
                });
            }
        }
        
        // 4. Generate unique Xavef ID
        const xavefId = await generateUniqueXavefId(firestore);

        // 5. Create the user document in Firestore
        const userDocRef = doc(firestore, "users", user.uid);
        await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            displayName: displayName,
            xavefId,
            referredBy: referrerUid,
            createdAt: new Date().toISOString(),
        });
        
        // 6. If a valid referral code was used, update it
        if (referralCodeDocRef) {
            await updateDoc(referralCodeDocRef, { used: true });
        }

        toast({
            title: "Account Created",
            description: "Welcome! Redirecting to your dashboard...",
        });
        router.push("/dashboard");

    } catch (error: any) {
        console.error("Registration Error:", error);
        
        if (error.code === 'auth/email-already-in-use') {
            toast({
                variant: "destructive",
                title: "Registration Failed",
                description: "This email address is already in use. Please log in instead.",
            });
        } else if (userCredential && error.code?.includes('permission-denied')) {
             toast({
                variant: "destructive",
                title: "Registration Incomplete",
                description: "Your account was created, but we couldn't save your profile. Please contact support.",
            });
        } else {
            toast({
                variant: "destructive",
                title: "Registration Failed",
                description: error.message || "An unknown error occurred.",
            });
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
                <Input placeholder="Enter code from a friend" {...field} />
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
