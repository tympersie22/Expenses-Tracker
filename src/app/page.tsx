'use client';

import { useState } from 'react';
import { ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface ExpenseSummary {
  title: string;
  amount: number;
  previousAmount: number;
  percentageChange: number;
  previousLabel: string;
}

export default function Home() {
  const [summaries] = useState<ExpenseSummary[]>([
    {
      title: 'Spent Today',
      amount: 64.30,
      previousAmount: 72.50,
      percentageChange: -11,
      previousLabel: 'Yesterday',
    },
    {
      title: 'Spent This Week',
      amount: 410.60,
      previousAmount: 498.00,
      percentageChange: -18,
      previousLabel: 'Last Week',
    },
    {
      title: 'Spent This Month',
      amount: 1025.90,
      previousAmount: 2045.00,
      percentageChange: -41,
      previousLabel: 'Last Month',
    },
  ]);

  return (
    <div className="min-h-screen">
      <header className="p-4 flex items-center justify-between border-b">
        <Link href="/accounts" className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">My Accounts</h1>
          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
        </Link>
        <Link href="/profile">
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        </Link>
      </header>

      <div className="p-4 space-y-4">
        {summaries.map((summary) => (
          <div
            key={summary.title}
            className="bg-white rounded-lg shadow-sm p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-gray-600 text-lg">{summary.title}</h2>
              <ChevronDownIcon className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold">
                ${summary.amount.toFixed(2)}
              </span>
              <span
                className={`text-sm ${
                  summary.percentageChange < 0
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}
              >
                {Math.abs(summary.percentageChange)}%
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {summary.previousLabel} ${summary.previousAmount.toFixed(2)}
            </p>
          </div>
        ))}

        <Link
          href="/add-expense"
          className="fixed bottom-20 right-4 bg-black text-white p-4 rounded-full shadow-lg"
        >
          <PlusIcon className="w-6 h-6" />
        </Link>
      </div>
    </div>
  );
} 