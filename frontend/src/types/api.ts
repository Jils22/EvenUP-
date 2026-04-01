// These types exactly mirror the backend Pydantic schemas

export interface User {
  id: string;
  name: string;
  email: string;
  created_at?: string;  // snake_case from backend
  avatarUrl?: string;   // frontend-only field, may be missing
}

// Backend `MemberOut` returns id/name/email
export interface Member {
  id: string;
  name: string;
  email: string;
}

// Backend `GroupOut` returns id/name/created_by/members
export interface Group {
  id: string;
  name: string;
  created_by: string;
  members: Member[];
  description?: string; // frontend-only, may be absent
}

export interface ExpenseParticipant {
  userId: string;
  amountOwed: number;
  sharePercentage?: number;
  hasPaid: boolean;
}

export interface Expense {
  id: string;
  groupId: string;
  title: string;
  amount: number;
  paidBy: string;
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
  totalOwed: number;
  totalOwedToYou: number;
  netBalance: number;
}
