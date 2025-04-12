'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function AddExpensePage() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [wallet, setWallet] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Here you would typically make an API call to save the expense
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      router.push('/');
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="p-4 flex items-center border-b">
        <button onClick={() => router.back()} className="mr-4">
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold">Add Expense</h1>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        <div className="space-y-2">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              id="amount"
              step="0.01"
              required
              className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <input
            type="text"
            id="description"
            required
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What did you spend on?"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            id="category"
            required
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isSubmitting}
          >
            <option value="">Select a category</option>
            <option value="food">Food & Drinks</option>
            <option value="transport">Transportation</option>
            <option value="shopping">Shopping</option>
            <option value="entertainment">Entertainment</option>
            <option value="bills">Bills & Utilities</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="wallet" className="block text-sm font-medium text-gray-700">
            Wallet
          </label>
          <select
            id="wallet"
            required
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            disabled={isSubmitting}
          >
            <option value="">Select a wallet</option>
            <option value="cash">Cash</option>
            <option value="bank">Bank Account</option>
            <option value="savings">Savings</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white py-3 px-4 rounded-md hover:bg-gray-900 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adding...' : 'Add Expense'}
        </button>
      </form>
    </div>
  );
} 