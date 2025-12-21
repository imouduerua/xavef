
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser, useFirestore } from '@/firebase';
import { toast } from '@/hooks/use-toast';
import type { Group } from '@/lib/types';
import { Loader2, PlayCircle, UserPlus, Users } from 'lucide-react';
import React from 'react';
import { startGroup, requestToJoinGroup } from '@/app/(app)/groups/client-actions';

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
              description: `The group "${group.name}" is now active.`
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
      if (group.status !== 'forming') {
          return null; // Or show other info for active/closed groups
      }
      if (isOwned && isGroupAdmin) {
          return (
             <Button className="w-full" disabled={!isGroupFull || isStarting} onClick={handleStartGroup}>
                {isStarting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Starting...
                    </>
                ) : (
                    <>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Start Group
                    </>
                )}
            </Button>
          )
      }
      if (!isOwned) {
          return (
             <Button className="w-full" onClick={handleRequestToJoin} disabled={isJoining}>
                {isJoining ? (
                   <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Request...
                   </>
                ) : (
                   <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Request to Join
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
            <span className='text-sm text-muted-foreground'>Contribution</span>
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
