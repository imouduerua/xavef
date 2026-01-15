
'use client';
import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Transaction, TransactionWithUserDetails } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { handleTransactionUpdate } from './actions';
import Image from 'next/image';

interface TransactionActionsProps {
  userId: string;
  transaction: Transaction | TransactionWithUserDetails;
}

export function TransactionActions({ userId, transaction }: TransactionActionsProps) {
  const [isProcessing, setIsProcessing] = useState<false | 'approved' | 'declined'>(false);

  const onAction = async (decision: 'approved' | 'declined') => {
    setIsProcessing(decision);
    const result = await handleTransactionUpdate(userId, transaction.id, decision);
    if (result.success) {
      toast({
        title: `Transaction ${decision}`,
        description: `The transaction has been successfully ${decision}.`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: `Failed to ${decision} transaction`,
        description: result.error,
      });
      setIsProcessing(false);
    }
  };

  if (transaction.status !== 'Pending') {
    return null;
  }

  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <AlertDialogTrigger asChild>
            <DropdownMenuItem className="text-green-600 focus:text-green-700">
                {isProcessing === 'approved' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                )}
              <span>Approve</span>
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem className="text-red-600 focus:text-red-700">
               {isProcessing === 'declined' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <XCircle className="mr-2 h-4 w-4" />
                )}
              <span>Decline</span>
            </DropdownMenuItem>
          </AlertDialogTrigger>
           {transaction.proofOfPaymentUrl && (
             <>
                <DropdownMenuSeparator />
                 <AlertDialogTrigger asChild>
                    <DropdownMenuItem>View Proof</DropdownMenuItem>
                </AlertDialogTrigger>
            </>
           )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
           {isProcessing ? (
                <AlertDialogDescription>
                    This will process the transaction. This action cannot be undone.
                </AlertDialogDescription>
           ) : transaction.proofOfPaymentUrl ? (
                 <AlertDialogDescription>
                    Review the proof of payment before proceeding.
                </AlertDialogDescription>
           ) : <></>}
        </AlertDialogHeader>
        {transaction.proofOfPaymentUrl && !isProcessing && (
            <div className="relative w-full h-64 my-4 rounded-md overflow-hidden border">
                <Image src={transaction.proofOfPaymentUrl} alt="Proof of payment" layout="fill" objectFit="contain" />
            </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsProcessing(false)}>Cancel</AlertDialogCancel>
          {!isProcessing ? (
            <>
                <AlertDialogAction onClick={() => onAction('declined')} className="bg-destructive hover:bg-destructive/90">Decline</AlertDialogAction>
                <AlertDialogAction onClick={() => onAction('approved')}>Approve</AlertDialogAction>
            </>
          ) : (
            <Button disabled>
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 Processing...
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
