

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
  path?: string;
  uid: string;
  email: string;
  displayName: string; 
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
  olidaraBalance: number;
  annualBalance: number;
  groupPoolBalance: number;
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

export type AccountType = 'olidara' | 'annual' | 'groupPool';
export type TransactionType = "Deposit" | "Withdrawal" | "Loan Payment" | "Interest" | "Group Contribution" | "Group Payout" | "Internal Transfer";
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
  userEmail?: string;
  groupId?: string; // For group contributions
  destinationBankName?: string;
  destinationAccountName?: string;
  destinationAccountNumber?: string;
}

export interface TransactionWithUserDetails extends Transaction {
  userId: string;
  userEmail: string;
  userDisplayName: string;
  xavefId: string;
}

export interface Notification {
  id: string;
  path?: string;
  createdAt: any;
  title: string;
  description: string;
  read: boolean;
  actionUrl?: string;
}


export interface ReferralCode {
    id: string;
    path?: string;
    code: string;
    creatorUid: string;
    used: boolean;
    createdAt: any;
}

export interface SavingGoal {
    id: string;
    path?: string;
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
    path?: string;
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
    membersData?: UserData[];
}

export type JoinRequestStatus = 'pending' | 'approved' | 'declined';

export interface GroupJoinRequest {
    id: string;
    path?: string;
    groupId: string;
    groupName: string;
    groupCreatorUid: string;
    requesterUid: string;
    requesterEmail: string;
    requesterName: string;
    status: JoinRequestStatus;
    createdAt: any;
}
