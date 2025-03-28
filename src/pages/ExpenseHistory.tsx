import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useExpenses, Expense } from '../contexts/ExpenseContext';
import ExpenseCard from '../components/ExpenseCard';
import ExpenseFilter from '../components/ExpenseFilter';
import ExpenseForm from '../components/ExpenseForm';
import { format } from 'date-fns';
import { PlusCircle, ReceiptText, X } from 'lucide-react';

const ExpenseHistory: React.FC = () => {
  const { expenses, categories, deleteExpense, getExpensesByCategory, getExpensesByDateRange, loading } = useExpenses();
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  useEffect(() => {
    if (expenses.length > 0) {
      let filtered = [...expenses];
      
      // Filter by search term
      if (searchTerm) {
        filtered = filtered.filter(expense => 
          expense.merchant.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Filter by category
      if (selectedCategory) {
        filtered = filtered.filter(expense => 
          expense.category === selectedCategory
        );
      }
      
      // Filter by date range
      if (dateRange.startDate) {
        const startDate = new Date(dateRange.startDate);
        filtered = filtered.filter(expense => 
          new Date(expense.date) >= startDate
        );
      }
      
      if (dateRange.endDate) {
        const endDate = new Date(dateRange.endDate);
        endDate.setHours(23, 59, 59, 999); // End of the day
        filtered = filtered.filter(expense => 
          new Date(expense.date) <= endDate
        );
      }
      
      setFilteredExpenses(filtered);
    } else {
      setFilteredExpenses([]);
    }
  }, [expenses, searchTerm, selectedCategory, dateRange]);

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowAddExpense(true);
  };

  const handleDeleteExpense = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      await deleteExpense(id);
    }
  };

  const handleFormSuccess = () => {
    setShowAddExpense(false);
    setEditingExpense(null);
  };

  async function handleFilterCatChange(
    cat: string
  ) {
    console.log(cat)

    try {
    
      
      const exp_result = await getExpensesByCategory(cat);
      setFilteredExpenses(exp_result);
      console.log(exp_result)
    }catch (error) {
      console.error("Error fetching expenses by date range:", error);
    }
    
  }

  async function handleFilterDateChange(
    selectedDate: any
  ) {
    console.log(selectedDate)

    try {
    
      
      const exp_result = await getExpensesByDateRange(selectedDate.startDate, selectedDate.endDate);
      setFilteredExpenses(exp_result);
      console.log(exp_result)
    }catch (error) {
      console.error("Error fetching expenses by date range:", error);
    }
    
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Expense History</h1>
        <button
          onClick={() => {
            setEditingExpense(null);
            setShowAddExpense(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusCircle size={16} className="mr-2" />
          Add Expense
        </button>
      </div>
      
      <ExpenseFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={handleFilterCatChange}
        categories={categories}
        dateRange={dateRange}
        onDateRangeChange={handleFilterDateChange}
      />
      
      {showAddExpense && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h2>
              <button
                onClick={() => {
                  setShowAddExpense(false);
                  setEditingExpense(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <ExpenseForm
                initialData={editingExpense || undefined}
                onSuccess={handleFormSuccess}
              />
            </div>
          </div>
        </div>
      )}
      
      {filteredExpenses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredExpenses.map(expense => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onEdit={handleEditExpense}
              onDelete={handleDeleteExpense}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <ReceiptText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <h3 className="text-lg font-medium text-gray-900">No expenses found</h3>
          <p className="text-gray-500 mt-1">
            {expenses.length === 0
              ? "You haven't added any expenses yet."
              : "No expenses match your current filters."}
          </p>
          {expenses.length === 0 && (
            <div className="mt-4">
              <Link
                to="/scan"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusCircle size={16} className="mr-2" />
                Scan Receipt
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExpenseHistory;


