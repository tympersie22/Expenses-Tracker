'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  BellIcon,
  EnvelopeIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
  ChartBarIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useNavigation } from '@/contexts/NavigationContext';

interface Notification {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  enabled: boolean;
  type: 'push' | 'email' | 'sms';
  category: 'transaction' | 'alert' | 'report' | 'reminder';
}

export default function NotificationsPage() {
  const { handleBack } = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 'transaction',
      title: 'Transaction Notifications',
      description: 'Get notified about your transactions',
      icon: ChartBarIcon,
      color: 'blue',
      enabled: true,
      type: 'push',
      category: 'transaction',
    },
    {
      id: 'alert',
      title: 'Alert Notifications',
      description: 'Receive alerts about your spending',
      icon: ExclamationTriangleIcon,
      color: 'red',
      enabled: true,
      type: 'email',
      category: 'alert',
    },
    {
      id: 'report',
      title: 'Report Notifications',
      description: 'Get your monthly financial reports',
      icon: ChartBarIcon,
      color: 'green',
      enabled: true,
      type: 'email',
      category: 'report',
    },
    {
      id: 'reminder',
      title: 'Bill Reminders',
      description: 'Get reminded about upcoming bills',
      icon: CalendarIcon,
      color: 'purple',
      enabled: true,
      type: 'sms',
      category: 'reminder',
    },
  ]);

  const toggleNotification = (id: string) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === id
          ? { ...notification, enabled: !notification.enabled }
          : notification
      )
    );
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
            <span>Back to Profile</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
            <p className="text-gray-600">Manage your notification preferences</p>
          </div>
        </div>

        <div className="space-y-4">
          {notifications.map((notification) => {
            const Icon = notification.icon;
            const color = notification.color;
            
            return (
              <motion.div
                key={notification.id}
                whileHover={{ scale: 1.01 }}
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 bg-${color}-50 rounded-lg mt-1`}>
                      <Icon className={`w-5 h-5 text-${color}-600`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{notification.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{notification.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          notification.type === 'push' ? 'bg-blue-50 text-blue-700' :
                          notification.type === 'email' ? 'bg-green-50 text-green-700' :
                          'bg-purple-50 text-purple-700'
                        }`}>
                          {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleNotification(notification.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notification.enabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notification.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 