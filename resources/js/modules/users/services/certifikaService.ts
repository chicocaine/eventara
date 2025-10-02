import axios from 'axios';
import type { AxiosResponse } from 'axios';

// Certifika Types
export interface CertifikaEvent {
  id: string;
  name: string;
  description: string;
  place: string;
  date_range: string;
  image_url: string;
  category: string;
}

export interface CertifikaNft {
  tx_hash: string;
  chain: string;
  contract_address: string;
  block_timestamp?: string;
}

export interface CertifikaPersonalization {
  has_personalization: boolean;
  image_url?: string;
}

export interface CertifikaUserNft {
  id: number;
  event: CertifikaEvent;
  nft: CertifikaNft;
  personalization: CertifikaPersonalization;
  created_at: string;
}

export interface CertifikaProfile {
  has_certifika_wallet: boolean;
  wallet_address?: string;
}

export interface CertifikaResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface VerifyQrResponse extends CertifikaResponse {
  verification?: any;
  sync?: any;
}

export interface GetNftsResponse extends CertifikaResponse<CertifikaUserNft[]> {
  count?: number;
}

export interface SyncNftsResponse extends CertifikaResponse {
  synced_count?: number;
  new_nfts?: number;
}

class CertifikaService {
  private baseURL = '/api/certifika';

  /**
   * Verify QR code and link wallet to user
   */
  async verifyQr(qrContent: string): Promise<VerifyQrResponse> {
    try {
      console.log('Verifying QR code...');
      
      const response: AxiosResponse<VerifyQrResponse> = await axios.post(`${this.baseURL}/verify-qr`, {
        qr_content: qrContent,
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        }
      });

      console.log('QR verification response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('QR verification error:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.data) {
        return error.response.data;
      }
      
      return {
        success: false,
        message: `Network error occurred (${error.response?.status || 'Unknown'}). Please try again.`,
        errors: { general: ['Unable to connect to server'] }
      };
    }
  }

  /**
   * Get user's Certifika NFTs
   */
  async getUserNfts(): Promise<GetNftsResponse> {
    try {
      console.log('Fetching user NFTs...');
      
      const response: AxiosResponse<GetNftsResponse> = await axios.get(`${this.baseURL}/nfts`, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        }
      });

      console.log('User NFTs response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Get NFTs error:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.data) {
        return error.response.data;
      }
      
      return {
        success: false,
        message: `Network error occurred (${error.response?.status || 'Unknown'}). Please try again.`,
        errors: { general: ['Unable to connect to server'] }
      };
    }
  }

  /**
   * Manually sync user's NFTs
   */
  async syncNfts(): Promise<SyncNftsResponse> {
    try {
      console.log('Syncing user NFTs...');
      
      const response: AxiosResponse<SyncNftsResponse> = await axios.post(`${this.baseURL}/sync-nfts`, {}, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        }
      });

      console.log('Sync NFTs response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Sync NFTs error:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.data) {
        return error.response.data;
      }
      
      return {
        success: false,
        message: `Network error occurred (${error.response?.status || 'Unknown'}). Please try again.`,
        errors: { general: ['Unable to connect to server'] }
      };
    }
  }

  /**
   * Get user's Certifika profile information
   */
  async getUserProfile(): Promise<CertifikaResponse<CertifikaProfile>> {
    try {
      console.log('Fetching user Certifika profile...');
      
      const response: AxiosResponse<CertifikaResponse<CertifikaProfile>> = await axios.get(`${this.baseURL}/profile`, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        }
      });

      console.log('User profile response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Get profile error:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.data) {
        return error.response.data;
      }
      
      return {
        success: false,
        message: `Network error occurred (${error.response?.status || 'Unknown'}). Please try again.`,
        errors: { general: ['Unable to connect to server'] }
      };
    }
  }

  /**
   * Process QR image and extract content
   */
  async processQrImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      // For now, we'll use a simple file reader approach
      // In production, you might want to use a QR code detection library
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const result = event.target?.result as string;
        
        // Create an image element to analyze
        const img = new Image();
        img.onload = () => {
          try {
            // Create a canvas to draw the image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              reject(new Error('Canvas context not available'));
              return;
            }
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            // For demo purposes, we'll assume the QR content is in the filename or prompt user
            // In production, use a QR code detection library like jsQR
            const mockQrContent = prompt('Please enter the QR code content (for demo purposes):') || '';
            
            if (mockQrContent) {
              resolve(mockQrContent);
            } else {
              reject(new Error('No QR content provided'));
            }
          } catch (error) {
            reject(error);
          }
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        
        img.src = result;
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }
}

export const certifikaService = new CertifikaService();
export default certifikaService;