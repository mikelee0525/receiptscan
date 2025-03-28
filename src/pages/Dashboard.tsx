import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useExpenses } from '../contexts/ExpenseContext';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { 
  ReceiptText, 
  PlusCircle, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  BarChart3 
} from 'lucide-react';
import ExpenseCard from '../components/ExpenseCard';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { expenses, loading, deleteExpense } = useExpenses();
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [topCategories, setTopCategories] = useState<{category: string, amount: number}[]>([]);
  
  useEffect(() => {
    if (expenses.length > 0) {
      // Get recent expenses (last 5)
      setRecentExpenses(expenses.slice(0, 5));
      
      // Calculate total spent this month
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      
      const thisMonthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === thisMonth && expenseDate.getFullYear() === thisYear;
      });
      
      const total = thisMonthExpenses.reduce((sum, expense) => sum + expense.total, 0);
      setTotalSpent(total);
      
      // Get top categories
      const categoryMap = new Map<string, number>();
      
      expenses.forEach(expense => {
        const currentAmount = categoryMap.get(expense.category) || 0;
        categoryMap.set(expense.category, currentAmount + expense.total);
      });
      
      const sortedCategories = Array.from(categoryMap.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3);
      
      setTopCategories(sortedCategories);
    }
  }, [expenses]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {currentUser?.displayName || 'User'}
        </h1>
        <p className="text-gray-600">
          {format(new Date(), 'EEEE, MMMM do, yyyy')}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <h3 className="text-xl font-bold text-gray-900">{formatCurrency(totalSpent)}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <ReceiptText size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Receipts</p>
              <h3 className="text-xl font-bold text-gray-900">{expenses.length}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Last Added</p>
              <h3 className="text-xl font-bold text-gray-900">
                {expenses.length > 0 
                  ? format(new Date(expenses[0].date), 'MMM d')
                  : 'No receipts yet'}
              </h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Top Category</p>
              <h3 className="text-xl font-bold text-gray-900">
                {topCategories.length > 0 
                  ? topCategories[0].category
                  : 'No data yet'}
              </h3>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Expenses</h2>
              <Link 
                to="/history" 
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                View All
              </Link>
            </div>
            
            {recentExpenses.length > 0 ? (
              <div className="space-y-4">
                {recentExpenses.map(expense => (
                  <ExpenseCard 
                    key={expense.id} 
                    expense={expense} 
                    onEdit={() => {}} 
                    onDelete={deleteExpense} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ReceiptText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <h3 className="text-lg font-medium text-gray-900">No expenses yet</h3>
                <p className="text-gray-500 mt-1">Start by scanning your first receipt</p>
                <Link
                  to="/scan"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusCircle size={16} className="mr-2" />
                  Scan Receipt
                </Link>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Top Categories</h2>
              <Link 
                to="/reports" 
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                View Reports
              </Link>
            </div>
            
            {topCategories.length > 0 ? (
              <div className="space-y-4">
                {topCategories.map((category, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${
                        index === 0 ? 'bg-blue-500' : 
                        index === 1 ? 'bg-green-500' : 'bg-purple-500'
                      }`}></div>
                      <span className="text-gray-700">{category.category}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(category.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <BarChart3 className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No category data yet</p>
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                to="/scan"
                className="flex items-center p-3 rounded-md hover:bg-blue-50 text-gray-700 hover:text-blue-700"
              >
                <ReceiptText size={18} className="mr-3 text-blue-600" />
                <span>Scan New Receipt</span>
              </Link>
              <Link
                to="/history"
                className="flex items-center p-3 rounded-md hover:bg-blue-50 text-gray-700 hover:text-blue-700"
              >
                <Calendar size={18} className="mr-3 text-blue-600" />
                <span>View All Expenses</span>
              </Link>
              <Link
                to="/reports"
                className="flex items-center p-3 rounded-md hover:bg-blue-50 text-gray-700 hover:text-blue-700"
              >
                <BarChart3 size={18} className="mr-3 text-blue-600" />
                <span>Generate Reports</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;