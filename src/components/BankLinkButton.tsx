'use client';

import { useState } from 'react';
import { BanknotesIcon } from '@heroicons/react/24/outline';

export default function BankLinkButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLinkBank = async () => {
    setIsLoading(true);
    
    try {
      // In a real implementation, you would:
      // 1. Call your backend API to create a Plaid link token
      // 2. Initialize the Plaid Link interface
      // 3. Handle the onSuccess callback to save the public token
      
      // For demo purposes, we'll simulate a successful bank link
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success message
      alert('Bank account linked successfully!');
    } catch (error) {
      console.error('Error linking bank account:', error);
      alert('Failed to link bank account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLinkBank}
      disabled={isLoading}
      className="flex items-center justify-center gap-2 bg-white p-4 rounded-lg shadow-sm hover:bg-gray-50 transition-colors w-full"
    >
      <BanknotesIcon className="w-5 h-5 text-blue-600" />
      <span className="text-sm font-medium">
        {isLoading ? 'Linking...' : 'Link Bank Account'}
      </span>
      {isLoading && (
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      )}
    </button>
  );
} 