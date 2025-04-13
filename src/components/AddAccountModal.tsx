'use client';

import { useState } from 'react';
import { XMarkIcon, CreditCardIcon, QrCodeIcon, BuildingLibraryIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import BankLinkButton from './BankLinkButton';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddAccountModal({ isOpen, onClose }: AddAccountModalProps) {
  const [selectedOption, setSelectedOption] = useState<'bank' | 'card' | 'manual' | null>(null);

  const options = [
    {
      id: 'bank',
      title: 'Connect Bank Account',
      description: 'Securely link your bank account using Plaid',
      icon: BuildingLibraryIcon,
      action: () => setSelectedOption('bank'),
    },
    {
      id: 'card',
      title: 'Scan Card',
      description: 'Scan your credit or debit card',
      icon: CreditCardIcon,
      action: () => setSelectedOption('card'),
    },
    {
      id: 'manual',
      title: 'Manual Entry',
      description: 'Add account details manually',
      icon: QrCodeIcon,
      action: () => setSelectedOption('manual'),
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Add New Account</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {options.map((option) => (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-4 border rounded-xl hover:border-gray-400 transition-colors flex items-start gap-4"
                    onClick={option.action}
                  >
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <option.icon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium">{option.title}</h3>
                      <p className="text-sm text-gray-500">{option.description}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {selectedOption === 'bank' && (
              <div className="p-6 border-t">
                <BankLinkButton />
              </div>
            )}

            {selectedOption === 'card' && (
              <div className="p-6 border-t">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">Card scanning feature coming soon!</p>
                  <button
                    onClick={() => setSelectedOption(null)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Go back
                  </button>
                </div>
              </div>
            )}

            {selectedOption === 'manual' && (
              <div className="p-6 border-t">
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Name
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="e.g., My Checking Account"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Type
                    </label>
                    <select className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent">
                      <option value="checking">Checking</option>
                      <option value="savings">Savings</option>
                      <option value="credit">Credit Card</option>
                      <option value="investment">Investment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Initial Balance
                    </label>
                    <input
                      type="number"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedOption(null)}
                      className="flex-1 p-3 border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 p-3 bg-black text-white rounded-lg hover:bg-gray-800"
                    >
                      Add Account
                    </button>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 