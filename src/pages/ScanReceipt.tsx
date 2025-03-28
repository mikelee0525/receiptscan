import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OCRProcessor from '../components/OCRProcessor';
import ExpenseForm from '../components/ExpenseForm';
import { ReceiptText, ArrowLeft } from 'lucide-react';

const ScanReceipt: React.FC = () => {
  const navigate = useNavigate();
  const [extractedData, setExtractedData] = useState<{
    merchant?: string;
    date?: string;
    total?: string;
    tax?: string;
  } | null>(null);
  const [step, setStep] = useState<'scan' | 'form'>('scan');

  const handleExtractedData = (data: {
    merchant?: string;
    date?: string;
    total?: string;
    tax?: string;
  }) => {
    setExtractedData(data);
    setStep('form');
  };

  const handleFormSuccess = () => {
    navigate('/history');
  };

  const parseDate = (dateString?: string) => {
    if (!dateString) return undefined;
    
    try {
      // Try to parse the date string
      const parts = dateString.split(/[\/\-\.]/);
      if (parts.length !== 3) return undefined;
      
      let day, month, year;
      
      // Handle different date formats (MM/DD/YYYY, DD/MM/YYYY, etc.)
      if (parts[2].length === 4) {
        // Assuming format is either MM/DD/YYYY or DD/MM/YYYY
        year = parseInt(parts[2]);
        
        // Try to determine if it's MM/DD or DD/MM based on values
        const firstNum = parseInt(parts[0]);
        const secondNum = parseInt(parts[1]);
        
        if (firstNum > 12 && secondNum <= 12) {
          // First number is likely the day
          day = firstNum;
          month = secondNum;
        } else {
          // Assume MM/DD format (US standard)
          month = firstNum;
          day = secondNum;
        }
      } else {
        // Handle 2-digit year
        year = 2000 + parseInt(parts[2]);
        month = parseInt(parts[0]);
        day = parseInt(parts[1]);
      }
      
      // Create and validate the date
      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime())) return undefined;
      
      return date;
    } catch (error) {
      console.error('Error parsing date:', error);
      return undefined;
    }
  };

  const initialFormData = extractedData ? {
    merchant: extractedData.merchant || '',
    date: parseDate(extractedData.date),
    total: extractedData.total ? parseFloat(extractedData.total.replace(/,/g, '')) : undefined,
    tax: extractedData.tax ? parseFloat(extractedData.tax.replace(/,/g, '')) : undefined,
  } : undefined;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={16} className="mr-1" />
          <span>Back</span>
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <ReceiptText className="h-6 w-6 text-blue-600 mr-2" />
            <h1 className="text-xl font-bold text-gray-900">
              {step === 'scan' ? 'Scan Receipt' : 'Add Expense Details'}
            </h1>
          </div>
        </div>
        
        <div className="p-6">
          {step === 'scan' ? (
            <>
              <p className="text-gray-600 mb-6">
                Take a photo of your receipt or upload an image to extract information automatically.
              </p>
              <OCRProcessor onExtractedData={handleExtractedData} />
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-6">
                Review and edit the extracted information below.
              </p>
              <ExpenseForm 
                initialData={initialFormData} 
                onSuccess={handleFormSuccess} 
              />
              <div className="mt-4 text-center">
                <button
                  onClick={() => setStep('scan')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Scan a different receipt
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScanReceipt;