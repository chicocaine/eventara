import React, { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState<'gallery' | 'scanner'>('gallery');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleQrSuccess = async (result: any) => {
    setShowSuccessMessage(true);
    await onQrSuccess(result);
    setActiveTab('gallery');
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  const hasWallet = certifikaProfile?.has_certifika_wallet || certifikaConnected;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
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

        {/* Profile Status */}
        {certifikaProfile && (
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              hasWallet
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                hasWallet ? 'bg-green-400' : 'bg-yellow-400'
              }`}></div>
              {hasWallet ? 'Wallet Connected' : 'No Wallet Connected'}
            </div>
            
            {hasWallet && certifikaProfile.wallet_address && (
              <p className="mt-1 text-xs text-gray-500 font-mono">
                {certifikaProfile.wallet_address.slice(0, 6)}...{certifikaProfile.wallet_address.slice(-4)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Profile Details */}
      {hasWallet && certifikaProfile?.wallet_address && (
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
              Wallet Address
            </label>
            <p className="mt-1 text-sm text-gray-900 font-mono">
              {certifikaProfile.wallet_address}
            </p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                QR Code Verified Successfully!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Your Certifika wallet has been linked and your NFTs have been synced.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {certifikaError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{certifikaError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'gallery'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2m0 0V9a2 2 0 012-2m0 0V7a2 2 0 012-2h10a2 2 0 012 2v2M7 7V6a1 1 0 011-1h8a1 1 0 011 1v1" />
              </svg>
              My Certificates
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('scanner')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'scanner'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Scan QR Code
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="pt-4">
        {certifikaLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="mt-2 text-gray-600">Loading Certifika...</p>
          </div>
        ) : (
          <>
            {activeTab === 'gallery' && (
              <NftGallery />
            )}
            
            {activeTab === 'scanner' && (
              <div className="max-w-2xl mx-auto">
                <QrScanner
                  onSuccess={handleQrSuccess}
                  onError={onQrError}
                />
                
                {!hasWallet && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                          First Time Setup
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>
                            To get started with Certifika, scan any QR code from your POAP or 
                            blockchain certificate. This will link your wallet and import all 
                            your certificates automatically.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}