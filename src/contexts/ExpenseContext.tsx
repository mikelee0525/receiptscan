import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  orderBy 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';

export interface Expense {
  id: string;
  date: Date;
  merchant: string;
  total: number;
  tax?: number;
  currency: string;
  category: string;
  notes?: string;
  receiptUrl?: string;
  userId: string;
  createdAt: Date;
}

interface ExpenseContextType {
  expenses: Expense[];
  categories: string[];
  addExpense: (expense: Omit<Expense, 'id' | 'userId' | 'createdAt'>, receiptImage?: File) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Omit<Expense, 'id' | 'userId'>>, receiptImage?: File) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  getExpensesByDateRange: (startDate: Date, endDate: Date) => Promise<Expense[]>;
  getExpensesByCategory: (category: string) => Promise<Expense[]>;
  addCategory: (category: string) => void;
  loading: boolean;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export function useExpenses() {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
}

const defaultCategories = [
  'Food & Dining',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Utilities',
  'Health',
  'Travel',
  'Education',
  'Business',
  'Other'
];

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    async function fetchExpenses() {
      if (currentUser) {
        setLoading(true);
        try {
          const expensesRef = collection(db, 'expenses');
          const q = query(
            expensesRef, 
            where('userId', '==', currentUser.uid),
            orderBy('date', 'desc')
          );
          
          const querySnapshot = await getDocs(q);
          const expensesData: Expense[] = [];
          
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            expensesData.push({
              id: doc.id,
              date: data.date.toDate(),
              merchant: data.merchant,
              total: data.total,
              tax: data.tax,
              currency: data.currency,
              category: data.category,
              notes: data.notes,
              receiptUrl: data.receiptUrl,
              userId: data.userId,
              createdAt: data.createdAt.toDate()
            });
          });
          
          setExpenses(expensesData);
        } catch (error) {
          console.error("Error fetching expenses:", error);
        } finally {
          setLoading(false);
        }
      }
    }

    fetchExpenses();
  }, [currentUser]);

  async function uploadReceipt(file: File): Promise<string> {
    if (!currentUser) throw new Error('User not authenticated');
    
    const fileExtension = file.name.split('.').pop();
    const fileName = `receipts/${currentUser.uid}/${uuidv4()}.${fileExtension}`;
    const storageRef = ref(storage, fileName);
    
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  }

  async function addExpense(
    expense: Omit<Expense, 'id' | 'userId' | 'createdAt'>, 
    receiptImage?: File
  ) {
    if (!currentUser) throw new Error('User not authenticated');
    
    try {
      let receiptUrl = expense.receiptUrl || "" ;
      
      if (receiptImage) {
        receiptUrl = await uploadReceipt(receiptImage) || "";
      }
      
      const expenseData = {
        ...expense,
        userId: currentUser.uid,
        createdAt: new Date(),
        receiptUrl
      };
      
      const docRef = await addDoc(collection(db, 'expenses'), expenseData);
      
      setExpenses(prev => [
        {
          ...expenseData,
          id: docRef.id
        } as Expense,
        ...prev
      ]);
    } catch (error) {
      console.error("Error adding expense:", error);
      throw error;
    }
  }

  async function updateExpense(
    id: string, 
    expenseUpdate: Partial<Omit<Expense, 'id' | 'userId'>>,
    receiptImage?: File
  ) {
    if (!currentUser) throw new Error('User not authenticated');
    
    try {
      let receiptUrl = expenseUpdate.receiptUrl;
      
      if (receiptImage) {
        receiptUrl = await uploadReceipt(receiptImage);
        expenseUpdate.receiptUrl = receiptUrl;
      }
      
      const expenseRef = doc(db, 'expenses', id);
      await updateDoc(expenseRef, expenseUpdate);
      
      setExpenses(prev => 
        prev.map(expense => 
          expense.id === id 
            ? { ...expense, ...expenseUpdate } 
            : expense
        )
      );
    } catch (error) {
      console.error("Error updating expense:", error);
      throw error;
    }
  }

  async function deleteExpense(id: string) {
    if (!currentUser) throw new Error('User not authenticated');
    
    try {
      await deleteDoc(doc(db, 'expenses', id));
      setExpenses(prev => prev.filter(expense => expense.id !== id));
    } catch (error) {
      console.error("Error deleting expense:", error);
      throw error;
    }
  }

  async function getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]> {
    if (!currentUser) throw new Error('User not authenticated');
    
    try {
      const expensesRef = collection(db, 'expenses');
      const q = query(
        expensesRef,
        where('userId', '==', currentUser.uid),
        where('date', '>=', new Date(startDate)),
        where('date', '<=', new Date(endDate)),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const expensesData: Expense[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        expensesData.push({
          id: doc.id,
          date: data.date.toDate(),
          merchant: data.merchant,
          total: data.total,
          tax: data.tax,
          currency: data.currency,
          category: data.category,
          notes: data.notes,
          receiptUrl: data.receiptUrl,
          userId: data.userId,
          createdAt: data.createdAt.toDate()
        });
      });
      
      return expensesData;
    } catch (error) {
      console.error("Error fetching expenses by date range:", error);
      throw error;
    }
  }

  async function getExpensesByCategory(category: string): Promise<Expense[]> {
    if (!currentUser) throw new Error('User not authenticated');
    
    try {
      const expensesRef = collection(db, 'expenses');
      const q = query(
        expensesRef,
        where('userId', '==', currentUser.uid),
        where('category', '==', category),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const expensesData: Expense[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        expensesData.push({
          id: doc.id,
          date: data.date.toDate(),
          merchant: data.merchant,
          total: data.total,
          tax: data.tax,
          currency: data.currency,
          category: data.category,
          notes: data.notes,
          receiptUrl: data.receiptUrl,
          userId: data.userId,
          createdAt: data.createdAt.toDate()
        });
      });
      
      return expensesData;
    } catch (error) {
      console.error("Error fetching expenses by category:", error);
      throw error;
    }
  }

  function addCategory(category: string) {
    if (!categories.includes(category)) {
      setCategories(prev => [...prev, category]);
    }
  }

  const value = {
    expenses,
    categories,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpensesByDateRange,
    getExpensesByCategory,
    addCategory,
    loading
  };

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
}