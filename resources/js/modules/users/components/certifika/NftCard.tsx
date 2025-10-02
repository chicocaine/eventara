import React from 'react';
import type { CertifikaUserNft } from '../../services/certifikaService.js';

interface NftCardProps {
  nft: CertifikaUserNft;
  className?: string;
}

export default function NftCard({ nft, className = '' }: NftCardProps) {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getChainIcon = (chain: string) => {
    switch (chain.toLowerCase()) {
      case 'ethereum':
        return '⚡';
      case 'polygon':
        return '🔷';
      case 'binance':
        return '💛';
      default:
        return '🔗';
    }
  };

  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <div className="relative">
        {/* Event Image */}
        <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-t-lg overflow-hidden">
          {nft.event.image_url ? (
            <img
              src={nft.event.image_url}
              alt={nft.event.name}
              className="w-full h-48 object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          
          {/* Fallback placeholder */}
          <div className={`${nft.event.image_url ? 'hidden' : ''} w-full h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center`}>
            <div className="text-center text-white">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v2a1 1 0 01-1 1h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V8H3a1 1 0 01-1-1V5a1 1 0 011-1h4zM9 4h6V3H9v1zm3 8l-3 3m0 0l3 3m-3-3h6" />
              </svg>
              <p className="text-sm font-medium">NFT Certificate</p>
            </div>
          </div>
        </div>

        {/* Chain Badge */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white bg-opacity-90 text-gray-700 shadow-sm">
            <span className="mr-1">{getChainIcon(nft.nft.chain)}</span>
            {nft.nft.chain}
          </span>
        </div>

        {/* Personalization Badge */}
        {nft.personalization.has_personalization && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Personalized
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Event Info */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
            {nft.event.name}
          </h3>
          
          {nft.event.description && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {nft.event.description}
            </p>
          )}

          <div className="flex items-center text-sm text-gray-500 space-x-4">
            {nft.event.place && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate">{nft.event.place}</span>
              </div>
            )}
            
            {nft.event.date_range && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v16a2 2 0 002 2z" />
                </svg>
                <span>{nft.event.date_range}</span>
              </div>
            )}
          </div>

          {nft.event.category && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {nft.event.category}
              </span>
            </div>
          )}
        </div>

        {/* NFT Details */}
        <div className="border-t border-gray-200 pt-3">
          <div className="space-y-2 text-xs text-gray-500">
            <div className="flex justify-between items-center">
              <span>Contract:</span>
              <span className="font-mono">{truncateAddress(nft.nft.contract_address)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Transaction:</span>
              <span className="font-mono">{truncateAddress(nft.nft.tx_hash)}</span>
            </div>
            
            {nft.nft.block_timestamp && (
              <div className="flex justify-between items-center">
                <span>Minted:</span>
                <span>{formatDate(nft.nft.block_timestamp)}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span>Acquired:</span>
              <span>{formatDate(nft.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex space-x-2">
          {nft.personalization.image_url && (
            <button className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              View Image
            </button>
          )}
          
          <button 
            onClick={() => window.open(`https://etherscan.io/tx/${nft.nft.tx_hash}`, '_blank')}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View on Chain
          </button>
        </div>
      </div>
    </div>
  );
}