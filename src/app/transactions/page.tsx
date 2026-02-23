'use client';

import { useState, useEffect, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BanknotesIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import { useNavigation } from '@/contexts/NavigationContext';

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  description: string;
  category?: string;
  notes?: string;
  walletId: string;
}

interface Wallet {
  id: string;
  name: string;
  type: string;
  currency: string;
}

const STORAGE_KEY = 'expenses-tracker-transactions-v1';

const SAMPLE_WALLETS: Wallet[] = [
  { id: '1', name: 'Cash', type: 'cash', currency: 'USD' },
  { id: '2', name: 'Bank Account', type: 'bank', currency: 'USD' },
  { id: '3', name: 'Savings', type: 'savings', currency: 'USD' },
];

const SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    amount: 100,
    type: 'income',
    date: '2024-03-15',
    description: 'Freelance Payment',
    category: 'Work',
    notes: 'Payment for website design project',
    walletId: '1',
  },
  {
    id: '2',
    amount: 50,
    type: 'expense',
    date: '2024-03-14',
    description: 'Groceries',
    category: 'Food',
    notes: 'Weekly grocery shopping',
    walletId: '1',
  },
  {
    id: '3',
    amount: 2000,
    type: 'income',
    date: '2024-03-10',
    description: 'Salary',
    category: 'Work',
    notes: 'Monthly salary payment',
    walletId: '2',
  },
  {
    id: '4',
    amount: 150,
    type: 'expense',
    date: '2024-03-13',
    description: 'Utilities',
    category: 'Bills',
    notes: 'Electricity bill',
    walletId: '2',
  },
  {
    id: '5',
    amount: 500,
    type: 'income',
    date: '2024-03-01',
    description: 'Monthly Transfer',
    category: 'Savings',
    notes: 'Automatic savings transfer',
    walletId: '3',
  },
];

function parseCsvRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(cell.trim());
      cell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(cell.trim());
      cell = '';
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    if (row.some((value) => value.length > 0)) rows.push(row);
  }

  return rows;
}

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parseAmount(raw?: string): number | null {
  if (!raw) return null;
  const normalized = raw.replace(/[^0-9.-]/g, '');
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function TransactionsPage() {
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>(SAMPLE_WALLETS);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedWallet, setSelectedWallet] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [importMessage, setImportMessage] = useState<string>('');
  const [importError, setImportError] = useState<string>('');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setTransactions(SAMPLE_TRANSACTIONS);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as Transaction[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setTransactions(parsed);
      } else {
        setTransactions(SAMPLE_TRANSACTIONS);
      }
    } catch {
      setTransactions(SAMPLE_TRANSACTIONS);
    }
  }, []);

  useEffect(() => {
    if (transactions.length === 0) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  const handleCsvImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError('');
    setImportMessage('');

    try {
      const text = await file.text();
      const rows = parseCsvRows(text);
      if (rows.length < 2) {
        setImportError('CSV must include a header row and at least one data row.');
        return;
      }

      const headers = rows[0].map(normalizeHeader);
      const headerIndex = (keys: string[]) => headers.findIndex((h) => keys.includes(h));
      const dateIdx = headerIndex(['date', 'transactiondate', 'posteddate', 'valuedate']);
      const descriptionIdx = headerIndex(['description', 'details', 'narration', 'memo']);
      const amountIdx = headerIndex(['amount', 'transactionamount']);
      const debitIdx = headerIndex(['debit', 'withdrawal', 'moneyout']);
      const creditIdx = headerIndex(['credit', 'deposit', 'moneyin']);
      const categoryIdx = headerIndex(['category']);
      const notesIdx = headerIndex(['notes', 'note', 'reference']);
      const typeIdx = headerIndex(['type', 'transactiontype']);

      if (dateIdx < 0 || descriptionIdx < 0 || (amountIdx < 0 && debitIdx < 0 && creditIdx < 0)) {
        setImportError('Missing columns. Required: date, description, and amount (or debit/credit).');
        return;
      }

      const targetWalletId = selectedWallet === 'all' ? wallets[0]?.id || '1' : selectedWallet;
      let importedCount = 0;
      const imported: Transaction[] = [];

      for (let i = 1; i < rows.length; i += 1) {
        const currentRow = rows[i];
        if (!currentRow || currentRow.length === 0) continue;

        const rawDate = currentRow[dateIdx];
        const rawDescription = currentRow[descriptionIdx];
        if (!rawDate || !rawDescription) continue;

        const parsedDate = new Date(rawDate);
        if (Number.isNaN(parsedDate.getTime())) continue;

        let amount = amountIdx >= 0 ? parseAmount(currentRow[amountIdx]) : null;
        const debit = debitIdx >= 0 ? parseAmount(currentRow[debitIdx]) : null;
        const credit = creditIdx >= 0 ? parseAmount(currentRow[creditIdx]) : null;

        let type: 'income' | 'expense' = 'expense';
        if (typeIdx >= 0) {
          const rawType = (currentRow[typeIdx] || '').toLowerCase();
          if (rawType.includes('income') || rawType.includes('credit') || rawType.includes('deposit')) {
            type = 'income';
          } else if (rawType.includes('expense') || rawType.includes('debit') || rawType.includes('withdraw')) {
            type = 'expense';
          }
        }

        if (amount === null) {
          if (credit !== null) {
            amount = Math.abs(credit);
            type = 'income';
          } else if (debit !== null) {
            amount = Math.abs(debit);
            type = 'expense';
          }
        } else if (typeIdx < 0) {
          type = amount < 0 ? 'expense' : 'income';
          amount = Math.abs(amount);
        } else {
          amount = Math.abs(amount);
        }

        if (amount === null || amount === 0) continue;

        imported.push({
          id: `csv-${Date.now()}-${i}`,
          amount,
          type,
          date: parsedDate.toISOString(),
          description: rawDescription,
          category: categoryIdx >= 0 ? currentRow[categoryIdx] || 'Imported' : 'Imported',
          notes: notesIdx >= 0 ? currentRow[notesIdx] || '' : 'Imported from CSV',
          walletId: targetWalletId,
        });
        importedCount += 1;
      }

      if (importedCount === 0) {
        setImportError('No valid rows found. Check date and amount formats in your CSV.');
        return;
      }

      setTransactions((prev) => [...imported, ...prev]);
      setImportMessage(`Imported ${importedCount} transaction${importedCount > 1 ? 's' : ''} from ${file.name}.`);
    } catch (error) {
      console.error('CSV import failed:', error);
      setImportError('Failed to import CSV file. Please try again with a valid file.');
    } finally {
      event.target.value = '';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredTransactions = transactions
    .filter((transaction) => {
      const matchesType = filterType === 'all' || transaction.type === filterType;
      const matchesWallet = selectedWallet === 'all' || transaction.walletId === selectedWallet;
      const matchesSearch = transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          transaction.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDateRange = (!dateRange.start || transaction.date >= dateRange.start) &&
                             (!dateRange.end || transaction.date <= dateRange.end);
      return matchesType && matchesWallet && matchesSearch && matchesDateRange;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'desc' 
          ? new Date(b.date).getTime() - new Date(a.date).getTime()
          : new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
      }
    });

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
    const date = transaction.date.split('T')[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => {
    return sortOrder === 'desc' ? b.localeCompare(a) : a.localeCompare(b);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={navigation.handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
              <p className="text-gray-500 mt-1">View and manage your transactions</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-gray-700 shadow-sm hover:shadow-md transition-all cursor-pointer">
              <ArrowUpTrayIcon className="w-5 h-5" />
              <span>Import CSV</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleCsvImport}
                className="hidden"
              />
            </label>
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
        </div>
        {(importMessage || importError) && (
          <div className={`mb-6 rounded-xl px-4 py-3 text-sm ${importError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {importError || importMessage}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-green-100 font-medium">Total Income</h3>
              <div className="p-2 bg-white/10 rounded-xl">
                <ArrowUpIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{formatCurrency(totalIncome, 'USD')}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-2xl shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-red-100 font-medium">Total Expenses</h3>
              <div className="p-2 bg-white/10 rounded-xl">
                <ArrowDownIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{formatCurrency(totalExpenses, 'USD')}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-blue-100 font-medium">Net Balance</h3>
              <div className="p-2 bg-white/10 rounded-xl">
                <BanknotesIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">
              {formatCurrency(totalIncome - totalExpenses, 'USD')}
            </p>
          </motion.div>
        </div>

        {/* Filters */}
        <AnimatePresence mode="wait">
          {isFilterOpen && (
            <motion.div
              key="filter-panel"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-sm p-6 mb-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                  />
                </div>

                {/* Type Filter */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                      filterType === 'all'
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterType('income')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                      filterType === 'income'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Income
                  </button>
                  <button
                    onClick={() => setFilterType('expense')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                      filterType === 'expense'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Expenses
                  </button>
                </div>

                {/* Wallet Filter */}
                <select
                  value={selectedWallet}
                  onChange={(e) => setSelectedWallet(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                >
                  <option value="all">All Wallets</option>
                  {wallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.name}
                    </option>
                  ))}
                </select>

                {/* Date Range */}
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                  />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                  />
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
                    {new Date(date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium text-green-600">
                        +{formatCurrency(
                          groupedTransactions[date]
                            .filter((t) => t.type === 'income')
                            .reduce((sum, t) => sum + t.amount, 0),
                          'USD'
                        )}
                      </span>
                      {' • '}
                      <span className="font-medium text-red-600">
                        -{formatCurrency(
                          groupedTransactions[date]
                            .filter((t) => t.type === 'expense')
                            .reduce((sum, t) => sum + t.amount, 0),
                          'USD'
                        )}
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
                            <ArrowUpIcon className="w-5 h-5" />
                          ) : (
                            <ArrowDownIcon className="w-5 h-5" />
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
                            <span className="text-xs text-gray-500">
                              {wallets.find((w) => w.id === transaction.walletId)?.name}
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
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCurrency(transaction.amount, 'USD')}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(transaction.date).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
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
