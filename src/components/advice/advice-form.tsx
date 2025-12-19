"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React from "react";
import { BrainCircuit, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockLoanAccount, mockSavingsAccount } from "@/lib/mock-data";
import { generateAdvice } from "@/app/(app)/advice/actions";
import { Skeleton } from "../ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

const formSchema = z.object({
  savingsBalance: z.coerce.number().positive(),
  loanBalance: z.coerce.number().nonnegative(),
  loanInterestRate: z.coerce.number().nonnegative(),
  monthlyIncome: z.coerce.number().positive(),
  monthlyExpenses: z.coerce.number().positive(),
  financialGoals: z.string().min(10, {
    message: "Please describe your financial goals in at least 10 characters.",
  }),
});

type AdviceState = {
  advice?: string;
  error?: string;
};

export function AdviceForm() {
  const [state, setState] = React.useState<AdviceState>();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      savingsBalance: mockSavingsAccount.balance,
      loanBalance: mockLoanAccount.balance,
      loanInterestRate: mockLoanAccount.interestRate,
      monthlyIncome: 6000,
      monthlyExpenses: 3500,
      financialGoals: "I want to pay off my loan faster and start saving for a down payment on a house.",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setState(undefined);
    const result = await generateAdvice(values);
    if (result.success) {
      setState({ advice: result.advice });
    } else {
      setState({ error: result.error });
    }
    setIsLoading(false);
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField control={form.control} name="monthlyIncome" render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Income</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="monthlyExpenses" render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Expenses</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
            )} />
             <FormField control={form.control} name="savingsBalance" render={({ field }) => (
                <FormItem>
                  <FormLabel>Savings Balance</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="loanBalance" render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Balance</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="loanInterestRate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Interest Rate (%)</FormLabel>
                  <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
            )} />
          </div>

          <FormField
            control={form.control}
            name="financialGoals"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Financial Goals</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., Pay off debt, save for a house, invest for retirement..."
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Briefly describe what you want to achieve financially.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
                <>
                 <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                 Generating Advice...
                </>
            ) : (
                <>
                 <BrainCircuit className="mr-2 h-4 w-4" />
                 Get Advice
                </>
            )}
          </Button>
        </form>
      </Form>

      {isLoading && (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-6 w-6" /> Your Personalized Advice
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
            </CardContent>
        </Card>
      )}

      {state?.advice && (
        <Card className="border-primary bg-primary/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-6 w-6" /> Your Personalized Advice
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="whitespace-pre-wrap">{state.advice}</p>
            </CardContent>
        </Card>
      )}

      {state?.error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
