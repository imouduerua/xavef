
'use client';

import { respondToJoinRequest } from '@/app/(app)/groups/client-actions';
import { useCollection, useFirestore } from '@/firebase';
import { toast } from '@/hooks/use-toast';
import type { GroupJoinRequest, Transaction } from '@/lib/types';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { Check, Loader2, User, X, TrendingUp } from 'lucide-react';
import React, { useMemo } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { MissingIndexAlert } from '../admin/missing-index-alert';

interface JoinRequestCardProps {
  request: GroupJoinRequest;
}

const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString();
};

const formatCurrency = (amount: number) =>
    `₦${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

export function JoinRequestCard({ request }: JoinRequestCardProps) {
  const [isResponding, setIsResponding] = React.useState(false);
  const requesterUid = request.requesterUid;
  const firestore = useFirestore();
  
  const transactionsQuery = useMemo(() => {
    if (!requesterUid || !firestore) return null;
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    return query(
        collection(firestore, `users/${requesterUid}/transactions`),
        where('type', '==', 'Deposit'),
        where('status', '==', 'Completed'),
        where('date', '>=', Timestamp.fromDate(ninetyDaysAgo))
    );
  }, [requesterUid, firestore]);
  
  const { data: transactions, loading, indexCreationUrl } = useCollection<Transaction>(transactionsQuery);

  const totalDeposits = useMemo(() => {
      if (!transactions) return 0;
      return transactions.reduce((acc, tx) => acc + tx.amount, 0);
  }, [transactions]);


  const handleResponse = async (decision: 'approved' | 'declined') => {
      if (!firestore) return;
      setIsResponding(true);
      const result = await respondToJoinRequest(firestore, request.id, decision);
      if (result.success) {
          toast({
              title: `Request ${decision}`,
              description: `${request.requesterName}'s request to join "${request.groupName}" has been ${decision}.`
          });
      } else {
          toast({
              variant: 'destructive',
              title: 'Action Failed',
              description: result.error
          });
          setIsResponding(false);
      }
  }

  const renderFinancialActivity = () => {
    if (indexCreationUrl) {
      return (
        <div className='p-4'>
            <MissingIndexAlert url={indexCreationUrl} />
        </div>
      );
    }

    return (
       <Card className="bg-muted/30">
            <CardHeader className='pb-2'>
                <CardTitle className='text-base flex items-center gap-2'><TrendingUp className='h-5 w-5' /> Financial Activity</CardTitle>
                <CardDescription className="text-xs">Based on the last 90 days.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? <Skeleton className="h-6 w-32" /> : (
                     <p className="text-xl font-bold text-green-600">{formatCurrency(totalDeposits)}</p>
                )}
                 <p className="text-sm text-muted-foreground">Total completed deposits</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex justify-between items-start'>
            <div>
                 <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5" />{request.requesterName}</CardTitle>
                 <CardDescription>Wants to join "{request.groupName}"</CardDescription>
            </div>
            <div className='text-xs text-muted-foreground'>{formatDate(request.createdAt)}</div>
        </div>
       
      </CardHeader>
      <CardContent className="space-y-4">
        <p className='text-sm text-muted-foreground'>{request.requesterEmail}</p>
        {renderFinancialActivity()}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
         {isResponding ? (
            <Button variant="outline" size="sm" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
            </Button>
         ) : (
            <>
                <Button variant="outline" size="sm" onClick={() => handleResponse('declined')}>
                    <X className="mr-2 h-4 w-4" /> Decline
                </Button>
                <Button size="sm" onClick={() => handleResponse('approved')}>
                    <Check className="mr-2 h-4 w-4" /> Approve
                </Button>
            </>
         )}
      </CardFooter>
    </Card>
  );
}
