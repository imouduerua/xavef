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
import { MoreHorizontal, CheckCircle, XCircle, Loader2, Eye } from "lucide-react";
import { Transaction, TransactionWithUserDetails } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { updateTransactionStatusClient } from '@/app/(admin)/admin/client-actions';
import Image from 'next/image';
import { useFirestore } from '@/firebase';

interface TransactionActionsProps {
  userId: string;
  transaction: Transaction | TransactionWithUserDetails;
}

export function TransactionActions({ userId, transaction }: TransactionActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [dialogAction, setDialogAction] = useState<'approve' | 'decline' | 'view' | null>(null);
  const firestore = useFirestore();

  const onAction = async (decision: 'approved' | 'declined') => {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Action Failed',
        description: 'Firestore is not available.'
      });
      return;
    }
    setIsProcessing(true);
    const result = await updateTransactionStatusClient(firestore, userId, transaction.id, decision);
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
    }
    setIsProcessing(false);
    setDialogAction(null); // Close dialog on completion
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setDialogAction(null);
    }
  };

  if (transaction.status !== 'Pending') {
    return null;
  }

  const renderDialogContent = () => {
    if (!dialogAction) return null;

    if (dialogAction === 'view') {
        return (
            <AlertDialogContent>
                 <AlertDialogHeader>
                    <AlertDialogTitle>Proof of Payment</AlertDialogTitle>
                    <AlertDialogDescription>
                        Review the uploaded proof of payment for this transaction.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="relative w-full h-96 my-4 rounded-md overflow-hidden border">
                    <Image src={transaction.proofOfPaymentUrl!} alt="Proof of payment" fill style={{ objectFit: 'contain' }} />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Close</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        )
    }

    const isApprove = dialogAction === 'approve';
    const isWithdrawal = transaction.type === 'Withdrawal';
    const title = isApprove ? 'Approve Transaction?' : 'Decline Transaction?';
    
    const generalDescription = isApprove
      ? "This will update the user's balance and mark the transaction as 'Completed'. This action cannot be undone."
      : "This will mark the transaction as 'Failed' and will not affect the user's balance. This action cannot be undone.";

    const WITHDRAWAL_FEE_PERCENTAGE = 0.033;
    const withdrawalAmount = Number(transaction.amount) || 0;
    
    // Use stored fee/payout if available, otherwise calculate on the fly for backward compatibility.
    // This handles old transactions that didn't have these fields saved.
    const fee = transaction.fee ?? withdrawalAmount * WITHDRAWAL_FEE_PERCENTAGE;
    const payoutAmount = transaction.payoutAmount ?? withdrawalAmount - fee;
    
    return (
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{generalDescription}</AlertDialogDescription>
        </AlertDialogHeader>

        {isApprove && isWithdrawal && (
            <div className="py-2 space-y-3">
                <h4 className="font-medium text-center text-sm text-muted-foreground">Withdrawal Summary</h4>
                <div className="flex justify-between items-center text-sm p-3 rounded-md bg-muted">
                    <span>Amount to Debit from User Balance</span>
                    <span className="font-bold">₦{withdrawalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Withdrawal Fee (3.3%)</span>
                    <span className="text-muted-foreground">- ₦{fee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold p-3 rounded-md bg-primary/10 text-primary">
                    <span>Final Payout to User</span>
                    <span>₦{payoutAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
            </div>
        )}

        {transaction.proofOfPaymentUrl && (
          <div className="relative w-full h-64 my-4 rounded-md overflow-hidden border">
            <Image src={transaction.proofOfPaymentUrl} alt="Proof of payment" fill style={{ objectFit: 'contain' }} />
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
          {isApprove ? (
            <AlertDialogAction onClick={() => onAction('approved')} disabled={isProcessing}>
                {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Approving...</> : 'Approve'}
            </AlertDialogAction>
          ) : (
            <AlertDialogAction onClick={() => onAction('declined')} className="bg-destructive hover:bg-destructive/90" disabled={isProcessing}>
               {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Declining...</> : 'Decline'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    );
  }

  return (
    <AlertDialog open={!!dialogAction} onOpenChange={handleOpenChange}>
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
          <DropdownMenuItem onSelect={() => setDialogAction('approve')} className="text-green-600 focus:text-green-700">
            <CheckCircle className="mr-2 h-4 w-4" />
            <span>Approve</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialogAction('decline')} className="text-red-600 focus:text-red-700">
            <XCircle className="mr-2 h-4 w-4" />
            <span>Decline</span>
          </DropdownMenuItem>
           {transaction.proofOfPaymentUrl && (
             <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setDialogAction('view')}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Proof
                </DropdownMenuItem>
            </>
           )}
        </DropdownMenuContent>
      </DropdownMenu>

      {renderDialogContent()}
    </AlertDialog>
  );
}
