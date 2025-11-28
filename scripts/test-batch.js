#!/usr/bin/env node

/**
 * TEST BATCH PROCESSING
 * 
 * Simple test to verify batch processing works
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create test input directory if it doesn't exist
const testInputDir = path.join(__dirname, '..', 'TEST_INPUT_FILES');
if (!fs.existsSync(testInputDir)) {
  fs.mkdirSync(testInputDir, { recursive: true });
  console.log('Created TEST_INPUT_FILES directory');
}

// Create batch output directory if it doesn't exist
const batchOutputDir = path.join(__dirname, '..', 'BATCH_OUTPUTS');
if (!fs.existsSync(batchOutputDir)) {
  fs.mkdirSync(batchOutputDir, { recursive: true });
  console.log('Created BATCH_OUTPUTS directory');
}

console.log('\n📁 Batch Processing Test Setup Complete');
console.log('\nTo test batch processing:');
console.log('1. Add Excel files to TEST_INPUT_FILES directory');
console.log('2. Run: npm run batch:process');
console.log('3. Run: npm run batch:html');
console.log('4. Check BATCH_OUTPUTS directory for generated files');

console.log('\nTo test interactive mode:');
console.log('1. Run: npm run dev:client');
console.log('2. Open browser to http://localhost:5000');
console.log('3. Use the web interface to generate documents');
console.log('4. Click export buttons for different document types');