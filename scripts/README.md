# Sample CSV Data Generator

This directory contains utilities for generating realistic postal code sample data for the postal code datacenter application.

## Files

- `generateSampleCSVs.ts` - Main script to generate all sample CSV files
- `../src/lib/sampleDataGenerator.ts` - Core utility functions for data generation

## Usage

### Generate All Sample Files

```bash
npm run generate-samples
```

This will generate sample CSV files for all countries defined in `src/lib/data.json` and place them in `public/assets/samples/`.

### Manual Generation

You can also run the script directly:

```bash
npx tsx scripts/generateSampleCSVs.ts
```

## Generated Data

Each sample CSV file contains:

- **75 records** per country (configurable)
- **Realistic postal codes** following country-specific formats
- **Geographic distribution** across major regions within each country
- **Proper administrative divisions** (states, provinces, counties, etc.)
- **Accurate coordinates** within realistic ranges for each region
- **Correct timezones** based on geographic location

### CSV Format

All files follow this standard format:

```csv
PostalCode,PlaceName,AdminName1,AdminName2,AdminName3,Latitude,Longitude,Timezone
10001,New York,New York,New York County,Manhattan,40.7505,-73.9934,America/New_York
```

## Supported Countries

Currently supports sample data generation for:

- 🇺🇸 **United States** (US) - 5-digit ZIP codes
- 🇩🇪 **Germany** (DE) - 5-digit postal codes  
- 🇯🇵 **Japan** (JP) - XXX-XXXX format
- 🇬🇧 **United Kingdom** (GB) - Alphanumeric postcodes
- 🇫🇷 **France** (FR) - 5-digit postal codes
- 🇨🇦 **Canada** (CA) - AXA XAX format

## Adding New Countries

To add support for a new country:

1. Add a new template to `COUNTRY_TEMPLATES` in `sampleDataGenerator.ts`
2. Define regions with realistic coordinate ranges
3. Provide sample postal codes and city names
4. Add the country to `COUNTRIES_TO_GENERATE` in `generateSampleCSVs.ts`
5. Run the generation script

## Data Quality

The generated data includes:

- ✅ **Realistic postal codes** from actual postal code systems
- ✅ **Geographic accuracy** with coordinates within proper ranges
- ✅ **Administrative hierarchy** following country-specific structures
- ✅ **Timezone accuracy** based on longitude and country rules
- ✅ **Data variety** across different regions and cities

This ensures that sample downloads provide users with representative data that accurately reflects the quality and structure of the full datasets.