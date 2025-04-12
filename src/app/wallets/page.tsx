'use client';

import { useState } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Wallet {
  id: string;
  name: string;
  balance: number;
  type: string;
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([
    { id: '1', name: 'Cash', balance: 1200.00, type: 'cash' },
    { id: '2', name: 'Bank Account', balance: 5430.50, type: 'bank' },
    { id: '3', name: 'Savings', balance: 10000.00, type: 'savings' },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newWallet, setNewWallet] = useState({ name: '', type: 'cash' });

  const handleAddWallet = () => {
    if (newWallet.name.trim()) {
      setWallets([
        ...wallets,
        {
          id: Date.now().toString(),
          name: newWallet.name,
          balance: 0,
          type: newWallet.type,
        },
      ]);
      setNewWallet({ name: '', type: 'cash' });
      setShowAddForm(false);
    }
  };

  const handleDeleteWallet = (id: string) => {
    setWallets(wallets.filter(wallet => wallet.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white p-4 border-b">
        <h1 className="text-xl font-semibold">My Wallets</h1>
      </header>

      <div className="p-4 space-y-4">
        {wallets.map((wallet) => (
          <div
            key={wallet.id}
            className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center"
          >
            <div>
              <h2 className="font-medium">{wallet.name}</h2>
              <p className="text-2xl font-semibold mt-1">
                ${wallet.balance.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 capitalize">{wallet.type}</p>
            </div>
            <button
              onClick={() => handleDeleteWallet(wallet.id)}
              className="text-red-500 p-2"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        ))}

        {showAddForm ? (
          <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
            <input
              type="text"
              placeholder="Wallet Name"
              className="w-full p-2 border rounded"
              value={newWallet.name}
              onChange={(e) => setNewWallet({ ...newWallet, name: e.target.value })}
            />
            <select
              className="w-full p-2 border rounded"
              value={newWallet.type}
              onChange={(e) => setNewWallet({ ...newWallet, type: e.target.value })}
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank Account</option>
              <option value="savings">Savings</option>
              <option value="investment">Investment</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleAddWallet}
                className="bg-black text-white px-4 py-2 rounded"
              >
                Add Wallet
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="border px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-black text-white p-4 rounded-full fixed bottom-20 right-4 shadow-lg"
          >
            <PlusIcon className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
} 