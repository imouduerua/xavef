
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import type { Group } from '@/lib/types';
import { UserPlus, Users } from 'lucide-react';

interface GroupCardProps {
  group: Group;
}

export function GroupCard({ group }: GroupCardProps) {
  const formatCurrency = (amount: number) =>
    `₦${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handleRequestToJoin = () => {
    // In a real application, this would trigger a Firestore write
    // to a 'joinRequests' subcollection. For now, it's a placeholder.
    toast({
        title: "Feature Coming Soon!",
        description: "The ability to request to join a group is not yet implemented.",
    });
  }

  const memberProgress = `${group.members.length}/${group.numberOfMembers}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{group.name}</CardTitle>
        <CardDescription>
            A weekly savings group.
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
      <CardFooter>
        <Button className="w-full" onClick={handleRequestToJoin}>
            <UserPlus className="mr-2 h-4 w-4" />
            Request to Join
        </Button>
      </CardFooter>
    </Card>
  );
}
