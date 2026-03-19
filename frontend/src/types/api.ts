export interface User {
  id: string; // Mongo ObjectId
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Member {
  userId: string;
  name: string;
  initials: string;
  avatarUrl?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: Member[];
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseParticipant {
  userId: string;
  amountOwed: number; // For exact splits
  sharePercentage?: number; // For percentage splits
  hasPaid: boolean;
}

export interface Expense {
  id: string;
  groupId: string;
  title: string;
  amount: number;
  paidBy: string; // userId
  date: string;
  splitType: 'equal' | 'exact' | 'percentage';
  participants: ExpenseParticipant[];
  category?: string;
  createdAt: string;
}

export interface Settlement {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  status: 'pending' | 'completed';
  createdAt: string;
  completedAt?: string;
}

export interface ActivityItem {
  id: string;
  groupId: string;
  type: 'expense_added' | 'expense_updated' | 'settlement_created' | 'settlement_completed' | 'member_joined';
  description: string;
  createdAt: string;
  metadata?: any;
}

export interface BalanceSummary {
  userId: string;
  totalOwed: number; // You owe
  totalOwedToYou: number; // You are owed
  netBalance: number;
}
