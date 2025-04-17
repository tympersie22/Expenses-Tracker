'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  DocumentChartBarIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  XMarkIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { useNavigation } from '@/contexts/NavigationContext';

type TimeRange = 'day' | 'week' | 'month' | '3months' | '6months' | 'annual';
type ChartType = 'income-expenses' | 'category-breakdown' | null;

interface ReportCard {
  id: string;
  title: string;
  value: string;
  change: number;
  icon: any;
  color: string;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
}

export default function ReportsPage() {
  const router = useRouter();
  const { handleBack } = useNavigation();
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChart, setSelectedChart] = useState<ChartType>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  // Sample transaction data - in a real app, this would come from an API
  const allTransactions: Transaction[] = [
    { id: '1', date: '2023-06-15', description: 'Salary', amount: 5000, category: 'Income', type: 'income' },
    { id: '2', date: '2023-06-14', description: 'Rent', amount: 1200, category: 'Housing', type: 'expense' },
    { id: '3', date: '2023-06-13', description: 'Groceries', amount: 150, category: 'Food', type: 'expense' },
    { id: '4', date: '2023-06-12', description: 'Freelance Work', amount: 800, category: 'Income', type: 'income' },
    { id: '5', date: '2023-06-11', description: 'Utilities', amount: 200, category: 'Utilities', type: 'expense' },
    { id: '6', date: '2023-06-10', description: 'Dining Out', amount: 75, category: 'Food', type: 'expense' },
    { id: '7', date: '2023-06-09', description: 'Transportation', amount: 100, category: 'Transportation', type: 'expense' },
    { id: '8', date: '2023-06-08', description: 'Investment Returns', amount: 250, category: 'Income', type: 'income' },
    { id: '9', date: '2023-05-15', description: 'Salary', amount: 4800, category: 'Income', type: 'income' },
    { id: '10', date: '2023-05-14', description: 'Rent', amount: 1200, category: 'Housing', type: 'expense' },
    { id: '11', date: '2023-05-13', description: 'Groceries', amount: 140, category: 'Food', type: 'expense' },
    { id: '12', date: '2023-05-12', description: 'Freelance Work', amount: 750, category: 'Income', type: 'income' },
    { id: '13', date: '2023-05-11', description: 'Utilities', amount: 190, category: 'Utilities', type: 'expense' },
    { id: '14', date: '2023-05-10', description: 'Dining Out', amount: 80, category: 'Food', type: 'expense' },
    { id: '15', date: '2023-05-09', description: 'Transportation', amount: 95, category: 'Transportation', type: 'expense' },
    { id: '16', date: '2023-05-08', description: 'Investment Returns', amount: 220, category: 'Income', type: 'income' },
    { id: '17', date: '2023-04-15', description: 'Salary', amount: 4700, category: 'Income', type: 'income' },
    { id: '18', date: '2023-04-14', description: 'Rent', amount: 1200, category: 'Housing', type: 'expense' },
    { id: '19', date: '2023-04-13', description: 'Groceries', amount: 130, category: 'Food', type: 'expense' },
    { id: '20', date: '2023-04-12', description: 'Freelance Work', amount: 700, category: 'Income', type: 'income' },
    { id: '21', date: '2023-04-11', description: 'Utilities', amount: 180, category: 'Utilities', type: 'expense' },
    { id: '22', date: '2023-04-10', description: 'Dining Out', amount: 70, category: 'Food', type: 'expense' },
    { id: '23', date: '2023-04-09', description: 'Transportation', amount: 90, category: 'Transportation', type: 'expense' },
    { id: '24', date: '2023-04-08', description: 'Investment Returns', amount: 200, category: 'Income', type: 'income' },
    { id: '25', date: '2023-03-15', description: 'Salary', amount: 4600, category: 'Income', type: 'income' },
    { id: '26', date: '2023-03-14', description: 'Rent', amount: 1200, category: 'Housing', type: 'expense' },
    { id: '27', date: '2023-03-13', description: 'Groceries', amount: 120, category: 'Food', type: 'expense' },
    { id: '28', date: '2023-03-12', description: 'Freelance Work', amount: 650, category: 'Income', type: 'income' },
    { id: '29', date: '2023-03-11', description: 'Utilities', amount: 170, category: 'Utilities', type: 'expense' },
    { id: '30', date: '2023-03-10', description: 'Dining Out', amount: 65, category: 'Food', type: 'expense' },
    { id: '31', date: '2023-03-09', description: 'Transportation', amount: 85, category: 'Transportation', type: 'expense' },
    { id: '32', date: '2023-03-08', description: 'Investment Returns', amount: 180, category: 'Income', type: 'income' },
    { id: '33', date: '2023-02-15', description: 'Salary', amount: 4500, category: 'Income', type: 'income' },
    { id: '34', date: '2023-02-14', description: 'Rent', amount: 1200, category: 'Housing', type: 'expense' },
    { id: '35', date: '2023-02-13', description: 'Groceries', amount: 110, category: 'Food', type: 'expense' },
    { id: '36', date: '2023-02-12', description: 'Freelance Work', amount: 600, category: 'Income', type: 'income' },
    { id: '37', date: '2023-02-11', description: 'Utilities', amount: 160, category: 'Utilities', type: 'expense' },
    { id: '38', date: '2023-02-10', description: 'Dining Out', amount: 60, category: 'Food', type: 'expense' },
    { id: '39', date: '2023-02-09', description: 'Transportation', amount: 80, category: 'Transportation', type: 'expense' },
    { id: '40', date: '2023-02-08', description: 'Investment Returns', amount: 170, category: 'Income', type: 'income' },
    { id: '41', date: '2023-01-15', description: 'Salary', amount: 4400, category: 'Income', type: 'income' },
    { id: '42', date: '2023-01-14', description: 'Rent', amount: 1200, category: 'Housing', type: 'expense' },
    { id: '43', date: '2023-01-13', description: 'Groceries', amount: 100, category: 'Food', type: 'expense' },
    { id: '44', date: '2023-01-12', description: 'Freelance Work', amount: 550, category: 'Income', type: 'income' },
    { id: '45', date: '2023-01-11', description: 'Utilities', amount: 150, category: 'Utilities', type: 'expense' },
    { id: '46', date: '2023-01-10', description: 'Dining Out', amount: 55, category: 'Food', type: 'expense' },
    { id: '47', date: '2023-01-09', description: 'Transportation', amount: 75, category: 'Transportation', type: 'expense' },
    { id: '48', date: '2023-01-08', description: 'Investment Returns', amount: 160, category: 'Income', type: 'income' },
  ];

  // Sample monthly data for the trend chart
  const allMonthlyData = [
    { name: 'Jan', income: 5100, expenses: 1780 },
    { name: 'Feb', income: 5270, expenses: 1810 },
    { name: 'Mar', income: 5430, expenses: 1840 },
    { name: 'Apr', income: 5630, expenses: 1880 },
    { name: 'May', income: 5850, expenses: 1920 },
    { name: 'Jun', income: 6050, expenses: 1950 },
  ];

  const reportCards: ReportCard[] = [
    {
      id: '1',
      title: 'Total Income',
      value: '$12,450.00',
      change: 8.2,
      icon: ArrowTrendingUpIcon,
      color: 'green',
    },
    {
      id: '2',
      title: 'Total Expenses',
      value: '$8,320.00',
      change: -3.1,
      icon: ArrowTrendingDownIcon,
      color: 'red',
    },
    {
      id: '3',
      title: 'Net Savings',
      value: '$4,130.00',
      change: 12.5,
      icon: CurrencyDollarIcon,
      color: 'blue',
    },
    {
      id: '4',
      title: 'Investment Returns',
      value: '$1,250.00',
      change: 5.7,
      icon: ChartBarIcon,
      color: 'purple',
    },
  ];

  // Filter transactions based on selected time range
  useEffect(() => {
    const filterTransactionsByTimeRange = () => {
      const today = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case 'day':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(today.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(today.getMonth() - 1);
          break;
        case '3months':
          startDate.setMonth(today.getMonth() - 3);
          break;
        case '6months':
          startDate.setMonth(today.getMonth() - 6);
          break;
        case 'annual':
          startDate.setFullYear(today.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(today.getMonth() - 1);
      }
      
      const filtered = allTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startDate && transactionDate <= today;
      });
      
      setFilteredTransactions(filtered);
      console.log(`Filtered transactions for ${timeRange}:`, filtered.length);
    };
    
    filterTransactionsByTimeRange();
  }, [timeRange]);

  // Update monthly data based on time range
  useEffect(() => {
    const updateMonthlyData = () => {
      switch (timeRange) {
        case 'day':
        case 'week':
          // For day and week, show hourly data
          setMonthlyData([
            { name: '9AM', income: 1200, expenses: 800 },
            { name: '12PM', income: 1500, expenses: 950 },
            { name: '3PM', income: 1800, expenses: 1100 },
            { name: '6PM', income: 2100, expenses: 1300 },
            { name: '9PM', income: 2400, expenses: 1500 },
          ]);
          break;
        case 'month':
          // For month, show daily data
          setMonthlyData([
            { name: 'Week 1', income: 4200, expenses: 3100 },
            { name: 'Week 2', income: 3800, expenses: 2900 },
            { name: 'Week 3', income: 4500, expenses: 3200 },
            { name: 'Week 4', income: 5100, expenses: 3400 },
          ]);
          break;
        case '3months':
          // For 3 months, show monthly data
          setMonthlyData(allMonthlyData.slice(3));
          break;
        case '6months':
        case 'annual':
          // For 6 months and annual, show all monthly data
          setMonthlyData(allMonthlyData);
          break;
        default:
          setMonthlyData(allMonthlyData);
      }
    };
    
    updateMonthlyData();
  }, [timeRange]);

  const handleTimeRangeChange = (range: TimeRange) => {
    setIsLoading(true);
    setTimeRange(range);
    
    // Simulate loading data
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  };

  const openChartDetails = (chartType: ChartType) => {
    setSelectedChart(chartType);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedChart(null);
    }, 300); // Wait for animation to complete
  };

  // Calculate totals for the selected time range
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Group transactions by category
  const categoryTotals = filteredTransactions.reduce((acc, transaction) => {
    const { category, amount, type } = transaction;
    if (!acc[category]) {
      acc[category] = { income: 0, expenses: 0 };
    }
    if (type === 'income') {
      acc[category].income += amount;
    } else {
      acc[category].expenses += amount;
    }
    return acc;
  }, {} as Record<string, { income: number; expenses: number }>);

  // Prepare data for Income vs Expenses chart
  const incomeExpensesData = [
    { name: 'Income', amount: totalIncome, fill: '#10B981' },
    { name: 'Expenses', amount: totalExpenses, fill: '#EF4444' },
  ];

  // Prepare data for Category Breakdown chart - include all categories with any transactions
  const categoryData = Object.entries(categoryTotals)
    .filter(([_, totals]) => totals.expenses > 0 || totals.income > 0) // Include categories with either expenses or income
    .map(([category, totals]) => ({
      name: category,
      value: totals.expenses || totals.income, // Use expenses if available, otherwise use income
    }));

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C43'];

  // Format the time range display
  const getTimeRangeDisplay = () => {
    switch (timeRange) {
      case 'day':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case '3months':
        return 'Last 3 Months';
      case '6months':
        return 'Last 6 Months';
      case 'annual':
        return 'This Year';
      default:
        return 'This Month';
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
            <span>Back to Accounts</span>
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-gray-900">Financial Reports</h1>
            <p className="text-gray-600">Track your financial performance over time</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLoading(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <div className="relative group">
              <button className="flex items-center gap-1 px-3 py-1.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <CalendarIcon className="w-4 h-4" />
                <span>{getTimeRangeDisplay()}</span>
                <ChevronDownIcon className="w-4 h-4" />
              </button>
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 hidden group-hover:block">
                <button
                  onClick={() => handleTimeRangeChange('day')}
                  className={`w-full text-left px-3 py-1.5 text-sm ${timeRange === 'day' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  Today
                </button>
                <button
                  onClick={() => handleTimeRangeChange('week')}
                  className={`w-full text-left px-3 py-1.5 text-sm ${timeRange === 'week' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  This Week
                </button>
                <button
                  onClick={() => handleTimeRangeChange('month')}
                  className={`w-full text-left px-3 py-1.5 text-sm ${timeRange === 'month' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  This Month
                </button>
                <button
                  onClick={() => handleTimeRangeChange('3months')}
                  className={`w-full text-left px-3 py-1.5 text-sm ${timeRange === '3months' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  Last 3 Months
                </button>
                <button
                  onClick={() => handleTimeRangeChange('6months')}
                  className={`w-full text-left px-3 py-1.5 text-sm ${timeRange === '6months' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  Last 6 Months
                </button>
                <button
                  onClick={() => handleTimeRangeChange('annual')}
                  className={`w-full text-left px-3 py-1.5 text-sm ${timeRange === 'annual' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  This Year
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {reportCards.map((card) => (
            <motion.div
              key={card.id}
              whileHover={{ scale: 1.02 }}
              className={`bg-white rounded-xl shadow-sm p-4 border border-gray-100 h-[100px] flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">{card.title}</h3>
                <div className={`p-1.5 bg-${card.color}-50 rounded-lg`}>
                  <card.icon className={`w-4 h-4 text-${card.color}-600`} />
                </div>
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-900">
                  {card.id === '1' ? `$${totalIncome.toFixed(2)}` : 
                   card.id === '2' ? `$${totalExpenses.toFixed(2)}` : 
                   card.id === '3' ? `$${(totalIncome - totalExpenses).toFixed(2)}` : 
                   card.value}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <span className={`text-xs font-medium ${card.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {card.change >= 0 ? '+' : ''}{card.change}%
                  </span>
                  <span className="text-xs text-gray-500">vs last {timeRange}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="space-y-6">
          <h2 className="text-lg font-medium text-gray-900">Spending Analysis</h2>
          
          {/* Income vs Expenses Chart */}
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Income vs Expenses</h3>
              <button 
                onClick={() => openChartDetails('income-expenses')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View Details
              </button>
            </div>
            <div className="h-64">
              {incomeExpensesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={incomeExpensesData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`$${(value as number).toFixed(2)}`, 'Amount']}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="amount" name="Amount" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No data available for the selected time period
                </div>
              )}
            </div>
          </div>
          
          {/* Category Breakdown */}
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Category Breakdown</h3>
              <button 
                onClick={() => openChartDetails('category-breakdown')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View Details
              </button>
            </div>
            <div className="h-64">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`$${(value as number).toFixed(2)}`, 'Amount']}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No category data available for the selected time period
                </div>
              )}
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Trend Analysis</h3>
              <button 
                onClick={() => openChartDetails('income-expenses')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View Details
              </button>
            </div>
            <div className="h-64">
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`$${(value as number).toFixed(2)}`, 'Amount']}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="income" name="Income" stroke="#10B981" strokeWidth={2} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#EF4444" strokeWidth={2} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No trend data available for the selected time period
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Chart Details */}
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
              className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedChart === 'income-expenses' ? 'Income vs Expenses Details' : 'Category Breakdown Details'}
                </h2>
                <button 
                  onClick={closeModal}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                {selectedChart === 'income-expenses' ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-green-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-green-800 mb-1">Total Income</h3>
                        <p className="text-2xl font-semibold text-green-700">${totalIncome.toFixed(2)}</p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-red-800 mb-1">Total Expenses</h3>
                        <p className="text-2xl font-semibold text-red-700">${totalExpenses.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Transactions</h3>
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredTransactions.map((transaction) => (
                              <tr key={transaction.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(transaction.date).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  {transaction.description}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {transaction.category}
                                </td>
                                <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium text-right ${
                                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-blue-800 mb-1">Total Categories</h3>
                        <p className="text-2xl font-semibold text-blue-700">{Object.keys(categoryTotals).length}</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-purple-800 mb-1">Net Balance</h3>
                        <p className="text-2xl font-semibold text-purple-700">${(totalIncome - totalExpenses).toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Category Breakdown</h3>
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Income</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(categoryTotals).map(([category, totals]) => (
                              <tr key={category} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {category}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600">
                                  ${totals.income.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-red-600">
                                  ${totals.expenses.toFixed(2)}
                                </td>
                                <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium text-right ${
                                  totals.income - totals.expenses >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  ${(totals.income - totals.expenses).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t bg-gray-50 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 