'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

interface Transaction {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  description: string;
  category: string;
  date: Date;
}

export default function HistoryPage() {
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
      date: new Date(Date.now() - 86400000),
    },
    {
      id: '3',
      type: 'expense',
      amount: 45.00,
      description: 'Movie tickets',
      category: 'Entertainment',
      date: new Date(Date.now() - 172800000),
    },
  ]);

  const [filter, setFilter] = useState('all');

  const filteredTransactions = transactions.filter((transaction) => {
    if (filter === 'income') return transaction.type === 'income';
    if (filter === 'expense') return transaction.type === 'expense';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white p-4 border-b">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold">Transaction History</h1>
          <div className="flex gap-2">
            <select
              className="border rounded px-2 py-1 text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="income">Income</option>
              <option value="expense">Expenses</option>
            </select>
            <button className="p-1">
              <FunnelIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {filteredTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4"
          >
            <div
              className={`p-2 rounded-full ${
                transaction.type === 'income'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-red-100 text-red-600'
              }`}
            >
              {transaction.type === 'income' ? (
                <ArrowDownIcon className="w-6 h-6" />
              ) : (
                <ArrowUpIcon className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="font-medium">{transaction.description}</h2>
              <p className="text-sm text-gray-500">{transaction.category}</p>
              <p className="text-xs text-gray-400">
                {format(transaction.date, 'MMM d, yyyy')}
              </p>
            </div>
            <p
              className={`text-lg font-semibold ${
                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {transaction.type === 'income' ? '+' : '-'}$
              {transaction.amount.toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
} 