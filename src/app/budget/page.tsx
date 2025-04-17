'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowLeftIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useNavigation } from '@/contexts/NavigationContext';

interface BudgetCategory {
  id: string;
  name: string;
  budget: number;
  spent: number;
  icon: any;
  color: string;
}

export default function BudgetPage() {
  const { handleBack } = useNavigation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    budget: '',
    icon: 'CurrencyDollarIcon',
    color: 'blue',
  });

  const budgetCategories: BudgetCategory[] = [
    {
      id: '1',
      name: 'Housing',
      budget: 1200,
      spent: 950,
      icon: ChartBarIcon,
      color: 'blue',
    },
    {
      id: '2',
      name: 'Food',
      budget: 500,
      spent: 320,
      icon: CurrencyDollarIcon,
      color: 'green',
    },
    {
      id: '3',
      name: 'Transportation',
      budget: 300,
      spent: 180,
      icon: ArrowTrendingUpIcon,
      color: 'purple',
    },
    {
      id: '4',
      name: 'Entertainment',
      budget: 200,
      spent: 150,
      icon: ArrowTrendingDownIcon,
      color: 'red',
    },
  ];

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewCategory({
      name: '',
      budget: '',
      icon: 'CurrencyDollarIcon',
      color: 'blue',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewCategory((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would save the new category to your database
    console.log('New category:', newCategory);
    closeModal();
  };

  // Calculate total budget and spent
  const totalBudget = budgetCategories.reduce((sum, category) => sum + category.budget, 0);
  const totalSpent = budgetCategories.reduce((sum, category) => sum + category.spent, 0);
  const remainingBudget = totalBudget - totalSpent;

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
            <h1 className="text-2xl font-semibold text-gray-900">Budget Planning</h1>
            <p className="text-gray-600">Manage your spending across different categories</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add Category</span>
          </motion.button>
        </div>

        {/* Budget Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 h-[100px] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Total Budget</h3>
              <div className="p-1.5 bg-blue-50 rounded-lg">
                <CurrencyDollarIcon className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-900">${totalBudget.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">Monthly allocation</p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 h-[100px] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Total Spent</h3>
              <div className="p-1.5 bg-red-50 rounded-lg">
                <ArrowTrendingDownIcon className="w-4 h-4 text-red-600" />
              </div>
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-900">${totalSpent.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">Of your budget</p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 h-[100px] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Remaining</h3>
              <div className="p-1.5 bg-green-50 rounded-lg">
                <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-900">${remainingBudget.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">Available to spend</p>
            </div>
          </motion.div>
        </div>

        {/* Budget Categories */}
        <div className="space-y-6">
          <h2 className="text-lg font-medium text-gray-900">Budget Categories</h2>
          
          <div className="grid grid-cols-1 gap-4">
            {budgetCategories.map((category) => {
              const percentage = (category.spent / category.budget) * 100;
              const isOverBudget = percentage > 100;
              
              return (
                <motion.div
                  key={category.id}
                  whileHover={{ scale: 1.01 }}
                  className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-${category.color}-50 rounded-lg`}>
                        <category.icon className={`w-5 h-5 text-${category.color}-600`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-500">
                          ${category.spent.toFixed(2)} of ${category.budget.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                        {percentage.toFixed(0)}%
                      </p>
                      <p className="text-xs text-gray-500">
                        {isOverBudget ? 'Over budget' : 'Remaining: $' + (category.budget - category.spent).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        isOverBudget ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Category Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Add Budget Category</h2>
                <button 
                  onClick={closeModal}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newCategory.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Groceries, Rent, etc."
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Budget
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">$</span>
                    </div>
                    <input
                      type="number"
                      id="budget"
                      name="budget"
                      value={newCategory.budget}
                      onChange={handleInputChange}
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                    Category Color
                  </label>
                  <select
                    id="color"
                    name="color"
                    value={newCategory.color}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="blue">Blue</option>
                    <option value="green">Green</option>
                    <option value="purple">Purple</option>
                    <option value="red">Red</option>
                    <option value="yellow">Yellow</option>
                    <option value="indigo">Indigo</option>
                  </select>
                </div>
                
                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:shadow-md transition-all"
                  >
                    Add Category
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