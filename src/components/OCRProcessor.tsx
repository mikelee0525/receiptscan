import React, { useState } from 'react';
import { createWorker } from 'tesseract.js';
import { useDropzone } from 'react-dropzone';
import { Camera, Upload, Loader } from 'lucide-react';

interface OCRProcessorProps {
  onExtractedData: (data: {
    merchant?: string;
    date?: string;
    total?: string;
    tax?: string;
  }) => void;
}

const OCRProcessor: React.FC<OCRProcessorProps> = ({ onExtractedData }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState(""); // 提取的文本

  const [total, setTotal] = useState(null); // 提取的总金额
  const [date, setDate] = useState(null); // 提取的日期

  const apiKey = "AIzaSyAOr6tzMGHTO-ba2v-pLCnZEBRSB0PN0N8";

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp'],
    },
    maxFiles: 1,
    onDrop: handleImageDrop,
  });

  async function handleImageDrop(acceptedFiles: File[]) {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    processImage(file);
  }

  async function captureImage() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      
      video.srcObject = stream;
      await video.play();
      
      // Set canvas dimensions to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current video frame to canvas
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "captured-receipt.jpg", { type: "image/jpeg" });
          processImage(file);
        }
        
        // Stop all video streams
        stream.getTracks().forEach(track => track.stop());
      }, 'image/jpeg');
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please check permissions.');
    }
  }

  const toBase64 = (file:any) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () =>{
        if (typeof reader.result === "string") {
          resolve(reader.result.split(",")[1]);
        };
      } 
      reader.onerror = (error) => reject(error);
    });

  
  // 从提取的文本中提取 total、tax 和 date
  const extractInfoFromText = (text:any) => {
    const result: {
      merchant?: string;
      date?: string;
      total?: string;
      tax?: string;
    } = {};

    // 提取总金额（假设格式为 "Total: $123.45"）
    
    //const taxMatch = text.match(/Total Tax\s*\n\s*(\d+\.\d{2})/);

    const dateMatch1 = text.match(/\d{2}\/\d{2}\/\d{4}/);
    const dateMatch2 = text.match(/\d{2}\/\d{2}\/\d{2,4}/);
  
//   // Extract total amount
    const totalMatch1 = text.match(/TOTAL\s*\n\s*\$?(\d+\.\d{2})/);

    const totalMatch2 = text.match(/Total\s*\n\s*(\d+\.\d{2})/);
    const totalMatch = totalMatch1 || totalMatch2
    if (totalMatch) {
      setTotal(totalMatch[1]);
      result.total = totalMatch[1]
    }

    // 提取日期（假设格式为 "Date: 2023-10-01"）
    const dateMatch = dateMatch1 || dateMatch2
    if (dateMatch) {
      setDate(dateMatch[0]);
      result.date = dateMatch[0]
    }

    result.tax = "0.00"

    return result;

    

  };

  // 使用 Google Cloud Vision API 提取文本
  const processImage = async (file:any) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const base64Image = await toBase64(file);

      const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
      const requestBody = {
        requests: [
          {
            image: {
              content: base64Image,
            },
            features: [
              {
                type: "TEXT_DETECTION",
              },
            ],
          },
        ],
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      const extractedText = data.responses[0].fullTextAnnotation.text;
      //const extractedData = extractReceiptData(data.text);
      setText(extractedText);
      const extractedData = extractInfoFromText(extractedText);
      onExtractedData(extractedData);
    } catch (error) {
      console.error('OCR processing error:', error);
      setError('Failed to process the image. Please try again with a clearer image.');
    } finally {
      setIsProcessing(false);
    }
  };

  // async function processImage2(file: File) {
  //   setIsProcessing(true);
  //   setProgress(0);
  //   setError(null);
    
  //   // Create preview URL
  //   const fileUrl = URL.createObjectURL(file);
  //   setPreviewUrl(fileUrl);
    
  //   try {
  //     const worker = await createWorker("eng");
      
  //     await worker.loadLanguage('eng');
  //     await worker.initialize('eng');
      
  //     const { data } = await worker.recognize(file);
  //     await worker.terminate();
      
  //     // Process the OCR text to extract relevant information
  //     const extractedData = extractReceiptData(data.text);
  //     onExtractedData(extractedData);
      
  //   } catch (err) {
  //     console.error('OCR processing error:', err);
  //     setError('Failed to process the image. Please try again with a clearer image.');
  //   } finally {
  //     setIsProcessing(false);
  //   }
  // }

  // function extractReceiptData(text: string) {
  //   const result: {
  //     merchant?: string;
  //     date?: string;
  //     total?: string;
  //     tax?: string;
  //   } = {};
    
  //   // Split text into lines for processing
  //   const lines = text.split('\n').map(line => line.trim());
    
  //   // Try to find the merchant name (usually in the first few lines)
  //   for (let i = 0; i < Math.min(5, lines.length); i++) {
  //     if (lines[i] && lines[i].length > 3 && !/^\d/.test(lines[i])) {
  //       result.merchant = lines[i];
  //       break;
  //     }
  //   }
    
  //   // Look for date patterns
  //   const dateRegex = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/;
  //   for (const line of lines) {
  //     const dateMatch = line.match(dateRegex);
  //     if (dateMatch) {
  //       result.date = dateMatch[0];
  //       break;
  //     }
  //   }
    
  //   // Look for total amount
  //   const totalRegexes = [
  //     /total\s*[\:\$]?\s*(\d+[\.,]\d{2})/i,
  //     /sum\s*[\:\$]?\s*(\d+[\.,]\d{2})/i,
  //     /amount\s*[\:\$]?\s*(\d+[\.,]\d{2})/i,
  //     /\$\s*(\d+[\.,]\d{2})/
  //   ];
    
  //   for (const regex of totalRegexes) {
  //     for (const line of lines) {
  //       const match = line.match(regex);
  //       if (match) {
  //         result.total = match[1];
  //         break;
  //       }
  //     }
  //     if (result.total) break;
  //   }
    
  //   // Look for tax
  //   const taxRegexes = [
  //     /tax\s*[\:\$]?\s*(\d+[\.,]\d{2})/i,
  //     /vat\s*[\:\$]?\s*(\d+[\.,]\d{2})/i,
  //     /gst\s*[\:\$]?\s*(\d+[\.,]\d{2})/i
  //   ];
    
  //   for (const regex of taxRegexes) {
  //     for (const line of lines) {
  //       const match = line.match(regex);
  //       if (match) {
  //         result.tax = match[1];
  //         break;
  //       }
  //     }
  //     if (result.tax) break;
  //   }
    
  //   return result;
  // }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <button
          type="button"
          onClick={captureImage}
          disabled={isProcessing}
          className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <Camera size={18} className="mr-2" />
          Take Photo
        </button>
        
        <div
          {...getRootProps()}
          className={`flex-1 flex justify-center items-center px-4 py-2 border-2 border-dashed rounded-md cursor-pointer ${
            isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} disabled={isProcessing} />
          <Upload size={18} className="mr-2 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            {isDragActive ? 'Drop the file here' : 'Upload Receipt'}
          </span>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {isProcessing && (
        <div className="text-center py-4">
          <Loader size={24} className="animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-sm text-gray-600">Processing receipt...</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {previewUrl && !isProcessing && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Receipt Preview:</p>
          <div className="relative rounded-md overflow-hidden border border-gray-200">
            <img 
              src={previewUrl} 
              alt="Receipt preview" 
              className="max-h-64 mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OCRProcessor;