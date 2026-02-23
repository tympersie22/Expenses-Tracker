'use client';

import { useState } from 'react';
import { BanknotesIcon } from '@heroicons/react/24/outline';

export default function BankLinkButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLinkBank = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/create-link-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to start Mono linking');
      }

      const linkUrl = data.mono_url || data.link_url || data.url;
      if (!linkUrl) {
        throw new Error('Mono link URL was not returned by the server');
      }

      window.open(linkUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error linking bank account:', error);
      setError(error instanceof Error ? error.message : 'Failed to link bank account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleLinkBank}
        disabled={isLoading}
        className="flex items-center justify-center gap-2 bg-white p-4 rounded-lg shadow-sm hover:bg-gray-50 transition-colors w-full"
      >
        <BanknotesIcon className="w-5 h-5 text-blue-600" />
        <span className="text-sm font-medium">
          {isLoading ? 'Opening Mono...' : 'Connect with Mono'}
        </span>
        {isLoading && (
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        )}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
