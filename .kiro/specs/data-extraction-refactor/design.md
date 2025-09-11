# Design Document

## Overview

This design outlines the refactoring of the DatabaseCenter component to separate data concerns from UI logic. The solution involves extracting hardcoded dataset information into external JSON files and creating a proper asset structure for sample CSV files. This approach will improve maintainability, scalability, and allow non-technical users to manage dataset information.

## Architecture

### Data Layer Architecture
```
src/
├── lib/
│   ├── data.json              # Country dataset information
│   └── dataLoader.ts          # Data loading utilities
├── components/
│   └── DatabaseCenter.tsx     # UI component (data-agnostic)
└── types/
    └── dataset.ts             # TypeScript interfaces

public/
└── assets/
    └── samples/               # Sample CSV files
        ├── us-postal-codes-sample.csv
        ├── de-postal-codes-sample.csv
        └── [country]-postal-codes-sample.csv
```

### Data Flow
1. Component mounts → triggers data loading
2. DataLoader fetches JSON from `src/lib/data.json`
3. Data is validated against TypeScript interfaces
4. Component receives validated data and renders UI
5. User interactions trigger downloads from `public/assets/samples/`

## Components and Interfaces

### Data Structure (`src/lib/data.json`)
```json
{
  "datasets": [
    {
      "id": "us",
      "countryName": "United States",
      "countryCode": "US",
      "postalCodeCount": 41692,
      "region": "North America",
      "status": "active",
      "sampleFileName": "us-postal-codes-sample.csv"
    }
  ],
  "metadata": {
    "lastUpdated": "2025-01-09",
    "version": "1.0.0",
    "totalCountries": 6
  }
}
```

### TypeScript Interfaces (`src/types/dataset.ts`)
```typescript
export interface DatasetInfo {
  id: string;
  countryName: string;
  countryCode: string;
  postalCodeCount: number;
  region: string;
  status: 'active' | 'inactive' | 'coming-soon';
  sampleFileName: string;
}

export interface DatasetCollection {
  datasets: DatasetInfo[];
  metadata: {
    lastUpdated: string;
    version: string;
    totalCountries: number;
  };
}

export interface DataLoaderResult {
  data: DatasetInfo[] | null;
  loading: boolean;
  error: string | null;
}
```

### Data Loader (`src/lib/dataLoader.ts`)
```typescript
export class DataLoader {
  static async loadDatasets(): Promise<DatasetInfo[]>
  static validateDataset(dataset: any): boolean
  static getAssetPath(filename: string): string
}
```

### Updated Component Interface
```typescript
// DatabaseCenter.tsx will use:
const { data, loading, error } = useDatasets();
```

## Data Models

### JSON Schema Validation
- **Required Fields**: All fields in DatasetInfo interface are mandatory
- **Field Validation**: 
  - `id`: lowercase alphanumeric + hyphens
  - `countryCode`: 2-letter ISO country code
  - `postalCodeCount`: positive integer
  - `status`: enum of allowed values
  - `sampleFileName`: must end with `.csv`

### Sample CSV Structure
Each sample CSV file will contain 50-100 records with columns:
```csv
PostalCode,PlaceName,AdminName1,AdminName2,AdminName3,Latitude,Longitude,Timezone
10001,New York,New York,New York County,Manhattan,40.7505,-73.9934,America/New_York
```

## Error Handling

### Data Loading Errors
1. **File Not Found**: Display error message with fallback to empty state
2. **Invalid JSON**: Log error, show user-friendly message
3. **Schema Validation Failure**: Filter out invalid records, continue with valid ones
4. **Network Issues**: Implement retry mechanism with exponential backoff

### Download Errors
1. **Missing Sample File**: Disable download button, show "Coming Soon" status
2. **Download Failure**: Show toast notification with retry option
3. **Large File Handling**: Implement progress indicators for larger samples

### Fallback Mechanisms
- Maintain minimal hardcoded dataset as ultimate fallback
- Graceful degradation when external resources unavailable
- Clear error messaging for users and developers

## Testing Strategy

### Unit Tests
- Data loader functionality and validation
- Error handling scenarios
- JSON schema validation
- Component rendering with different data states

### Integration Tests
- End-to-end data loading flow
- File download functionality
- Error recovery mechanisms

### Data Validation Tests
- JSON structure validation
- Sample file existence verification
- Cross-reference between JSON and actual files

### Performance Tests
- Large dataset loading (100+ countries)
- Concurrent download handling
- Memory usage with large datasets

## Implementation Phases

### Phase 1: Data Extraction
- Create JSON structure and sample data
- Implement data loader utility
- Update TypeScript interfaces

### Phase 2: Component Refactoring
- Remove hardcoded data from component
- Implement data loading hook
- Add loading and error states

### Phase 3: Asset Management
- Create sample CSV files with real data
- Implement proper file serving
- Add file validation

### Phase 4: Error Handling & Polish
- Comprehensive error handling
- User experience improvements
- Performance optimizations