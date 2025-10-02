import React, { useState, useRef, useEffect } from 'react';
import { QrReader } from 'react-qr-reader';
// @ts-ignore - QrScanner has some TypeScript issues but works at runtime
import QrScannerLib from 'qr-scanner';
import { X } from 'lucide-react';
import { certifikaService } from '../../services/certifikaService.js';
import type { VerifyQrResponse } from '../../services/certifikaService.js';

interface QrScannerProps {
  onSuccess?: (result: VerifyQrResponse) => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function QrScanner({ onSuccess, onError, className = '' }: QrScannerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [scanMethod, setScanMethod] = useState<'camera' | 'upload'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError?.('Please select a valid image file.');
      return;
    }

    setIsLoading(true);
    try {
      // Use qr-scanner library to extract QR content from the image
      // @ts-ignore - QrScanner static method exists but has TypeScript definition issues
      const result = await (QrScannerLib as any).scanImage(file, { 
        returnDetailedScanResult: true 
      });
      
      const qrContent = typeof result === 'string' ? result : result.data;
      
      if (!qrContent) {
        onError?.('No QR code found in the image.');
        return;
      }

      // Verify the QR content with the backend
      const verificationResult = await certifikaService.verifyQr(qrContent);
      
      if (verificationResult.success) {
        onSuccess?.(verificationResult);
      } else {
        onError?.(verificationResult.message || 'QR verification failed.');
      }
    } catch (error) {
      console.error('QR scanning error:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to process QR code. Make sure the image contains a valid QR code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0]) {
      await handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0]) {
      await handleFileSelect(files[0]);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Prefer back camera
      });
      
      setStream(mediaStream);
      setCameraActive(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Camera access error:', error);
      onError?.('Unable to access camera. Please use file upload instead.');
    }
  };

  const handleQrScan = async (qrContent: string) => {
    if (!qrContent) return;
    
    setIsLoading(true);
    try {
      // Verify the QR content with the backend
      const verificationResult = await certifikaService.verifyQr(qrContent);
      
      if (verificationResult.success) {
        onSuccess?.(verificationResult);
        setCameraActive(false);
      } else {
        onError?.(verificationResult.message || 'QR verification failed.');
      }
    } catch (error) {
      console.error('QR verification error:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to verify QR code.');
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], 'qr-capture.jpg', { type: 'image/jpeg' });
        await handleFileSelect(file);
        stopCamera();
      }
    }, 'image/jpeg', 0.8);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Scan Certifika QR Code</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setScanMethod('upload')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                scanMethod === 'upload'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Upload
            </button>
            <button
              onClick={() => setScanMethod('camera')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                scanMethod === 'camera'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Camera
            </button>
          </div>
        </div>

        {scanMethod === 'upload' && (
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-indigo-400 bg-indigo-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Drop your QR code image here
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  or click to browse files
                </p>
              </div>

              <button
                onClick={triggerFileInput}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Choose File'
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          </div>
        )}

        {scanMethod === 'camera' && (
          <div className="space-y-4">
            {!cameraActive ? (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-900">
                  Use Camera to Scan QR Code
                </p>
                <button
                  onClick={startCamera}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Start Camera
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <QrReader
                    constraints={{
                      facingMode: 'environment' // Prefer back camera
                    }}
                    onResult={(result, error) => {
                      if (result) {
                        handleQrScan(result.getText());
                      }
                      if (error) {
                        console.error('QR Scanner Error:', error);
                      }
                    }}
                    scanDelay={300}
                    videoContainerStyle={{
                      width: '100%',
                      height: '300px',
                    }}
                    videoStyle={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <div className="absolute inset-0 border-2 border-white border-dashed rounded-lg pointer-events-none opacity-50"></div>
                </div>
                
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={stopCamera}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Stop Camera
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}