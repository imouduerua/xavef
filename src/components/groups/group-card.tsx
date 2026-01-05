
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore, useUser } from '@/firebase/provider';
import { toast } from '@/hooks/use-toast';
import type { Group } from '@/lib/types';
import { Loader2, PlayCircle, UserPlus, Users, ArrowRight, HandCoins } from 'lucide-react';
import React from 'react';
import { startGroup, requestToJoinGroup } from '@/app/(app)/groups/client-actions';
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
} from '@/components/ui/alert-dialog';
import Link from 'next/link';
import { ContributeDialog } from './contribute-dialog';


interface GroupCardProps {
  group: Group;
  isOwned?: boolean;
}

export function GroupCard({ group, isOwned = false }: GroupCardProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isStarting, setIsStarting] = React.useState(false);
  const [isJoining, setIsJoining] = React.useState(false);
  
  const isGroupAdmin = user?.uid === group.creatorUid;
  const isGroupFull = group.members.length === group.numberOfMembers;
  const isUserMember = user ? group.members.includes(user.uid) : false;


  const formatCurrency = (amount: number) =>
    `₦${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handleRequestToJoin = async () => {
    if (!user || !firestore) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to join a group.",
      });
      return;
    }
    setIsJoining(true);
    const result = await requestToJoinGroup(firestore, user, group);
    if (result.success) {
      toast({
        title: "Request Sent!",
        description: `Your request to join "${group.name}" has been sent to the group creator.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Request Failed",
        description: result.error,
      });
    }
    setIsJoining(false);
  }

  const handleStartGroup = async () => {
      if (!firestore) return;
      setIsStarting(true);
      const result = await startGroup(firestore, group.id);
      if (result.success) {
          toast({
              title: "Group Started!",
              description: `The group "${group.name}" is now active and members have been notified.`
          });
      } else {
          toast({
              variant: "destructive",
              title: "Failed to Start Group",
              description: result.error
          });
      }
      setIsStarting(false);
  }

  const renderFooter = () => {
      if (group.status === 'active' && isUserMember) {
        return (
          <div className="w-full flex gap-2">
            <Button asChild className="flex-1" variant="secondary">
                <Link href={`/groups/${group.id}`}>
                    View Group
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
            <ContributeDialog group={group}>
                 <Button className="flex-1">
                    <HandCoins className="mr-2 h-4 w-4" />
                    Contribute
                </Button>
            </ContributeDialog>
          </div>
        )
      }

      if (group.status !== 'forming') {
          if(isUserMember) {
            return (
                <Button asChild className="w-full">
                    <Link href={`/groups/${group.id}`}>
                        View Group
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            )
          }
          return null;
      }
      if (isOwned && isGroupAdmin) {
          return (
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button className="w-full" disabled={!isGroupFull || isStarting}>
                        {isStarting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                        {isStarting ? 'Starting...' : 'Start Group'}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to start this group?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will activate the group and notify all members. No new members will be able to join. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleStartGroup}>Yes, Start Group</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
             </AlertDialog>
          )
      }
      if (!isOwned) {
          return (
             <Button className="w-full" onClick={handleRequestToJoin} disabled={isJoining || isGroupFull}>
                {isJoining ? (
                   <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Request...
                   </>
                ) : (
                   <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {isGroupFull ? 'Group is Full' : 'Request to Join'}
                   </>
                )}
            </Button>
          )
      }
      return null;
  }

  const memberProgress = `${group.members.length}/${group.numberOfMembers}`;

  return (
    <Card className='flex flex-col'>
      <CardHeader>
        <CardTitle>{group.name}</CardTitle>
        <CardDescription>
            {group.status === 'forming' 
                ? isGroupFull ? 'This group is full and ready to start.' : 'A weekly savings group.'
                : `This group is ${group.status}.`
            }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-baseline">
            <span className='text-sm text-muted-foreground'>Weekly Contribution</span>
            <span className="font-bold text-lg">{formatCurrency(group.contributionAmount)}</span>
        </div>
        <div className="flex justify-between items-center">
            <span className='text-sm text-muted-foreground'>Members</span>
             <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="font-semibold">{memberProgress}</span>
            </div>
        </div>
      </CardContent>
      {renderFooter() && (
         <CardFooter>
            {renderFooter()}
        </CardFooter>
      )}
    </Card>
  );
}

    