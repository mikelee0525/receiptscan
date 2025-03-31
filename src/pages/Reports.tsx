import React, { useState, useEffect, useRef } from 'react';
import { useExpenses, Expense } from '../contexts/ExpenseContext';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Download, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';

const Reports: React.FC = () => {
  const { expenses, loading, getExpensesByDateRange } = useExpenses();
  const [reportType, setReportType] = useState<'monthly' | 'category'>('monthly');
  const [timeRange, setTimeRange] = useState<'3months' | '6months' | '1year'>('3months');
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [avgPerMonth, setAvgPerMonth] = useState(0);
  const [highestMonth, setHighestMonth] = useState({ month: '', amount: 0 });
  const [lowestMonth, setLowestMonth] = useState({ month: '', amount: 0 });
  const [topCategory, setTopCategory] = useState({ name: '', amount: 0 });
  
  const COLORS = [
    'red',
    'yellow',
    'grey',
    'blue',
    'gold',
    'green',
    'purple',
    'orange',
    'pink'
  ]
   

  useEffect(() => {
    if (!loading && expenses.length > 0) {
      generateReportData();
    }
  }, [expenses, timeRange, loading]);

  const generateReportData = async () => {
    // Determine date range based on selected time range
    const endDate = new Date();
    let startDate;
    
    switch (timeRange) {
      case '3months':
        startDate = subMonths(endDate, 3);
        break;
      case '6months':
        startDate = subMonths(endDate, 6);
        break;
      case '1year':
        startDate = subMonths(endDate, 12);
        break;
      default:
        startDate = subMonths(endDate, 3);
    }
    
    // Get expenses for the selected time range
    const filteredExpenses = await getExpensesByDateRange(startDate, endDate);
    
    // Generate monthly data
    const monthsMap = new Map();
    let total = 0;
    
    filteredExpenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthYear = format(date, 'MMM yyyy');
      
      const currentAmount = monthsMap.get(monthYear) || 0;
      monthsMap.set(monthYear, currentAmount + expense.total);
      
      total += expense.total;
    });
    
    // Sort months chronologically
    const sortedMonths = Array.from(monthsMap.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });
    
    setMonthlyData(sortedMonths);
    
    // Generate category data
    const categoriesMap = new Map();
    
    filteredExpenses.forEach(expense => {
      const currentAmount = categoriesMap.get(expense.category) || 0;
      categoriesMap.set(expense.category, currentAmount + expense.total);
    });
    
    const sortedCategories = Array.from(categoriesMap.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
    
    setCategoryData(sortedCategories);
    
    // Calculate statistics
    setTotalAmount(total);
    setAvgPerMonth(total / Math.max(sortedMonths.length, 1));
    
    if (sortedMonths.length > 0) {
      const highest = sortedMonths.reduce((max, item) => 
        item.amount > max.amount ? item : max, sortedMonths[0]);
      
      const lowest = sortedMonths.reduce((min, item) => 
        item.amount < min.amount ? item : min, sortedMonths[0]);
      
      setHighestMonth(highest);
      setLowestMonth(lowest);
    }
    
    if (sortedCategories.length > 0) {
      setTopCategory(sortedCategories[0]);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const exportToCsv = () => {
    const data = reportType === 'monthly' ? monthlyData : categoryData;
    const headers = reportType === 'monthly' ? ['Month', 'Amount'] : ['Category', 'Amount'];
    
    const csvContent = [
      headers.join(','),
      ...data.map(item => 
        reportType === 'monthly' 
          ? `${item.month},${item.amount}` 
          : `${item.name},${item.amount}`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `expense_report_${reportType}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
        <h3 className="text-lg font-medium text-gray-900">No expense data available</h3>
        <p className="text-gray-500 mt-1">
          Add some expenses to generate reports and insights.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Expense Reports</h1>
        <button
          onClick={exportToCsv}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Download size={16} className="mr-2" />
          Export CSV
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex space-x-4">
            <button
              onClick={() => setReportType('monthly')}
              className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium ${
                reportType === 'monthly'
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <BarChart3 size={16} className="mr-2" />
              Monthly Trends
            </button>
            <button
              onClick={() => setReportType('category')}
              className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium ${
                reportType === 'category'
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <PieChartIcon size={16} className="mr-2" />
              Category Breakdown
            </button>
          </div>
          
          <div className="flex space-x-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last 12 Months</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <h3 className="text-xl font-bold text-gray-900">{formatCurrency(totalAmount)}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Average</p>
              <h3 className="text-xl font-bold text-gray-900">{formatCurrency(avgPerMonth)}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Highest Month</p>
              <h3 className="text-xl font-bold text-gray-900">
                {highestMonth.month ? `${highestMonth.month}` : 'N/A'}
              </h3>
              <p className="text-sm text-gray-500">
                {highestMonth.amount ? formatCurrency(highestMonth.amount) : ''}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <PieChartIcon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Top Category</p>
              <h3 className="text-xl font-bold text-gray-900">
                {topCategory.name || 'N/A'}
              </h3>
              <p className="text-sm text-gray-500">
                {topCategory.amount ? formatCurrency(topCategory.amount) : ''}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {reportType === 'monthly' ? 'Monthly Expense Trends' : 'Expense Categories Breakdown'}
        </h2>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {reportType === 'monthly' ? (
              <BarChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis 
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  formatter={(value) => [`$${value}`, 'Amount']}
                />
                <Legend />
                <Bar dataKey="amount" name="Expenses" fill="#3B82F6" />
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                <Legend />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
        
        {reportType === 'category' && (
          <div className="mt-6">
            <h3 className="text-md font-medium text-gray-900 mb-3">Category Breakdown</h3>
            <div className="space-y-2">
              {categoryData.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-sm text-gray-700">{category.name}</span>
                  </div>
                  <div className="text-sm font-medium">
                    {formatCurrency(category.amount)} 
                    <span className="text-gray-500 ml-1">
                      ({((category.amount / totalAmount) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;