'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  BellIcon,
  LockClosedIcon,
  GlobeAltIcon,
  MoonIcon,
  SunIcon,
  LanguageIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { useNavigation } from '@/contexts/NavigationContext';

interface Setting {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  value: boolean | string;
  type: 'toggle' | 'select';
  options?: string[];
}

export default function SettingsPage() {
  const navigation = useNavigation();
  const [settings, setSettings] = useState<Setting[]>([
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Manage your notification preferences',
      icon: BellIcon,
      color: 'blue',
      value: true,
      type: 'toggle',
    },
    {
      id: 'privacy',
      title: 'Privacy',
      description: 'Control your privacy settings',
      icon: LockClosedIcon,
      color: 'purple',
      value: true,
      type: 'toggle',
    },
    {
      id: 'language',
      title: 'Language',
      description: 'Choose your preferred language',
      icon: LanguageIcon,
      color: 'green',
      value: 'English',
      type: 'select',
      options: ['English', 'Spanish', 'French', 'German'],
    },
    {
      id: 'currency',
      title: 'Currency',
      description: 'Set your default currency',
      icon: CurrencyDollarIcon,
      color: 'yellow',
      value: 'USD',
      type: 'select',
      options: ['USD', 'EUR', 'GBP', 'JPY'],
    },
    {
      id: 'theme',
      title: 'Theme',
      description: 'Choose your preferred theme',
      icon: SunIcon,
      color: 'orange',
      value: 'light',
      type: 'select',
      options: ['light', 'dark', 'system'],
    },
  ]);

  const handleToggle = (id: string) => {
    setSettings(prevSettings =>
      prevSettings.map(setting =>
        setting.id === id
          ? { ...setting, value: !setting.value }
          : setting
      )
    );
  };

  const handleSelect = (id: string, value: string) => {
    setSettings(prevSettings =>
      prevSettings.map(setting =>
        setting.id === id
          ? { ...setting, value }
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
            <span>Back to Profile</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage your account settings and preferences</p>
          </div>
        </div>

        <div className="space-y-4">
          {settings.map((setting) => {
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
                    </div>
                  </div>
                  {setting.type === 'toggle' ? (
                    <button
                      onClick={() => handleToggle(setting.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        setting.value ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          setting.value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  ) : (
                    <select
                      value={setting.value as string}
                      onChange={(e) => handleSelect(setting.id, e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    >
                      {setting.options?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 