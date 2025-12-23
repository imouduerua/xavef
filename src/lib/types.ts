

import type { FieldValue, Timestamp } from "firebase/firestore";

export interface User {
  name: string;
  email: string;
  avatarUrl: string;
}

export interface BankAccount {
    bankName: string;
    accountName: string;
    bankAccountNumber: string;
}

export interface UserData {
  id?: string;
  uid: string;
  email: string;
  displayName: string; // This might become redundant, but let's keep for now
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  phoneNumber: string | null;
  address: string | null;
  state: string | null;
  country: string | null;
  xavefId: string;
  referredBy: string | null;
  createdAt: any;
  solidaraBalance: number;
  annualBalance: number;
  bankAccounts: BankAccount[];
}

export interface SavingsAccount {
  balance: number;
  apy: number;
  interestEarned: number;
}

export interface LoanAccount {
  balance: number;
  interestRate: number;
  nextPayment: number;
  nextPaymentDate: string;
}

export type AccountType = 'solidara' | 'annual';
export type TransactionType = "Deposit" | "Withdrawal" | "Loan Payment" | "Interest" | "Group Contribution" | "Group Payout";
export type TransactionStatus = "Completed" | "Pending" | "Failed";

export interface Transaction {
  id: string;
  path: string; // Added by useCollection for collectionGroup queries
  date: any;
  description: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  fee?: number;
  payoutAmount?: number;
  targetAccount?: AccountType | 'group';
  proofOfPaymentUrl?: string;
  userId?: string; 
  groupId?: string; // For group contributions
}

export interface TransactionWithUserDetails extends Transaction {
  userId: string;
  userEmail: string;
  xavefId: string;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  date: any;
  read: boolean;
  actionUrl?: string;
}

export interface ReferralCode {
    id: string;
    code: string;
    creatorUid: string;
    used: boolean;
    createdAt: any;
}

export interface SavingGoal {
    id: string;
    userId: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    createdAt: any;
    emoji?: string;
}

export type GroupStatus = 'forming' | 'active' | 'closed';

export interface Group {
    id: string;
    name: string;
    contributionAmount: number;
    contributionFrequency: 'weekly';
    numberOfMembers: number;
    creatorUid: string;
    members: string[];
    status: GroupStatus;
    createdAt: any;
    startedAt?: any;
    payoutOrder?: string[];
    currentCollectionWeek?: number;
    lastDistributionDate?: any;
}

export type JoinRequestStatus = 'pending' | 'approved' | 'declined';

export interface GroupJoinRequest {
    id: string;
    groupId: string;
    groupName: string;
    groupCreatorUid: string;
    requesterUid: string;
    requesterEmail: string;
    requesterName: string;
    status: JoinRequestStatus;
    createdAt: any;
}

    

    
