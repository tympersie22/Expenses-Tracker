'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  ChartBarIcon,
  ShareIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  FunnelIcon,
  ArrowsRightLeftIcon,
  XMarkIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { useNavigation } from '@/contexts/NavigationContext';
import TransactionDetails from '@/components/TransactionDetails';

interface Wallet {
  id: string;
  name: string;
  balance: number;
  type: string;
  currency: string;
  goal?: number;
  transactions: Transaction[];
  color: string;
  icon: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  description: string;
  category?: string;
  notes?: string;
}

export default function WalletsPage() {
  const navigation = useNavigation();
  const [wallets, setWallets] = useState<Wallet[]>([
    {
      id: '1',
      name: 'Cash',
      balance: 1200.00,
      type: 'cash',
      currency: 'USD',
      color: 'bg-green-500',
      icon: 'BanknotesIcon',
      transactions: [
        { 
          id: '1', 
          amount: 100, 
          type: 'income', 
          date: '2024-03-15', 
          description: 'Freelance Payment',
          category: 'Work',
          notes: 'Payment for website design project'
        },
        { 
          id: '2', 
          amount: 50, 
          type: 'expense', 
          date: '2024-03-14', 
          description: 'Groceries',
          category: 'Food',
          notes: 'Weekly grocery shopping'
        },
      ],
    },
    {
      id: '2',
      name: 'Bank Account',
      balance: 5430.50,
      type: 'bank',
      currency: 'USD',
      color: 'bg-blue-500',
      icon: 'BuildingLibraryIcon',
      transactions: [
        { 
          id: '3', 
          amount: 2000, 
          type: 'income', 
          date: '2024-03-10', 
          description: 'Salary',
          category: 'Work',
          notes: 'Monthly salary payment'
        },
        { 
          id: '4', 
          amount: 150, 
          type: 'expense', 
          date: '2024-03-13', 
          description: 'Utilities',
          category: 'Bills',
          notes: 'Electricity bill'
        },
      ],
    },
    {
      id: '3',
      name: 'Savings',
      balance: 10000.00,
      type: 'savings',
      currency: 'USD',
      goal: 15000,
      color: 'bg-purple-500',
      icon: 'BanknotesIcon',
      transactions: [
        { 
          id: '5', 
          amount: 500, 
          type: 'income', 
          date: '2024-03-01', 
          description: 'Monthly Transfer',
          category: 'Savings',
          notes: 'Automatic savings transfer'
        },
      ],
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense' as 'income' | 'expense',
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: '',
    notes: '',
  });
  const [showAddTransactionForm, setShowAddTransactionForm] = useState(false);
  const [newWallet, setNewWallet] = useState({
    name: '',
    type: 'cash',
    currency: 'USD',
    goal: '',
  });
  const [currentCard, setCurrentCard] = useState(0);

  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  const totalSavings = wallets
    .filter(wallet => wallet.type === 'savings')
    .reduce((sum, wallet) => sum + wallet.balance, 0);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentCard((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const cards = [
    {
      title: "Total Balance",
      value: formatCurrency(totalBalance, 'USD'),
      subtitle: "Across all wallets",
      icon: <CurrencyDollarIcon className="w-6 h-6 text-white" />,
      gradient: "from-black to-gray-800",
      textColor: "text-gray-300",
      subtitleColor: "text-gray-400"
    },
    {
      title: "Total Savings",
      value: formatCurrency(totalSavings, 'USD'),
      subtitle: "In savings accounts",
      icon: <BanknotesIcon className="w-6 h-6 text-white" />,
      gradient: "from-purple-600 to-purple-800",
      textColor: "text-purple-100",
      subtitleColor: "text-purple-200"
    },
    {
      title: "Active Wallets",
      value: wallets.length.toString(),
      subtitle: "Total accounts",
      icon: <ChartBarIcon className="w-6 h-6 text-white" />,
      gradient: "from-blue-600 to-blue-800",
      textColor: "text-blue-100",
      subtitleColor: "text-blue-200"
    }
  ];

  const getWalletIcon = (iconName: string) => {
    switch (iconName) {
      case 'BanknotesIcon':
        return <BanknotesIcon className="w-6 h-6" />;
      case 'BuildingLibraryIcon':
        return <BuildingLibraryIcon className="w-6 h-6" />;
      case 'PiggyBankIcon':
        return <BanknotesIcon className="w-6 h-6" />;
      default:
        return <BanknotesIcon className="w-6 h-6" />;
    }
  };

  const handleAddWallet = () => {
    if (newWallet.name.trim()) {
      const walletTypes = {
        cash: { color: 'bg-green-500', icon: 'BanknotesIcon' },
        bank: { color: 'bg-blue-500', icon: 'BuildingLibraryIcon' },
        savings: { color: 'bg-purple-500', icon: 'BanknotesIcon' },
      };

      const { color, icon } = walletTypes[newWallet.type as keyof typeof walletTypes];

      setWallets([
        ...wallets,
        {
          id: Date.now().toString(),
          name: newWallet.name,
          balance: 0,
          type: newWallet.type,
          currency: newWallet.currency,
          goal: newWallet.goal ? parseFloat(newWallet.goal) : undefined,
          color,
          icon,
          transactions: [],
        },
      ]);
      setNewWallet({ name: '', type: 'cash', currency: 'USD', goal: '' });
      setShowAddForm(false);
    }
  };

  const handleDeleteWallet = (id: string) => {
    setWallets(wallets.filter(wallet => wallet.id !== id));
  };

  const handleTransactionClick = (wallet: Wallet, transaction: Transaction) => {
    setSelectedWallet(wallet);
    setSelectedTransaction(transaction);
  };

  const handleCloseTransactionDetails = () => {
    setSelectedTransaction(null);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    // Close the details modal
    setSelectedTransaction(null);
    
    // Set the form data for editing
    setFormData({
      amount: transaction.amount.toString(),
      type: transaction.type,
      date: transaction.date,
      description: transaction.description,
      category: transaction.category || '',
      notes: transaction.notes || '',
    });
    
    // Show the add transaction form
    setShowAddTransactionForm(true);
    
    // Set the editing state
    setIsEditing(true);
    setEditingTransactionId(transaction.id);
  };

  const handleDeleteTransaction = (transactionId: string) => {
    if (selectedWallet) {
      // Find the wallet that contains this transaction
      const updatedWallets = wallets.map(wallet => {
        if (wallet.id === selectedWallet.id) {
          // Filter out the deleted transaction
          const updatedTransactions = wallet.transactions.filter(
            t => t.id !== transactionId
          );
          
          // Recalculate the wallet balance
          const newBalance = updatedTransactions.reduce((balance, t) => {
            return t.type === 'income' 
              ? balance + t.amount 
              : balance - t.amount;
          }, 0);
          
          return {
            ...wallet,
            transactions: updatedTransactions,
            balance: newBalance
          };
        }
        return wallet;
      });
      
      setWallets(updatedWallets);
    }
  };

  const handleAddTransaction = () => {
    if (selectedWallet && formData.amount && formData.description) {
      const amount = parseFloat(formData.amount);
      
      // Create a new transaction
      const newTransaction: Transaction = {
        id: isEditing && editingTransactionId ? editingTransactionId : Date.now().toString(),
        amount,
        type: formData.type,
        date: formData.date,
        description: formData.description,
        category: formData.category || undefined,
        notes: formData.notes || undefined,
      };
      
      // Update the wallets state
      const updatedWallets = wallets.map(wallet => {
        if (wallet.id === selectedWallet.id) {
          let updatedTransactions;
          
          if (isEditing && editingTransactionId) {
            // Replace the existing transaction
            updatedTransactions = wallet.transactions.map(t => 
              t.id === editingTransactionId ? newTransaction : t
            );
          } else {
            // Add a new transaction
            updatedTransactions = [...wallet.transactions, newTransaction];
          }
          
          // Recalculate the wallet balance
          const newBalance = updatedTransactions.reduce((balance, t) => {
            return t.type === 'income' 
              ? balance + t.amount 
              : balance - t.amount;
          }, 0);
          
          return {
            ...wallet,
            transactions: updatedTransactions,
            balance: newBalance
          };
        }
        return wallet;
      });
      
      setWallets(updatedWallets);
      
      // Reset form and close modal
      setFormData({
        amount: '',
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: '',
        notes: '',
      });
      setShowAddTransactionForm(false);
      setIsEditing(false);
      setEditingTransactionId(null);
    }
  };

  const filteredTransactions = selectedWallet?.transactions.filter(transaction => {
    const matchesFilter = filterType === 'all' || transaction.type === filterType;
    const matchesSearch = transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
            <div>
            <h1 className="text-3xl font-bold text-gray-900">My Wallets</h1>
            <p className="text-gray-500 mt-1">Manage your financial accounts</p>
            </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Add Wallet
            </button>
          </div>
        </div>

        {/* Overview Cards Slider */}
        <div className="relative h-[200px] mb-8 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCard}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ 
                duration: 0.4,
                ease: [0.4, 0, 0.2, 1]
              }}
              className={`absolute inset-0 bg-gradient-to-br ${cards[currentCard].gradient} p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:shadow-xl transition-all duration-300`}
            >
              <div className="absolute inset-0 bg-grid-white/[0.05] -z-0" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <motion.h3 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`${cards[currentCard].textColor} font-medium text-lg`}
                  >
                    {cards[currentCard].title}
                  </motion.h3>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="p-2 bg-white/10 rounded-xl"
                  >
                    {cards[currentCard].icon}
                  </motion.div>
                </div>
                <div>
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl font-bold text-white mb-2"
                  >
                    {cards[currentCard].value}
                  </motion.p>
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className={`text-sm ${cards[currentCard].subtitleColor}`}
                  >
                    {cards[currentCard].subtitle}
                  </motion.p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Navigation Dots */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {cards.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrentCard(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  currentCard === index ? 'bg-white w-4' : 'bg-white/50'
                }`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>
        </div>

        {/* Wallets List */}
        <div className="space-y-6">
          <AnimatePresence>
            {wallets.map((wallet, index) => (
              <motion.div
                key={wallet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className={`${wallet.color} p-4 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getWalletIcon(wallet.icon)}
                      <h2 className="font-semibold text-lg">{wallet.name}</h2>
                    </div>
                    <button
                      onClick={() => handleDeleteWallet(wallet.id)}
                      className="text-white/80 hover:text-white transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-3xl font-bold">{formatCurrency(wallet.balance, wallet.currency)}</p>
                      <span className="text-sm text-gray-500 capitalize">{wallet.type}</span>
                    </div>
                    <div className="flex gap-2 -mt-1 ml-4">
                      <button 
                        className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                        onClick={() => {
                          setSelectedWallet(wallet);
                          setShowAddTransactionForm(true);
                        }}
                      >
                        <PlusIcon className="w-3.5 h-3.5" />
                        Add Transaction
                      </button>
                      <button 
                        className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                        onClick={() => {
                          setSelectedWallet(wallet);
                          setShowTransactionDetails(true);
                        }}
                      >
                        <ArrowRightIcon className="w-3.5 h-3.5" />
                        View All
                      </button>
                    </div>
                  </div>

                  {wallet.goal && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-500">Savings Goal</span>
                        <span className="font-medium">{formatCurrency(wallet.goal, wallet.currency)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-purple-500 h-2.5 rounded-full"
                          style={{ width: `${(wallet.balance / wallet.goal) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Recent Transactions</h3>
                    {wallet.transactions.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {wallet.transactions.slice(0, 4).map((transaction) => (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors border border-gray-100"
                            onClick={() => handleTransactionClick(wallet, transaction)}
                          >
                            <div className="flex items-center gap-2">
                              {transaction.type === 'income' ? (
                                <ArrowUpIcon className="w-4 h-4 text-green-500" />
                              ) : (
                                <ArrowDownIcon className="w-4 h-4 text-red-500" />
                              )}
                              <div>
                                <span className="text-gray-700 font-medium">{transaction.description}</span>
                                <p className="text-xs text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <span className={`font-medium ${transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, wallet.currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic p-3 border border-gray-100 rounded-lg">No transactions yet</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Transaction Details Modal */}
        <AnimatePresence>
          {selectedTransaction && selectedWallet && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <TransactionDetails
                transaction={selectedTransaction}
                onClose={handleCloseTransactionDetails}
                currency={selectedWallet.currency}
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
              />
            </div>
          )}
        </AnimatePresence>

        {/* All Transactions Modal */}
        <AnimatePresence>
          {showTransactionDetails && selectedWallet && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden w-full max-w-4xl max-h-[90vh] flex flex-col"
              >
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                      All Transactions - {selectedWallet.name}
                    </h2>
                    <button
                      onClick={() => setShowTransactionDetails(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search transactions..."
                          className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none w-64"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <FunnelIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setFilterType('all')}
                          className={`px-3 py-1.5 rounded-lg text-sm ${
                            filterType === 'all'
                              ? 'bg-black text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setFilterType('income')}
                          className={`px-3 py-1.5 rounded-lg text-sm ${
                            filterType === 'income'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          Income
                        </button>
                        <button
                          onClick={() => setFilterType('expense')}
                          className={`px-3 py-1.5 rounded-lg text-sm ${
                            filterType === 'expense'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          Expenses
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowTransactionDetails(false);
                        setShowAddTransactionForm(true);
                      }}
                      className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors"
                    >
                      <PlusIcon className="w-5 h-5" />
                      Add Transaction
                    </button>
                  </div>
                  
                  {filteredTransactions && filteredTransactions.length > 0 ? (
                    <div className="space-y-3">
                      {filteredTransactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleTransactionClick(selectedWallet, transaction)}
                        >
                          <div className="flex items-center gap-3">
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
                              <h3 className="font-medium">{transaction.description}</h3>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>{new Date(transaction.date).toLocaleDateString()}</span>
                                {transaction.category && (
                                  <>
                                    <span>•</span>
                                    <span>{transaction.category}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`font-medium ${
                              transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.type === 'income' ? '+' : '-'}
                              {formatCurrency(transaction.amount, selectedWallet.currency)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTransaction(transaction);
                              }}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <ArrowsRightLeftIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <FunnelIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No transactions found</h3>
                      <p className="text-gray-500">
                        {searchQuery || filterType !== 'all'
                          ? "Try adjusting your search or filter"
                          : "Add your first transaction to get started"}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Add Wallet Modal */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl p-6 w-full max-w-md"
              >
                <h2 className="text-xl font-semibold mb-4">Add New Wallet</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wallet Name
                    </label>
            <input
              type="text"
                      placeholder="Enter wallet name"
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
              value={newWallet.name}
              onChange={(e) => setNewWallet({ ...newWallet, name: e.target.value })}
            />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wallet Type
                    </label>
            <select
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
              value={newWallet.type}
              onChange={(e) => setNewWallet({ ...newWallet, type: e.target.value })}
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank Account</option>
              <option value="savings">Savings</option>
              <option value="investment">Investment</option>
            </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <select
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                      value={newWallet.currency}
                      onChange={(e) => setNewWallet({ ...newWallet, currency: e.target.value })}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Savings Goal (Optional)
                    </label>
                    <input
                      type="number"
                      placeholder="Enter savings goal"
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                      value={newWallet.goal}
                      onChange={(e) => setNewWallet({ ...newWallet, goal: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 mt-6">
              <button
                onClick={handleAddWallet}
                      className="flex-1 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Add Wallet
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                      className="flex-1 border px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Transaction Modal */}
        <AnimatePresence>
          {showAddTransactionForm && selectedWallet && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden w-full max-w-md"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">
                      {isEditing ? 'Edit Transaction' : 'Add Transaction'}
                    </h2>
                    <button
                      onClick={() => {
                        setShowAddTransactionForm(false);
                        setIsEditing(false);
                        setEditingTransactionId(null);
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount
                      </label>
                      <input
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setFormData({ ...formData, type: 'income' })}
                          className={`flex-1 py-2 rounded-lg ${
                            formData.type === 'income'
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}
                        >
                          Income
                        </button>
                        <button
                          onClick={() => setFormData({ ...formData, type: 'expense' })}
                          className={`flex-1 py-2 rounded-lg ${
                            formData.type === 'expense'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}
                        >
                          Expense
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6">
          <button
                      onClick={handleAddTransaction}
                      className="flex-1 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
                      {isEditing ? 'Update Transaction' : 'Add Transaction'}
          </button>
                  </div>
                </div>
              </motion.div>
            </div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
} 