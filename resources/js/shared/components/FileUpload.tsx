import React, { useState, useRef, useCallback } from 'react';
import type { ChangeEvent, DragEvent } from 'react';

export interface FileUploadProps {
  label: string;
  type: 'profile' | 'banner';
  currentUrl?: string;
  onUploadSuccess: (url: string) => void;
  onUploadError: (error: string) => void;
  disabled?: boolean;
  className?: string;
  showUrlInput?: boolean;
  onUrlChange?: (url: string) => void;
  accept?: string;
  maxSize?: number; // in MB
}

interface UploadResponse {
  success: boolean;
  message: string;
  data?: {
    url: string;
    filename: string;
    type: string;
  };
  errors?: Record<string, string[]>;
}

export default function FileUpload({
  label,
  type,
  currentUrl = '',
  onUploadSuccess,
  onUploadError,
  disabled = false,
  className = '',
  showUrlInput = true,
  onUrlChange,
  accept = 'image/*',
  maxSize = 2
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [urlInput, setUrlInput] = useState(currentUrl);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const maxSizeBytes = maxSize * 1024 * 1024;
    
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${maxSize}MB`;
    }
    
    if (!file.type.startsWith('image/')) {
      return 'File must be an image';
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'File must be JPEG, PNG, JPG, GIF, or WebP';
    }
    
    return null;
  };

  const uploadFile = async (file: File): Promise<void> => {
    const validationError = validateFile(file);
    if (validationError) {
      onUploadError(validationError);
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/profile/upload-image', {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
      });

      const data: UploadResponse = await response.json();

      if (data.success && data.data?.url) {
        setPreviewUrl(data.data.url);
        onUploadSuccess(data.data.url);
      } else {
        const errorMessage = data.message || 'Upload failed';
        onUploadError(errorMessage);
      }
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError('Network error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = useCallback((file: File) => {
    uploadFile(file);
  }, [type, onUploadSuccess, onUploadError]);

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleUrlInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrlInput(newUrl);
    if (onUrlChange) {
      onUrlChange(newUrl);
    }
    if (newUrl) {
      setPreviewUrl(newUrl);
    }
  };

  const openFileDialog = () => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      {/* Mode Toggle */}
      {showUrlInput && (
        <div className="flex space-x-4 mb-3">
          <button
            type="button"
            onClick={() => setUploadMode('file')}
            className={`px-3 py-1 text-sm rounded-md ${
              uploadMode === 'file'
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                : 'bg-gray-100 text-gray-600 border border-gray-300'
            }`}
            disabled={disabled}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setUploadMode('url')}
            className={`px-3 py-1 text-sm rounded-md ${
              uploadMode === 'url'
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                : 'bg-gray-100 text-gray-600 border border-gray-300'
            }`}
            disabled={disabled}
          >
            Enter URL
          </button>
        </div>
      )}

      {uploadMode === 'file' ? (
        <>
          {/* File Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={openFileDialog}
            className={`
              relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${isDragOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300'}
              ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-400 hover:bg-gray-50'}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileInputChange}
              className="hidden"
              disabled={disabled || isUploading}
            />

            {isUploading ? (
              <div className="space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-sm text-gray-600">Uploading...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-indigo-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF, WebP up to {maxSize}MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* URL Input */
        <input
          type="url"
          value={urlInput}
          onChange={handleUrlInputChange}
          placeholder={`https://example.com/${type}-image.jpg`}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          disabled={disabled}
        />
      )}

      {/* Preview */}
      {previewUrl && (
        <div className="mt-3">
          <p className="text-sm text-gray-700 mb-2">Preview:</p>
          <div className="relative inline-block">
            <img
              src={previewUrl}
              alt={`${type} preview`}
              className={`border border-gray-300 rounded-lg shadow-sm ${
                type === 'profile'
                  ? 'w-20 h-20 object-cover'
                  : 'w-full max-w-sm h-32 object-cover'
              }`}
              onError={() => {
                setPreviewUrl(null);
                onUploadError('Failed to load image preview');
              }}
            />
            <button
              type="button"
              onClick={() => {
                setPreviewUrl(null);
                setUrlInput('');
                if (onUrlChange) onUrlChange('');
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
              disabled={disabled}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}