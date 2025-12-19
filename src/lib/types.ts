export interface User {
  name: string;
  email: string;
  avatarUrl: string;
}

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  xavefId: string;
  referredBy: string | null;
  createdAt: string;
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

export type TransactionType = "Deposit" | "Withdrawal" | "Loan Payment" | "Interest";
export type TransactionStatus = "Completed" | "Pending" | "Failed";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
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
    createdAt: string;
}
