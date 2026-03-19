import { Activity } from '../components/ActivityFeed';
import { Expense } from '../components/ExpenseTable';

export const users = {
  alex: { id: 'u1', name: 'Alex Morgan', initials: 'AM', src: 'https://i.pravatar.cc/150?u=alex' },
  john: { id: 'u2', name: 'John Doe', initials: 'JD', src: 'https://i.pravatar.cc/150?u=john' },
  sarah: { id: 'u3', name: 'Sarah Smith', initials: 'SS', src: 'https://i.pravatar.cc/150?u=sarah' },
  emma: { id: 'u4', name: 'Emma Wilson', initials: 'EW' },
};

export const stats = {
  youOwe: 120.50,
  youAreOwed: 450.00,
  sharedSpend: 840.25,
  personalSpend: 320.00,
};

export const groups = [
  { 
    id: 1, 
    name: 'Trip to Bali', 
    balance: 50.00, 
    members: [users.alex, users.john, users.sarah, users.emma] 
  },
  { 
    id: 2, 
    name: 'Apartment', 
    balance: -120.50, 
    members: [users.alex, users.john] 
  },
  { 
    id: 3, 
    name: 'Friday Dinner', 
    balance: 0.00, 
    members: [users.alex, users.sarah] 
  }
];

export const expenses: Expense[] = [
  { id: 1, title: 'Dinner at Nobu', amount: 250, date: '2026-03-18', split: 'equal', paidBy: 'Alex Morgan' },
  { id: 2, title: 'Airbnb in Bali', amount: 1200, date: '2026-03-15', split: 'percentage', paidBy: 'John Doe' },
  { id: 3, title: 'Uber to Airport', amount: 45.50, date: '2026-03-14', split: 'equal', paidBy: 'Alex Morgan' },
  { id: 4, title: 'Groceries', amount: 130.20, date: '2026-03-10', split: 'exact', paidBy: 'Sarah Smith' },
  { id: 5, title: 'Internet Bill', amount: 80.00, date: '2026-03-01', split: 'equal', paidBy: 'Emma Wilson' },
];

export const settlements = [
  { id: 1, fromUser: users.alex, toUser: users.john, amount: 120.50, type: 'owes' as const },
  { id: 2, fromUser: users.sarah, toUser: users.alex, amount: 45.00, type: 'owed' as const },
  { id: 3, fromUser: users.emma, toUser: users.alex, amount: 405.00, type: 'owed' as const },
];

export const activities: Activity[] = [
  { id: 1, type: 'expense', description: 'Alex added "Dinner at Nobu"', time: '2 hours ago' },
  { id: 2, type: 'settlement', description: 'Sarah paid Alex $60.00', time: '5 hours ago' },
  { id: 3, type: 'info', description: 'Flight tickets changed to $450.00', time: '1 day ago' },
  { id: 4, type: 'join', description: 'Emma joined "Trip to Bali"', time: '2 days ago' },
];

export const trendChartData = [
  { name: 'Jan', personal: 400, shared: 240 },
  { name: 'Feb', personal: 300, shared: 139 },
  { name: 'Mar', personal: 200, shared: 980 },
  { name: 'Apr', personal: 278, shared: 390 },
  { name: 'May', personal: 189, shared: 480 },
  { name: 'Jun', personal: 239, shared: 380 },
  { name: 'Jul', personal: 349, shared: 430 },
];

export const categoryChartData = [
  { name: 'Housing', value: 800, color: '#C08FF5' }, // Lavender (Primary)
  { name: 'Food', value: 300, color: '#42E3D0' },    // Teal (Success)
  { name: 'Transport', value: 150, color: '#E7BE29' }, // Yellow (Warning)
  { name: 'Entertainment', value: 250, color: '#F86161' }, // Coral (Danger)
];
