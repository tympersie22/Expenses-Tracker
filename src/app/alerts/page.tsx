'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellIcon,
  BellSlashIcon,
  ArrowLeftIcon,
  XMarkIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { useNavigation } from '@/contexts/NavigationContext';

interface Alert {
  id: string;
  title: string;
  description: string;
  type: 'budget' | 'bill' | 'goal' | 'custom';
  frequency: 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
  icon: any;
  color: string;
}

export default function AlertsPage() {
  const { handleBack } = useNavigation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({
    title: '',
    description: '',
    type: 'budget',
    frequency: 'daily',
  });

  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      title: 'Budget Threshold Alert',
      description: 'Get notified when you reach 80% of your monthly budget',
      type: 'budget',
      frequency: 'daily',
      isActive: true,
      icon: ChartBarIcon,
      color: 'blue',
    },
    {
      id: '2',
      title: 'Bill Payment Reminder',
      description: 'Receive reminders 3 days before your bills are due',
      type: 'bill',
      frequency: 'weekly',
      isActive: true,
      icon: CalendarIcon,
      color: 'green',
    },
    {
      id: '3',
      title: 'Savings Goal Alert',
      description: 'Get notified when you reach your savings milestones',
      type: 'goal',
      frequency: 'monthly',
      isActive: false,
      icon: CurrencyDollarIcon,
      color: 'purple',
    },
    {
      id: '4',
      title: 'Unusual Spending Alert',
      description: 'Get notified when you have unusual spending patterns',
      type: 'custom',
      frequency: 'daily',
      isActive: true,
      icon: ExclamationTriangleIcon,
      color: 'red',
    },
  ]);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewAlert({
      title: '',
      description: '',
      type: 'budget',
      frequency: 'daily',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewAlert((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would save the new alert to your database
    console.log('New alert:', newAlert);
    closeModal();
  };

  const toggleAlertStatus = (id: string) => {
    setAlerts(prevAlerts => 
      prevAlerts.map(alert => 
        alert.id === id 
          ? { ...alert, isActive: !alert.isActive }
          : alert
      )
    );
  };

  // Get icon based on alert type
  const getIconForType = (type: string) => {
    switch (type) {
      case 'budget':
        return ChartBarIcon;
      case 'bill':
        return CalendarIcon;
      case 'goal':
        return CurrencyDollarIcon;
      case 'custom':
        return ExclamationTriangleIcon;
      default:
        return BellIcon;
    }
  };

  // Get color based on alert type
  const getColorForType = (type: string) => {
    switch (type) {
      case 'budget':
        return 'blue';
      case 'bill':
        return 'green';
      case 'goal':
        return 'purple';
      case 'custom':
        return 'red';
      default:
        return 'gray';
    }
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
            <h1 className="text-2xl font-semibold text-gray-900">Alert Preferences</h1>
            <p className="text-gray-600">Manage your financial notifications and reminders</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm rounded-lg shadow-sm hover:shadow transition-all"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>Add Alert</span>
          </motion.button>
        </div>

        {/* Alert Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-lg shadow-sm p-2 border border-gray-100 h-[70px] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-medium text-gray-700">Active Alerts</h3>
              <div className="p-0.5 bg-blue-50 rounded-md">
                <BellIcon className="w-3 h-3 text-blue-600" />
              </div>
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">{alerts.filter(a => a.isActive).length}</p>
              <p className="text-[8px] text-gray-500">Currently enabled</p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-lg shadow-sm p-2 border border-gray-100 h-[70px] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-medium text-gray-700">Inactive Alerts</h3>
              <div className="p-0.5 bg-gray-50 rounded-md">
                <BellSlashIcon className="w-3 h-3 text-gray-600" />
              </div>
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">{alerts.filter(a => !a.isActive).length}</p>
              <p className="text-[8px] text-gray-500">Currently disabled</p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-lg shadow-sm p-2 border border-gray-100 h-[70px] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-medium text-gray-700">Alert Types</h3>
              <div className="p-0.5 bg-purple-50 rounded-md">
                <ExclamationTriangleIcon className="w-3 h-3 text-purple-600" />
              </div>
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">{new Set(alerts.map(a => a.type)).size}</p>
              <p className="text-[8px] text-gray-500">Different categories</p>
            </div>
          </motion.div>
        </div>

        {/* Alert List */}
        <div className="space-y-6">
          <h2 className="text-lg font-medium text-gray-900">Your Alerts</h2>
          
          <div className="grid grid-cols-1 gap-4">
            {alerts.map((alert) => {
              const Icon = alert.icon;
              const color = alert.color;
              
              return (
                <motion.div
                  key={alert.id}
                  whileHover={{ scale: 1.01 }}
                  className={`bg-white rounded-xl shadow-sm p-4 border border-gray-100 cursor-pointer transition-all duration-200 ${
                    alert.isActive ? 'border-green-200' : 'border-gray-200'
                  }`}
                  onClick={() => toggleAlertStatus(alert.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 bg-${color}-50 rounded-lg mt-1`}>
                        <Icon className={`w-5 h-5 text-${color}-600`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{alert.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            alert.isActive 
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-50 text-gray-700'
                          }`}>
                            {alert.isActive ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{alert.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            alert.type === 'budget' ? 'bg-blue-50 text-blue-700' :
                            alert.type === 'bill' ? 'bg-green-50 text-green-700' :
                            alert.type === 'goal' ? 'bg-purple-50 text-purple-700' :
                            'bg-red-50 text-red-700'
                          }`}>
                            {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
                          </span>
                          <span className="text-xs px-2 py-1 bg-gray-50 text-gray-700 rounded-full">
                            {alert.frequency.charAt(0).toUpperCase() + alert.frequency.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`p-2 rounded-lg transition-colors ${
                        alert.isActive 
                          ? 'bg-green-50 text-green-600' 
                          : 'bg-gray-50 text-gray-600'
                      }`}
                    >
                      {alert.isActive ? <BellIcon className="w-5 h-5" /> : <BellSlashIcon className="w-5 h-5" />}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Alert Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 rounded-lg">
                    <PlusIcon className="w-4 h-4 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Add New Alert</h2>
                </div>
                <button 
                  onClick={closeModal}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Alert Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={newAlert.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm"
                    placeholder="e.g., Budget Threshold Alert"
                    required
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={newAlert.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm resize-none"
                    placeholder="Describe what this alert will notify you about"
                    rows={3}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                      Alert Type
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={newAlert.type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
                    >
                      <option value="budget">Budget</option>
                      <option value="bill">Bill</option>
                      <option value="goal">Goal</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">
                      Frequency
                    </label>
                    <select
                      id="frequency"
                      name="frequency"
                      value={newAlert.frequency}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-sm text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg hover:shadow-sm transition-all"
                  >
                    Add Alert
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 