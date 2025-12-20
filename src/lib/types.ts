import type { FieldValue, Timestamp } from "firebase/firestore";

export interface User {
  name: string;
  email: string;
  avatarUrl: string;
}

export interface UserData {
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
  id?: string;
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
export type TransactionType = "Deposit" | "Withdrawal" | "Loan Payment" | "Interest";
export type TransactionStatus = "Completed" | "Pending" | "Failed";

export interface Transaction {
  id: string;
  date: any;
  description: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  targetAccount?: AccountType;
  proofOfPaymentUrl?: string;
  userId?: string; // Optional: To link transaction to user when querying collection group
  userEmail?: string; // Optional: To display user email in admin table
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  date: string;
  read: boolean;
}

export interface ReferralCode {
    id: string;
    code: string;
    creatorUid: string;
    used: boolean;
    createdAt: any;
}
