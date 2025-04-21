'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  BanknotesIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

interface Transaction {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  description: string;
  category: string;
  date: Date;
  notes?: string;
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
      notes: 'Weekly groceries from Walmart',
    },
    {
      id: '2',
      type: 'income',
      amount: 2500.00,
      description: 'Salary',
      category: 'Income',
      date: new Date(Date.now() - 86400000),
      notes: 'Monthly salary payment',
    },
    {
      id: '3',
      type: 'expense',
      amount: 45.00,
      description: 'Movie tickets',
      category: 'Entertainment',
      date: new Date(Date.now() - 172800000),
      notes: 'Movie night with friends',
    },
    {
      id: '4',
      type: 'income',
      amount: 150.00,
      description: 'Freelance work',
      category: 'Income',
      date: new Date(Date.now() - 259200000),
      notes: 'Website design project',
    },
    {
      id: '5',
      type: 'expense',
      amount: 120.00,
      description: 'Electricity bill',
      category: 'Utilities',
      date: new Date(Date.now() - 345600000),
      notes: 'Monthly electricity payment',
    },
  ]);

  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });

  const filteredTransactions = transactions.filter((transaction) => {
    // Filter by type
    if (filter !== 'all' && transaction.type !== filter) return false;
    
    // Filter by search query
    if (searchQuery && !transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !transaction.category.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filter by date range
    if (dateRange.start && transaction.date < new Date(dateRange.start)) return false;
    if (dateRange.end && transaction.date > new Date(dateRange.end)) return false;
    
    return true;
  });

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
    const date = format(transaction.date, 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  // Calculate totals
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const [currentCard, setCurrentCard] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCard((prev) => (prev + 1) % 3);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const cards = [
    {
      title: 'Total Income',
      value: totalIncome,
      subtitle: 'All income transactions',
      icon: <ArrowDownIcon className="w-6 h-6 text-white" />,
      gradient: 'from-green-500 to-green-600',
      textColor: 'text-green-100',
    },
    {
      title: 'Total Expenses',
      value: totalExpenses,
      subtitle: 'All expense transactions',
      icon: <ArrowUpIcon className="w-6 h-6 text-white" />,
      gradient: 'from-red-500 to-red-600',
      textColor: 'text-red-100',
    },
    {
      title: 'Net Balance',
      value: totalIncome - totalExpenses,
      subtitle: 'Current balance',
      icon: <BanknotesIcon className="w-6 h-6 text-white" />,
      gradient: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
            <p className="text-gray-500 mt-1">View and manage your transactions</p>
          </div>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              isFilterOpen 
                ? 'bg-black text-white shadow-md' 
                : 'bg-white text-gray-700 shadow-sm hover:shadow-md'
            }`}
          >
            <FunnelIcon className="w-5 h-5" />
            <span>Filters</span>
            {isFilterOpen ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Summary Cards Slider */}
        <div className="relative h-[200px] mb-8 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCard}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className={`absolute inset-0 bg-gradient-to-br ${cards[currentCard].gradient} p-6 rounded-2xl shadow-lg`}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center justify-between mb-4"
              >
                <h3 className={`font-medium ${cards[currentCard].textColor}`}>{cards[currentCard].title}</h3>
                <div className="p-2 bg-white/10 rounded-xl">
                  {cards[currentCard].icon}
                </div>
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-white"
              >
                ${cards[currentCard].value.toFixed(2)}
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`text-sm ${cards[currentCard].textColor} mt-2`}
              >
                {cards[currentCard].subtitle}
              </motion.p>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Dots */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {cards.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentCard(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentCard === index ? 'bg-white scale-125' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence mode="wait">
          {isFilterOpen && (
            <motion.div
              key="filter-panel"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-4 mb-6"
            >
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-black focus:outline-none"
                  />
                </div>

                {/* Type Filter */}
                <div className="flex gap-1">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      filter === 'all'
                        ? 'bg-black text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('income')}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      filter === 'income'
                        ? 'bg-green-50 text-green-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Income
                  </button>
                  <button
                    onClick={() => setFilter('expense')}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      filter === 'expense'
                        ? 'bg-red-50 text-red-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Expenses
                  </button>
                </div>

                {/* Date Range */}
                <div className="flex gap-1 relative">
                  <div className="relative">
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className="w-32 px-2 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-black focus:outline-none [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-2 [&::-webkit-calendar-picker-indicator]:top-1/2 [&::-webkit-calendar-picker-indicator]:-translate-y-1/2"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      className="w-32 px-2 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-black focus:outline-none [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-2 [&::-webkit-calendar-picker-indicator]:top-1/2 [&::-webkit-calendar-picker-indicator]:-translate-y-1/2"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transactions List */}
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-500">
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium text-green-600">
                        +${groupedTransactions[date]
                          .filter((t) => t.type === 'income')
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toFixed(2)}
                      </span>
                      {' • '}
                      <span className="font-medium text-red-600">
                        -${groupedTransactions[date]
                          .filter((t) => t.type === 'expense')
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {groupedTransactions[date].map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-3 rounded-xl ${
                            transaction.type === 'income'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {transaction.type === 'income' ? (
                            <ArrowDownIcon className="w-5 h-5" />
                          ) : (
                            <ArrowUpIcon className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {transaction.description}
                          </h4>
                          {transaction.notes && (
                            <p className="text-sm text-gray-500 mt-1">{transaction.notes}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {transaction.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-medium ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {transaction.type === 'income' ? '+' : '-'}$
                          {transaction.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(transaction.date, 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 