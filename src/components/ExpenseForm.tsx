import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useExpenses } from '../contexts/ExpenseContext';
import { format } from 'date-fns';

interface ExpenseFormProps {
  initialData?: {
    id?: string;
    date?: Date;
    merchant?: string;
    total?: number;
    tax?: number;
    currency?: string;
    category?: string;
    notes?: string;
  };
  onSuccess?: () => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ initialData, onSuccess }) => {
  const { categories, addExpense, updateExpense } = useExpenses();
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    defaultValues: {
      date: initialData?.date ? format(initialData.date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      merchant: initialData?.merchant || ' ',
      total: initialData?.total || '',
      tax: initialData?.tax || '0.0',
      currency: initialData?.currency || 'CAD',
      category: initialData?.category || categories[0],
      notes: initialData?.notes || '',
    }
  });

  const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      setValue('category', newCategory);
      setShowNewCategoryInput(false);
      setNewCategory('');
    }
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const expenseData = {
        date: new Date(data.date),
        merchant: data.merchant,
        total: parseFloat(data.total),
        tax: data.tax ? parseFloat(data.tax) : undefined,
        currency: data.currency,
        category: data.category,
        notes: data.notes,
      };

      if (initialData?.id) {
        await updateExpense(initialData.id, expenseData, receiptFile || undefined);
      } else {
        await addExpense(expenseData, receiptFile || undefined);
      }

      reset();
      setReceiptFile(null);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error submitting expense:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            {...register('date', { required: 'Date is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Merchant</label>
          <input
            type="text"
            {...register('merchant', { required: 'Merchant is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Store or business name"
          />
          {errors.merchant && <p className="mt-1 text-sm text-red-600">{errors.merchant.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Total Amount</label>
          <input
            type="number"
            step="0.01"
            {...register('total', { 
              required: 'Total amount is required',
              min: { value: 0.01, message: 'Amount must be greater than 0' }
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="0.00"
          />
          {errors.total && <p className="mt-1 text-sm text-red-600">{errors.total.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tax (Optional)</label>
          <input
            type="number"
            step="0.01"
            {...register('tax', { 
              min: { value: 0, message: 'Tax cannot be negative' }
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="0.00"
          />
          {errors.tax && <p className="mt-1 text-sm text-red-600">{errors.tax.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Currency</label>
          <select
            {...register('currency', { required: 'Currency is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {currencies.map(currency => (
              <option key={currency} value={currency}>{currency}</option>
            ))}
          </select>
          {errors.currency && <p className="mt-1 text-sm text-red-600">{errors.currency.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Category</label>
        {showNewCategoryInput ? (
          <div className="flex mt-1">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="New category name"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add
            </button>
          </div>
        ) : (
          <div className="flex mt-1">
            <select
              {...register('category', { required: 'Category is required' })}
              className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNewCategoryInput(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              New
            </button>
          </div>
        )}
        {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
        <textarea
          {...register('notes')}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Additional details about this expense"
        ></textarea>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Receipt Image (Optional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mt-1 block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        {receiptFile && (
          <p className="mt-2 text-sm text-gray-500">
            Selected file: {receiptFile.name}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : initialData?.id ? 'Update Expense' : 'Save Expense'}
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;