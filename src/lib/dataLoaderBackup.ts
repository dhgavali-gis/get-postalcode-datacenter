/**
 * Data loading utilities for postal code datasets
 * Handles async data loading, validation, and error handling
 */

import { DatasetInfo, DatasetCollection } from '@/types/dataset';

/**
 * Validation error details for debugging
 */
export interface ValidationError {
  field: string;
  value: any;
  message: string;
  path?: string;
}

/**
 * Validation result with detailed error information
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Error class for data loading operations
 */
export class DataLoaderError extends Error {
  constructor(
    message: string, 
    public cause?: Error,
    public code?: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'DataLoaderError';
  }
}

/**
 * Error codes for different types of data loading failures
 */
export enum DataLoaderErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * User-friendly error messages for different error types
 */
export const ERROR_MESSAGES = {
  [DataLoaderErrorCode.NETWORK_ERROR]: 'Unable to connect to the server. Please check your internet connection and try again.',
  [DataLoaderErrorCode.PARSE_ERROR]: 'The data format is invalid. Please contact support if this problem persists.',
  [DataLoaderErrorCode.VALIDATION_ERROR]: 'Some data entries are invalid and have been filtered out.',
  [DataLoaderErrorCode.FILE_NOT_FOUND]: 'The requested file could not be found.',
  [DataLoaderErrorCode.PERMISSION_ERROR]: 'You do not have permission to access this resource.',
  [DataLoaderErrorCode.TIMEOUT_ERROR]: 'The request timed out. Please try again.',
  [DataLoaderErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again or contact support.'
} as const;

/**
 * Logger utility for debugging data issues
 */
export class DataLogger {
  private static readonly LOG_PREFIX = '[DataLoader]';
  
  static info(message: string, data?: any): void {
    console.info(`${this.LOG_PREFIX} ${message}`, data || '');
  }
  
  static warn(message: string, data?: any): void {
    console.warn(`${this.LOG_PREFIX} ${message}`, data || '');
  }
  
  static error(message: string, error?: any): void {
    console.error(`${this.LOG_PREFIX} ${message}`, error || '');
  }
  
  static debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`${this.LOG_PREFIX} ${message}`, data || '');
    }
  }
}

/**
 * Data loader class with static methods for dataset operations
 */
export class DataLoader {
  private static readonly DATA_PATH = '/src/lib/data.json';
  private static readonly ASSETS_BASE_PATH = 'public/assets/samples';

  /**
   * Loads datasets from the JSON file with comprehensive validation and error handling
   * @returns Promise resolving to array of DatasetInfo objects
   * @throws DataLoaderError if loading or validation fails
   */
  static async loadDatasets(): Promise<DatasetInfo[]> {
    DataLogger.info('Starting dataset loading process');
    
    try {
      // Import the JSON data using Vite's static import with timeout
      const dataModule = await Promise.race([
        import('./data.json'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Import timeout')), 10000)
        )
      ]) as any;
      
      const data = dataModule.default as DatasetCollection;
      DataLogger.debug('Raw data loaded successfully', { datasetCount: data?.datasets?.length });

      // Comprehensive validation of the collection structure
      const collectionValidation = this.validateDatasetCollectionDetailed(data);
      if (!collectionValidation.isValid) {
        const errorMessages = collectionValidation.errors.map(e => `${e.field}: ${e.message}`).join(', ');
        DataLogger.error('Collection validation failed', collectionValidation.errors);
        
        throw new DataLoaderError(
          ERROR_MESSAGES[DataLoaderErrorCode.VALIDATION_ERROR],
          new Error(errorMessages),
          DataLoaderErrorCode.VALIDATION_ERROR,
          false
        );
      }

      // Log any warnings from collection validation
      if (collectionValidation.warnings.length > 0) {
        DataLogger.warn('Collection validation warnings found', collectionValidation.warnings);
      }

      // Validate and filter datasets with detailed error reporting
      const filterResult = this.filterValidDatasets(data.datasets);
      const { valid: validDatasets, invalid: invalidDatasets, totalProcessed } = filterResult;

      // Log validation results
      if (invalidDatasets.length > 0) {
        DataLogger.warn(`Filtered out ${invalidDatasets.length} invalid datasets out of ${totalProcessed} total`);
        
        // Log details about invalid datasets in development
        if (process.env.NODE_ENV === 'development') {
          invalidDatasets.forEach(({ dataset, errors }, index) => {
            DataLogger.debug(`Invalid dataset ${index}:`, { dataset, errors });
          });
        }
      }

      if (validDatasets.length === 0) {
        DataLogger.error('No valid datasets found after validation');
        
        // Try to recover with fallback data
        const fallbackData = this.getFallbackDatasets();
        DataLogger.warn('Using fallback datasets due to validation failures', { count: fallbackData.length });
        
        throw new DataLoaderError(
          'No valid datasets found. Using fallback data.',
          new Error('All datasets failed validation'),
          DataLoaderErrorCode.VALIDATION_ERROR,
          true
        );
      }

      DataLogger.info(`Successfully loaded ${validDatasets.length} valid datasets`);
      return validDatasets;
      
    } catch (error) {
      // Enhanced error handling with specific error types
      if (error instanceof DataLoaderError) {
        throw error;
      }

      // Determine error type and provide appropriate handling
      let errorCode = DataLoaderErrorCode.UNKNOWN_ERROR;
      let recoverable = true;

      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('timeout') || errorMessage.includes('import timeout')) {
          errorCode = DataLoaderErrorCode.TIMEOUT_ERROR;
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          errorCode = DataLoaderErrorCode.NETWORK_ERROR;
        } else if (errorMessage.includes('parse') || errorMessage.includes('json')) {
          errorCode = DataLoaderErrorCode.PARSE_ERROR;
          recoverable = false;
        } else if (errorMessage.includes('not found') || errorMessage.includes('404')) {
          errorCode = DataLoaderErrorCode.FILE_NOT_FOUND;
          recoverable = false;
        } else if (errorMessage.includes('permission') || errorMessage.includes('403')) {
          errorCode = DataLoaderErrorCode.PERMISSION_ERROR;
          recoverable = false;
        }
      }

      DataLogger.error('Dataset loading failed', { error, errorCode, recoverable });
      
      throw new DataLoaderError(
        ERROR_MESSAGES[errorCode],
        error instanceof Error ? error : new Error(String(error)),
        errorCode,
        recoverable
      );
    }
  }

  /**
   * Validates a dataset collection structure with detailed error reporting
   * @param data - The data to validate
   * @returns Detailed validation result
   */
  static validateDatasetCollectionDetailed(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Check if data exists and is an object
    if (!data || typeof data !== 'object') {
      errors.push({
        field: 'root',
        value: data,
        message: 'Data must be a non-null object'
      });
      return { isValid: false, errors, warnings };
    }

    // Check for required top-level properties
    if (!data.hasOwnProperty('datasets')) {
      errors.push({
        field: 'datasets',
        value: undefined,
        message: 'Missing required property "datasets"'
      });
    } else if (!Array.isArray(data.datasets)) {
      errors.push({
        field: 'datasets',
        value: data.datasets,
        message: 'Property "datasets" must be an array'
      });
    } else if (data.datasets.length === 0) {
      warnings.push({
        field: 'datasets',
        value: data.datasets,
        message: 'Datasets array is empty'
      });
    }

    if (!data.hasOwnProperty('metadata')) {
      errors.push({
        field: 'metadata',
        value: undefined,
        message: 'Missing required property "metadata"'
      });
    } else {
      // Validate metadata structure
      const metadata = data.metadata;
      if (!metadata || typeof metadata !== 'object') {
        errors.push({
          field: 'metadata',
          value: metadata,
          message: 'Metadata must be an object'
        });
      } else {
        // Validate metadata fields
        if (typeof metadata.lastUpdated !== 'string') {
          errors.push({
            field: 'metadata.lastUpdated',
            value: metadata.lastUpdated,
            message: 'lastUpdated must be a string'
          });
        } else if (!/^\d{4}-\d{2}-\d{2}$/.test(metadata.lastUpdated)) {
          warnings.push({
            field: 'metadata.lastUpdated',
            value: metadata.lastUpdated,
            message: 'lastUpdated should be in YYYY-MM-DD format'
          });
        }

        if (typeof metadata.version !== 'string') {
          errors.push({
            field: 'metadata.version',
            value: metadata.version,
            message: 'version must be a string'
          });
        } else if (!/^\d+\.\d+\.\d+$/.test(metadata.version)) {
          warnings.push({
            field: 'metadata.version',
            value: metadata.version,
            message: 'version should follow semantic versioning (x.y.z)'
          });
        }

        if (typeof metadata.totalCountries !== 'number') {
          errors.push({
            field: 'metadata.totalCountries',
            value: metadata.totalCountries,
            message: 'totalCountries must be a number'
          });
        } else if (metadata.totalCountries < 0) {
          errors.push({
            field: 'metadata.totalCountries',
            value: metadata.totalCountries,
            message: 'totalCountries must be non-negative'
          });
        } else if (Array.isArray(data.datasets) && metadata.totalCountries !== data.datasets.length) {
          warnings.push({
            field: 'metadata.totalCountries',
            value: metadata.totalCountries,
            message: `totalCountries (${metadata.totalCountries}) does not match actual datasets length (${data.datasets.length})`
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Legacy validation method for backward compatibility
   * @param data - The data to validate
   * @returns true if valid, false otherwise
   */
  static validateDatasetCollection(data: any): data is DatasetCollection {
    return this.validateDatasetCollectionDetailed(data).isValid;
  }

  /**
   * Validates a single dataset object with detailed error reporting
   * @param dataset - The dataset to validate
   * @param path - Path context for error reporting
   * @returns Detailed validation result
   */
  static validateDatasetDetailed(dataset: any, path: string = 'dataset'): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Check if dataset exists and is an object
    if (!dataset || typeof dataset !== 'object') {
      errors.push({
        field: path,
        value: dataset,
        message: 'Dataset must be a non-null object',
        path
      });
      return { isValid: false, errors, warnings };
    }

    // Define required fields with their validation rules
    const fieldValidations = [
      {
        field: 'id',
        required: true,
        type: 'string',
        pattern: /^[a-z0-9-]+$/,
        patternMessage: 'ID must contain only lowercase letters, numbers, and hyphens'
      },
      {
        field: 'countryName',
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 100
      },
      {
        field: 'countryCode',
        required: true,
        type: 'string',
        pattern: /^[A-Z]{2}$/,
        patternMessage: 'Country code must be exactly 2 uppercase letters'
      },
      {
        field: 'region',
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 50
      },
      {
        field: 'sampleFileName',
        required: true,
        type: 'string',
        pattern: /\.csv$/,
        patternMessage: 'Sample filename must end with .csv'
      }
    ];

    // Validate string fields
    for (const validation of fieldValidations) {
      const value = dataset[validation.field];
      const fieldPath = `${path}.${validation.field}`;

      if (validation.required && (value === undefined || value === null)) {
        errors.push({
          field: validation.field,
          value,
          message: `Required field "${validation.field}" is missing`,
          path: fieldPath
        });
        continue;
      }

      if (value !== undefined && value !== null) {
        if (typeof value !== validation.type) {
          errors.push({
            field: validation.field,
            value,
            message: `Field "${validation.field}" must be of type ${validation.type}`,
            path: fieldPath
          });
          continue;
        }

        if (validation.type === 'string') {
          const stringValue = value as string;
          
          if (stringValue.trim() === '') {
            errors.push({
              field: validation.field,
              value,
              message: `Field "${validation.field}" cannot be empty`,
              path: fieldPath
            });
            continue;
          }

          if (validation.minLength && stringValue.length < validation.minLength) {
            errors.push({
              field: validation.field,
              value,
              message: `Field "${validation.field}" must be at least ${validation.minLength} characters`,
              path: fieldPath
            });
          }

          if (validation.maxLength && stringValue.length > validation.maxLength) {
            warnings.push({
              field: validation.field,
              value,
              message: `Field "${validation.field}" is longer than recommended ${validation.maxLength} characters`,
              path: fieldPath
            });
          }

          if (validation.pattern && !validation.pattern.test(stringValue)) {
            errors.push({
              field: validation.field,
              value,
              message: validation.patternMessage || `Field "${validation.field}" does not match required pattern`,
              path: fieldPath
            });
          }
        }
      }
    }

    // Validate postalCodeCount
    const postalCodeCount = dataset.postalCodeCount;
    if (postalCodeCount === undefined || postalCodeCount === null) {
      errors.push({
        field: 'postalCodeCount',
        value: postalCodeCount,
        message: 'Required field "postalCodeCount" is missing',
        path: `${path}.postalCodeCount`
      });
    } else if (typeof postalCodeCount !== 'number') {
      errors.push({
        field: 'postalCodeCount',
        value: postalCodeCount,
        message: 'Field "postalCodeCount" must be a number',
        path: `${path}.postalCodeCount`
      });
    } else if (!Number.isInteger(postalCodeCount)) {
      errors.push({
        field: 'postalCodeCount',
        value: postalCodeCount,
        message: 'Field "postalCodeCount" must be an integer',
        path: `${path}.postalCodeCount`
      });
    } else if (postalCodeCount <= 0) {
      errors.push({
        field: 'postalCodeCount',
        value: postalCodeCount,
        message: 'Field "postalCodeCount" must be greater than 0',
        path: `${path}.postalCodeCount`
      });
    } else if (postalCodeCount > 10000000) {
      warnings.push({
        field: 'postalCodeCount',
        value: postalCodeCount,
        message: 'Field "postalCodeCount" seems unusually high (>10M)',
        path: `${path}.postalCodeCount`
      });
    }

    // Validate status enum
    const status = dataset.status;
    const validStatuses = ['active', 'inactive', 'coming-soon'] as const;
    if (status === undefined || status === null) {
      errors.push({
        field: 'status',
        value: status,
        message: 'Required field "status" is missing',
        path: `${path}.status`
      });
    } else if (typeof status !== 'string') {
      errors.push({
        field: 'status',
        value: status,
        message: 'Field "status" must be a string',
        path: `${path}.status`
      });
    } else if (!validStatuses.includes(status as any)) {
      errors.push({
        field: 'status',
        value: status,
        message: `Field "status" must be one of: ${validStatuses.join(', ')}`,
        path: `${path}.status`
      });
    }

    // Additional cross-field validations
    // if (dataset.id && dataset.sampleFileName) {
    //   const expectedPrefix = dataset.id.toLowerCase();
    //   const actualPrefix = dataset.sampleFileName.toLowerCase().replace('-postal-codes-sample.csv', '');
    //   if (expectedPrefix !== actualPrefix) {
    //     warnings.push({
    //       field: 'sampleFileName',
    //       value: dataset.sampleFileName,
    //       message: `Sample filename should match pattern "${dataset.id}-postal-codes-sample.csv"`,
    //       path: `${path}.sampleFileName`
    //     });
    //   }
    // }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Legacy validation method for backward compatibility
   * @param dataset - The dataset to validate
   * @returns true if valid, false otherwise
   */
  static validateDataset(dataset: any): dataset is DatasetInfo {
    return this.validateDatasetDetailed(dataset).isValid;
  }

  /**
   * Generates the full path for a sample asset file
   * @param filename - The filename of the sample file
   * @returns Full path to the asset file
   */
  static getAssetPath(filename: string): string {
    if (!filename) {
      throw new DataLoaderError('Filename is required for asset path generation');
    }

    // Ensure filename ends with .csv
    if (!filename.endsWith('.csv')) {
      throw new DataLoaderError('Asset filename must end with .csv');
    }

    return `${this.ASSETS_BASE_PATH}/${filename}`;
  }

  /**
   * Checks if a sample file exists by attempting to fetch its headers
   * @param filename - The filename to check
   * @returns Promise resolving to true if file exists, false otherwise
   */
  static async checkFileExists(filename: string): Promise<boolean> {
    try {
      if (!filename || typeof filename !== 'string') {
        DataLogger.warn('Invalid filename provided for existence check', { filename });
        return false;
      }

      const assetPath = this.getAssetPath(filename);
      DataLogger.debug(`Checking file existence: ${assetPath}`);
      
      const response = await Promise.race([
        fetch(assetPath, { method: 'HEAD' }),
        new Promise<Response>((_, reject) => 
          setTimeout(() => reject(new Error('File check timeout')), 5000)
        )
      ]);
      
      const exists = response.ok;
      DataLogger.debug(`File existence check result for ${filename}: ${exists}`);
      return exists;
      
    } catch (error) {
      DataLogger.warn(`File existence check failed for ${filename}`, error);
      return false;
    }
  }

  /**
   * Downloads a sample file with comprehensive error handling and retry logic
   * @param filename - The filename to download
   * @param maxRetries - Maximum number of retry attempts (default: 2)
   * @returns Promise resolving to the file blob
   * @throws DataLoaderError if download fails
   */
  static async downloadSampleFile(filename: string, maxRetries: number = 2): Promise<Blob> {
    if (!filename || typeof filename !== 'string') {
      throw new DataLoaderError(
        'Invalid filename provided for download',
        new Error(`Invalid filename: ${filename}`),
        DataLoaderErrorCode.VALIDATION_ERROR,
        false
      );
    }

    DataLogger.info(`Starting download for file: ${filename}`);
    
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        const assetPath = this.getAssetPath(filename);
        DataLogger.debug(`Download attempt ${attempt} for ${filename}: ${assetPath}`);
        
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(assetPath, {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          let errorCode = DataLoaderErrorCode.UNKNOWN_ERROR;
          let recoverable = true;
          
          switch (response.status) {
            case 404:
              errorCode = DataLoaderErrorCode.FILE_NOT_FOUND;
              recoverable = false;
              break;
            case 403:
              errorCode = DataLoaderErrorCode.PERMISSION_ERROR;
              recoverable = false;
              break;
            case 408:
            case 504:
              errorCode = DataLoaderErrorCode.TIMEOUT_ERROR;
              break;
            case 500:
            case 502:
            case 503:
              errorCode = DataLoaderErrorCode.NETWORK_ERROR;
              break;
          }
          
          const error = new DataLoaderError(
            ERROR_MESSAGES[errorCode],
            new Error(`HTTP ${response.status}: ${response.statusText}`),
            errorCode,
            recoverable
          );
          
          if (!recoverable || attempt > maxRetries) {
            throw error;
          }
          
          lastError = error;
          DataLogger.warn(`Download attempt ${attempt} failed, retrying...`, { status: response.status, statusText: response.statusText });
          
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
          continue;
        }

        // Validate response content
        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.includes('text/csv') && !contentType.includes('application/octet-stream')) {
          DataLogger.warn(`Unexpected content type for ${filename}: ${contentType}`);
        }

        const blob = await response.blob();
        
        // Validate blob size
        if (blob.size === 0) {
          throw new DataLoaderError(
            'Downloaded file is empty',
            new Error('Zero-byte file received'),
            DataLoaderErrorCode.VALIDATION_ERROR,
            true
          );
        }
        
        DataLogger.info(`Successfully downloaded ${filename}`, { size: blob.size, type: blob.type });
        return blob;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (error instanceof DataLoaderError) {
          if (!error.recoverable || attempt > maxRetries) {
            throw error;
          }
        } else {
          // Handle network errors, timeouts, etc.
          let errorCode = DataLoaderErrorCode.NETWORK_ERROR;
          
          if (error instanceof Error) {
            const errorMessage = error.message.toLowerCase();
            if (errorMessage.includes('abort') || errorMessage.includes('timeout')) {
              errorCode = DataLoaderErrorCode.TIMEOUT_ERROR;
            }
          }
          
          if (attempt > maxRetries) {
            throw new DataLoaderError(
              ERROR_MESSAGES[errorCode],
              lastError,
              errorCode,
              true
            );
          }
        }
        
        DataLogger.warn(`Download attempt ${attempt} failed for ${filename}`, error);
        
        // Wait before retry
        if (attempt <= maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
        }
      }
    }
    
    // This should never be reached, but just in case
    throw new DataLoaderError(
      ERROR_MESSAGES[DataLoaderErrorCode.UNKNOWN_ERROR],
      lastError || new Error('Unknown download failure'),
      DataLoaderErrorCode.UNKNOWN_ERROR,
      true
    );
  }

  /**
   * Validates the entire JSON structure with comprehensive schema checking
   * @param data - The raw data to validate
   * @returns Detailed validation result with all errors and warnings
   */
  static validateJsonSchema(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // First validate the collection structure
    const collectionValidation = this.validateDatasetCollectionDetailed(data);
    errors.push(...collectionValidation.errors);
    warnings.push(...collectionValidation.warnings);

    // If collection structure is valid, validate each dataset
    if (collectionValidation.isValid && Array.isArray(data.datasets)) {
      const datasetIds = new Set<string>();
      const countryCodes = new Set<string>();

      for (let i = 0; i < data.datasets.length; i++) {
        const dataset = data.datasets[i];
        const datasetValidation = this.validateDatasetDetailed(dataset, `datasets[${i}]`);
        
        errors.push(...datasetValidation.errors);
        warnings.push(...datasetValidation.warnings);

        // Check for duplicate IDs and country codes
        if (datasetValidation.isValid && dataset.id) {
          if (datasetIds.has(dataset.id)) {
            errors.push({
              field: 'id',
              value: dataset.id,
              message: `Duplicate dataset ID "${dataset.id}" found`,
              path: `datasets[${i}].id`
            });
          } else {
            datasetIds.add(dataset.id);
          }
        }

        if (datasetValidation.isValid && dataset.countryCode) {
          if (countryCodes.has(dataset.countryCode)) {
            warnings.push({
              field: 'countryCode',
              value: dataset.countryCode,
              message: `Duplicate country code "${dataset.countryCode}" found`,
              path: `datasets[${i}].countryCode`
            });
          } else {
            countryCodes.add(dataset.countryCode);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Filters out invalid records while preserving valid ones
   * @param datasets - Array of datasets to filter
   * @returns Object containing valid datasets and information about filtered ones
   */
  static filterValidDatasets(datasets: any[]): {
    valid: DatasetInfo[];
    invalid: Array<{ dataset: any; errors: ValidationError[] }>;
    totalProcessed: number;
  } {
    const valid: DatasetInfo[] = [];
    const invalid: Array<{ dataset: any; errors: ValidationError[] }> = [];

    for (let i = 0; i < datasets.length; i++) {
      const dataset = datasets[i];
      const validation = this.validateDatasetDetailed(dataset, `dataset[${i}]`);
      
      if (validation.isValid) {
        valid.push(dataset as DatasetInfo);
      } else {
        invalid.push({ dataset, errors: validation.errors });
      }
    }

    return {
      valid,
      invalid,
      totalProcessed: datasets.length
    };
  }

  /**
   * Creates a fallback dataset for when data loading fails
   * @returns Minimal dataset array for fallback scenarios
   */
  static getFallbackDatasets(): DatasetInfo[] {
    DataLogger.info('Providing fallback datasets');
    
    return [
      {
        id: 'us',
        countryName: 'United States',
        countryCode: 'US',
        postalCodeCount: 41692,
        region: 'North America',
        status: 'active',
        sampleFileName: 'us-postal-codes-sample.csv'
      }
    ];
  }

  /**
   * Attempts to recover from data loading failures with multiple fallback strategies
   * @param originalError - The original error that triggered recovery
   * @returns Promise resolving to recovered data or throws if all recovery attempts fail
   */
  static async attemptRecovery(originalError: DataLoaderError): Promise<DatasetInfo[]> {
    DataLogger.warn('Attempting data recovery', { originalError: originalError.message, code: originalError.code });
    
    // Strategy 1: Try fallback data if the original error is recoverable
    if (originalError.recoverable) {
      try {
        const fallbackData = this.getFallbackDatasets();
        
        // Validate fallback data
        const validation = this.filterValidDatasets(fallbackData);
        if (validation.valid.length > 0) {
          DataLogger.info('Recovery successful using fallback data', { count: validation.valid.length });
          return validation.valid;
        }
      } catch (fallbackError) {
        DataLogger.error('Fallback data recovery failed', fallbackError);
      }
    }

    // Strategy 2: Try to load a minimal dataset from localStorage if available
    try {
      const cachedData = localStorage.getItem('datasets_emergency_cache');
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        const validation = this.filterValidDatasets(parsedData);
        
        if (validation.valid.length > 0) {
          DataLogger.info('Recovery successful using emergency cache', { count: validation.valid.length });
          return validation.valid;
        }
      }
    } catch (cacheError) {
      DataLogger.debug('Emergency cache recovery failed', cacheError);
    }

    // Strategy 3: Return empty array with warning (graceful degradation)
    DataLogger.error('All recovery strategies failed, returning empty dataset');
    throw new DataLoaderError(
      'Unable to recover data. Please refresh the page or contact support.',
      originalError,
      DataLoaderErrorCode.UNKNOWN_ERROR,
      false
    );
  }

  /**
   * Saves current data to emergency cache for recovery purposes
   * @param datasets - Datasets to cache
   */
  static saveEmergencyCache(datasets: DatasetInfo[]): void {
    try {
      localStorage.setItem('datasets_emergency_cache', JSON.stringify(datasets));
      DataLogger.debug('Emergency cache saved', { count: datasets.length });
    } catch (error) {
      DataLogger.warn('Failed to save emergency cache', error);
    }
  }

  /**
   * Gets user-friendly error message with recovery suggestions
   * @param error - The DataLoaderError to get message for
   * @returns User-friendly error message with suggestions
   */
  static getUserFriendlyErrorMessage(error: DataLoaderError): string {
    let message = error.message;
    
    // Add recovery suggestions based on error type
    switch (error.code) {
      case DataLoaderErrorCode.NETWORK_ERROR:
        message += ' Try refreshing the page or check your internet connection.';
        break;
      case DataLoaderErrorCode.TIMEOUT_ERROR:
        message += ' The server may be busy. Please try again in a few moments.';
        break;
      case DataLoaderErrorCode.FILE_NOT_FOUND:
        message += ' The requested file is not available. Please contact support.';
        break;
      case DataLoaderErrorCode.VALIDATION_ERROR:
        message += ' Some data may be displayed with limited functionality.';
        break;
      default:
        if (error.recoverable) {
          message += ' Please try refreshing the page.';
        } else {
          message += ' Please contact support if this problem persists.';
        }
    }
    
    return message;
  }

  /**
   * Health check method to verify data loading capabilities
   * @returns Promise resolving to health status
   */
  static async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    message: string;
    details: any;
  }> {
    try {
      DataLogger.debug('Starting health check');
      
      const startTime = Date.now();
      const datasets = await this.loadDatasets();
      const loadTime = Date.now() - startTime;
      
      const status = loadTime > 5000 ? 'degraded' : 'healthy';
      const message = status === 'healthy' 
        ? 'Data loading is functioning normally'
        : 'Data loading is slow but functional';
      
      return {
        status,
        message,
        details: {
          loadTime,
          datasetCount: datasets.length,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      DataLogger.error('Health check failed', error);
      
      return {
        status: 'unhealthy',
        message: 'Data loading is not functioning',
        details: {
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}