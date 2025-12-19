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
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  invitationCode: z.string().optional(),
});

// Function to generate a unique 4-digit ID
async function generateUniqueXavefId(firestore: any): Promise<string> {
  let xavefId;
  let isUnique = false;
  const usersRef = collection(firestore, 'users');

  while (!isUnique) {
    xavefId = Math.floor(1000 + Math.random() * 9000).toString();
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
      fullName: "",
      email: "",
      password: "",
      invitationCode: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      // Validate invitation code if provided
      let referredBy = null;
      let referralCodeDoc = null;
      if (values.invitationCode) {
        const referralCodesRef = collection(firestore, 'referralCodes');
        const q = query(referralCodesRef, where('code', '==', values.invitationCode), where('used', '==', false));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          toast({
            variant: "destructive",
            title: "Registration Failed",
            description: "Invalid or already used invitation code.",
          });
          setIsLoading(false);
          return;
        }
        referralCodeDoc = snapshot.docs[0];
        referredBy = referralCodeDoc.data().creatorUid;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      
      await updateProfile(user, {
        displayName: values.fullName,
      });

      const xavefId = await generateUniqueXavefId(firestore);
      
      const batch = writeBatch(firestore);

      // Create user document
      const userDocRef = doc(firestore, "users", user.uid);
      batch.set(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: values.fullName,
        xavefId,
        referredBy,
        createdAt: new Date().toISOString(),
      });
      
      // Mark referral code as used
      if (referralCodeDoc) {
        batch.update(referralCodeDoc.ref, { used: true });
      }

      await batch.commit();

      toast({
        title: "Account Created",
        description: "Welcome! Redirecting to your dashboard...",
      });
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message,
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
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Alex Johnson" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
          name="invitationCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Invitation Code (Optional)</FormLabel>
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
