import type { User, SavingsAccount, LoanAccount, Transaction, Notification } from "@/lib/types";

export const mockUser: User = {
  name: "Alex Johnson",
  email: "alex.j@example.com",
  avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
};

export const mockSavingsAccount: SavingsAccount = {
  balance: 15_750.55,
  apy: 4.5,
  interestEarned: 312.45,
};

export const mockLoanAccount: LoanAccount = {
  balance: 8_200.0,
  interestRate: 8.2,
  nextPayment: 450.0,
  nextPaymentDate: "2024-08-01",
};

export const mockTransactions: Transaction[] = [
  {
    id: "txn_1",
    path: "",
    date: "2024-07-15",
    description: "Monthly Salary",
    type: "Deposit",
    status: "Completed",
    amount: 5000.0,
  },
  {
    id: "txn_2",
    path: "",
    date: "2024-07-14",
    description: "Car Loan Payment",
    type: "Loan Payment",
    status: "Completed",
    amount: -450.0,
  },
  {
    id: "txn_3",
    path: "",
    date: "2024-07-12",
    description: "Grocery Store",
    type: "Withdrawal",
    status: "Completed",
    amount: -125.75,
  },
  {
    id: "txn_4",
    path: "",
    date: "2024-07-10",
    description: "ATM Withdrawal",
    type: "Withdrawal",
    status: "Completed",
    amount: -200.0,
  },
  {
    id: "txn_5",
    path: "",
    date: "2024-07-05",
    description: "Online Shopping",
    type: "Withdrawal",
    status: "Pending",
    amount: -89.99,
  },
  {
    id: "txn_6",
    path: "",
    date: "2024-07-01",
    description: "Monthly Interest",
    type: "Interest",
    status: "Completed",
    amount: 58.12,
  },
  {
    id: "txn_7",
    path: "",
    date: "2024-06-28",
    description: "Utility Bill",
    type: "Withdrawal",
    status: "Completed",
    amount: -75.50,
  },
  {
    id: "txn_8",
    path: "",
    date: "2024-06-15",
    description: "Monthly Salary",
    type: "Deposit",
    status: "Completed",
    amount: 5000.0,
  },
];

export const mockNotifications: Notification[] = [
    {
        id: "notif_1",
        title: "Loan Payment Due",
        description: "Your next loan payment of $450.00 is due on August 1, 2024.",
        date: "2024-07-25",
        read: false,
    },
    {
        id: "notif_2",
        title: "Large Deposit Received",
        description: "A deposit of $5,000.00 was successfully made to your account.",
        date: "2024-07-15",
        read: false,
    },
    {
        id: "notif_3",
        title: "New Feature: AI Advisor",
        description: "Get personalized financial advice with our new AI-powered tool.",
        date: "2024-07-10",
        read: true,
    },
     {
        id: "notif_4",
        title: "Security Alert",
        description: "Your password was successfully updated.",
        date: "2024-07-05",
        read: true,
    },
];
