'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  EyeIcon,
  LockClosedIcon,
  KeyIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useNavigation } from '@/contexts/NavigationContext';

interface PrivacySetting {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  enabled: boolean;
  category: 'data' | 'security' | 'sharing' | 'transparency';
}

export default function PrivacyPage() {
  const navigation = useNavigation();
  const [privacySettings, setPrivacySettings] = useState<PrivacySetting[]>([
    {
      id: 'data-collection',
      title: 'Data Collection',
      description: 'Allow collection of usage data to improve your experience',
      icon: DocumentTextIcon,
      color: 'blue',
      enabled: true,
      category: 'data',
    },
    {
      id: 'two-factor',
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security to your account',
      icon: KeyIcon,
      color: 'green',
      enabled: false,
      category: 'security',
    },
    {
      id: 'data-sharing',
      title: 'Data Sharing',
      description: 'Share anonymous data for analytics and improvements',
      icon: EyeIcon,
      color: 'purple',
      enabled: true,
      category: 'sharing',
    },
    {
      id: 'privacy-policy',
      title: 'Privacy Policy',
      description: 'View and manage your privacy policy preferences',
      icon: ShieldCheckIcon,
      color: 'red',
      enabled: true,
      category: 'transparency',
    },
  ]);

  const togglePrivacySetting = (id: string) => {
    setPrivacySettings(prevSettings =>
      prevSettings.map(setting =>
        setting.id === id
          ? { ...setting, enabled: !setting.enabled }
          : setting
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <button 
            onClick={navigation.handleBack}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back to Accounts</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-gray-900">Privacy Settings</h1>
            <p className="text-gray-600">Manage your privacy and security preferences</p>
          </div>
        </div>

        <div className="space-y-4">
          {privacySettings.map((setting) => {
            const Icon = setting.icon;
            const color = setting.color;
            
            return (
              <motion.div
                key={setting.id}
                whileHover={{ scale: 1.01 }}
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 bg-${color}-50 rounded-lg mt-1`}>
                      <Icon className={`w-5 h-5 text-${color}-600`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{setting.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{setting.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          setting.category === 'data' ? 'bg-blue-50 text-blue-700' :
                          setting.category === 'security' ? 'bg-green-50 text-green-700' :
                          setting.category === 'sharing' ? 'bg-purple-50 text-purple-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {setting.category.charAt(0).toUpperCase() + setting.category.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => togglePrivacySetting(setting.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      setting.enabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        setting.enabled ? 'translate-x-6' : 'translate-x-1'
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