'use client';

import { useState } from 'react';
import { 
  ArrowLeftIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  PhoneIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      id: 1,
      question: 'How do I add a new account?',
      answer: 'To add a new account, click on the "Add Account" button in the accounts page. You\'ll need to provide your bank credentials to connect your account securely.'
    },
    {
      id: 2,
      question: 'How do I track my expenses?',
      answer: 'You can track your expenses by adding them manually or connecting your bank accounts for automatic tracking. The app will categorize your transactions automatically.'
    },
    {
      id: 3,
      question: 'Is my financial data secure?',
      answer: 'Yes, we use bank-level encryption and security measures to protect your data. We never store your bank credentials and use secure third-party providers for account connections.'
    },
    {
      id: 4,
      question: 'How do I export my transaction history?',
      answer: 'You can export your transaction history by going to the History page and clicking the export button. You can choose between CSV and PDF formats.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/settings" className="text-gray-600 hover:text-gray-900">
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-semibold">Help Center</h1>
          </div>

          <div className="space-y-6">
            {/* Contact Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-xl shadow-sm p-4 flex flex-col items-center gap-2 text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <ChatBubbleLeftRightIcon className="w-6 h-6" />
                <span className="font-medium">Live Chat</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-xl shadow-sm p-4 flex flex-col items-center gap-2 text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <EnvelopeIcon className="w-6 h-6" />
                <span className="font-medium">Email Support</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-xl shadow-sm p-4 flex flex-col items-center gap-2 text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <PhoneIcon className="w-6 h-6" />
                <span className="font-medium">Call Support</span>
              </motion.button>
            </div>

            {/* FAQ Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <div key={faq.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                    <button
                      onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <span className="font-medium text-gray-900">{faq.question}</span>
                      {openFaq === faq.id ? (
                        <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                    {openFaq === faq.id && (
                      <p className="mt-2 text-gray-600">{faq.answer}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
} 