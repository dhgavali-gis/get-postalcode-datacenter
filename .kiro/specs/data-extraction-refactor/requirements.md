# Requirements Document

## Introduction

This feature involves refactoring the DatabaseCenter component to separate data concerns from UI logic. Currently, the postal code dataset information is hardcoded within the React component, making it difficult to maintain and scale as the dataset grows to 100+ countries. The goal is to extract this data into external JSON files and create a proper asset structure for sample CSV files.

## Requirements

### Requirement 1

**User Story:** As a developer maintaining the postal code datacenter, I want dataset information stored in external JSON files, so that I can easily add, edit, or remove country data without modifying React components.

#### Acceptance Criteria

1. WHEN the application loads THEN the dataset information SHALL be loaded from a JSON file located in `src/lib/data.json`
2. WHEN a developer needs to add a new country THEN they SHALL be able to add it by editing the JSON file without touching component code
3. WHEN the JSON file is updated THEN the application SHALL automatically reflect the changes without requiring code modifications
4. IF the JSON file is malformed or missing THEN the application SHALL display an appropriate error message

### Requirement 2

**User Story:** As a user downloading sample files, I want to access real CSV sample files with actual postal code data, so that I can evaluate the dataset quality before making a purchase decision.

#### Acceptance Criteria

1. WHEN a user clicks on a sample file download THEN they SHALL receive an actual CSV file with 50-100 sample postal code records
2. WHEN sample files are stored THEN they SHALL be located in the `public/assets/samples/` directory for direct access
3. WHEN the JSON data references sample files THEN it SHALL use the correct file paths that correspond to actual files in the assets directory
4. WHEN a sample file is missing THEN the download button SHALL be disabled or show an appropriate error message

### Requirement 3

**User Story:** As a content manager, I want a standardized JSON structure for country data, so that all dataset information follows a consistent format and is easy to validate.

#### Acceptance Criteria

1. WHEN defining country data THEN each entry SHALL include all required fields: id, countryName, countryCode, postalCodeCount, region, status, and sampleFileName
2. WHEN the JSON structure is defined THEN it SHALL be easily extensible for future fields without breaking existing functionality
3. WHEN validating data THEN the application SHALL handle missing or invalid fields gracefully
4. WHEN loading data THEN the application SHALL maintain backward compatibility with the existing DatasetInfo interface

### Requirement 4

**User Story:** As a developer, I want the component to dynamically load and display data from external sources, so that the UI remains responsive and handles data loading states appropriately.

#### Acceptance Criteria

1. WHEN the component mounts THEN it SHALL fetch data from the JSON file asynchronously
2. WHEN data is loading THEN the component SHALL display an appropriate loading state
3. WHEN data loading fails THEN the component SHALL display an error state with retry options
4. WHEN data is successfully loaded THEN the component SHALL render the table with all dataset information
5. WHEN no data is available THEN the component SHALL display an empty state message

### Requirement 5

**User Story:** As a system administrator, I want proper error handling and fallback mechanisms, so that the application remains stable even when external data sources are unavailable.

#### Acceptance Criteria

1. WHEN the JSON file cannot be loaded THEN the application SHALL fall back to a minimal default dataset or show an appropriate error
2. WHEN a sample file download fails THEN the user SHALL receive a clear error message
3. WHEN network issues occur THEN the application SHALL provide retry mechanisms
4. WHEN data validation fails THEN the application SHALL log errors and continue with valid data only