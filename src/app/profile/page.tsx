'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserCircleIcon,
  BellIcon,
  CogIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  KeyIcon,
  DocumentTextIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import ReactCrop, { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface UserProfile {
  name: string;
  email: string;
  currency: string;
  notifications: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  profileImage?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>({
    name: 'John Doe',
    email: 'Johndoe@example.com',
    currency: 'USD',
    notifications: true,
    theme: 'system',
    language: 'English',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState(profile);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 100,
    height: 100,
    x: 0,
    y: 0
  });
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEdit = () => {
    setTempProfile(profile);
    setIsEditing(true);
  };

  const handleSave = () => {
    setProfile(tempProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (crop: Crop) => {
    setCrop(crop);
  };

  const handleCropSave = () => {
    if (imageRef.current && crop.width && crop.height) {
      const canvas = document.createElement('canvas');
      const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
      const scaleY = imageRef.current.naturalHeight / imageRef.current.height;
      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(
          imageRef.current,
          crop.x * scaleX,
          crop.y * scaleY,
          crop.width * scaleX,
          crop.height * scaleY,
          0,
          0,
          crop.width,
          crop.height
        );

        const base64Image = canvas.toDataURL('image/jpeg');
        setTempProfile({ ...tempProfile, profileImage: base64Image });
        setShowCropModal(false);
      }
    }
  };

  const handleLogout = () => {
    // Clear the authentication token
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    // Redirect to login page
    router.push('/login');
  };

  const menuItems = [
    {
      icon: CogIcon,
      label: 'Settings',
      href: '/settings',
      description: 'Manage your account settings',
    },
    {
      icon: BellIcon,
      label: 'Notifications',
      href: '/notifications',
      description: 'Configure your notification preferences',
    },
    {
      icon: ShieldCheckIcon,
      label: 'Security',
      href: '/security',
      description: 'Manage your security settings',
    },
    {
      icon: DocumentTextIcon,
      label: 'Terms & Privacy',
      href: '/terms',
      description: 'View our terms and privacy policy',
    },
    {
      icon: QuestionMarkCircleIcon,
      label: 'Help & Support',
      href: '/help',
      description: 'Get help and support',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-500 mt-1">Manage your account settings</p>
          </div>
          <div className="flex items-center self-end mb-0.5">
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <PencilIcon className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex gap-1.5">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <CheckIcon className="w-4 h-4" />
                  <span>Save</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm p-4 mb-6"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={`w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden ${isEditing ? 'cursor-pointer hover:bg-gray-200 transition-colors group' : ''}`}>
                {isEditing ? (
                  tempProfile.profileImage ? (
                    <img
                      src={tempProfile.profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center">
                      <UserCircleIcon className="w-12 h-12 text-gray-400" />
                      <span className="text-[10px] text-gray-500 mt-0.5">Add photo</span>
                    </div>
                  )
                ) : (
                  profile.profileImage ? (
                    <img
                      src={profile.profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="w-12 h-12 text-gray-400" />
                  )
                )}
                {isEditing && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                    <CameraIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
              </div>
              {isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-1.5 bg-black text-white rounded-full hover:bg-gray-800 transition-colors shadow-lg"
                >
                  <CameraIcon className="w-3 h-3" />
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-0.5">
                      Name
                    </label>
                    <input
                      type="text"
                      value={tempProfile.name}
                      onChange={(e) =>
                        setTempProfile({ ...tempProfile, name: e.target.value })
                      }
                      className="w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-0.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={tempProfile.email}
                      onChange={(e) =>
                        setTempProfile({ ...tempProfile, email: e.target.value })
                      }
                      className="w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {profile.name}
                  </h2>
                  <p className="text-sm text-gray-500">{profile.email}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Crop Modal */}
        <AnimatePresence>
          {showCropModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4"
              >
                <h3 className="text-lg font-semibold mb-4">Crop Profile Picture</h3>
                <div className="mb-4">
                  <ReactCrop
                    crop={crop}
                    onChange={handleCropComplete}
                    aspect={1}
                    circularCrop
                  >
                    <img
                      ref={imageRef}
                      src={imageSrc}
                      alt="Crop me"
                      className="max-h-[400px] w-auto mx-auto"
                    />
                  </ReactCrop>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowCropModal(false)}
                    className="px-3.5 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCropSave}
                    className="px-3.5 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm p-6 mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Preferences
          </h3>
          <div className="space-y-4">
            <button
              onClick={() => isEditing && setTempProfile({ ...tempProfile, currency: tempProfile.currency === 'USD' ? 'EUR' : 'GBP' })}
              className={`w-full flex justify-between items-center p-4 rounded-xl transition-all ${
                isEditing ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'
              }`}
            >
              <div>
                <label className="text-gray-900 font-medium">Currency</label>
                <p className="text-sm text-gray-500">Select your preferred currency</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">{isEditing ? tempProfile.currency : profile.currency}</span>
                {isEditing && (
                  <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>

            <button
              onClick={() => isEditing && setTempProfile({ 
                ...tempProfile, 
                theme: tempProfile.theme === 'light' ? 'dark' : tempProfile.theme === 'dark' ? 'system' : 'light' 
              })}
              className={`w-full flex justify-between items-center p-4 rounded-xl transition-all ${
                isEditing ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'
              }`}
            >
              <div>
                <label className="text-gray-900 font-medium">Theme</label>
                <p className="text-sm text-gray-500">Choose your preferred theme</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 capitalize">{isEditing ? tempProfile.theme : profile.theme}</span>
                {isEditing && (
                  <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>

            <button
              onClick={() => isEditing && setTempProfile({ 
                ...tempProfile, 
                language: tempProfile.language === 'English' ? 'Spanish' : tempProfile.language === 'Spanish' ? 'French' : 'English' 
              })}
              className={`w-full flex justify-between items-center p-4 rounded-xl transition-all ${
                isEditing ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'
              }`}
            >
              <div>
                <label className="text-gray-900 font-medium">Language</label>
                <p className="text-sm text-gray-500">Select your preferred language</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">{isEditing ? tempProfile.language : profile.language}</span>
                {isEditing && (
                  <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>

            <button
              onClick={() => isEditing && setTempProfile({ 
                ...tempProfile, 
                notifications: !tempProfile.notifications 
              })}
              className={`w-full flex justify-between items-center p-4 rounded-xl transition-all ${
                isEditing ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'
              }`}
            >
              <div>
                <label className="text-gray-900 font-medium">Notifications</label>
                <p className="text-sm text-gray-500">Enable or disable notifications</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEditing ? tempProfile.notifications : profile.notifications}
                    onChange={(e) =>
                      isEditing
                        ? setTempProfile({
                            ...tempProfile,
                            notifications: e.target.checked,
                          })
                        : setProfile({
                            ...profile,
                            notifications: e.target.checked,
                          })
                    }
                    disabled={!isEditing}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
                </label>
                {isEditing && (
                  <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>
          </div>
        </motion.div>

        {/* Menu Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm divide-y"
        >
          {menuItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-gray-100 rounded-lg">
                <item.icon className="w-6 h-6 text-gray-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{item.label}</h3>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
              <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-400" />
            </a>
          ))}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-4 text-red-600 hover:bg-red-50 transition-colors"
          >
            <div className="p-2 bg-red-100 rounded-lg">
              <ArrowRightOnRectangleIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-medium">Log Out</h3>
              <p className="text-sm text-red-500">Sign out of your account</p>
            </div>
          </button>
        </motion.div>
      </div>
    </div>
  );
} 