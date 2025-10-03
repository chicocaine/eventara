import React, { useState, useRef, useEffect } from 'react';
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const scanIntervalRef = useRef<number | null>(null);

  // Add a state to force re-render if needed
  const [videoReady, setVideoReady] = useState(false);

  // Function to play beep sound
  const playBeepSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // 800Hz beep
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log('Beep sound failed:', error);
    }
  };

  // Check if video ref exists when component renders
  useEffect(() => {
    console.log('Component mounted, videoRef.current:', !!videoRef.current);
    if (videoRef.current) {
      setVideoReady(true);
      console.log('Video element found and ready');
    }
  }, [cameraActive]);

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
        playBeepSound(); // Play beep on successful scan
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
    console.log('startCamera function called');
    setCameraLoading(true);
    setCameraActive(true); // Set this first to ensure video element renders
    console.log('Camera loading set to true, camera active set to true');
    
    // Wait a moment for React to render the video element
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('After timeout, videoRef.current:', !!videoRef.current);
    
    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.log('getUserMedia not supported');
      setCameraLoading(false);
      setCameraActive(false);
      onError?.('Camera not supported by this browser. Please use file upload instead.');
      return;
    }
    
    console.log('getUserMedia is supported, proceeding...');
    
    try {
      // Try environment camera first, fallback to any camera
      let mediaStream;
      console.log('Requesting camera access...');
      
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment', // Prefer back camera
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        });
        console.log('Environment camera obtained');
      } catch (envError) {
        console.log('Environment camera not available, trying any camera:', envError);
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        });
        console.log('Any camera obtained');
      }
      
      console.log('MediaStream obtained:', mediaStream);
      setStream(mediaStream);
      console.log('State updated: stream set');
      
      // Wait another moment and check again for video ref
      await new Promise(resolve => setTimeout(resolve, 200));
      console.log('After second timeout, videoRef.current:', !!videoRef.current);
      
      if (videoRef.current) {
        console.log('Video ref exists, setting up video...');
        const video = videoRef.current;
        
        // Clear any existing source first
        video.srcObject = null;
        console.log('Cleared existing video source');
        
        // Set the new source after a brief delay
        setTimeout(() => {
          console.log('Setting video source...');
          video.srcObject = mediaStream;
          console.log('Video source set to:', mediaStream);
          
          // Force video to load
          video.load();
          console.log('Video load() called');
          
          // Add multiple event listeners to ensure we catch when video is ready
          const clearLoadingState = () => {
            console.log('Video ready, clearing loading state');
            console.log('Video element state:', {
              readyState: video.readyState,
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
              paused: video.paused,
              muted: video.muted,
              srcObject: !!video.srcObject
            });
            setCameraLoading(false);
            setTimeout(() => startQrScanning(), 500);
          };
          
          // Listen for multiple video events
          video.addEventListener('loadedmetadata', clearLoadingState, { once: true });
          video.addEventListener('canplay', clearLoadingState, { once: true });
          video.addEventListener('playing', clearLoadingState, { once: true });
          
          // Force play after a short delay
          setTimeout(async () => {
            try {
              console.log('Attempting to play video...');
              await video.play();
              console.log('Video play() succeeded');
              setCameraLoading(false);
            } catch (playError) {
              console.error('Video play failed:', playError);
              setCameraLoading(false);
            }
          }, 300);
          
        }, 100);
        
        // Ultimate fallback - clear loading after 3 seconds no matter what
        setTimeout(() => {
          if (cameraLoading) {
            console.log('Force clearing loading state after timeout');
            console.log('Final video state check:', {
              hasVideoRef: !!videoRef.current,
              hasSrcObject: !!videoRef.current?.srcObject,
              readyState: videoRef.current?.readyState,
              videoWidth: videoRef.current?.videoWidth,
              videoHeight: videoRef.current?.videoHeight
            });
            setCameraLoading(false);
          }
        }, 3000);
      } else {
        console.error('Video ref is still null after waiting!');
        console.log('Retrying in 1 second...');
        
        // Try one more time after a longer delay
        setTimeout(() => {
          if (videoRef.current && mediaStream) {
            console.log('Video ref found on retry, setting up...');
            const video = videoRef.current;
            video.srcObject = mediaStream;
            video.play();
            setCameraLoading(false);
          } else {
            console.error('Video ref still null after retry. Camera setup failed.');
            setCameraLoading(false);
            onError?.('Failed to initialize camera. Please try again.');
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setCameraLoading(false);
      setCameraActive(false);
      
      let errorMessage = 'Unable to access camera. ';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage += 'Camera permission denied. Please allow camera access and try again.';
        } else if (error.name === 'NotFoundError') {
          errorMessage += 'No camera found on this device.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage += 'Camera not supported by this browser.';
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += 'Please check camera permissions and try again.';
      }
      
      onError?.(errorMessage);
    }
  };

  const handleQrScan = async (qrContent: string) => {
    if (!qrContent) return;
    
    setIsLoading(true);
    try {
      // Verify the QR content with the backend
      const verificationResult = await certifikaService.verifyQr(qrContent);
      
      if (verificationResult.success) {
        playBeepSound(); // Play beep on successful scan
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
    setCameraLoading(false);
    stopQrScanning();
  };

  const startQrScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    
    scanIntervalRef.current = window.setInterval(() => {
      scanVideoForQr();
    }, 500); // Scan every 500ms
  };

  const stopQrScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  const scanVideoForQr = async () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== 4) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Draw video frame to canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Convert canvas to blob and scan with qr-scanner
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            // @ts-ignore - QrScanner static method exists but has TypeScript definition issues
            const result = await (QrScannerLib as any).scanImage(blob, { 
              returnDetailedScanResult: true 
            });
            
            const qrContent = typeof result === 'string' ? result : result.data;
            
            if (qrContent) {
              stopQrScanning();
              handleQrScan(qrContent);
            }
          } catch (error) {
            // No QR code found in this frame, continue scanning
          }
        }
      }, 'image/jpeg', 0.8);
    } catch (error) {
      // Scanning error, continue
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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
                  onClick={() => {
                    console.log('Start Camera button clicked');
                    startCamera();
                  }}
                  disabled={cameraLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cameraLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Starting Camera...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Start Camera
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  {/* Video element for camera feed - always render when camera is active */}
                  <video
                    ref={videoRef}
                    className="w-full h-80 bg-gray-900 rounded-lg border-2 border-gray-300"
                    autoPlay
                    playsInline
                    muted
                    controls={false}
                    style={{ 
                      display: 'block',
                      objectFit: 'cover',
                      transform: 'scaleX(-1)', // Mirror for user-facing camera
                      minHeight: '320px',
                      maxHeight: '320px'
                    }}
                    onLoadedMetadata={() => {
                      console.log('Video metadata loaded, dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
                      setCameraLoading(false);
                    }}
                    onCanPlay={() => {
                      console.log('Video can play');
                      setCameraLoading(false);
                    }}
                    onPlaying={() => {
                      console.log('Video is playing');
                      setCameraLoading(false);
                    }}
                    onError={(e) => {
                      console.error('Video error:', e);
                      setCameraLoading(false);
                    }}
                  />
                  
                  {/* Loading overlay when camera is loading */}
                  {cameraLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 rounded-lg">
                      <div className="text-center">
                        <svg className="animate-spin mx-auto h-8 w-8 text-white mb-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-sm text-white">Loading camera...</p>
                      </div>
                    </div>
                  )}
                  
                  {/* QR scanning overlay - only show when not loading */}
                  {!cameraLoading && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-64 h-64 border-2 border-white border-dashed rounded-lg bg-black bg-opacity-20">
                        <div className="relative w-full h-full">
                          {/* Corner guides */}
                          <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                          <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                          <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                          <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                          
                          {/* Center text */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <p className="text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
                              Position QR code here
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Debug info overlay */}
                  <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
                    Camera: {cameraActive ? 'Active' : 'Inactive'} | 
                    Loading: {cameraLoading ? 'Yes' : 'No'} |
                    Stream: {stream ? 'Connected' : 'None'} |
                    VideoRef: {videoRef.current ? 'Found' : 'Null'}
                  </div>
                  
                  {/* Hidden canvas for QR processing */}
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                    width="640"
                    height="480"
                  />
                </div>
                
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={stopCamera}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Stop Camera
                  </button>
                  {cameraLoading && (
                    <button
                      onClick={() => {
                        setCameraLoading(false);
                        startQrScanning();
                      }}
                      className="inline-flex items-center px-4 py-2 border border-indigo-300 text-sm font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Force Start Scanning
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}