import React, { useState } from 'react';
import { format } from 'date-fns';
import { Expense } from '../contexts/ExpenseContext';
import { Edit, Trash2, Eye, ChevronDown, ChevronUp } from 'lucide-react';

interface ExpenseCardProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Food & Dining': 'bg-red-100 text-red-800',
      'Transportation': 'bg-blue-100 text-blue-800',
      'Entertainment': 'bg-purple-100 text-purple-800',
      'Shopping': 'bg-pink-100 text-pink-800',
      'Utilities': 'bg-yellow-100 text-yellow-800',
      'Health': 'bg-green-100 text-green-800',
      'Travel': 'bg-indigo-100 text-indigo-800',
      'Education': 'bg-orange-100 text-orange-800',
      'Business': 'bg-teal-100 text-teal-800',
    };
    
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{expense.merchant}</h3>
            <p className="text-sm text-gray-500">{format(expense.date, 'MMM dd, yyyy')}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(expense.total, expense.currency)}
            </p>
            <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(expense.category)}`}>
              {expense.category}
            </span>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <div className="flex space-x-2">
            <button 
              onClick={() => onEdit(expense)}
              className="p-1 text-blue-600 hover:text-blue-800"
              aria-label="Edit expense"
            >
              <Edit size={18} />
            </button>
            <button 
              onClick={() => onDelete(expense.id)}
              className="p-1 text-red-600 hover:text-red-800"
              aria-label="Delete expense"
            >
              <Trash2 size={18} />
            </button>
            {expense.receiptUrl && (
              <a 
                href={expense.receiptUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-1 text-gray-600 hover:text-gray-800"
                aria-label="View receipt"
              >
                <Eye size={18} />
              </a>
            )}
          </div>
          
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-gray-500 hover:text-gray-700"
            aria-label={expanded ? "Show less" : "Show more"}
          >
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100">
          {expense.tax !== undefined && (
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Tax:</span>
              <span className="text-gray-900">{formatCurrency(expense.tax, expense.currency)}</span>
            </div>
          )}
          
          {expense.notes && (
            <div className="mb-2">
              <span className="text-sm text-gray-600">Notes:</span>
              <p className="text-sm text-gray-900 mt-1">{expense.notes}</p>
            </div>
          )}
          
          <div className="text-xs text-gray-500 mt-2">
            Added on {format(expense.createdAt, 'MMM dd, yyyy')}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseCard;