# Implementation Plan

- [x] 1. Create TypeScript interfaces and types
  - Define DatasetInfo, DatasetCollection, and DataLoaderResult interfaces in `src/types/dataset.ts`
  - Export all types for use across the application
  - _Requirements: 1.3, 3.1, 3.4_

- [x] 2. Extract and structure dataset information
  - [x] 2.1 Create JSON data file with current dataset information
    - Create `src/lib/data.json` with existing 6 countries data
    - Structure data according to DatasetCollection interface
    - Include metadata section with version and update information
    - _Requirements: 1.1, 3.1, 3.2_

  - [x] 2.2 Create sample CSV files in public assets
    - Create `public/assets/samples/` directory structure
    - Generate realistic sample CSV files for each country (50-100 records each)
    - Ensure filenames match the sampleFileName values in JSON data
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Implement data loading utilities
  - [x] 3.1 Create data loader module
    - Implement `src/lib/dataLoader.ts` with async data loading functions
    - Add JSON validation and error handling
    - Create utility functions for asset path generation
    - _Requirements: 1.2, 4.1, 5.1_

  - [x] 3.2 Create custom React hook for data management
    - Implement `src/hooks/useDatasets.ts` hook for component data access
    - Handle loading states, error states, and data caching
    - Implement retry mechanisms for failed requests
    - _Requirements: 4.1, 4.2, 4.3, 5.3_

- [x] 4. Refactor DatabaseCenter component
  - [x] 4.1 Remove hardcoded SAMPLE_DATASETS array
    - Delete the hardcoded data array from DatabaseCenter.tsx
    - Import and use the useDatasets hook instead
    - Update component to handle loading and error states
    - _Requirements: 1.1, 4.1, 4.4_

  - [x] 4.2 Update download functionality
    - Modify handleDownloadSample to use actual file paths from public/assets
    - Remove CSV generation code and use real file downloads
    - Add error handling for missing sample files
    - _Requirements: 2.1, 2.4, 5.2_

  - [x] 4.3 Implement loading and error UI states
    - Add proper loading spinner during data fetch
    - Create error state UI with retry functionality
    - Add empty state for when no data is available
    - _Requirements: 4.2, 4.3, 4.5, 5.1_

- [x] 5. Add data validation and error handling
  - [x] 5.1 Implement JSON schema validation
    - Create validation functions for dataset structure
    - Add runtime type checking for loaded data
    - Filter out invalid records while preserving valid ones
    - _Requirements: 3.3, 5.4_

  - [x] 5.2 Add comprehensive error handling
    - Implement fallback mechanisms for data loading failures
    - Add user-friendly error messages and recovery options
    - Create logging for debugging data issues
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 6. Create sample CSV content generation
  - Write utility to generate realistic postal code sample data for each country
  - Include proper headers: PostalCode, PlaceName, AdminName1, AdminName2, AdminName3, Latitude, Longitude, Timezone
  - Ensure data variety and realistic geographic distribution
  - _Requirements: 2.1, 2.2_

- [x] 7. Update component imports and dependencies
  - Update all import statements in DatabaseCenter.tsx to use new data sources
  - Remove unused dependencies and add new ones as needed
  - Ensure proper TypeScript typing throughout the component
  - _Requirements: 1.3, 3.4_

- [ ] 8. Add file existence validation
  - Create utility to verify sample files exist before enabling download buttons
  - Implement graceful handling of missing sample files
  - Add visual indicators for file availability status
  - _Requirements: 2.4, 5.2_

- [ ] 9. Implement performance optimizations
  - Add data caching to prevent unnecessary re-fetches
  - Implement lazy loading for large datasets
  - Optimize component re-renders when data changes
  - _Requirements: 4.1, 4.4_

- [ ] 10. Create unit tests for new functionality
  - Write tests for data loader functions and validation
  - Test custom hooks with various data scenarios
  - Add tests for error handling and edge cases
  - _Requirements: 1.2, 3.3, 5.4_