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
} from '@heroicons/react/24/outline';
import AddAccountModal from '../../components/AddAccountModal';
import AccountDetails from '../../components/AccountDetails';
import ClientOnly from '../../components/ClientOnly';
import dynamic from 'next/dynamic';

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
      date: new Date(Date.now() - 86400000), // Yesterday
      description: 'Grocery Shopping',
      amount: 150.50,
      type: 'expense',
      category: 'Food',
    },
    {
      id: '3',
      date: new Date(Date.now() - 172800000), // 2 days ago
      description: 'Freelance Payment',
      amount: 500,
      type: 'income',
      category: 'Freelance',
    },
  ]);

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

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

  const handlePlaidSuccess = async (public_token: string, metadata: any) => {
    console.log('Bank connected successfully!', { public_token, metadata });
    console.log('Institution name:', metadata.institution.name);
    console.log('Institution ID:', metadata.institution.institution_id);
    
    try {
      console.log('Sending public token to exchange-token API...');
      // Exchange the public token for an access token and get account data
      const response = await fetch('/api/exchange-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_token }),
      });
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Plaid data received:', data);
      
      if (data.accounts && data.accounts.length > 0) {
        console.log('Number of accounts received:', data.accounts.length);
        // Convert Plaid accounts to our app's account format
        const newAccounts = data.accounts.map((plaidAccount: any) => {
          console.log('Processing account:', plaidAccount.name, plaidAccount.account_id);
          return {
            id: plaidAccount.account_id,
            name: plaidAccount.name,
            type: plaidAccount.type === 'credit' ? 'credit' : 
                  plaidAccount.subtype === 'savings' ? 'savings' : 'checking',
            balance: plaidAccount.balances.current || 0,
            currency: 'USD',
            lastUpdated: new Date(),
          };
        });
        
        console.log('Converted accounts:', newAccounts);
        
        // Add the new accounts to the existing accounts
        setAccounts([...accounts, ...newAccounts]);
        
        // Show a success message
        alert(`Successfully connected ${metadata.institution.name}! Added ${newAccounts.length} accounts.`);
      } else {
        console.log('No accounts found in the response');
        alert('No accounts found in the connected bank.');
      }
    } catch (error) {
      console.error('Error processing Plaid connection:', error);
      alert('Failed to process bank connection. Please try again.');
    }
  };

  const handlePlaidExit = (err: any, metadata: any) => {
    console.log('User exited Plaid flow', { err, metadata });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white p-4 border-b">
        <h1 className="text-2xl font-semibold">My Accounts</h1>
      </header>

      <main className="p-4">
        <div className="grid gap-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-medium">{account.name}</h2>
                  <p className="text-sm text-gray-500 capitalize">{account.type}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {account.currency} {account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="fixed bottom-20 right-4 bg-black text-white p-4 rounded-full shadow-lg hover:bg-gray-800 transition-colors"
        >
          <PlusIcon className="w-6 h-6" />
        </button>

        <AddAccountModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      </main>
    </div>
  );
} 