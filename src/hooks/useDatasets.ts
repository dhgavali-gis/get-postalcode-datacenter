/**
 * Custom React hook for managing postal code dataset data
 * Handles loading states, error states, caching, and retry mechanisms
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { DatasetInfo, DataLoaderResult } from '@/types/dataset';
import { DataLoader } from '@/lib/dataLoader';

/**
 * Configuration options for the useDatasets hook
 */
interface UseDatasetOptions {
  /** Whether to automatically load data on mount (default: true) */
  autoLoad?: boolean;
  /** Cache duration in milliseconds (default: 5 minutes) */
  cacheDuration?: number;
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial retry delay in milliseconds (default: 1000) */
  retryDelay?: number;
  /** Whether to use exponential backoff for retries (default: true) */
  exponentialBackoff?: boolean;
}

/**
 * Cache entry structure for storing loaded data
 */
interface CacheEntry {
  data: DatasetInfo[];
  timestamp: number;
}

// Global cache to persist data across component unmounts
const dataCache = new Map<string, CacheEntry>();
const CACHE_KEY = 'datasets';

/**
 * Custom hook for managing dataset data with loading states, caching, and retry logic
 * @param options - Configuration options for the hook
 * @returns DataLoaderResult with data, loading state, error, and utility functions
 */
export function useDatasets(options: UseDatasetOptions = {}): DataLoaderResult & {
  /** Function to manually reload data */
  reload: () => Promise<void>;
  /** Function to clear cached data */
  clearCache: () => void;
  /** Current retry attempt number */
  retryCount: number;
} {
  const {
    autoLoad = true,
    cacheDuration = 5 * 60 * 1000, // 5 minutes
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true
  } = options;

  const [data, setData] = useState<DatasetInfo[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Use refs to track component mount state and avoid memory leaks
  const isMountedRef = useRef<boolean>(true);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Checks if cached data is still valid
   */
  const isCacheValid = useCallback((): boolean => {
    const cached = dataCache.get(CACHE_KEY);
    if (!cached) return false;
    
    const now = Date.now();
    return (now - cached.timestamp) < cacheDuration;
  }, [cacheDuration]);

  /**
   * Gets data from cache if valid
   */
  const getCachedData = useCallback((): DatasetInfo[] | null => {
    if (isCacheValid()) {
      const cached = dataCache.get(CACHE_KEY);
      return cached?.data || null;
    }
    return null;
  }, [isCacheValid]);

  /**
   * Stores data in cache
   */
  const setCachedData = useCallback((datasets: DatasetInfo[]): void => {
    dataCache.set(CACHE_KEY, {
      data: datasets,
      timestamp: Date.now()
    });
  }, []);

  /**
   * Clears cached data
   */
  const clearCache = useCallback((): void => {
    dataCache.delete(CACHE_KEY);
  }, []);

  /**
   * Calculates retry delay with optional exponential backoff
   */
  const calculateRetryDelay = useCallback((attempt: number): number => {
    if (!exponentialBackoff) {
      return retryDelay;
    }
    return retryDelay * Math.pow(2, attempt - 1);
  }, [retryDelay, exponentialBackoff]);

  /**
   * Loads data from the data loader with error handling and retries
   */
  const loadData = useCallback(async (attempt: number = 1): Promise<void> => {
    // Check if component is still mounted
    if (!isMountedRef.current) return;

    // Check cache first
    const cachedData = getCachedData();
    if (cachedData && attempt === 1) {
      setData(cachedData);
      setLoading(false);
      setError(null);
      setRetryCount(0);
      return;
    }

    setLoading(true);
    setRetryCount(attempt - 1);

    try {
      const datasets = await DataLoader.loadDatasets();
      
      if (!isMountedRef.current) return;

      // Success - update state and cache
      setData(datasets);
      setError(null);
      setRetryCount(0);
      setCachedData(datasets);
      
    } catch (err) {
      if (!isMountedRef.current) return;

      const errorMessage = err instanceof Error ? err.message : 'Failed to load datasets';
      console.error(`Dataset loading error (attempt ${attempt}/${maxRetries})`, err);

      // If we haven't exceeded max retries, schedule a retry
      if (attempt < maxRetries) {
        const delay = calculateRetryDelay(attempt);
        
        retryTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            loadData(attempt + 1);
          }
        }, delay);
        
        setError(`${errorMessage} (retrying in ${Math.ceil(delay / 1000)}s...)`);
      } else {
        // Max retries exceeded
        setData(null);
        setError(errorMessage);
        setRetryCount(maxRetries);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [getCachedData, setCachedData, maxRetries, calculateRetryDelay]);

  /**
   * Manual reload function that bypasses cache
   */
  const reload = useCallback(async (): Promise<void> => {
    clearCache();
    setRetryCount(0);
    await loadData(1);
  }, [loadData, clearCache]);

  // Effect to load data on mount if autoLoad is enabled
  useEffect(() => {
    if (autoLoad) {
      loadData();
    }

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [autoLoad, loadData]);

  // Update mounted ref when component unmounts
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    reload,
    clearCache,
    retryCount
  };
}

/**
 * Hook for checking if sample files exist
 * @param datasets - Array of datasets to check
 * @returns Map of filename to existence status
 */
export function useSampleFileStatus(datasets: DatasetInfo[] | null): {
  fileStatus: Map<string, boolean>;
  loading: boolean;
  checkFile: (filename: string) => Promise<boolean>;
} {
  const [fileStatus, setFileStatus] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  /**
   * Checks if a specific file exists
   */
  const checkFile = useCallback(async (filename: string): Promise<boolean> => {
    try {
      const exists = await DataLoader.checkFileExists(filename);
      
      if (isMountedRef.current) {
        setFileStatus(prev => new Map(prev).set(filename, exists));
      }
      
      return exists;
    } catch (error) {
      console.warn(`Error checking file existence for ${filename}`, error);
      
      if (isMountedRef.current) {
        setFileStatus(prev => new Map(prev).set(filename, false));
      }
      
      return false;
    }
  }, []);

  // Effect to check all files when datasets change
  useEffect(() => {
    if (!datasets || datasets.length === 0) {
      setFileStatus(new Map());
      return;
    }

    setLoading(true);

    const checkAllFiles = async () => {
      const statusMap = new Map<string, boolean>();
      
      await Promise.all(
        datasets.map(async (dataset) => {
          const exists = await DataLoader.checkFileExists(dataset.sampleFileName);
          statusMap.set(dataset.sampleFileName, exists);
        })
      );

      if (isMountedRef.current) {
        setFileStatus(statusMap);
        setLoading(false);
      }
    };

    checkAllFiles();
  }, [datasets]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    fileStatus,
    loading,
    checkFile
  };
}