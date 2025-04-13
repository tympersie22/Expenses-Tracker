'use client';

import { useState } from 'react';
import { usePlaidLink, PlaidLinkOnSuccess, PlaidLinkOnExit } from 'react-plaid-link';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface PlaidLinkProps {
  onSuccess: PlaidLinkOnSuccess;
  onExit: PlaidLinkOnExit;
}

export default function PlaidLink({ onSuccess, onExit }: PlaidLinkProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to request a link token from the server
  const requestLinkToken = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Requesting link token...');
      
      const response = await fetch('/api/create-link-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Link token received:', data);
      
      if (data.link_token) {
        setLinkToken(data.link_token);
        return data.link_token;
      } else {
        console.error('No link token in response:', data);
        setError('Failed to get link token');
        return null;
      }
    } catch (error) {
      console.error('Error creating link token:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize Plaid Link with the token when it's available
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit,
  });

  // Handle the connect bank button click
  const handleConnectBank = async () => {
    console.log('Connect bank button clicked');
    
    // Only request a new token if we don't already have one
    if (!linkToken) {
      const token = await requestLinkToken();
      if (token) {
        console.log('Opening Plaid Link with token');
        // Make sure the token is set in state before opening
        setLinkToken(token);
        // Wait for the next render cycle to ensure the token is set
        setTimeout(() => {
          if (ready) {
            open();
          } else {
            console.error('Plaid Link is not ready');
            setError('Plaid Link is not ready. Please try again.');
          }
        }, 100);
      }
    } else {
      // If we already have a token, just open the Plaid Link
      console.log('Opening Plaid Link with existing token');
      if (ready) {
        open();
      } else {
        console.error('Plaid Link is not ready');
        setError('Plaid Link is not ready. Please try again.');
      }
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={handleConnectBank}
        disabled={isLoading}
        className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <ArrowPathIcon className="w-5 h-5 animate-spin" />
        ) : (
          <ArrowPathIcon className="w-5 h-5" />
        )}
        <span className="text-sm font-medium">
          {isLoading ? 'Connecting...' : 'Connect Bank Account'}
        </span>
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
} 