
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Group } from '@/lib/types';
import { Users, ArrowRight } from 'lucide-react';
import React from 'react';
import Link from 'next/link';

interface AdminGroupCardProps {
  group: Group;
}

export function AdminGroupCard({ group }: AdminGroupCardProps) {

  const formatCurrency = (amount: number) =>
    `₦${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;


  const renderFooter = () => {
    return (
        <Button asChild className="w-full">
            <Link href={`/admin/group-details/${group.id}`}>
                View Details
                <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
        </Button>
    )
  }

  const memberProgress = `${group.members.length}/${group.numberOfMembers}`;

  return (
    <Card className='flex flex-col'>
      <CardHeader>
        <CardTitle>{group.name}</CardTitle>
        <CardDescription>
            {group.status === 'forming' 
                ? 'A weekly savings group.'
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
