'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  CreditCardIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
}

interface AccountDetailsProps {
  account: {
    id: string;
    name: string;
    type: 'checking' | 'savings' | 'credit';
    balance: number;
    currency: string;
    lastUpdated: Date;
  };
  transactions: Transaction[];
}

export default function AccountDetails({ account, transactions }: AccountDetailsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  const filteredTransactions = transactions.filter(transaction => {
    const now = new Date();
    const transactionDate = new Date(transaction.date);
    
    switch (selectedPeriod) {
      case 'week':
        return now.getTime() - transactionDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
      case 'month':
        return now.getMonth() === transactionDate.getMonth() &&
               now.getFullYear() === transactionDate.getFullYear();
      case 'year':
        return now.getFullYear() === transactionDate.getFullYear();
      default:
        return true;
    }
  });

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">{account.name}</h2>
          <p className="text-gray-500 capitalize">{account.type}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold">${account.balance.toFixed(2)}</p>
          <p className="text-sm text-gray-500">
            Last updated: {format(account.lastUpdated, 'MMM d, yyyy')}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedPeriod('week')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              selectedPeriod === 'week'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              selectedPeriod === 'month'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setSelectedPeriod('year')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              selectedPeriod === 'year'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Year
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-full ${
                transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {transaction.type === 'income' ? (
                  <ArrowUpIcon className="w-5 h-5 text-green-600" />
                ) : (
                  <ArrowDownIcon className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div>
                <p className="font-medium">{transaction.description}</p>
                <p className="text-sm text-gray-500">{transaction.category}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-semibold ${
                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">
                {format(new Date(transaction.date), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 