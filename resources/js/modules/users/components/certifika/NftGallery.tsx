import React, { useState, useEffect } from 'react';
import { certifikaService } from '../../services/certifikaService.js';
import type { CertifikaUserNft, GetNftsResponse, SyncNftsResponse } from '../../services/certifikaService.js';
import NftCard from './NftCard.js';

interface NftGalleryProps {
  className?: string;
}

export default function NftGallery({ className = '' }: NftGalleryProps) {
  const [nfts, setNfts] = useState<CertifikaUserNft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'recent' | 'personalized'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'category'>('date');

  useEffect(() => {
    loadNfts();
  }, []);

  const loadNfts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response: GetNftsResponse = await certifikaService.getUserNfts();
      
      if (response.success && response.data) {
        setNfts(response.data);
      } else {
        setError(response.message || 'Failed to load NFTs');
      }
    } catch (error) {
      console.error('Error loading NFTs:', error);
      setError('Failed to load NFTs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setError(null);
      
      const response: SyncNftsResponse = await certifikaService.syncNfts();
      
      if (response.success) {
        // Reload NFTs after successful sync
        await loadNfts();
        
        // Show success message
        if (response.new_nfts && response.new_nfts > 0) {
          setError(`Successfully synced! Found ${response.new_nfts} new NFT(s).`);
        } else {
          setError('Sync completed. No new NFTs found.');
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => setError(null), 3000);
      } else {
        setError(response.message || 'Sync failed');
      }
    } catch (error) {
      console.error('Error syncing NFTs:', error);
      setError('Failed to sync NFTs');
    } finally {
      setIsSyncing(false);
    }
  };

  const getFilteredAndSortedNfts = () => {
    let filteredNfts = [...nfts];

    // Apply filter
    switch (filter) {
      case 'recent':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filteredNfts = filteredNfts.filter(nft => 
          new Date(nft.created_at) > thirtyDaysAgo
        );
        break;
      case 'personalized':
        filteredNfts = filteredNfts.filter(nft => 
          nft.personalization.has_personalization
        );
        break;
      default:
        // 'all' - no filter
        break;
    }

    // Apply sorting
    filteredNfts.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.event.name.localeCompare(b.event.name);
        case 'category':
          return (a.event.category || '').localeCompare(b.event.category || '');
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filteredNfts;
  };

  const filteredNfts = getFilteredAndSortedNfts();

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your NFT certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              My NFT Certificates
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {nfts.length} certificate{nfts.length !== 1 ? 's' : ''} collected
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSyncing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Syncing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync NFTs
                </>
              )}
            </button>
            
            <button
              onClick={loadNfts}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Error/Success Message */}
        {error && (
          <div className={`mt-4 p-3 rounded-md ${
            error.includes('Successfully') || error.includes('completed')
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {error.includes('Successfully') || error.includes('completed') ? (
                  <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Sorting */}
        {nfts.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex space-x-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Filter
                </label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as 'all' | 'recent' | 'personalized')}
                  className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Certificates</option>
                  <option value="recent">Recent (30 days)</option>
                  <option value="personalized">Personalized</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Sort by
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'category')}
                  className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="date">Date Acquired</option>
                  <option value="name">Event Name</option>
                  <option value="category">Category</option>
                </select>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              Showing {filteredNfts.length} of {nfts.length} certificate{filteredNfts.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {filteredNfts.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2m0 0V9a2 2 0 012-2m0 0V7a2 2 0 012-2h10a2 2 0 012 2v2M7 7V6a1 1 0 011-1h8a1 1 0 011 1v1"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {nfts.length === 0 ? 'No certificates yet' : 'No certificates match your filter'}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {nfts.length === 0
                ? 'Start by scanning a Certifika QR code to add your first certificate.'
                : 'Try adjusting your filter or sort options.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNfts.map((nft) => (
              <NftCard 
                key={`${nft.id}-${nft.nft.tx_hash}`}
                nft={nft}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}