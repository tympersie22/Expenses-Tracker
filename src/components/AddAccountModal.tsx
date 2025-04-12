'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAccount: (account: {
    name: string;
    type: 'checking' | 'savings' | 'credit';
    initialBalance: number;
  }) => void;
}

export default function AddAccountModal({ isOpen, onClose, onAddAccount }: AddAccountModalProps) {
  const [formData, setFormData] = useState<{
    name: string;
    type: 'checking' | 'savings' | 'credit';
    initialBalance: string;
  }>({
    name: '',
    type: 'checking',
    initialBalance: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddAccount({
      name: formData.name,
      type: formData.type,
      initialBalance: parseFloat(formData.initialBalance) || 0,
    });
    setFormData({ name: '', type: 'checking', initialBalance: '' });
    onClose();
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Add New Account
                    </Dialog.Title>
                    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          Account Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                          Account Type
                        </label>
                        <select
                          id="type"
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value as 'checking' | 'savings' | 'credit' })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          <option value="checking">Checking</option>
                          <option value="savings">Savings</option>
                          <option value="credit">Credit Card</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="initialBalance" className="block text-sm font-medium text-gray-700">
                          Initial Balance
                        </label>
                        <input
                          type="number"
                          id="initialBalance"
                          value={formData.initialBalance}
                          onChange={(e) => setFormData({ ...formData, initialBalance: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          step="0.01"
                          required
                        />
                      </div>
                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
                        >
                          Add Account
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                          onClick={onClose}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 