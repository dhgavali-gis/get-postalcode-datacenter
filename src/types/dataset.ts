/**
 * TypeScript interfaces for postal code dataset management
 */

/**
 * Represents information about a single postal code dataset for a country
 */
export interface DatasetInfo {
  /** Unique identifier for the dataset */
  id: number | string;
  /** Full country name */
  countryName: string;
  /** 2-letter ISO country code */
  countryCode: string;
  /** Total number of postal codes in the dataset */
  postalCodeCount: number;
  /** Geographic region the country belongs to */
  region: string;
  /** Current status of the dataset */
  status: string;
  /** Filename of the sample CSV file */
  sampleFileName: string;
  /** Last updated date */
  lastUpdatedDate?: string;
  /** Admin 1 count */
  admin1Count?: string;
  /** Admin 2 count */
  admin2Count?: string;
  /** Admin 3 count */
  admin3Count?: string;
  /** Total postal codes as string */
  totalPostalCodes?: string;
}

/**
 * Collection of datasets with metadata
 */
export interface DatasetCollection {
  /** Array of dataset information */
  datasets: DatasetInfo[];
  /** Metadata about the collection */
  metadata: {
    /** Date when the data was last updated (YYYY-MM-DD format) */
    lastUpdated: string;
    /** Version of the data structure */
    version: string;
    /** Total number of countries in the collection */
    totalCountries: number;
  };
}

/**
 * Result object returned by data loading operations
 */
export interface DataLoaderResult {
  /** Loaded dataset array, null if loading failed or not yet loaded */
  data: DatasetInfo[] | null;
  /** Whether data is currently being loaded */
  loading: boolean;
  /** Error message if loading failed, null otherwise */
  error: string | null;
}