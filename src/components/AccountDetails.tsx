'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  CreditCardIcon,
  BanknotesIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

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
    type: 'checking' | 'savings' | 'credit' | 'investment';
    balance: number;
    currency: string;
    lastUpdated: Date;
  };
  transactions: Transaction[];
  onClose: () => void;
}

export default function AccountDetails({ account, transactions, onClose }: AccountDetailsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [showBalance, setShowBalance] = useState(false);

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
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-xl">
                {account.type === 'checking' && <BanknotesIcon className="w-6 h-6 text-blue-600" />}
                {account.type === 'savings' && <BanknotesIcon className="w-6 h-6 text-green-600" />}
                {account.type === 'credit' && <CreditCardIcon className="w-6 h-6 text-purple-600" />}
                {account.type === 'investment' && <ArrowUpIcon className="w-6 h-6 text-orange-600" />}
              </div>
              <div>
                <h2 className="text-2xl font-semibold">{account.name}</h2>
                <p className="text-gray-500 capitalize">{account.type}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex justify-between items-end">
            <div>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-2"
              >
                {showBalance ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">
                  {showBalance ? 'Hide' : 'Show'} Balance
                </span>
              </button>
              {showBalance ? (
                <p className="text-3xl font-bold">
                  {account.currency} {account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              ) : (
                <div className="h-9 w-32 bg-gray-100 rounded-lg blur-sm" />
              )}
            </div>
            <p className="text-sm text-gray-500">
              Last updated: {format(account.lastUpdated, 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        <div className="p-6 border-b">
          <div className="flex gap-2">
            {['week', 'month', 'year'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period as 'week' | 'month' | 'year')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[calc(90vh-300px)] overflow-y-auto">
          {filteredTransactions.map((transaction) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl ${
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
                {showBalance ? (
                  <p className={`font-semibold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                  </p>
                ) : (
                  <div className="h-6 w-20 bg-gray-100 rounded-lg blur-sm" />
                )}
                <p className="text-sm text-gray-500">
                  {format(new Date(transaction.date), 'MMM d, yyyy')}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
} 