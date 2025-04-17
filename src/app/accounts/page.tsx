'use client';

import { useState, useEffect } from 'react';
import {
  BanknotesIcon,
  PlusCircleIcon,
  CreditCardIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  XMarkIcon,
  PlusIcon,
  EyeIcon,
  EyeSlashIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowDownIcon,
  BellIcon,
  UserCircleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  CreditCardIcon as CreditCardIconSolid,
  KeyIcon,
} from '@heroicons/react/24/outline';
import AddAccountModal from '../../components/AddAccountModal';
import AccountDetails from '../../components/AccountDetails';
import ClientOnly from '../../components/ClientOnly';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

// Dynamically import PlaidLink with no SSR to avoid hydration errors
const PlaidLink = dynamic(() => import('../../components/PlaidLink'), {
  ssr: false,
  loading: () => (
    <div className="w-full">
      <button
        disabled
        className="flex items-center justify-center gap-2 w-full bg-gray-400 text-white py-2 px-4 rounded-lg cursor-not-allowed transition-colors"
      >
        <ArrowPathIcon className="w-5 h-5" />
        <span className="text-sm font-medium">Loading...</span>
      </button>
    </div>
  ),
});

interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment';
  balance: number;
  currency: string;
  lastUpdated: Date;
}

interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
}

export default function AccountsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showBalances, setShowBalances] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(true);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Sample transactions data
  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      date: new Date(),
      description: 'Salary Deposit',
      amount: 3000,
      type: 'income',
      category: 'Salary',
    },
    {
      id: '2',
      date: new Date(Date.now() - 86400000),
      description: 'Grocery Shopping',
      amount: 150.50,
      type: 'expense',
      category: 'Food',
    },
    {
      id: '3',
      date: new Date(Date.now() - 172800000),
      description: 'Freelance Payment',
      amount: 500,
      type: 'income',
      category: 'Freelance',
    },
  ]);

  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: '1',
      name: 'Main Checking',
      type: 'checking',
      balance: 2500.00,
      currency: 'USD',
      lastUpdated: new Date(),
    },
    {
      id: '2',
      name: 'Savings',
      type: 'savings',
      balance: 10000.00,
      currency: 'USD',
      lastUpdated: new Date(),
    },
  ]);

  // Calculate total balance and other metrics
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  // Sample notifications data
  const [notifications] = useState([
    {
      id: '1',
      title: 'Account Balance Updated',
      message: 'Your Main Checking account balance has been updated.',
      type: 'info',
      time: '2 hours ago',
      read: false,
    },
    {
      id: '2',
      title: 'Large Transaction Detected',
      message: 'A transaction of $1,200 was detected on your Savings account.',
      type: 'alert',
      time: '1 day ago',
      read: false,
    },
    {
      id: '3',
      title: 'Bill Payment Due',
      message: 'Your credit card payment of $350 is due in 3 days.',
      type: 'warning',
      time: '2 days ago',
      read: true,
    },
    {
      id: '4',
      title: 'Account Connected',
      message: 'Your investment account has been successfully connected.',
      type: 'success',
      time: '1 week ago',
      read: true,
    },
  ]);

  // Sample user data
  const [user] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: null,
    lastLogin: '2 hours ago',
    accountType: 'Premium',
    securityLevel: 'High',
  });
  
  // Close popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.notification-popup') && !target.closest('.notification-icon')) {
        setIsNotificationOpen(false);
      }
      if (!target.closest('.profile-popup') && !target.closest('.profile-icon')) {
        setIsProfileOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    setHasNotifications(false);
  };
  
  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <ExclamationCircleIcon className="w-5 h-5 text-yellow-500" />;
      case 'alert':
        return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const handleAddAccount = (account: Omit<Account, 'id' | 'currency'>) => {
    const newAccount: Account = {
      ...account,
      id: Date.now().toString(),
      currency: 'USD',
      lastUpdated: new Date(),
    };
    setAccounts([...accounts, newAccount]);
  };

  const handleAccountClick = (account: Account) => {
    setSelectedAccount(account);
  };

  const handleCloseDetails = () => {
    setSelectedAccount(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-semibold">My Accounts</h1>
            <div className="flex items-center gap-4">
              {/* Notification Icon */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors notification-icon"
                >
                  <BellIcon className="w-6 h-6" />
                  {hasNotifications && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </motion.button>
                
                {/* Notification Popup */}
                {isNotificationOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="notification-popup absolute right-0 top-12 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-20"
                  >
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-medium text-gray-900">Notifications</h3>
                      {hasNotifications && (
                        <button 
                          onClick={markAllAsRead}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                          {notifications.map((notification) => (
                            <div 
                              key={notification.id} 
                              className={`p-4 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50/50' : ''}`}
                            >
                              <div className="flex gap-3">
                                <div className="mt-1">
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between">
                                    <h4 className="font-medium text-gray-900 text-sm">{notification.title}</h4>
                                    <span className="text-xs text-gray-500">{notification.time}</span>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center">
                          <BellIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">No notifications</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3 border-t border-gray-100 bg-gray-50">
                      <button 
                        onClick={() => setIsNotificationOpen(false)}
                        className="w-full text-center text-sm text-gray-600 hover:text-gray-900 font-medium"
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
              
              {/* User Profile */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors profile-icon"
                >
                  <UserCircleIcon className="w-8 h-8 text-gray-600" />
                </motion.button>
                
                {/* Profile Popup */}
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="profile-popup absolute right-0 top-12 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-20"
                  >
                    {/* Profile Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                          ) : (
                            <UserCircleIcon className="w-10 h-10 text-white" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium">{user.name}</h3>
                          <p className="text-xs text-white/80">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Profile Info */}
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-500">Last Login</span>
                        <span className="text-xs font-medium">{user.lastLogin}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Account Type</span>
                        <span className="text-xs font-medium text-blue-600">{user.accountType}</span>
                      </div>
                    </div>
                    
                    {/* Profile Actions */}
                    <div className="divide-y divide-gray-100">
                      <a href="/settings" className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <Cog6ToothIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium">Account Settings</span>
                      </a>
                      
                      <a href="/security" className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                        <div className="p-1.5 bg-green-100 rounded-lg">
                          <ShieldCheckIcon className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-sm font-medium">Security</span>
                        <span className="ml-auto text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                          {user.securityLevel}
                        </span>
                      </a>
                      
                      <a href="/payment-methods" className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                        <div className="p-1.5 bg-purple-100 rounded-lg">
                          <CreditCardIconSolid className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="text-sm font-medium">Payment Methods</span>
                      </a>
                      
                      <a href="/reports" className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                        <div className="p-1.5 bg-indigo-100 rounded-lg">
                          <ChartBarIcon className="w-4 h-4 text-indigo-600" />
                        </div>
                        <span className="text-sm font-medium">Financial Reports</span>
                      </a>
                      
                      <a href="/budget" className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                        <div className="p-1.5 bg-cyan-100 rounded-lg">
                          <ArrowTrendingUpIcon className="w-4 h-4 text-cyan-600" />
                        </div>
                        <span className="text-sm font-medium">Budget Planning</span>
                      </a>
                      
                      <a href="/alerts" className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                        <div className="p-1.5 bg-amber-100 rounded-lg">
                          <BellIcon className="w-4 h-4 text-amber-600" />
                        </div>
                        <span className="text-sm font-medium">Alert Preferences</span>
                      </a>
                      
                      <a href="/recurring" className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                        <div className="p-1.5 bg-teal-100 rounded-lg">
                          <BanknotesIcon className="w-4 h-4 text-teal-600" />
                        </div>
                        <span className="text-sm font-medium">Recurring Transactions</span>
                      </a>
                    </div>
                    
                    {/* Logout Button */}
                    <div className="p-3 border-t border-gray-100 bg-gray-50">
                      <button className="w-full flex items-center justify-center gap-2 text-sm text-red-600 hover:text-red-800 font-medium">
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Financial Overview Section */}
          <div className="mb-6">
            {/* Total Balance Card */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium opacity-90">Total Balance</p>
                <button
                  onClick={() => setShowBalances(!showBalances)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  {showBalances ? (
                    <EyeSlashIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
              {showBalances ? (
                <p className="text-2xl font-bold">
                  ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              ) : (
                <div className="h-8 w-28 bg-white/20 rounded-lg blur-sm" />
              )}
            </div>
            
            {/* Add Account Button (Small Version) */}
            <div className="mt-4 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 bg-white text-blue-600 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-50 transition-colors shadow-sm"
              >
                <PlusIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Add Account</span>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Your Accounts</h2>
        <div className="grid gap-4">
          {accounts.map((account) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.01 }}
              className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => handleAccountClick(account)}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-100 rounded-xl">
                    {account.type === 'checking' && <BanknotesIcon className="w-6 h-6 text-blue-600" />}
                    {account.type === 'savings' && <BanknotesIcon className="w-6 h-6 text-green-600" />}
                    {account.type === 'credit' && <CreditCardIcon className="w-6 h-6 text-purple-600" />}
                    {account.type === 'investment' && <ChartBarIcon className="w-6 h-6 text-orange-600" />}
                  </div>
                <div>
                    <h3 className="font-medium text-lg text-gray-900">{account.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{account.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  {showBalances ? (
                    <p className="font-semibold text-lg">
                    {account.currency} {account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  ) : (
                    <div className="h-7 w-24 bg-gray-100 rounded-lg blur-sm" />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <AddAccountModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />

        {selectedAccount && (
          <AccountDetails
            account={selectedAccount}
            transactions={transactions}
            onClose={handleCloseDetails}
          />
        )}
      </main>
    </div>
  );
} 