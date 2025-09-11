#!/usr/bin/env tsx
/**
 * Script to generate sample CSV files for all countries
 * Usage: npx tsx scripts/generateSampleCSVs.ts
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { generateCountryCSV, getSupportedCountries } from '../src/lib/sampleDataGenerator.js';

// Country code mapping from data.json
const COUNTRIES_TO_GENERATE = [
  { code: 'US', recordCount: 75 },
  { code: 'DE', recordCount: 75 },
  { code: 'JP', recordCount: 75 },
  { code: 'GB', recordCount: 75 },
  { code: 'FR', recordCount: 75 },
  { code: 'CA', recordCount: 75 }
];

const OUTPUT_DIR = 'public/assets/samples';

function generateAllSampleFiles() {
  console.log('🚀 Starting sample CSV generation...');
  
  // Ensure output directory exists
  mkdirSync(OUTPUT_DIR, { recursive: true });
  
  const supportedCountries = getSupportedCountries();
  let generatedCount = 0;
  let skippedCount = 0;

  for (const { code, recordCount } of COUNTRIES_TO_GENERATE) {
    try {
      if (!supportedCountries.includes(code)) {
        console.log(`⚠️  Skipping ${code} - no template available`);
        skippedCount++;
        continue;
      }

      console.log(`📝 Generating ${code} sample data (${recordCount} records)...`);
      
      const csvContent = generateCountryCSV(code, recordCount);
      const filename = `${code.toLowerCase()}-postal-codes-sample.csv`;
      const filepath = join(OUTPUT_DIR, filename);
      
      writeFileSync(filepath, csvContent, 'utf-8');
      
      console.log(`✅ Generated ${filename} (${csvContent.split('\n').length - 1} records)`);
      generatedCount++;
      
    } catch (error) {
      console.error(`❌ Error generating ${code}:`, error);
    }
  }

  console.log('\n📊 Generation Summary:');
  console.log(`✅ Generated: ${generatedCount} files`);
  console.log(`⚠️  Skipped: ${skippedCount} files`);
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
  
  if (generatedCount > 0) {
    console.log('\n🎉 Sample CSV generation completed successfully!');
  }
}

// Run the generation
generateAllSampleFiles();