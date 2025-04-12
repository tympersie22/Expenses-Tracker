'use client';

import { useState } from 'react';
import {
  UserCircleIcon,
  BellIcon,
  CogIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

interface UserProfile {
  name: string;
  email: string;
  currency: string;
  notifications: boolean;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Mbwana Ally',
    email: 'mbwanaally1088@icloud.com',
    currency: 'USD',
    notifications: true,
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    // Here you would typically save to backend
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white p-4 border-b">
        <h1 className="text-xl font-semibold">Profile</h1>
      </header>

      <div className="p-4">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center gap-4">
            <UserCircleIcon className="w-16 h-16 text-gray-400" />
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                  className="text-xl font-semibold border rounded px-2 py-1"
                />
              ) : (
                <h2 className="text-xl font-semibold">{profile.name}</h2>
              )}
              <p className="text-gray-500">{profile.email}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm divide-y">
          <div className="p-4">
            <h3 className="text-lg font-medium mb-4">Preferences</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-gray-600">Currency</label>
                <select
                  value={profile.currency}
                  onChange={(e) =>
                    setProfile({ ...profile, currency: e.target.value })
                  }
                  className="border rounded px-2 py-1"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div className="flex justify-between items-center">
                <label className="text-gray-600">Notifications</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.notifications}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        notifications: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-2">
            <button className="w-full flex items-center gap-3 py-2 px-4 hover:bg-gray-50 rounded-lg">
              <CogIcon className="w-6 h-6 text-gray-500" />
              <span>Settings</span>
            </button>
            <button className="w-full flex items-center gap-3 py-2 px-4 hover:bg-gray-50 rounded-lg">
              <BellIcon className="w-6 h-6 text-gray-500" />
              <span>Notifications</span>
            </button>
            <button className="w-full flex items-center gap-3 py-2 px-4 hover:bg-gray-50 rounded-lg">
              <QuestionMarkCircleIcon className="w-6 h-6 text-gray-500" />
              <span>Help & Support</span>
            </button>
            <button className="w-full flex items-center gap-3 py-2 px-4 text-red-600 hover:bg-red-50 rounded-lg">
              <ArrowRightOnRectangleIcon className="w-6 h-6" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 