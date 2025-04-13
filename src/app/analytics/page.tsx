'use client';

import { useState } from 'react';
import ExpenseAnalytics from '@/components/ExpenseAnalytics';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: Date;
  description: string;
}

export default function AnalyticsPage() {
  // This is sample data - in a real app, this would come from your backend
  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'expense',
      amount: 64.30,
      description: 'Grocery shopping',
      category: 'Food',
      date: new Date(),
    },
    {
      id: '2',
      type: 'income',
      amount: 2500.00,
      description: 'Salary',
      category: 'Income',
      date: new Date(Date.now() - 86400000), // Yesterday
    },
    {
      id: '3',
      type: 'expense',
      amount: 45.00,
      description: 'Movie tickets',
      category: 'Entertainment',
      date: new Date(Date.now() - 172800000), // 2 days ago
    },
    {
      id: '4',
      type: 'expense',
      amount: 120.00,
      description: 'Electric bill',
      category: 'Utilities',
      date: new Date(Date.now() - 259200000), // 3 days ago
    },
    {
      id: '5',
      type: 'expense',
      amount: 35.00,
      description: 'Restaurant',
      category: 'Food',
      date: new Date(Date.now() - 345600000), // 4 days ago
    }
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Financial Analytics</h1>
        <ExpenseAnalytics transactions={transactions} />
      </div>
    </div>
  );
} 