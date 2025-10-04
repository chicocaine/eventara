import React from 'react';
import QrScanner from './certifika/QrScanner.js';
import NftGallery from './certifika/NftGallery.js';
import type { CertifikaProfile } from '../services/certifikaService.js';

interface CertifikaTabProps {
  certifikaProfile: CertifikaProfile | null;
  certifikaLoading: boolean;
  certifikaError: string | null;
  certifikaConnected: boolean;
  showQrScanner: boolean;
  setShowQrScanner: (show: boolean) => void;
  onQrSuccess: (result: any) => Promise<void>;
  onQrError: (errorMessage: string) => void;
}

export default function CertifikaTab({
  certifikaProfile,
  certifikaLoading,
  certifikaError,
  certifikaConnected,
  showQrScanner,
  setShowQrScanner,
  onQrSuccess,
  onQrError,
}: CertifikaTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <div className="mr-3">
          <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Certifika NFT Certificates</h3>
          <p className="text-gray-600">Your blockchain-verified certificates and achievements</p>
        </div>
      </div>

      {!certifikaConnected ? (
        <div className="text-center py-8">
          <div className="bg-gray-50 rounded-lg p-8 border-2 border-dashed border-gray-300">
            <div className="flex flex-col items-center">
              <div className="mb-4">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4"/>
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Connect to Certifika</h4>
              <p className="text-gray-600 mb-6 max-w-md">
                Scan your Certifika QR code to link your blockchain certificates to your profile
              </p>
              <button
                onClick={() => setShowQrScanner(true)}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Scan QR Code
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm text-green-700 font-medium">Connected to Certifika</span>
            </div>
            <button
              onClick={() => setShowQrScanner(true)}
              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              Update Connection
            </button>
          </div>

          {certifikaLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="mt-2 text-gray-600">Loading your certificates...</p>
            </div>
          ) : certifikaError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-red-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                <div>
                  <p className="text-red-800 font-medium">Error loading certificates</p>
                  <p className="text-red-700 text-sm mt-1">{certifikaError}</p>
                </div>
              </div>
            </div>
          ) : (
            <NftGallery />
          )}
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQrScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Scan Certifika QR Code</h4>
              <button
                onClick={() => setShowQrScanner(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <QrScanner
              onSuccess={onQrSuccess}
              onError={onQrError}
            />
          </div>
        </div>
      )}
    </div>
  );
}