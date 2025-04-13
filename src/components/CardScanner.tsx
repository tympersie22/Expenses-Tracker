'use client';

import { useState, useRef, useEffect } from 'react';
import { CameraIcon } from '@heroicons/react/24/outline';

interface CardScannerProps {
  onScan: (cardNumber: string) => void;
  onCancel: () => void;
}

export default function CardScanner({ onScan, onCancel }: CardScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      // Fallback to manual entry
      onCancel();
    }
  };

  return (
    <div className="relative">
      {!isScanning ? (
        <div className="text-center p-6">
          <button
            onClick={startScanning}
            className="flex items-center justify-center gap-2 w-full p-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <CameraIcon className="w-6 h-6" />
            <span>Start Scanning</span>
          </button>
          <p className="mt-4 text-sm text-gray-500">
            Position your card within the frame to scan
          </p>
        </div>
      ) : (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg"
          />
          <div className="absolute inset-0 border-2 border-dashed border-white rounded-lg m-4" />
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-opacity"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
} 