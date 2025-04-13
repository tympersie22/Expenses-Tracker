'use client';

import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { CameraIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ReceiptScannerProps {
  onScanComplete: (data: { 
    merchant: string;
    amount: number;
    date: Date;
    items?: string[];
  }) => void;
  onClose: () => void;
}

export default function ReceiptScanner({ onScanComplete, onClose }: ReceiptScannerProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setIsCapturing(true);
    }
  }, [webcamRef]);

  const retake = () => {
    setCapturedImage(null);
    setIsCapturing(false);
  };

  const processReceipt = () => {
    // In a real implementation, you would:
    // 1. Send the image to an OCR service
    // 2. Extract merchant, amount, date, and items
    // 3. Return the structured data
    
    // For demo purposes, we'll simulate processing
    setTimeout(() => {
      onScanComplete({
        merchant: 'Grocery Store',
        amount: 64.30,
        date: new Date(),
        items: ['Milk', 'Bread', 'Eggs', 'Fruits']
      });
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg overflow-hidden w-full max-w-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Scan Receipt</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          {!capturedImage ? (
            <div className="relative">
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full rounded-lg"
                videoConstraints={{
                  facingMode: 'environment',
                  aspectRatio: 1
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-blue-500 rounded-lg w-3/4 h-3/4"></div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <img 
                src={capturedImage} 
                alt="Captured receipt" 
                className="w-full rounded-lg"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white p-4 rounded-lg text-center">
                  <p className="mb-2">Processing receipt...</p>
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t flex justify-between">
          {!capturedImage ? (
            <button
              onClick={capture}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <CameraIcon className="w-5 h-5" />
              <span>Capture</span>
            </button>
          ) : (
            <>
              <button
                onClick={retake}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Retake
              </button>
              <button
                onClick={processReceipt}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Process
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 