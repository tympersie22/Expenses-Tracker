'use client';

import { useState } from 'react';
import { 
  ArrowLeftIcon,
  BellIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  CreditCardIcon,
  ChartBarIcon,
  CalendarIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function AlertPreferencesPage() {
  const [showPopup, setShowPopup] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [preferences, setPreferences] = useState({
    lowBalance: true,
    billDue: true,
    unusualActivity: true,
    budgetAlert: true,
    monthlyReport: true,
    weeklyReport: false,
    transactionAlert: true,
    securityAlert: true
  });

  const alertTypes = [
    {
      id: 'lowBalance',
      title: 'Low Balance Alert',
      description: 'Get notified when your account balance falls below a threshold',
      icon: CreditCardIcon,
      color: 'red'
    },
    {
      id: 'billDue',
      title: 'Bill Payment Reminder',
      description: 'Receive reminders for upcoming bill payments',
      icon: CalendarIcon,
      color: 'blue'
    },
    {
      id: 'unusualActivity',
      title: 'Unusual Activity',
      description: 'Get alerts for suspicious or unusual transactions',
      icon: ExclamationTriangleIcon,
      color: 'yellow'
    },
    {
      id: 'budgetAlert',
      title: 'Budget Alerts',
      description: 'Notifications when you approach your budget limits',
      icon: ChartBarIcon,
      color: 'purple'
    }
  ];

  const togglePreference = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAlertClick = (alertId: string) => {
    setSelectedAlert(alertId);
    setShowPopup(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/settings" className="text-gray-600 hover:text-gray-900">
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-semibold">Alert Preferences</h1>
          </div>

          {/* Quick Navigation */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Link href="/settings">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-xl shadow-sm p-3 flex flex-col items-center gap-2 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Cog6ToothIcon className="w-5 h-5" />
                <span className="text-xs font-medium">Settings</span>
              </motion.div>
            </Link>
            <Link href="/security">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-xl shadow-sm p-3 flex flex-col items-center gap-2 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <ShieldCheckIcon className="w-5 h-5" />
                <span className="text-xs font-medium">Security</span>
              </motion.div>
            </Link>
            <Link href="/payment-methods">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-xl shadow-sm p-3 flex flex-col items-center gap-2 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <CreditCardIcon className="w-5 h-5" />
                <span className="text-xs font-medium">Payments</span>
              </motion.div>
            </Link>
            <Link href="/terms">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-xl shadow-sm p-3 flex flex-col items-center gap-2 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <DocumentTextIcon className="w-5 h-5" />
                <span className="text-xs font-medium">Terms</span>
              </motion.div>
            </Link>
          </div>

          <div className="space-y-6">
            {/* Alert Types */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alertTypes.map((alert) => (
                <motion.div
                  key={alert.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAlertClick(alert.id)}
                  className="bg-white rounded-xl shadow-sm p-4 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 bg-${alert.color}-100 rounded-lg`}>
                      <alert.icon className={`w-5 h-5 text-${alert.color}-600`} />
                    </div>
                    <div>
                      <h3 className="font-medium">{alert.title}</h3>
                      <p className="text-sm text-gray-500">{alert.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Notification Settings */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h2>
              <div className="space-y-4">
                {Object.entries(preferences).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <BellIcon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </h3>
                        <p className="text-sm text-gray-500">Receive notifications for this alert</p>
                      </div>
                    </div>
                    <button
                      onClick={() => togglePreference(key as keyof typeof preferences)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        value ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Pages */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/reports" className="block">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-center gap-2 text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <ChartBarIcon className="w-5 h-5" />
                  <span className="font-medium">Financial Reports</span>
                </motion.div>
              </Link>
              <Link href="/budget" className="block">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-center gap-2 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                  <span className="font-medium">Budget Planning</span>
                </motion.div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Alert Settings Popup */}
      <AnimatePresence>
        {showPopup && selectedAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-lg max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {alertTypes.find(a => a.id === selectedAlert)?.title}
                </h2>
                <button
                  onClick={() => setShowPopup(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-gray-500">Receive alerts via email</p>
                  </div>
                  <button
                    onClick={() => togglePreference(selectedAlert as keyof typeof preferences)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences[selectedAlert as keyof typeof preferences] ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        preferences[selectedAlert as keyof typeof preferences] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Push Notifications</h3>
                    <p className="text-sm text-gray-500">Receive alerts on your device</p>
                  </div>
                  <button
                    onClick={() => togglePreference(selectedAlert as keyof typeof preferences)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences[selectedAlert as keyof typeof preferences] ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        preferences[selectedAlert as keyof typeof preferences] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="pt-4 border-t">
                  <button
                    onClick={() => setShowPopup(false)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 