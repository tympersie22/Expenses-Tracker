'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCardIcon,
  PlusIcon,
  XMarkIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  CheckIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNavigation } from '@/contexts/NavigationContext';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  name: string;
  details: string;
  icon: string;
  isDefault: boolean;
}

export default function PaymentMethodsPage() {
  const router = useRouter();
  const { handleBack } = useNavigation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'card' | 'bank'>('card');
  const [newPayment, setNewPayment] = useState({
    name: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    bankName: '',
    accountNumber: '',
    routingNumber: '',
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      name: 'Visa ending in 4242',
      details: 'Expires 12/24',
      icon: '💳',
      isDefault: true,
    },
    {
      id: '2',
      type: 'bank',
      name: 'Chase Bank',
      details: 'Account ending in 1234',
      icon: '🏦',
      isDefault: false,
    },
  ]);

  const handleAddPayment = () => {
    if (paymentType === 'card' && (!newPayment.name || !newPayment.cardNumber || !newPayment.expiryDate || !newPayment.cvv)) {
      return;
    }
    if (paymentType === 'bank' && (!newPayment.bankName || !newPayment.accountNumber || !newPayment.routingNumber)) {
      return;
    }

    const payment: PaymentMethod = {
      id: Date.now().toString(),
      type: paymentType,
      name: paymentType === 'card' ? `${newPayment.name} ending in ${newPayment.cardNumber.slice(-4)}` : newPayment.bankName,
      details: paymentType === 'card' ? `Expires ${newPayment.expiryDate}` : `Account ending in ${newPayment.accountNumber.slice(-4)}`,
      icon: paymentType === 'card' ? '💳' : '🏦',
      isDefault: false,
    };

    setPaymentMethods([...paymentMethods, payment]);
    setShowAddModal(false);
    setNewPayment({
      name: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      bankName: '',
      accountNumber: '',
      routingNumber: '',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <button 
            onClick={handleBack}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-gray-900">Payment Methods</h1>
            <p className="text-gray-600">Manage your payment methods and billing information</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-500 text-white text-sm font-medium rounded-xl hover:from-indigo-700 hover:via-blue-700 hover:to-blue-600 transition-all duration-300 w-44 shadow-lg hover:shadow-xl border border-blue-400/20"
          >
            <div className="bg-white/20 p-1 rounded-lg">
              <PlusIcon className="w-3.5 h-3.5" />
            </div>
            <span>Add Payment</span>
          </motion.button>
        </div>

        {/* Payment Methods List */}
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <motion.div
              key={method.id}
              whileHover={{ scale: 1.01 }}
              className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{method.icon}</span>
                  <div>
                    <h3 className="font-medium text-gray-900">{method.name}</h3>
                    <p className="text-sm text-gray-600">{method.details}</p>
                  </div>
                </div>
                {method.isDefault && (
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                    Default
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Add Payment Method Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl shadow-lg max-w-md w-full p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Add Payment Method</h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Payment Type Selection */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setPaymentType('card')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      paymentType === 'card'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <CreditCardIcon className="w-5 h-5" />
                    <span>Credit Card</span>
                  </button>
                  <button
                    onClick={() => setPaymentType('bank')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      paymentType === 'bank'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <BuildingLibraryIcon className="w-5 h-5" />
                    <span>Bank Account</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {paymentType === 'card' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          value={newPayment.name}
                          onChange={(e) => setNewPayment({ ...newPayment, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Card Number
                        </label>
                        <input
                          type="text"
                          value={newPayment.cardNumber}
                          onChange={(e) => setNewPayment({ ...newPayment, cardNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="4242 4242 4242 4242"
                          maxLength={19}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            value={newPayment.expiryDate}
                            onChange={(e) => setNewPayment({ ...newPayment, expiryDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="MM/YY"
                            maxLength={5}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            CVV
                          </label>
                          <input
                            type="text"
                            value={newPayment.cvv}
                            onChange={(e) => setNewPayment({ ...newPayment, cvv: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="123"
                            maxLength={3}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bank Name
                        </label>
                        <input
                          type="text"
                          value={newPayment.bankName}
                          onChange={(e) => setNewPayment({ ...newPayment, bankName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Chase Bank"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Account Number
                        </label>
                        <input
                          type="text"
                          value={newPayment.accountNumber}
                          onChange={(e) => setNewPayment({ ...newPayment, accountNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="1234567890"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Routing Number
                        </label>
                        <input
                          type="text"
                          value={newPayment.routingNumber}
                          onChange={(e) => setNewPayment({ ...newPayment, routingNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="021000021"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddPayment}
                    disabled={
                      paymentType === 'card'
                        ? !newPayment.name || !newPayment.cardNumber || !newPayment.expiryDate || !newPayment.cvv
                        : !newPayment.bankName || !newPayment.accountNumber || !newPayment.routingNumber
                    }
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Payment Method
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 