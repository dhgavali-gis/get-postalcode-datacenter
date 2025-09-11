/**
 * Data loading utilities for postal code datasets
 * Simple data loading without complex validation
 */

import { DatasetInfo, DatasetCollection } from '@/types/dataset';

/**
 * Data loader class with static methods for dataset operations
 */
export class DataLoader {
  private static readonly ASSETS_BASE_PATH = 'public/assets/samples';

  /**
   * Loads datasets from the JSON file
   * @returns Promise resolving to array of DatasetInfo objects
   */
  static async loadDatasets(): Promise<DatasetInfo[]> {
    try {
      // Import the JSON data using Vite's static import
      const dataModule = await import('./data.json');
      const data = dataModule.default as DatasetCollection;
      
      // Transform the data to match our interface
      const datasets: DatasetInfo[] = data.datasets.map((item: any) => ({
        id: item.id,
        countryName: item.country_name || item.countryName || '-',
        countryCode: item.country_code || item.countryCode || '',
        postalCodeCount: parseInt(item.total_postal_codes || item.totalPostalCodes || '0', 10),
        region: item.region || 'Unknown',
        status: item.status || 'ready',
        sampleFileName: item.file_name || item.sampleFileName || '',
        lastUpdatedDate: item.last_updated_date || item.lastUpdatedDate,
        admin1Count: item.admin_1_count || item.admin1Count,
        admin2Count: item.admin_2_count || item.admin2Count,
        admin3Count: item.admin_3_count || item.admin3Count,
        totalPostalCodes: item.total_postal_codes || item.totalPostalCodes
      }));

      return datasets;
    } catch (error) {
      console.error('Failed to load datasets:', error);
      throw new Error('Failed to load datasets');
    }
  }


  /**
   * Generates the full path for a sample asset file
   * @param filename - The filename of the sample file
   * @returns Full path to the asset file
   */
  static getAssetPath(filename: string): string {
    return `${this.ASSETS_BASE_PATH}/${filename}`;
  }

  /**
   * Checks if a sample file exists by attempting to fetch its headers
   * @param filename - The filename to check
   * @returns Promise resolving to true if file exists, false otherwise
   */
  static async checkFileExists(filename: string): Promise<boolean> {
    try {
      if (!filename) return false;
      
      const assetPath = this.getAssetPath(filename);
      const response = await fetch(assetPath, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Downloads a sample file
   * @param filename - The filename to download
   * @returns Promise resolving to the file blob
   */
  static async downloadSampleFile(filename: string): Promise<Blob> {
    const assetPath = this.getAssetPath(filename);
    const response = await fetch(assetPath);
    
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    
    return response.blob();
  }
}