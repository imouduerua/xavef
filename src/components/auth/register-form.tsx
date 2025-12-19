
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import React from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, getDocs, collection, query, where, writeBatch } from "firebase/firestore";

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
    try {
      
      // 1. Check referral code if provided
      let referrerUid: string | null = null;
      let referralCodeDocId: string | null = null;
      if (values.referralCode) {
        const referralCodesRef = collection(firestore, 'referralCodes');
        const q = query(referralCodesRef, where("code", "==", values.referralCode), where("used", "==", false));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            throw new Error("Invalid or already used referral code.");
        }
        
        const referralDoc = querySnapshot.docs[0];
        referrerUid = referralDoc.data().creatorUid;
        referralCodeDocId = referralDoc.id;
      }

      // 2. Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      
      const displayName = values.email.split('@')[0];

      // 3. Update user profile
      await updateProfile(user, {
        displayName: displayName,
      });

      // 4. Generate unique Xavef ID
      const xavefId = await generateUniqueXavefId(firestore);
      
      // 5. Create a batched write for Firestore
      const batch = writeBatch(firestore);

      // Add user document to the batch
      const userDocRef = doc(firestore, "users", user.uid);
      batch.set(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        xavefId,
        referredBy: referrerUid,
        createdAt: new Date().toISOString(),
      });

      // If a referral code was used, update it in the batch
      if (referralCodeDocId) {
          const referralCodeRef = doc(firestore, "referralCodes", referralCodeDocId);
          batch.update(referralCodeRef, { used: true });
      }

      // 6. Commit the batch
      await batch.commit();


      toast({
        title: "Account Created",
        description: "Welcome! Redirecting to your dashboard...",
      });
      router.push("/dashboard");

    } catch (error: any) {
      console.error("Registration Error:", error);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "An unknown error occurred.",
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
