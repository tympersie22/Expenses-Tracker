'use client';

import { useState, useCallback } from 'react';
import { 
  ArrowLeftIcon,
  CalendarIcon,
  PlusCircleIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useNavigation } from '@/contexts/NavigationContext';

export default function RecurringPage() {
  const navigation = useNavigation();
  const [recurringTransactions] = useState([
    {
      id: 1,
      name: 'Netflix Subscription',
      amount: 15.99,
      frequency: 'Monthly',
      nextDate: '2024-05-01',
      category: 'Entertainment'
    },
    {
      id: 2,
      name: 'Gym Membership',
      amount: 49.99,
      frequency: 'Monthly',
      nextDate: '2024-04-25',
      category: 'Health'
    },
    {
      id: 3,
      name: 'Phone Bill',
      amount: 79.99,
      frequency: 'Monthly',
      nextDate: '2024-04-20',
      category: 'Utilities'
    }
  ]);

  const handleBackClick = useCallback(() => {
    navigation.handleBack();
  }, [navigation]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button onClick={handleBackClick} className="text-gray-600 hover:text-gray-900">
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-semibold">Recurring Transactions</h1>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusCircleIcon className="w-5 h-5" />
              <span>Add New</span>
            </motion.button>
          </div>

          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CalendarIcon className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-medium">Monthly Recurring Expenses</h2>
              </div>
              <p className="text-3xl font-semibold text-gray-900">$145.97</p>
              <p className="text-sm text-gray-500 mt-1">3 active recurring transactions</p>
            </div>

            {/* Recurring Transactions List */}
            <div className="space-y-4">
              {recurringTransactions.map((transaction) => (
                <div key={transaction.id} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <CalendarIcon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{transaction.name}</h3>
                        <p className="text-sm text-gray-500">
                          {transaction.frequency} • Next: {transaction.nextDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-medium">${transaction.amount}</span>
                      <div className="flex gap-2">
                        <button className="p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-gray-100">
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-gray-100">
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={handleBackClick} className="block">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-center gap-2 text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                  <span className="font-medium">Back to Reports</span>
                </motion.div>
              </button>
              <button onClick={() => navigation.handleBack()} className="block">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-center gap-2 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <CalendarIcon className="w-5 h-5" />
                  <span className="font-medium">View Transaction History</span>
                </motion.div>
              </button>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
} 