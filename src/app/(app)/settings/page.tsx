
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import React from "react";
import { Loader2, PlusCircle, Save, Trash2 } from "lucide-react";

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
import { useUser, useFirestore } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useAuthContext } from "@/context/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const bankAccountSchema = z.object({
  bankName: z.string().min(1, "Bank name is required"),
  accountName: z.string().min(1, "Account name is required"),
  bankAccountNumber: z.string().min(1, "Account number is required"),
});

const profileFormSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  phoneNumber: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  bankAccounts: z.array(bankAccountSchema),
}).refine(data => {
    const fullName = `${data.firstName} ${data.lastName}`.trim().toLowerCase();
    return data.bankAccounts.every(account => 
        account.accountName.trim().toLowerCase() === fullName
    );
}, {
    message: "The account holder's name must match your first and last name.",
    path: ["bankAccounts"],
});


type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function SettingsPage() {
  const { user, userData, loading } = useAuthContext();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      address: "",
      state: "",
      country: "",
      bankAccounts: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "bankAccounts",
  });

  React.useEffect(() => {
    if (userData) {
      form.reset({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        phoneNumber: userData.phoneNumber || "",
        address: userData.address || "",
        state: userData.state || "",
        country: userData.country || "",
        bankAccounts: userData.bankAccounts || [],
      });
    }
  }, [userData, form]);

  async function onSubmit(data: ProfileFormValues) {
    if (!user || !firestore) return;

    setIsSubmitting(true);
    try {
      const userDocRef = doc(firestore, "users", user.uid);
      // We don't want to save firstName and lastName as they are disabled
      const { firstName, lastName, ...updateData } = data;
      await updateDoc(userDocRef, updateData);
      toast({
        title: "Profile Updated",
        description: "Your information has been saved successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "An unknown error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full max-w-lg" />
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
             </div>
             <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
             </div>
          </CardContent>
        </Card>
      </div>
    )
  }


  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Manage your account settings and personal information. This information is required to enable withdrawals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div>
                <h3 className="text-lg font-medium">Personal Information</h3>
                <p className="text-sm text-muted-foreground">Update your personal details.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl><Input {...field} disabled /></FormControl>
                      <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl><Input {...field} disabled /></FormControl>
                      <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                )} />
              </div>

              <Separator />

               <div>
                <h3 className="text-lg font-medium">Bank Accounts</h3>
                <p className="text-sm text-muted-foreground">Add and manage your bank accounts for withdrawals.</p>
              </div>

               <div className="space-y-6">
                {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-md space-y-4 relative">
                         <h4 className="font-medium text-md">Account {index + 1}</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <FormField control={form.control} name={`bankAccounts.${index}.bankName`} render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bank Name</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                          )} />
                          <FormField control={form.control} name={`bankAccounts.${index}.accountName`} render={({ field }) => (
                              <FormItem>
                                <FormLabel>Account Holder Name</FormLabel>
                                <FormControl><Input {...field} disabled /></FormControl>
                                <FormMessage />
                              </FormItem>
                          )} />
                           <FormField control={form.control} name={`bankAccounts.${index}.bankAccountNumber`} render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>Bank Account Number</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                          )} />
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                
                {form.formState.errors.bankAccounts?.message && (
                    <p className="text-sm font-medium text-destructive">
                        {form.formState.errors.bankAccounts.message}
                    </p>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ bankName: "", accountName: `${form.getValues("firstName")} ${form.getValues("lastName")}`, bankAccountNumber: "" })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Bank Account
                </Button>
              </div>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                    <><Save className="mr-2 h-4 w-4" /> Save Changes</>
                )}
                </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
